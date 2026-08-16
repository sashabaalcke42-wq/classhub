import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { notify } from "@/lib/notify";

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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { responseId, isCorrect } = await req.json();
  const { data: quiz } = await supabaseAdmin.from("quizzes").select("reward_per_correct").eq("id", quizId).single();
  const REWARD_PER_CORRECT = quiz?.reward_per_correct ?? 10;
  const newValue = !!isCorrect;

  const { data: existing } = await supabaseAdmin
    .from("quiz_responses")
    .select("is_correct, quiz_attempts(account_name)")
    .eq("id", responseId)
    .single();

  const { error } = await supabaseAdmin
    .from("quiz_responses")
    .update({ is_correct: newValue, graded_by: session.accountName, graded_at: new Date().toISOString() })
    .eq("id", responseId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Adjust coins based on the grade transition: pay out when it newly
  // becomes correct, claw back if a previously-correct grade is reversed.
  const wasCorrect = existing?.is_correct === true;
  let delta = 0;
  if (newValue && !wasCorrect) delta = REWARD_PER_CORRECT;
  else if (!newValue && wasCorrect) delta = -REWARD_PER_CORRECT;

  if (delta !== 0) {
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
          .update({ credits: Math.max(0, user.credits + delta) })
          .eq("account_name", accountName);
      }
    }
  }

  const gradedAccount = (existing?.quiz_attempts as any)?.account_name;
  if (gradedAccount && existing?.is_correct === null) {
    await notify(
      gradedAccount,
      "quiz_graded",
      `Your written answer was graded ${newValue ? "correct" : "incorrect"}`,
      undefined,
      `/dashboard/quizzes/${quizId}`
    );
  }

  return NextResponse.json({ ok: true });
}
