import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date().toISOString();
  const { data: quizzes, error } = await supabaseAdmin
    .from("quizzes")
    .select("id, title, description, release_at, end_at, created_at")
    .or(`release_at.is.null,release_at.lte.${now}`)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const visible = (quizzes ?? []).filter((q) => !q.end_at || q.end_at > now);

  const { data: myAttempts } = await supabaseAdmin
    .from("quiz_attempts")
    .select("quiz_id, submitted_at")
    .eq("account_name", session.accountName);

  const attemptMap = new Map((myAttempts ?? []).map((a) => [a.quiz_id, !!a.submitted_at]));

  return NextResponse.json(
    visible.map((q) => ({ ...q, attempted: attemptMap.get(q.id) ?? false }))
  );
}
