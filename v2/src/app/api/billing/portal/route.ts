import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";
import { createPortalSession } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", session.user.id)
    .single() as { data: any };

  if (!user?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account" }, { status: 400 });
  }

  const origin = request.headers.get("origin") || "http://localhost:3000";
  const portalSession = await createPortalSession(
    user.stripe_customer_id,
    `${origin}/dashboard/billing`
  );

  return NextResponse.json({ url: portalSession.url });
}
