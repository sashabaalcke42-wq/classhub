"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Question = {
  id: string;
  order_index: number;
  type: "true_false" | "multiple_choice" | "written";
  question_text: string;
  options: string[] | null;
  timer_seconds: number | null;
};

export default function TakeQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<{ title: string; description: string | null } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadQuiz() {
    const res = await fetch(`/api/quizzes/${id}`);
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 409) {
        setSubmitted(true);
        loadResult();
      } else {
        setError(data.error);
      }
      setLoading(false);
      return;
    }
    setQuiz(data.quiz);
    setQuestions(data.questions);
    setLoading(false);
  }

  async function loadResult() {
    const res = await fetch(`/api/quizzes/${id}/result`);
    if (res.ok) setResult(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submit() {
    setError("");
    const res = await fetch(`/api/quizzes/${id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setSubmitted(true);
    loadResult();
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-txt2">Loading...</div>;

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-[52px] border-b border-line flex items-center px-[18px] gap-3 bg-bg1">
        <button onClick={() => router.push("/dashboard/quizzes")} className="text-txt2 text-sm">← Back</button>
        <h2 className="font-display text-lg font-bold">{quiz?.title ?? "Quiz results"}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-3 py-2 rounded-md mb-4 max-w-[560px]">{error}</div>}

        {submitted && result ? (
          <div className="max-w-[560px]">
            <div className="text-sm text-txt1 mb-4">
              Score: <span className="text-gold font-semibold">{result.correct}</span> / {result.total} correct
              {!result.fullyGraded && <span className="text-txt2"> · some written answers still being graded</span>}
            </div>
            {result.responses.map((r: any) => (
              <div key={r.id} className="bg-bg2 border border-line rounded-lg p-3 mb-2">
                <div className="text-sm font-medium mb-1">{r.quiz_questions.question_text}</div>
                <div className="text-xs text-txt2">Your answer: {r.answer_text || "(blank)"}</div>
                <div className="text-xs mt-1">
                  {r.is_correct === null ? (
                    <span className="text-gold">Awaiting grading</span>
                  ) : r.is_correct ? (
                    <span className="text-online">Correct</span>
                  ) : (
                    <span className="text-danger">Incorrect{r.quiz_questions.type !== "written" ? ` — answer: ${r.quiz_questions.correct_answer}` : ""}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : questions.length > 0 ? (
          <div className="max-w-[560px] flex flex-col gap-4">
            {quiz?.description && <div className="text-sm text-txt2">{quiz.description}</div>}
            {questions.map((q, i) => (
              <div key={q.id} className="bg-bg2 border border-line rounded-lg p-4">
                <div className="text-sm font-medium mb-3">{i + 1}. {q.question_text}</div>
                {q.type === "true_false" && (
                  <div className="flex gap-2">
                    {["true", "false"].map((v) => (
                      <button key={v} onClick={() => setAnswers((a) => ({ ...a, [q.id]: v }))}
                        className={`px-4 py-2 rounded-md text-sm border ${answers[q.id] === v ? "bg-violet text-white border-violet" : "bg-bg3 border-line text-txt1"}`}>
                        {v === "true" ? "True" : "False"}
                      </button>
                    ))}
                  </div>
                )}
                {q.type === "multiple_choice" && (
                  <div className="flex flex-col gap-2">
                    {(q.options ?? []).map((opt) => (
                      <button key={opt} onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className={`text-left px-3 py-2 rounded-md text-sm border ${answers[q.id] === opt ? "bg-violet text-white border-violet" : "bg-bg3 border-line text-txt1"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {q.type === "written" && (
                  <input
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    placeholder="Type your answer..."
                    className="w-full bg-bg3 border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-violet"
                  />
                )}
              </div>
            ))}
            <button onClick={submit} className="self-start bg-violet text-white rounded-md px-5 py-2.5 text-sm font-semibold">
              Submit quiz
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
