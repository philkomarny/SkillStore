import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const customerId = session.customer as string;
      const metadata = session.metadata || {};

      // Find user by Stripe customer ID
      const { data: user } = (await supabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single()) as { data: any };

      if (!user) break;

      if (metadata.type === "skill_purchase" && metadata.skillSlug) {
        // Record skill purchase
        const { data: skill } = (await supabase
          .from("skills")
          .select("id")
          .eq("slug", metadata.skillSlug)
          .single()) as { data: any };

        if (skill) {
          await (supabase.from("purchases") as any).insert({
            user_id: user.id,
            skill_id: skill.id,
            stripe_payment_intent_id: session.payment_intent as string,
            amount_cents: 99,
            status: "completed",
          });
        }
      }

      if (metadata.type === "subscription") {
        await (supabase
          .from("users") as any)
          .update({
            subscription_tier: "level2",
            subscription_status: "active",
          })
          .eq("id", user.id);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;
      const status = subscription.status;

      const { data: user } = (await supabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single()) as { data: any };

      if (user) {
        await (supabase
          .from("users") as any)
          .update({
            subscription_status: status === "active" ? "active" : status,
          })
          .eq("id", user.id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      const { data: user } = (await supabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single()) as { data: any };

      if (user) {
        await (supabase
          .from("users") as any)
          .update({
            subscription_tier: "free",
            subscription_status: "canceled",
          })
          .eq("id", user.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
