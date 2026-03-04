import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getOrCreateCustomer,
  createSkillCheckout,
  createSubscriptionCheckout,
} from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { plan, skillSlug, skillName } = body;
  const origin = request.headers.get("origin") || "http://localhost:3000";

  const customerId = await getOrCreateCustomer(session.user.id, session.user.email);

  if (plan === "level1" && skillSlug) {
    const checkoutSession = await createSkillCheckout(
      customerId,
      skillSlug,
      skillName || skillSlug,
      `${origin}/skills`
    );
    return NextResponse.json({ url: checkoutSession.url });
  }

  if (plan === "level2") {
    const checkoutSession = await createSubscriptionCheckout(
      customerId,
      `${origin}/dashboard`
    );
    return NextResponse.json({ url: checkoutSession.url });
  }

  return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
}
