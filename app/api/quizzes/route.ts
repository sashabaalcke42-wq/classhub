import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: quizzes, error } = await supabaseAdmin
    .from("quizzes")
    .select("id, title, description, release_at, end_at, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date().toISOString();

  const { data: myAttempts } = await supabaseAdmin
    .from("quiz_attempts")
    .select("quiz_id, submitted_at")
    .eq("account_name", session.accountName);
  const attemptMap = new Map((myAttempts ?? []).map((a) => [a.quiz_id, !!a.submitted_at]));

  return NextResponse.json(
    (quizzes ?? []).map((q) => {
      const attempted = attemptMap.get(q.id) ?? false;
      let status: "locked" | "closed" | "attempted" | "open" = "open";
      if (attempted) status = "attempted";
      else if (q.release_at && q.release_at > now) status = "locked";
      else if (q.end_at && q.end_at < now) status = "closed";
      return { ...q, attempted, status };
    })
  );
}
