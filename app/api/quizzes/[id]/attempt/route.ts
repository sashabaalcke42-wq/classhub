import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { answers } = await req.json(); // { [questionId]: answerText }

  const { data: existing } = await supabaseAdmin
    .from("quiz_attempts")
    .select("id, submitted_at")
    .eq("quiz_id", id)
    .eq("account_name", session.accountName)
    .maybeSingle();
  if (existing?.submitted_at) {
    return NextResponse.json({ error: "You've already submitted this quiz" }, { status: 409 });
  }

  const { data: questions } = await supabaseAdmin
    .from("quiz_questions")
    .select("id, type, correct_answer")
    .eq("quiz_id", id);
  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "Quiz has no questions" }, { status: 400 });
  }

  let attemptId = existing?.id;
  if (!attemptId) {
    const { data: attempt, error: attemptErr } = await supabaseAdmin
      .from("quiz_attempts")
      .insert({ quiz_id: id, account_name: session.accountName })
      .select()
      .single();
    if (attemptErr) return NextResponse.json({ error: attemptErr.message }, { status: 500 });
    attemptId = attempt.id;
  }

  const rows = questions.map((q) => {
    const answerText = String(answers?.[q.id] ?? "").trim();
    let isCorrect: boolean | null = null;
    if (q.type !== "written") {
      isCorrect = answerText.toLowerCase() === String(q.correct_answer ?? "").toLowerCase();
    }
    return { attempt_id: attemptId, question_id: q.id, answer_text: answerText, is_correct: isCorrect };
  });

  const { error: respErr } = await supabaseAdmin.from("quiz_responses").insert(rows);
  if (respErr) return NextResponse.json({ error: respErr.message }, { status: 500 });

  await supabaseAdmin
    .from("quiz_attempts")
    .update({ submitted_at: new Date().toISOString() })
    .eq("id", attemptId);

  return NextResponse.json({ ok: true });
}
