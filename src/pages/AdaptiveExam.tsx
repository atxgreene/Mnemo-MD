import { useMemo, useState } from "react";
import { useStore } from "../store";
import type { Confidence, Flashcard } from "../types";
import { uid } from "../lib/storage";
import {
  abilityPct,
  cardTopic,
  ExamAnswer,
  initTopicWeights,
  nextTheta,
  selectNext,
  updateWeights,
} from "../lib/adaptive";
import { Panel, SectionTitle, Field, EmptyState } from "../ui";

interface Question {
  card: Flashcard;
  topic: string;
  correct: string;
  options: string[];
  mcq: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestion(card: Flashcard, pool: Flashcard[]): Question {
  const topic = cardTopic(card);
  const mcq = pool.length >= 4;
  if (!mcq) return { card, topic, correct: card.back, options: [], mcq: false };
  const distractors = shuffle(pool.filter((x) => x.id !== card.id && x.back.trim() !== card.back.trim()))
    .slice(0, 3)
    .map((x) => x.back);
  return { card, topic, correct: card.back, options: shuffle([card.back, ...distractors]), mcq: true };
}

export default function AdaptiveExam() {
  const { state, upsertWeak, setPage } = useStore();
  const allCards = state.flashcards;

  const [phase, setPhase] = useState<"setup" | "running" | "done">("setup");
  const [length, setLength] = useState(Math.min(12, allCards.length || 12));
  const [pool, setPool] = useState<Flashcard[]>([]);
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [theta, setTheta] = useState(0);
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [applied, setApplied] = useState(false);

  const start = () => {
    const p = allCards;
    const w = initTopicWeights(p, state.weakTopics);
    const first = selectNext(p, new Set(), 0, w, state.weakTopics);
    if (!first) return;
    setPool(p);
    setWeights(w);
    setTheta(0);
    setAsked(new Set([first.id]));
    setAnswers([]);
    setQ(buildQuestion(first, p));
    setPicked(null);
    setRevealed(false);
    setApplied(false);
    setPhase("running");
  };

  const advance = (correct: boolean) => {
    if (!q) return;
    const ans: ExamAnswer = { cardId: q.card.id, topic: q.topic, correct };
    const allAnswers = [...answers, ans];
    setAnswers(allAnswers);

    const newTheta = nextTheta(theta, correct);
    const newWeights = updateWeights(weights, q.topic, correct);
    setTheta(newTheta);
    setWeights(newWeights);

    if (allAnswers.length >= length) {
      setPhase("done");
      return;
    }
    const nextCard = selectNext(pool, asked, newTheta, newWeights, state.weakTopics);
    if (!nextCard) {
      setPhase("done");
      return;
    }
    setAsked((s) => new Set(s).add(nextCard.id));
    setQ(buildQuestion(nextCard, pool));
    setPicked(null);
    setRevealed(false);
  };

  const answerMcq = (opt: string) => {
    if (revealed || !q) return;
    setPicked(opt);
    setRevealed(true);
  };

  const score = answers.filter((a) => a.correct).length;

  // Per-topic accuracy for the results view.
  const byTopic = useMemo(() => {
    const m = new Map<string, { correct: number; total: number }>();
    for (const a of answers) {
      const g = m.get(a.topic) ?? { correct: 0, total: 0 };
      g.total++;
      if (a.correct) g.correct++;
      m.set(a.topic, g);
    }
    return [...m.entries()].map(([topic, g]) => ({ topic, ...g, acc: g.correct / g.total }));
  }, [answers]);

  const applyToTracker = () => {
    for (const t of byTopic) {
      const confidence = (t.acc >= 0.8 ? 4 : t.acc >= 0.5 ? 3 : 2) as Confidence;
      const misses = t.total - t.correct;
      const existing = state.weakTopics.find((w) => w.topic.toLowerCase() === t.topic.toLowerCase());
      if (existing) {
        upsertWeak({ ...existing, confidence, missedQuestions: existing.missedQuestions + misses, lastStudied: Date.now() });
      } else {
        upsertWeak({ id: uid("wk_"), topic: t.topic, confidence, missedQuestions: misses, notes: "", nextAction: "", lastStudied: Date.now() });
      }
    }
    setApplied(true);
  };

  // ---- Setup ----
  if (phase === "setup") {
    return (
      <div className="space-y-5">
        <SectionTitle icon="🧠" title="Adaptive Exam" subtitle="A practice exam that targets your weak topics and adjusts difficulty as you go." />
        {allCards.length === 0 ? (
          <Panel>
            <EmptyState icon="🗂️" title="No flashcards to draw from" hint="Add cards in Flashcards (or import an Anki CSV), then take an adaptive exam." />
            <div className="mt-3 text-center">
              <button className="btn btn-primary" onClick={() => setPage("flashcards")}>Go to Flashcards</button>
            </div>
          </Panel>
        ) : (
          <Panel>
            <div className="max-w-xs">
              <Field label={`Exam length (deck has ${allCards.length})`}>
                <input
                  type="number"
                  min={1}
                  max={allCards.length}
                  className="input"
                  value={length}
                  onChange={(e) => setLength(Math.max(1, Math.min(allCards.length, Number(e.target.value) || 1)))}
                />
              </Field>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-slate-400">
              <li>• Questions are weighted toward your <span className="text-rose-300">weak topics</span>.</li>
              <li>• Difficulty tracks your performance — get them right and it ramps up.</li>
              <li>• Afterwards you can push the results into your Weakness Tracker.</li>
            </ul>
            <button className="btn btn-primary mt-4" onClick={start}>▶ Start adaptive exam</button>
          </Panel>
        )}
      </div>
    );
  }

  // ---- Running ----
  if (phase === "running" && q) {
    const num = answers.length + 1;
    return (
      <div className="space-y-5">
        <SectionTitle
          icon="🧠"
          title="Adaptive Exam"
          right={<span className="chip">Q {num}/{length} · score {score}/{answers.length}</span>}
        />
        <Panel>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
            <span>Difficulty level</span>
            <span>{abilityPct(theta)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 transition-all" style={{ width: `${abilityPct(theta)}%` }} />
          </div>

          <p className="mt-4 text-lg font-medium">{q.card.front}</p>
          <span className="mt-1 inline-block rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-slate-400">#{q.topic}</span>

          {q.mcq ? (
            <div className="mt-4 space-y-2">
              {q.options.map((opt) => {
                const isCorrect = opt === q.correct;
                const isPicked = opt === picked;
                let cls = "border-white/10 bg-white/[0.02] hover:border-white/25";
                if (revealed && isCorrect) cls = "border-emerald-400/60 bg-emerald-400/10";
                else if (revealed && isPicked) cls = "border-rose-400/60 bg-rose-400/10";
                return (
                  <button key={opt} disabled={revealed} onClick={() => answerMcq(opt)} className={`block w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${cls}`}>
                    {opt}
                    {revealed && isCorrect && <span className="ml-2 text-emerald-300">✓</span>}
                    {revealed && isPicked && !isCorrect && <span className="ml-2 text-rose-300">✗</span>}
                  </button>
                );
              })}
              {revealed && (
                <button className="btn btn-primary mt-2 w-full" onClick={() => advance(picked === q.correct)}>
                  {num >= length ? "See results" : "Next →"}
                </button>
              )}
            </div>
          ) : (
            <SelfGrade card={q} onGrade={(ok) => advance(ok)} />
          )}
        </Panel>
      </div>
    );
  }

  // ---- Done ----
  const pct = Math.round((score / Math.max(1, answers.length)) * 100);
  const weakest = [...byTopic].sort((a, b) => a.acc - b.acc).slice(0, 5);
  return (
    <div className="space-y-5">
      <SectionTitle icon="🏁" title="Adaptive Exam — Results" />
      <Panel>
        <div className="flex flex-wrap items-center justify-around gap-4 text-center">
          <Big label="Score" value={`${pct}%`} accent />
          <Big label="Correct" value={`${score}/${answers.length}`} />
          <Big label="Topics seen" value={`${byTopic.length}`} />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button className="btn btn-primary" onClick={() => setPhase("setup")}>↻ New exam</button>
          <button className="btn btn-ghost" disabled={applied} onClick={applyToTracker}>
            {applied ? "✓ Applied to tracker" : "📊 Apply results to Weakness Tracker"}
          </button>
          <button className="btn btn-ghost" onClick={() => setPage("weakness")}>Open tracker</button>
        </div>
      </Panel>

      <Panel>
        <SectionTitle icon="📊" title="Per-topic accuracy" subtitle="Lowest first — these need the most work." />
        <div className="space-y-2">
          {weakest.map((t) => {
            const p = Math.round(t.acc * 100);
            const color = t.acc >= 0.8 ? "from-emerald-400 to-teal-500" : t.acc >= 0.5 ? "from-amber-400 to-yellow-500" : "from-rose-400 to-rose-500";
            return (
              <div key={t.topic} className="flex items-center gap-3">
                <span className="w-40 truncate text-sm">{t.topic}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full bg-gradient-to-r ${color}`} style={{ width: `${p}%` }} />
                </div>
                <span className="w-16 text-right text-xs text-slate-400">{t.correct}/{t.total}</span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function SelfGrade({ card, onGrade }: { card: Question; onGrade: (correct: boolean) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mt-4">
      {!show ? (
        <button className="btn btn-primary w-full" onClick={() => setShow(true)}>Show answer</button>
      ) : (
        <>
          <div className="rounded-lg border border-white/10 bg-ink-950/60 p-3 text-sm text-slate-200">{card.correct}</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="rounded-lg bg-rose-500/80 px-3 py-2 text-sm font-semibold text-white hover:brightness-110" onClick={() => onGrade(false)}>Got it wrong</button>
            <button className="rounded-lg bg-emerald-500/80 px-3 py-2 text-sm font-semibold text-slate-900 hover:brightness-110" onClick={() => onGrade(true)}>Got it right</button>
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
