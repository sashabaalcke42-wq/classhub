import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("quizzes")
    .select("id, title, description, release_at, end_at, created_at, deleted_at, quiz_questions(id)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    data.map((q: any) => ({ ...q, questionCount: q.quiz_questions?.length ?? 0, quiz_questions: undefined }))
  );
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { title, description, releaseAt, endAt, questions, rewardPerCorrect } = await req.json();

  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "Title and at least one question are required" }, { status: 400 });
  }
  if (questions.length > 4) {
    return NextResponse.json({ error: "Quizzes support up to 4 questions" }, { status: 400 });
  }
  for (const q of questions) {
    if (!["true_false", "multiple_choice", "written"].includes(q.type)) {
      return NextResponse.json({ error: "Invalid question type" }, { status: 400 });
    }
    if (!q.questionText?.trim()) {
      return NextResponse.json({ error: "Every question needs text" }, { status: 400 });
    }
    if (q.type === "multiple_choice" && (!Array.isArray(q.options) || q.options.length < 2)) {
      return NextResponse.json({ error: "Multiple choice needs at least 2 options" }, { status: 400 });
    }
    if (q.type !== "written" && !q.correctAnswer) {
      return NextResponse.json({ error: "True/false and multiple choice need a correct answer set" }, { status: 400 });
    }
  }

  const { data: quiz, error: quizErr } = await supabaseAdmin
    .from("quizzes")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      created_by: session.accountName,
      release_at: releaseAt || null,
      end_at: endAt || null,
      reward_per_correct: Math.max(0, parseInt(rewardPerCorrect, 10) || 10),
    })
    .select()
    .single();
  if (quizErr) return NextResponse.json({ error: quizErr.message }, { status: 500 });

  const rows = questions.map((q: any, i: number) => ({
    quiz_id: quiz.id,
    order_index: i,
    type: q.type,
    question_text: q.questionText.trim(),
    options: q.type === "multiple_choice" ? q.options : null,
    correct_answer: q.type === "written" ? null : String(q.correctAnswer),
    timer_seconds: q.timerSeconds || null,
  }));

  const { error: qErr } = await supabaseAdmin.from("quiz_questions").insert(rows);
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  return NextResponse.json(quiz);
}
