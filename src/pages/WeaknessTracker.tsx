import { useState } from "react";
import { useStore } from "../store";
import type { Confidence, WeakTopic } from "../types";
import { uid } from "../lib/storage";
import { formatRelative } from "../lib/dates";
import { recommendedOrder, band, calculateWeaknessPriority } from "../lib/weakness";
import { Panel, SectionTitle, Field, EmptyState } from "../ui";

export default function WeaknessTracker() {
  const { state, upsertWeak, removeWeak } = useStore();
  const [newTopic, setNewTopic] = useState("");

  const ordered = recommendedOrder(state.weakTopics);
  const tracked = new Set(state.weakTopics.map((t) => t.topic.toLowerCase()));
  const untracked = state.profile.topics.filter((t) => !tracked.has(t.toLowerCase()));

  const add = (topic: string) => {
    const name = topic.trim();
    if (!name || tracked.has(name.toLowerCase())) return;
    upsertWeak({
      id: uid("wk_"),
      topic: name,
      confidence: 3,
      missedQuestions: 0,
      notes: "",
      nextAction: "",
    });
    setNewTopic("");
  };

  const counts = {
    weak: state.weakTopics.filter((t) => band(t) === "weak").length,
    medium: state.weakTopics.filter((t) => band(t) === "medium").length,
    strong: state.weakTopics.filter((t) => band(t) === "strong").length,
  };

  return (
    <div className="space-y-5">
      <SectionTitle icon="🎯" title="Weakness Tracker" subtitle="Confidence, missed questions, and the recommended review order." />

      <div className="flex flex-wrap gap-2">
        <span className="badge border-rose-400/40 bg-rose-400/15 text-rose-200">Weak: {counts.weak}</span>
        <span className="badge border-amber-400/40 bg-amber-400/15 text-amber-200">Medium: {counts.medium}</span>
        <span className="badge border-emerald-400/40 bg-emerald-400/15 text-emerald-200">Strong: {counts.strong}</span>
      </div>

      <Panel>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Field label="Add a topic to track">
              <input
                className="input"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add(newTopic)}
                placeholder="e.g. apoptosis"
              />
            </Field>
          </div>
          <button className="btn btn-primary" onClick={() => add(newTopic)}>+ Add</button>
        </div>
        {untracked.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs text-slate-400">From your course topics — tap to track:</p>
            <div className="flex flex-wrap gap-2">
              {untracked.map((t) => (
                <button key={t} className="chip hover:ring-1 hover:ring-teal-400/40" onClick={() => add(t)}>
                  + {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {ordered.length === 0 ? (
        <EmptyState icon="🎯" title="No topics tracked yet" hint="Add topics above to build your review priority." />
      ) : (
        <div className="space-y-3">
          {ordered.map((t) => (
            <TopicRow key={t.id} topic={t} onChange={upsertWeak} onRemove={removeWeak} />
          ))}
        </div>
      )}
    </div>
  );
}

function TopicRow({
  topic,
  onChange,
  onRemove,
}: {
  topic: WeakTopic;
  onChange: (t: WeakTopic) => void;
  onRemove: (id: string) => void;
}) {
  const b = band(topic);
  const priority = calculateWeaknessPriority(topic);
  const bandColor =
    b === "weak" ? "border-rose-400/40 text-rose-200" : b === "medium" ? "border-amber-400/40 text-amber-200" : "border-emerald-400/40 text-emerald-200";

  return (
    <Panel className="!p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{topic.topic}</h3>
          <span className={`badge ${bandColor}`}>{b}</span>
          <span className="text-xs text-slate-500">priority {priority} · studied {formatRelative(topic.lastStudied)}</span>
        </div>
        <button className="btn btn-ghost btn-sm !text-rose-300" onClick={() => onRemove(topic.id)}>Remove</button>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Field label={`Confidence: ${topic.confidence}/5`}>
          <input
            type="range"
            min={1}
            max={5}
            value={topic.confidence}
            onChange={(e) => onChange({ ...topic, confidence: Number(e.target.value) as Confidence })}
            className="w-full accent-teal-400"
          />
        </Field>
        <Field label="Missed questions">
          <input
            type="number"
            min={0}
            className="input"
            value={topic.missedQuestions}
            onChange={(e) => onChange({ ...topic, missedQuestions: Math.max(0, Number(e.target.value) || 0) })}
          />
        </Field>
        <Field label="Notes">
          <input className="input" value={topic.notes} onChange={(e) => onChange({ ...topic, notes: e.target.value })} placeholder="What's tripping you up?" />
        </Field>
        <Field label="Next action">
          <input className="input" value={topic.nextAction} onChange={(e) => onChange({ ...topic, nextAction: e.target.value })} placeholder="e.g. Make a pathway-order Anki deck" />
        </Field>
      </div>

      <button
        className="btn btn-ghost btn-sm mt-3"
        onClick={() => onChange({ ...topic, lastStudied: Date.now() })}
      >
        ✓ Mark studied today
      </button>
    </Panel>
  );
}
