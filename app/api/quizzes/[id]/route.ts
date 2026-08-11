import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: quiz } = await supabaseAdmin
    .from("quizzes")
    .select("id, title, description, release_at, end_at")
    .eq("id", id)
    .maybeSingle();
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const now = new Date().toISOString();
  if (quiz.release_at && quiz.release_at > now) {
    return NextResponse.json({ error: "This quiz isn't available yet" }, { status: 403 });
  }
  if (quiz.end_at && quiz.end_at < now) {
    return NextResponse.json({ error: "This quiz has closed" }, { status: 403 });
  }

  const { data: existing } = await supabaseAdmin
    .from("quiz_attempts")
    .select("submitted_at")
    .eq("quiz_id", id)
    .eq("account_name", session.accountName)
    .maybeSingle();
  if (existing?.submitted_at) {
    return NextResponse.json({ error: "You've already submitted this quiz" }, { status: 409 });
  }

  const { data: questions, error } = await supabaseAdmin
    .from("quiz_questions")
    .select("id, order_index, type, question_text, options, timer_seconds")
    .eq("quiz_id", id)
    .order("order_index", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ quiz, questions });
}
