import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: suggestions, error } = await supabaseAdmin
    .from("suggestions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: votes } = await supabaseAdmin.from("suggestion_votes").select("suggestion_id, account_name");
  const counts: Record<string, number> = {};
  const myVotes = new Set<string>();
  for (const v of votes ?? []) {
    counts[v.suggestion_id] = (counts[v.suggestion_id] ?? 0) + 1;
    if (v.account_name === session.accountName) myVotes.add(v.suggestion_id);
  }

  const result = suggestions
    .map((s) => ({ ...s, votes: counts[s.id] ?? 0, votedByMe: myVotes.has(s.id) }))
    .sort((a, b) => b.votes - a.votes);

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body } = await req.json();
  const clean = String(title ?? "").trim();
  if (!clean) return NextResponse.json({ error: "Title required" }, { status: 400 });
  if (clean.length > 100) return NextResponse.json({ error: "Title too long" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("suggestions")
    .insert({
      account_name: session.accountName,
      display_name: session.displayName,
      title: clean,
      body: String(body ?? "").trim().slice(0, 500) || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
