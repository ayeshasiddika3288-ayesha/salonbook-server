import mongoose from "mongoose";
import Appointment from "../models/appointment.model.js";
import Transaction from "../models/transaction.model.js";
import getStripe from "../lib/stripe.js";

import { getAllowedOrigins } from "../lib/origins.js";

const CURRENCY = "bdt";

const isLocalOrigin = (origin) =>
  origin.includes("localhost") || origin.includes("127.0.0.1");

// Stripe must send the customer back to the deployed client, so prefer the
// configured public origin in production and localhost during local dev.
const getClientUrl = () => {
  const origins = getAllowedOrigins();
  const preferred =
    process.env.NODE_ENV === "production"
      ? origins.find((origin) => !isLocalOrigin(origin))
      : origins.find(isLocalOrigin);

  return preferred || origins[0] || "http://localhost:3000";
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      customerId: req.user.id,
    }).populate("serviceId", "serviceName");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed appointments can be paid",
      });
    }

    if (appointment.paymentStatus !== "unpaid") {
      return res.status(400).json({
        success: false,
        message: "This appointment is already paid",
      });
    }

    const amountInMinorUnit = Math.round(appointment.servicePrice * 100);

    if (!Number.isSafeInteger(amountInMinorUnit) || amountInMinorUnit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment amount",
      });
    }

    const stripe = getStripe();

    const clientUrl = getClientUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            product_data: {
              name: appointment.serviceId?.serviceName || "Salon Service",
              description: `Appointment ID: ${appointment._id}`,
            },
            unit_amount: amountInMinorUnit,
          },
          quantity: 1,
        },
      ],
      metadata: {
        appointmentId: appointment._id.toString(),
        customerId: req.user.id,
      },
      client_reference_id: appointment._id.toString(),
      success_url: `${clientUrl}/dashboard/customer/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/dashboard/customer/payments/cancel`,
    });

    await Transaction.create({
      appointmentId: appointment._id,
      customerId: req.user.id,
      amount: appointment.servicePrice,
      currency: CURRENCY,
      stripeSessionId: session.id,
      status: "failed",
    });

    return res.status(201).json({
      success: true,
      message: "Checkout session created",
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error("Create checkout session error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create checkout session",
    });
  }
};

export const getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      customerId: req.user.id,
    })
      .populate({
        path: "appointmentId",
        select: "appointmentDate timeSlot status paymentStatus serviceId",
        populate: {
          path: "serviceId",
          select: "serviceName",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment history",
    });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate({
        path: "appointmentId",
        select: "appointmentDate timeSlot status paymentStatus serviceId",
        populate: {
          path: "serviceId",
          select: "serviceName",
        },
      })
      .populate("customerId", "name email image phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Get all transactions error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch transactions",
    });
  }
};

export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];

  let event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    const stripe = getStripe();

    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error.message);

    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (session.payment_status !== "paid") {
        return res.status(200).json({ received: true });
      }

      const { appointmentId, customerId } = session.metadata || {};

      if (
        !mongoose.Types.ObjectId.isValid(appointmentId) ||
        !customerId
      ) {
        console.error("Webhook metadata is missing or invalid");
        return res.status(200).json({ received: true });
      }

      const transaction = await Transaction.findOne({
        stripeSessionId: session.id,
        appointmentId,
        customerId,
      });

      if (!transaction) {
        console.error("No matching transaction found for Stripe session");
        return res.status(200).json({ received: true });
      }

      const expectedAmount = Math.round(transaction.amount * 100);

      if (
        session.amount_total !== expectedAmount ||
        session.currency?.toLowerCase() !== transaction.currency
      ) {
        console.error("Stripe payment amount or currency mismatch");
        return res.status(200).json({ received: true });
      }

      const appointment = await Appointment.findOneAndUpdate(
        {
          _id: appointmentId,
          customerId,
          status: "confirmed",
          paymentStatus: "unpaid",
        },
        {
          $set: { paymentStatus: "paid" },
        },
        { new: true }
      );

      if (appointment) {
        await Transaction.updateOne(
          { _id: transaction._id },
          { $set: { status: "paid" } }
        );
      } else {
        const alreadyPaid = await Appointment.findOne({
          _id: appointmentId,
          customerId,
          paymentStatus: "paid",
        });

        if (alreadyPaid) {
          await Transaction.updateOne(
            { _id: transaction._id },
            { $set: { status: "paid" } }
          );
        } else {
          console.error(
            "Payment received, but appointment is no longer eligible for payment"
          );
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;

      await Transaction.updateOne(
        { stripeSessionId: session.id, status: "failed" },
        { $set: { status: "failed" } }
      );
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};
