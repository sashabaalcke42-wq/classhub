import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: attempt } = await supabaseAdmin
    .from("quiz_attempts")
    .select("id, submitted_at")
    .eq("quiz_id", id)
    .eq("account_name", session.accountName)
    .maybeSingle();
  if (!attempt || !attempt.submitted_at) {
    return NextResponse.json({ error: "No submitted attempt found" }, { status: 404 });
  }

  const { data: responses, error } = await supabaseAdmin
    .from("quiz_responses")
    .select("id, question_id, answer_text, is_correct, quiz_questions(question_text, type, correct_answer)")
    .eq("attempt_id", attempt.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = responses.length;
  const graded = responses.filter((r) => r.is_correct !== null).length;
  const correct = responses.filter((r) => r.is_correct === true).length;

  return NextResponse.json({ responses, total, graded, correct, fullyGraded: graded === total });
}
