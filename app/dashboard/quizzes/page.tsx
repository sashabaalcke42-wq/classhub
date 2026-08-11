"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Quiz = { id: string; title: string; description: string | null; attempted: boolean; end_at: string | null };

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    fetch("/api/quizzes").then((r) => r.json()).then(setQuizzes);
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-[52px] border-b border-line flex items-center px-[18px] bg-bg1">
        <h2 className="font-display text-lg font-bold">Quizzes</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {quizzes.length === 0 ? (
          <div className="text-center text-txt2 mt-10">No quizzes available right now</div>
        ) : (
          <div className="flex flex-col gap-2 max-w-[560px]">
            {quizzes.map((q) => (
              <div key={q.id} className="bg-bg2 border border-line rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{q.title}</div>
                  {q.description && <div className="text-xs text-txt2 mt-1">{q.description}</div>}
                  {q.end_at && <div className="text-[11px] text-txt2 mt-1">Closes {new Date(q.end_at).toLocaleString()}</div>}
                </div>
                <button
                  onClick={() => router.push(`/dashboard/quizzes/${q.id}`)}
                  className={`rounded-md px-4 py-2 text-xs font-semibold ${q.attempted ? "bg-bg3 border border-line text-txt1" : "bg-violet text-white"}`}
                >
                  {q.attempted ? "View results" : "Take quiz"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
