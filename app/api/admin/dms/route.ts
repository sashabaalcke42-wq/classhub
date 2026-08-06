import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("dm_key")
    .eq("scope", "dm");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.dm_key as string] = (counts[row.dm_key as string] ?? 0) + 1;
  }

  const conversations = Object.entries(counts).map(([key, count]) => {
    const [a, b] = key.split("__");
    return { key, accountA: a, accountB: b, messageCount: count };
  });

  return NextResponse.json(conversations);
}
