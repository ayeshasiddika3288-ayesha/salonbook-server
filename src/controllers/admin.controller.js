import User from "../models/user.model.js";
import Service from "../models/service.model.js";
import Appointment from "../models/appointment.model.js";
import Transaction from "../models/transaction.model.js";

// Dashboard overview stats (Admin)
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalCustomers,
      totalServices,
      totalActiveServices,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      cancelledAppointments,
      paymentSummary,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      Service.countDocuments(),
      Service.countDocuments({ status: "active" }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: "pending" }),
      Appointment.countDocuments({ status: "confirmed" }),
      Appointment.countDocuments({ status: "cancelled" }),
      Transaction.aggregate([
        { $match: { status: { $in: ["paid", "completed"] } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const payments = paymentSummary[0] || {
      count: 0,
      totalAmount: 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        totalServices,
        totalActiveServices,
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        cancelledAppointments,
        successfulPayments: {
          count: payments.count,
          totalAmount: payments.totalAmount,
        },
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics.",
    });
  }
};
