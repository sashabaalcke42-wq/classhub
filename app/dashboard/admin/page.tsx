"use client";

import { useEffect, useState } from "react";

type User = { account_name: string; display_name: string; is_admin: boolean; created_at: string };
type Group = { id: string; name: string; created_by: string; memberCount: number };
type DMConv = { key: string; accountA: string; accountB: string; messageCount: number };
type Game = { id: string; name: string; added_by: string };
type DMMsg = { id: string; display_name: string; body: string; created_at: string };

export default function AdminPage() {
  const [tab, setTab] = useState<"users" | "groups" | "dms" | "games" | "quizzes">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [dms, setDms] = useState<DMConv[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [gradeQueue, setGradeQueue] = useState<any[]>([]);
  const [showNewQuiz, setShowNewQuiz] = useState(false);
  const [gradingQuiz, setGradingQuiz] = useState<string | null>(null);
  const [viewingDM, setViewingDM] = useState<DMConv | null>(null);
  const [dmMsgs, setDmMsgs] = useState<DMMsg[]>([]);
  const [me, setMe] = useState<string>("");

  async function loadUsers() {
    const [u, s] = await Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]);
    setUsers(u);
    setMe(s.accountName);
  }
  async function loadGroups() {
    setGroups(await fetch("/api/admin/groups").then((r) => r.json()));
  }
  async function loadDMs() {
    setDms(await fetch("/api/admin/dms").then((r) => r.json()));
  }
  async function loadGames() {
    setGames(await fetch("/api/games").then((r) => r.json()));
  }
  async function loadQuizzes() {
    setQuizzes(await fetch("/api/admin/quizzes").then((r) => r.json()));
  }
  async function deleteQuiz(id: string) {
    if (!confirm("Permanently delete this quiz? This also removes it from the leaderboard.")) return;
    await fetch(`/api/admin/quizzes/${id}`, { method: "DELETE" });
    loadQuizzes();
  }
  async function toggleArchive(id: string, archived: boolean) {
    await fetch(`/api/admin/quizzes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    });
    loadQuizzes();
  }
  async function openGrading(quizId: string) {
    setGradingQuiz(quizId);
    setGradeQueue(await fetch(`/api/admin/quizzes/${quizId}/grade`).then((r) => r.json()));
  }
  async function grade(responseId: string, isCorrect: boolean) {
    await fetch(`/api/admin/quizzes/${gradingQuiz}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responseId, isCorrect }),
    });
    if (gradingQuiz) openGrading(gradingQuiz);
  }

  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "groups") loadGroups();
    if (tab === "dms") loadDMs();
    if (tab === "games") loadGames();
    if (tab === "quizzes") loadQuizzes();
    setViewingDM(null);
  }, [tab]);

  async function toggleAdmin(accountName: string, isAdmin: boolean) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountName, isAdmin: !isAdmin }),
    });
    loadUsers();
  }
  async function deleteUser(accountName: string) {
    if (!confirm(`Delete account "${accountName}"? This cannot be undone.`)) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountName }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert("Delete failed: " + (data.error ?? "Unknown error"));
    }
    loadUsers();
  }
  async function deleteGroup(id: string) {
    if (!confirm("Delete this group and all its messages?")) return;
    await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
    loadGroups();
  }
  async function deleteGame(id: string) {
    await fetch(`/api/games/${id}`, { method: "DELETE" });
    loadGames();
  }
  async function openDM(conv: DMConv) {
    setViewingDM(conv);
    setDmMsgs(await fetch(`/api/admin/dms/${conv.key}`).then((r) => r.json()));
  }

  const tabBtn = (id: typeof tab, label: string) => (
    <div
      onClick={() => setTab(id)}
      className={`px-3.5 py-1.5 rounded-md text-sm cursor-pointer border ${
        tab === id ? "bg-violet text-white border-violet" : "bg-bg2 text-txt1 border-line"
      }`}
    >
      {label}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-[52px] border-b border-line flex items-center px-[18px] bg-bg1">
        <h2 className="font-display text-lg font-bold text-gold">Admin</h2>
      </div>
      <div className="flex gap-2 px-5 pt-3.5">
        {tabBtn("users", "Users")}
        {tabBtn("groups", "Groups")}
        {tabBtn("dms", "DMs")}
        {tabBtn("games", "Games")}
        {tabBtn("quizzes", "Quizzes")}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "users" && (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-txt2 text-[11px] uppercase tracking-wide border-b border-line">
                <th className="py-2 px-2">Display name</th>
                <th className="py-2 px-2 font-mono">Account</th>
                <th className="py-2 px-2">Role</th>
                <th className="py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.account_name} className="border-b border-line text-txt1">
                  <td className="py-2 px-2">{u.display_name}</td>
                  <td className="py-2 px-2 font-mono">{u.account_name}</td>
                  <td className="py-2 px-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.is_admin ? "bg-gold/15 text-gold" : "bg-bg3"}`}>
                      {u.is_admin ? "admin" : "member"}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    {u.account_name !== me ? (
                      <>
                        <button
                          onClick={() => toggleAdmin(u.account_name, u.is_admin)}
                          className="bg-bg3 border border-line rounded px-2 py-1 text-xs mr-1.5"
                        >
                          {u.is_admin ? "Revoke admin" : "Make admin"}
                        </button>
                        <button
                          onClick={() => deleteUser(u.account_name)}
                          className="bg-bg3 border border-line rounded px-2 py-1 text-xs hover:text-danger"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="text-txt2">— you —</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "groups" &&
          (groups.length === 0 ? (
            <Empty text="No groups yet" />
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-txt2 text-[11px] uppercase tracking-wide border-b border-line">
                  <th className="py-2 px-2">Group</th>
                  <th className="py-2 px-2">Members</th>
                  <th className="py-2 px-2 font-mono">Created by</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.id} className="border-b border-line text-txt1">
                    <td className="py-2 px-2">{g.name}</td>
                    <td className="py-2 px-2">{g.memberCount}</td>
                    <td className="py-2 px-2 font-mono">{g.created_by}</td>
                    <td className="py-2 px-2">
                      <button onClick={() => deleteGroup(g.id)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs hover:text-danger">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === "dms" &&
          (viewingDM ? (
            <div>
              <button onClick={() => setViewingDM(null)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs mb-3">
                ← back
              </button>
              <div className="text-sm text-txt2 mb-3">
                {viewingDM.accountA} ↔ {viewingDM.accountB}
              </div>
              {dmMsgs.length === 0 ? (
                <Empty text="No messages" />
              ) : (
                dmMsgs.map((m) => (
                  <div key={m.id} className="py-1.5">
                    <div className="text-xs text-txt2">
                      <span className="font-semibold text-txt0">{m.display_name}</span>{" "}
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                    <div className="text-sm">{m.body}</div>
                  </div>
                ))
              )}
            </div>
          ) : dms.length === 0 ? (
            <Empty text="No DMs yet" />
          ) : (
            <>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-txt2 text-[11px] uppercase tracking-wide border-b border-line">
                    <th className="py-2 px-2">Conversation</th>
                    <th className="py-2 px-2"></th>
                    <th className="py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dms.map((d) => (
                    <tr key={d.key} className="border-b border-line text-txt1">
                      <td className="py-2 px-2 font-mono">
                        {d.accountA} ↔ {d.accountB}
                      </td>
                      <td className="py-2 px-2">{d.messageCount} messages</td>
                      <td className="py-2 px-2">
                        <button onClick={() => openDM(d)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-[11px] text-txt2 mt-3">
                Admins can view all private conversations for moderation purposes. Use responsibly.
              </div>
            </>
          ))}

        {tab === "games" &&
          (games.length === 0 ? (
            <Empty text="No games yet" />
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-txt2 text-[11px] uppercase tracking-wide border-b border-line">
                  <th className="py-2 px-2">Game</th>
                  <th className="py-2 px-2 font-mono">Added by</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {games.map((g) => (
                  <tr key={g.id} className="border-b border-line text-txt1">
                    <td className="py-2 px-2">{g.name}</td>
                    <td className="py-2 px-2 font-mono">{g.added_by}</td>
                    <td className="py-2 px-2">
                      <button onClick={() => deleteGame(g.id)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs hover:text-danger">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === "quizzes" &&
          (gradingQuiz ? (
            <div>
              <button onClick={() => setGradingQuiz(null)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs mb-3">← back</button>
              {gradeQueue.length === 0 ? <Empty text="No written answers to grade" /> :
                gradeQueue.map((r: any) => (
                  <div key={r.id} className="bg-bg2 border border-line rounded-lg p-3 mb-2">
                    <div className="text-xs text-txt2 mb-1">{r.quiz_attempts.account_name} — {r.quiz_questions.question_text}</div>
                    <div className="text-sm mb-2">{r.answer_text || "(blank)"}</div>
                    <div className="flex gap-2 items-center">
                      <button onClick={() => grade(r.id, true)}
                        className={`rounded px-3 py-1 text-xs ${r.is_correct === true ? "bg-online text-bg0 font-semibold" : "bg-online/15 text-online"}`}>
                        Mark correct
                      </button>
                      <button onClick={() => grade(r.id, false)}
                        className={`rounded px-3 py-1 text-xs ${r.is_correct === false ? "bg-danger text-white font-semibold" : "bg-danger/15 text-danger"}`}>
                        Mark incorrect
                      </button>
                      {r.is_correct === null && <span className="text-[11px] text-txt2">Ungraded</span>}
                    </div>
                  </div>
                ))
              }
            </div>
          ) : (
            <>
              <button onClick={() => setShowNewQuiz(true)} className="bg-violet text-white rounded-md px-3.5 py-1.5 text-sm font-semibold mb-4">
                + New quiz
              </button>
              {quizzes.length === 0 ? <Empty text="No quizzes yet" /> :
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left text-txt2 text-[11px] uppercase tracking-wide border-b border-line">
                      <th className="py-2 px-2">Title</th>
                      <th className="py-2 px-2">Questions</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes.map((q: any) => (
                      <tr key={q.id} className="border-b border-line text-txt1">
                        <td className="py-2 px-2">{q.title}</td>
                        <td className="py-2 px-2">{q.questionCount}</td>
                        <td className="py-2 px-2">
                          {q.deleted_at ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg3 text-txt2">Archived</span> : <span className="text-online text-xs">Active</span>}
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <button onClick={() => openGrading(q.id)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs mr-1.5">Grade written</button>
                          <button onClick={() => toggleArchive(q.id, !q.deleted_at)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs mr-1.5">
                            {q.deleted_at ? "Unarchive" : "Archive"}
                          </button>
                          <button onClick={() => deleteQuiz(q.id)} className="bg-bg3 border border-line rounded px-2 py-1 text-xs hover:text-danger">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
              {showNewQuiz && <NewQuizModal onClose={() => setShowNewQuiz(false)} onCreated={() => { setShowNewQuiz(false); loadQuizzes(); }} />}
            </>
          ))}
      </div>
    </div>
  );
}

function NewQuizModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseAt, setReleaseAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [questions, setQuestions] = useState<any[]>([{ type: "true_false", questionText: "", correctAnswer: "true", options: [] }]);
  const [error, setError] = useState("");

  function updateQ(i: number, patch: any) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function addQuestion() {
    if (questions.length >= 4) return;
    setQuestions((qs) => [...qs, { type: "true_false", questionText: "", correctAnswer: "true", options: [] }]);
  }
  function removeQuestion(i: number) {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  }

  async function create() {
    setError("");
    const res = await fetch("/api/admin/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, questions,
        releaseAt: releaseAt ? new Date(releaseAt).toISOString() : null,
        endAt: endAt ? new Date(endAt).toISOString() : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-bg1 border border-line rounded-xl p-6 w-[520px] max-h-[85vh] overflow-y-auto">
        <h3 className="font-display text-lg font-bold mb-4">New quiz</h3>
        {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-3 py-2 rounded-md mb-3">{error}</div>}

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz title"
          className="w-full bg-bg2 border border-line rounded-md px-3 py-2 text-sm mb-3 outline-none focus:border-violet" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2}
          className="w-full bg-bg2 border border-line rounded-md px-3 py-2 text-sm mb-3 outline-none focus:border-violet resize-none" />

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wide text-txt2 mb-1">Release date (optional)</label>
            <input type="datetime-local" value={releaseAt} onChange={(e) => setReleaseAt(e.target.value)}
              className="w-full bg-bg2 border border-line rounded-md px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wide text-txt2 mb-1">End date (optional)</label>
            <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)}
              className="w-full bg-bg2 border border-line rounded-md px-2 py-1.5 text-sm" />
          </div>
        </div>

        {questions.map((q, i) => (
          <div key={i} className="bg-bg2 border border-line rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-txt2">Question {i + 1}</span>
              {questions.length > 1 && <button onClick={() => removeQuestion(i)} className="text-xs text-danger">Remove</button>}
            </div>
            <select value={q.type} onChange={(e) => updateQ(i, { type: e.target.value, correctAnswer: e.target.value === "true_false" ? "true" : "", options: [] })}
              className="w-full bg-bg3 border border-line rounded-md px-2 py-1.5 text-sm mb-2">
              <option value="true_false">True / False</option>
              <option value="multiple_choice">Multiple choice</option>
              <option value="written">Written answer</option>
            </select>
            <input value={q.questionText} onChange={(e) => updateQ(i, { questionText: e.target.value })} placeholder="Question text"
              className="w-full bg-bg3 border border-line rounded-md px-2 py-1.5 text-sm mb-2" />

            {q.type === "true_false" && (
              <select value={q.correctAnswer} onChange={(e) => updateQ(i, { correctAnswer: e.target.value })}
                className="w-full bg-bg3 border border-line rounded-md px-2 py-1.5 text-sm">
                <option value="true">Correct answer: True</option>
                <option value="false">Correct answer: False</option>
              </select>
            )}

            {q.type === "multiple_choice" && (
              <div className="flex flex-col gap-1.5">
                {[0, 1, 2, 3].map((oi) => (
                  <input key={oi} value={q.options[oi] ?? ""} placeholder={`Option ${oi + 1}`}
                    onChange={(e) => {
                      const opts = [...q.options];
                      opts[oi] = e.target.value;
                      updateQ(i, { options: opts.filter((o) => o) });
                    }}
                    className="w-full bg-bg3 border border-line rounded-md px-2 py-1.5 text-sm" />
                ))}
                <select value={q.correctAnswer} onChange={(e) => updateQ(i, { correctAnswer: e.target.value })}
                  className="w-full bg-bg3 border border-line rounded-md px-2 py-1.5 text-sm mt-1">
                  <option value="">Select correct option</option>
                  {q.options.filter((o: string) => o).map((o: string) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            )}

            {q.type === "written" && <div className="text-xs text-txt2">You'll grade this answer manually after students submit.</div>}
          </div>
        ))}

        {questions.length < 4 && (
          <button onClick={addQuestion} className="text-sm text-violet mb-4">+ Add question ({questions.length}/4)</button>
        )}

        <div className="flex gap-2">
          <button onClick={create} className="flex-1 bg-violet text-white rounded-md py-2 text-sm font-semibold">Create quiz</button>
          <button onClick={onClose} className="bg-bg2 border border-line rounded-md px-4 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="text-center text-txt2 mt-10">
      <div className="text-sm text-txt1">{text}</div>
    </div>
  );
}
