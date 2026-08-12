import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("store_purchases")
    .select("purchased_at, store_games(id, name, description)")
    .eq("account_name", session.accountName)
    .order("purchased_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data.map((row: any) => ({ ...row.store_games, purchased_at: row.purchased_at })));
}
