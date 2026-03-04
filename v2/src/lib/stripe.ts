import Stripe from "stripe";
import { supabase } from "./supabase";

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop];
  },
});

/**
 * Get or create a Stripe customer for a user.
 */
export async function getOrCreateCustomer(userId: string, email: string) {
  const { data: user } = (await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single()) as { data: any };

  if (user?.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await (supabase
    .from("users") as any)
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

/**
 * Create a Stripe Checkout session for a one-time skill purchase (Level 1).
 */
export async function createSkillCheckout(
  customerId: string,
  skillSlug: string,
  skillName: string,
  returnUrl: string
) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price: process.env.STRIPE_LEVEL1_PRICE_ID!,
        quantity: 1,
      },
    ],
    metadata: { skillSlug, type: "skill_purchase" },
    success_url: `${returnUrl}?purchased=${skillSlug}`,
    cancel_url: returnUrl,
  });
}

/**
 * Create a Stripe Checkout session for a Level 2 subscription.
 */
export async function createSubscriptionCheckout(
  customerId: string,
  returnUrl: string
) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_LEVEL2_PRICE_ID!,
        quantity: 1,
      },
    ],
    metadata: { type: "subscription" },
    success_url: `${returnUrl}?subscribed=true`,
    cancel_url: returnUrl,
  });
}

/**
 * Create a Stripe Customer Portal session for self-service billing.
 */
export async function createPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
