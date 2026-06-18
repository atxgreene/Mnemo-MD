import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store";
import type { Flashcard, ReviewGrade } from "../types";
import { dueCards, deckStats, previewInterval, newFlashcard, parseCardsCSV } from "../lib/srs";
import { formatRelative } from "../lib/dates";
import { exportCSV } from "../lib/exporters";
import { exportApkg } from "../lib/apkg";
import { Panel, SectionTitle, Field, EmptyState, parseList } from "../ui";

const GRADES: { grade: ReviewGrade; label: string; cls: string }[] = [
  { grade: "again", label: "Again", cls: "bg-rose-500/80 text-white" },
  { grade: "hard", label: "Hard", cls: "bg-amber-500/80 text-slate-900" },
  { grade: "good", label: "Good", cls: "bg-teal-500/80 text-slate-900" },
  { grade: "easy", label: "Easy", cls: "bg-emerald-500/80 text-slate-900" },
];

export default function Flashcards() {
  const { state, addCards, removeCard, reviewFlashcard } = useStore();
  const cards = state.flashcards;
  const stats = deckStats(cards);

  const [apkgBusy, setApkgBusy] = useState(false);
  const [apkgMsg, setApkgMsg] = useState<string | null>(null);

  const exportDeckApkg = async () => {
    const deck = state.profile.courseName || "Mnemo Med";
    const file = `${deck.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "mnemo-med"}.apkg`;
    try {
      setApkgBusy(true);
      setApkgMsg("Building Anki package…");
      await exportApkg(deck, cards.map((c) => ({ front: c.front, back: c.back, tags: c.tags })), file);
      setApkgMsg(null);
    } catch (e) {
      setApkgMsg("⚠️ " + (e instanceof Error ? e.message : "Export failed."));
      setTimeout(() => setApkgMsg(null), 6000);
    } finally {
      setApkgBusy(false);
    }
  };

  // Review session ---------------------------------------------------------
  const [queue, setQueue] = useState<string[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const reviewing = queue !== null;
  const currentId = queue?.[0];
  const current = useMemo(() => cards.find((c) => c.id === currentId), [cards, currentId]);

  const startReview = () => {
    setQueue(dueCards(cards).map((c) => c.id));
    setFlipped(false);
  };
  const grade = (g: ReviewGrade) => {
    if (!current || !queue) return;
    reviewFlashcard(current.id, g);
    const rest = queue.slice(1);
    setQueue(g === "again" ? [...rest, current.id] : rest);
    setFlipped(false);
  };

  // Keyboard shortcuts during a review session: Space/Enter flips, 1–4 grades.
  useEffect(() => {
    if (!reviewing || !current) return;
    const onKey = (e: KeyboardEvent) => {
      if (!flipped && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setFlipped(true);
        return;
      }
      if (flipped) {
        const map: Record<string, ReviewGrade> = { "1": "again", "2": "hard", "3": "good", "4": "easy" };
        const g = map[e.key];
        if (g) {
          e.preventDefault();
          grade(g);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewing, flipped, current?.id, queue]);

  return (
    <div className="space-y-5">
      <SectionTitle
        icon="🗂️"
        title="Flashcards"
        subtitle="A local spaced-repetition deck (SM-2). Review what's due; cards you find hard come back sooner."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Total" value={stats.total} />
        <Stat label="Due now" value={stats.due} accent />
        <Stat label="New" value={stats.fresh} />
        <Stat label="Learning" value={stats.learning} />
        <Stat label="Mature" value={stats.mature} />
      </div>

      {/* Review session */}
      {reviewing ? (
        <Panel>
          {!current ? (
            <div className="text-center">
              <div className="text-4xl">🎉</div>
              <p className="mt-2 font-semibold">Review complete!</p>
              <p className="text-sm text-slate-400">Nothing else is due right now.</p>
              <button className="btn btn-primary mt-4" onClick={() => setQueue(null)}>Done</button>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                <span>{queue.length} left in this session</span>
                <button className="hover:text-slate-200" onClick={() => setQueue(null)}>End session ✕</button>
              </div>
              <div className="min-h-[160px] rounded-xl border border-white/10 bg-ink-950/60 p-5">
                <div className="text-xs uppercase tracking-wide text-slate-500">Front</div>
                <p className="mt-1 text-lg font-medium">{current.front}</p>
                {flipped && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Back</div>
                    <p className="mt-1 whitespace-pre-wrap text-slate-200">{current.back}</p>
                    {current.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {current.tags.map((t) => (
                          <span key={t} className="rounded bg-teal-400/10 px-1.5 py-0.5 text-[11px] text-teal-200">#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {!flipped ? (
                <button className="btn btn-primary mt-4 w-full" onClick={() => setFlipped(true)}>Show answer</button>
              ) : (
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {GRADES.map((g) => (
                    <button
                      key={g.grade}
                      onClick={() => grade(g.grade)}
                      className={`rounded-lg px-2 py-2.5 text-sm font-semibold transition hover:brightness-110 ${g.cls}`}
                    >
                      {g.label}
                      <span className="block text-[11px] font-normal opacity-80">{previewInterval(current, g.grade)}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-3 text-center text-[11px] text-slate-500">
                Tip: <b>Space</b> to flip · <b>1</b> Again · <b>2</b> Hard · <b>3</b> Good · <b>4</b> Easy
              </p>
            </div>
          )}
        </Panel>
      ) : (
        <Panel>
          <div className="flex flex-col items-center gap-3 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="font-semibold">{stats.due > 0 ? `${stats.due} card${stats.due === 1 ? "" : "s"} due for review` : "You're all caught up"}</p>
              <p className="text-sm text-slate-400">Spaced repetition schedules each card for the moment you're about to forget it.</p>
            </div>
            <button className="btn btn-primary" disabled={stats.due === 0} onClick={startReview}>
              ▶ Start review
            </button>
          </div>
        </Panel>
      )}

      <AddImport onAdd={addCards} />

      {/* Manage cards */}
      <Panel>
        <SectionTitle
          icon="📋"
          title={`All Cards (${cards.length})`}
          right={
            cards.length > 0 ? (
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => exportCSV(`${state.profile.courseName || "mnemo"}-deck`, [
                    ["Front", "Back", "Tags", "Source", "Difficulty"],
                    ...cards.map((c) => [c.front, c.back, c.tags.join(" "), c.deck, ""]),
                  ])}
                >
                  ⬇ CSV
                </button>
                <button className="btn btn-primary btn-sm" disabled={apkgBusy} onClick={exportDeckApkg}>
                  {apkgBusy ? "Building…" : "⬇ Anki .apkg"}
                </button>
              </div>
            ) : undefined
          }
        />
        {apkgMsg && <p className="mb-3 text-sm text-amber-300">{apkgMsg}</p>}
        {cards.length === 0 ? (
          <EmptyState icon="🗂️" title="No flashcards yet" hint="Add a card or import an Anki CSV below — then review it with spaced repetition." />
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {cards.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.front}</p>
                  <p className="truncate text-xs text-slate-400">{c.back}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {c.reps === 0 && !c.lastReviewed ? "new" : `due ${formatRelative(c.due)} · ${c.intervalDays}d interval`}
                    {c.tags.length > 0 && " · " + c.tags.map((t) => `#${t}`).join(" ")}
                  </p>
                </div>
                <button className="flex-none text-slate-500 hover:text-rose-300" onClick={() => removeCard(c.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="glass-soft p-3 text-center">
      <div className={`text-2xl font-bold ${accent ? "text-teal-300" : ""}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}

function AddImport({ onAdd }: { onAdd: (cards: Flashcard[]) => void }) {
  const { state } = useStore();
  const deck = state.profile.courseName || "Default";
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [tags, setTags] = useState("");
  const [csv, setCsv] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 3000);
  };

  const addOne = () => {
    if (!front.trim() || !back.trim()) return;
    onAdd([newFlashcard(front, back, { tags: parseList(tags), deck })]);
    setFront("");
    setBack("");
    setTags("");
    flash("✓ Card added.");
  };

  const importCsv = (text: string) => {
    const cards = parseCardsCSV(text, deck);
    if (cards.length === 0) {
      flash("⚠️ No Front,Back rows found.");
      return;
    }
    onAdd(cards);
    setCsv("");
    flash(`✓ Imported ${cards.length} card${cards.length === 1 ? "" : "s"}.`);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel>
        <SectionTitle icon="➕" title="Add a card" />
        <div className="space-y-3">
          <Field label="Front"><input className="input" value={front} onChange={(e) => setFront(e.target.value)} placeholder="Question / prompt" /></Field>
          <Field label="Back"><textarea className="textarea min-h-[80px]" value={back} onChange={(e) => setBack(e.target.value)} placeholder="Answer" /></Field>
          <Field label="Tags" hint="Comma-separated"><input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="mitochondria, etc" /></Field>
          <button className="btn btn-primary" onClick={addOne} disabled={!front.trim() || !back.trim()}>Add card</button>
        </div>
      </Panel>

      <Panel>
        <SectionTitle icon="📥" title="Import Anki CSV" subtitle="Paste the CSV from Anki Factory (Front,Back,Tags,…) to build your local deck." />
        <Field label="Paste CSV">
          <textarea className="textarea min-h-[120px] font-mono text-xs" value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={"Front,Back,Tags,Source,Difficulty\nWhat is preload?,End-diastolic volume…,cardiac,Lecture 3,medium"} />
        </Field>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => importCsv(csv)} disabled={!csv.trim()}>Import pasted CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>⬆ Import .csv file</button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) importCsv(await f.text());
            }}
          />
        </div>
        {msg && <p className="mt-2 text-sm text-teal-300">{msg}</p>}
      </Panel>
    </div>
  );
}
