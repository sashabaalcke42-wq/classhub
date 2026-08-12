import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { data: questions } = await supabaseAdmin
    .from("quiz_questions")
    .select("id")
    .eq("quiz_id", id)
    .eq("type", "written");
  const questionIds = (questions ?? []).map((q) => q.id);
  if (questionIds.length === 0) return NextResponse.json([]);

  const { data, error } = await supabaseAdmin
    .from("quiz_responses")
    .select("id, answer_text, is_correct, quiz_attempts(account_name), quiz_questions(question_text)")
    .in("question_id", questionIds);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { responseId, isCorrect } = await req.json();
  const REWARD_PER_CORRECT = 10;

  const { data: existing } = await supabaseAdmin
    .from("quiz_responses")
    .select("is_correct, quiz_attempts(account_name)")
    .eq("id", responseId)
    .single();

  const { error } = await supabaseAdmin
    .from("quiz_responses")
    .update({ is_correct: !!isCorrect, graded_by: session.accountName, graded_at: new Date().toISOString() })
    .eq("id", responseId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Only pay out the first time a response transitions into "correct" —
  // re-grading the same response never double-pays.
  const wasUngraded = existing?.is_correct === null;
  if (isCorrect && wasUngraded) {
    const accountName = (existing?.quiz_attempts as any)?.account_name;
    if (accountName) {
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("credits")
        .eq("account_name", accountName)
        .single();
      if (user) {
        await supabaseAdmin
          .from("users")
          .update({ credits: user.credits + REWARD_PER_CORRECT })
          .eq("account_name", accountName);
      }
    }
  }

  return NextResponse.json({ ok: true });
}