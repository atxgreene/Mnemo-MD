import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store";
import type { Flashcard } from "../types";
import { Panel, SectionTitle, Field, EmptyState } from "../ui";

interface Question {
  cardId: string;
  prompt: string;
  correct: string;
  options: string[]; // includes correct (only when MCQ)
  mcq: boolean;
  tags: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(cards: Flashcard[], count: number): Question[] {
  const pool = shuffle(cards).slice(0, count);
  const canMcq = cards.length >= 4;
  return pool.map((c) => {
    if (!canMcq) {
      return { cardId: c.id, prompt: c.front, correct: c.back, options: [], mcq: false, tags: c.tags };
    }
    const distractors = shuffle(cards.filter((x) => x.id !== c.id && x.back.trim() !== c.back.trim()))
      .slice(0, 3)
      .map((x) => x.back);
    return {
      cardId: c.id,
      prompt: c.front,
      correct: c.back,
      options: shuffle([c.back, ...distractors]),
      mcq: true,
      tags: c.tags,
    };
  });
}

export default function Quiz() {
  const { state, setPage } = useStore();
  const cards = state.flashcards;

  const [phase, setPhase] = useState<"setup" | "running" | "done">("setup");
  const [count, setCount] = useState(Math.min(10, cards.length || 10));
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<{ q: Question; correct: boolean }[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (phase !== "running") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const start = () => {
    setQuestions(buildQuestions(cards, count));
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setResults([]);
    setStartedAt(Date.now());
    setNow(Date.now());
    setPhase("running");
  };

  const q = questions[idx];

  const answerMcq = (option: string) => {
    if (revealed) return;
    setPicked(option);
    setRevealed(true);
    setResults((r) => [...r, { q, correct: option === q.correct }]);
  };
  const answerSelf = (correct: boolean) => {
    setResults((r) => [...r, { q, correct }]);
    next();
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      setPhase("done");
    } else {
      setIdx((i) => i + 1);
      setPicked(null);
      setRevealed(false);
    }
  };

  const score = results.filter((r) => r.correct).length;
  const elapsed = startedAt ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0;
  const missed = results.filter((r) => !r.correct);

  // ---- Setup ----
  if (phase === "setup") {
    return (
      <div className="space-y-5">
        <SectionTitle icon="❓" title="Quiz Mode" subtitle="A timed, scored self-test generated from your flashcard deck." />
        {cards.length === 0 ? (
          <Panel>
            <EmptyState icon="🗂️" title="No flashcards to quiz" hint="Add cards in Flashcards (or import an Anki CSV), then come back to test yourself." />
            <div className="mt-3 text-center">
              <button className="btn btn-primary" onClick={() => setPage("flashcards")}>Go to Flashcards</button>
            </div>
          </Panel>
        ) : (
          <Panel>
            <div className="max-w-xs">
              <Field label={`Number of questions (deck has ${cards.length})`}>
                <input
                  type="number"
                  min={1}
                  max={cards.length}
                  className="input"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(cards.length, Number(e.target.value) || 1)))}
                />
              </Field>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              {cards.length >= 4
                ? "Multiple-choice questions with auto-graded scoring (distractors drawn from your other cards)."
                : "Self-graded recall mode (need at least 4 cards for multiple choice)."}
            </p>
            <button className="btn btn-primary mt-4" onClick={start}>▶ Start quiz</button>
          </Panel>
        )}
      </div>
    );
  }

  // ---- Running ----
  if (phase === "running" && q) {
    return (
      <div className="space-y-5">
        <SectionTitle icon="❓" title="Quiz Mode" right={<span className="chip">⏱ {fmtTime(elapsed)}</span>} />
        <Panel>
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
            <span>Question {idx + 1} of {questions.length}</span>
            <span>Score {score}/{results.length}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 transition-all" style={{ width: `${(idx / questions.length) * 100}%` }} />
          </div>

          <p className="mt-4 text-lg font-medium">{q.prompt}</p>

          {q.mcq ? (
            <div className="mt-4 space-y-2">
              {q.options.map((opt) => {
                const isCorrect = opt === q.correct;
                const isPicked = opt === picked;
                let cls = "border-white/10 bg-white/[0.02] hover:border-white/25";
                if (revealed && isCorrect) cls = "border-emerald-400/60 bg-emerald-400/10";
                else if (revealed && isPicked) cls = "border-rose-400/60 bg-rose-400/10";
                return (
                  <button
                    key={opt}
                    disabled={revealed}
                    onClick={() => answerMcq(opt)}
                    className={`block w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${cls}`}
                  >
                    {opt}
                    {revealed && isCorrect && <span className="ml-2 text-emerald-300">✓</span>}
                    {revealed && isPicked && !isCorrect && <span className="ml-2 text-rose-300">✗</span>}
                  </button>
                );
              })}
              {revealed && (
                <button className="btn btn-primary mt-2 w-full" onClick={next}>
                  {idx + 1 >= questions.length ? "See results" : "Next question →"}
                </button>
              )}
            </div>
          ) : (
            <SelfGrade card={q} onGrade={answerSelf} />
          )}
        </Panel>
      </div>
    );
  }

  // ---- Done ----
  return (
    <div className="space-y-5">
      <SectionTitle icon="🏁" title="Quiz Results" />
      <Panel>
        <div className="flex flex-wrap items-center justify-around gap-4 text-center">
          <Big label="Score" value={`${Math.round((score / Math.max(1, results.length)) * 100)}%`} accent />
          <Big label="Correct" value={`${score}/${results.length}`} />
          <Big label="Time" value={fmtTime(elapsed)} />
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <button className="btn btn-primary" onClick={start}>↻ Retry</button>
          <button className="btn btn-ghost" onClick={() => setPhase("setup")}>Change settings</button>
        </div>
      </Panel>

      <Panel>
        <SectionTitle icon="🔎" title={`Missed Questions (${missed.length})`} subtitle="Review these, then drill them in Flashcards." />
        {missed.length === 0 ? (
          <p className="text-sm text-emerald-300">Perfect run — nothing missed. 🎉</p>
        ) : (
          <div className="space-y-2">
            {missed.map((m, i) => (
              <div key={i} className="rounded-lg border border-rose-400/20 bg-rose-400/[0.05] px-3 py-2">
                <p className="text-sm font-medium">{m.q.prompt}</p>
                <p className="mt-1 text-sm text-slate-300"><span className="text-emerald-300">Answer:</span> {m.q.correct}</p>
                {m.q.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {m.q.tags.map((t) => (
                      <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-slate-400">#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function SelfGrade({ card, onGrade }: { card: Question; onGrade: (correct: boolean) => void }) {
  const [show, setShow] = useState(false);
  // Reset reveal when the prompt changes.
  useEffect(() => setShow(false), [card.cardId]);
  return (
    <div className="mt-4">
      {!show ? (
        <button className="btn btn-primary w-full" onClick={() => setShow(true)}>Show answer</button>
      ) : (
        <>
          <div className="rounded-lg border border-white/10 bg-ink-950/60 p-3 text-sm text-slate-200">{card.correct}</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="rounded-lg bg-rose-500/80 px-3 py-2 text-sm font-semibold text-white hover:brightness-110" onClick={() => onGrade(false)}>I got it wrong</button>
            <button className="rounded-lg bg-emerald-500/80 px-3 py-2 text-sm font-semibold text-slate-900 hover:brightness-110" onClick={() => onGrade(true)}>I got it right</button>
          </div>
        </>
      )}
    </div>
  );
}

function Big({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className={`text-3xl font-bold ${accent ? "text-teal-300" : ""}`}>{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
