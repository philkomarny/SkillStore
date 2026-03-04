import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: contexts } = (await supabase
    .from("user_contexts")
    .select("*")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })) as { data: any[] | null };

  return NextResponse.json({ contexts: contexts || [] });
}
