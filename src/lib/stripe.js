import Stripe from "stripe";

let stripeClient = null;

const getStripe = () => {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is missing from environment variables");
  }

  stripeClient = new Stripe(secretKey);

  return stripeClient;
};

export default getStripe;
