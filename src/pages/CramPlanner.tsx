import { useMemo, useState } from "react";
import { useStore } from "../store";
import { calculateDaysUntilExam, formatDate } from "../lib/dates";
import { recommendedOrder, band } from "../lib/weakness";
import { retrieveRelevantSources } from "../lib/retrieval";
import { generatePrompt } from "../lib/promptGenerator";
import { Panel, SectionTitle, Field, EmptyState } from "../ui";
import StatusBadges from "../components/StatusBadges";
import PromptWorkspace from "../components/PromptWorkspace";
import Disclaimer from "../components/Disclaimer";

export default function CramPlanner() {
  const { state, setProfile } = useStore();
  const { profile } = state;
  const days = calculateDaysUntilExam(profile.examDate);

  const [hours, setHours] = useState(profile.studyHoursPerDay || 3);

  // Topic order: weak first via weakness memory, then remaining course topics.
  const orderedWeak = recommendedOrder(state.weakTopics).map((t) => t.topic);
  const extra = profile.topics.filter((t) => !orderedWeak.some((w) => w.toLowerCase() === t.toLowerCase()));
  const allTopics = [...orderedWeak, ...extra];

  const weakSet = new Set(
    state.weakTopics.filter((t) => band(t) === "weak").map((t) => t.topic.toLowerCase())
  );

  const plan = useMemo(() => {
    if (days === null || days < 0 || allTopics.length === 0) return [];
    const studyDays = Math.max(1, Math.min(days, 9)); // reserve final day separately
    const buckets: string[][] = Array.from({ length: studyDays }, () => []);
    allTopics.forEach((t, i) => buckets[i % studyDays].push(t));
    return buckets;
  }, [days, allTopics]);

  const evidence = retrieveRelevantSources(profile.topics.join(" "), state.sources);
  const prompt = generatePrompt("cram-plan", {
    modes: state.modes,
    profile,
    sources: state.sources,
    evidence,
    options: { studyHoursPerDay: hours, weakTopics: [...weakSet] },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-5">
      <SectionTitle icon="🗓️" title="Finals Cram Planner" subtitle="A day-by-day plan that front-loads your weak topics." right={<StatusBadges />} />

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel>
          <Field label="Exam date">
            <input type="date" className="input" value={profile.examDate} onChange={(e) => setProfile({ examDate: e.target.value })} />
          </Field>
          <div className="mt-3">
            <Field label="Study hours / day">
              <input type="number" min={0.5} step={0.5} className="input" value={hours} onChange={(e) => setHours(Number(e.target.value) || 0)} />
            </Field>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <div className="text-3xl font-bold text-teal-300">{days === null ? "—" : days < 0 ? "past" : days}</div>
            <div className="text-xs text-slate-400">days until {formatDate(profile.examDate)}</div>
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <SectionTitle icon="📋" title="Suggested Day-by-Day Plan" />
          {plan.length === 0 ? (
            <EmptyState icon="🗓️" title="Set an exam date & topics" hint="Add an exam date in the profile and topics to your tracker." />
          ) : (
            <div className="space-y-3">
              {plan.map((topics, i) => {
                const date = new Date(today.getTime() + i * 86_400_000);
                return (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex items-baseline justify-between">
                      <b className="text-sm">Day {i + 1}</b>
                      <span className="text-xs text-slate-500">{date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                    </div>
                    <ul className="mt-1.5 space-y-1 text-sm text-slate-300">
                      {topics.map((t) => (
                        <li key={t}>
                          • {t}
                          {weakSet.has(t.toLowerCase()) && <span className="ml-1 text-rose-300">(weak — drill hard)</span>}
                        </li>
                      ))}
                      <li className="text-xs text-slate-500">+ make review sheet, ~{Math.round(hours * 3)} practice Qs, Anki review</li>
                    </ul>
                  </div>
                );
              })}
              <div className="rounded-xl border border-teal-400/30 bg-teal-400/[0.06] p-3">
                <b className="text-sm">🎯 Final review day</b>
                <ul className="mt-1.5 space-y-1 text-sm text-slate-300">
                  <li>• Full pass over review sheets (high-yield only)</li>
                  <li>• Re-test every weak topic + redo missed questions</li>
                  <li>• Light review, sleep early.</li>
                </ul>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <PromptWorkspace mode="cram-plan" prompt={prompt} title={`Cram Plan — ${profile.courseName || "Mnemo Med"}`} />
      <Disclaimer />
    </div>
  );
}
