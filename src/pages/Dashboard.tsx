import { useState } from "react";
import { useStore } from "../store";
import { calculateDaysUntilExam, formatDate } from "../lib/dates";
import { recommendedOrder, studyConfidenceScore, band } from "../lib/weakness";
import { deckStats } from "../lib/srs";
import { PROMPT_MODE_LABELS } from "../types";
import { Panel, SectionTitle, Stat } from "../ui";
import PagesHero from "../components/PagesHero";
import ModeBar from "../components/ModeBar";
import StatusBadges from "../components/StatusBadges";
import Disclaimer from "../components/Disclaimer";

export default function Dashboard() {
  const { state, setPage } = useStore();
  const { profile, sources, weakTopics, outputs } = state;

  const days = calculateDaysUntilExam(profile.examDate);
  const confidence = studyConfidenceScore(weakTopics);
  const weakCount = weakTopics.filter((t) => band(t) === "weak").length;
  const ordered = recommendedOrder(weakTopics);
  const topWeak = ordered[0];
  const cardsDue = deckStats(state.flashcards).due;

  const nextAction = (() => {
    if (sources.length === 0) return { label: "Add your first source note", page: "sources" as const };
    if (cardsDue > 0) return { label: `Review ${cardsDue} flashcard${cardsDue === 1 ? "" : "s"} due now`, page: "flashcards" as const };
    if (weakTopics.length === 0) return { label: "Set up your weakness tracker", page: "weakness" as const };
    if (topWeak) return { label: `Drill your weakest topic: ${topWeak.topic}`, page: "weakness" as const };
    return { label: "Generate a high-yield review sheet", page: "prompt-lab" as const };
  })();

  return (
    <div className="space-y-6">
      <PagesHero />

      <SectionTitle
        icon="◌"
        title="Study Cockpit"
        subtitle={profile.courseName ? `${profile.courseName} · ${profile.examName}` : "Set up your course profile to begin."}
        right={<StatusBadges />}
      />

      <QuickStart />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Days to exam" value={days === null ? "—" : days < 0 ? "past" : days} accent />
        <Stat label="Source notes" value={sources.length} />
        <Stat label="Cards due" value={cardsDue} accent />
        <Stat label="Weak topics" value={weakCount} />
        <Stat label="Confidence" value={`${confidence}%`} accent />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionTitle icon="◎" title="Recommended Next Action" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-200">{nextAction.label}</p>
            <button className="btn btn-primary" onClick={() => setPage(nextAction.page)}>
              Go →
            </button>
          </div>

          <div className="mt-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-300">Priority review order</h3>
            {ordered.length === 0 ? (
              <p className="text-sm text-slate-500">No tracked topics yet.</p>
            ) : (
              <div className="space-y-2">
                {ordered.slice(0, 5).map((t) => {
                  const b = band(t);
                  const color = b === "weak" ? "text-rose-300" : b === "medium" ? "text-amber-300" : "text-emerald-300";
                  return (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm">
                      <span className="truncate">{t.topic}</span>
                      <span className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${color}`}>{b}</span>
                        <span className="text-xs text-slate-500">priority {t.priority}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionTitle icon="◷" title="Exam" />
          <dl className="space-y-2 text-sm">
            <Row k="Course" v={profile.courseName || "—"} />
            <Row k="Professor" v={profile.professor || "—"} />
            <Row k="Exam date" v={formatDate(profile.examDate)} />
            <Row k="Difficulty" v={profile.difficulty || "—"} />
            <Row k="Model" v={profile.preferredModel} />
          </dl>
          <button className="btn btn-ghost btn-sm mt-4 w-full" onClick={() => setPage("profile")}>
            Edit course profile
          </button>
        </Panel>
      </div>

      <ModeBar />

      <Panel>
        <SectionTitle
          icon="▥"
          title="Recent Outputs"
          right={
            <button className="btn btn-ghost btn-sm" onClick={() => setPage("vault")}>
              Open Vault
            </button>
          }
        />
        {outputs.length === 0 ? (
          <p className="text-sm text-slate-500">No saved outputs yet. Generate a prompt and save it to your Vault.</p>
        ) : (
          <div className="space-y-2">
            {outputs.slice(0, 5).map((o) => (
              <button
                key={o.id}
                onClick={() => setPage("vault")}
                className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-left text-sm hover:border-white/15"
              >
                <span className="truncate">{o.title}</span>
                <span className="ml-3 flex-none text-xs text-slate-500">
                  {o.mode === "pasted-output" ? "Saved output" : PROMPT_MODE_LABELS[o.mode]} · {formatDate(o.date)}
                </span>
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Disclaimer />
    </div>
  );
}

const QUICKSTART_KEY = "mnemo-med:quickstart-dismissed";

function QuickStart() {
  const { setPage } = useStore();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(QUICKSTART_KEY) === "1";
    } catch {
      return false;
    }
  });
  if (dismissed) return null;

  const close = () => {
    try {
      localStorage.setItem(QUICKSTART_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const steps = [
    { n: 1, label: "Set up course", page: "profile" as const },
    { n: 2, label: "Add notes", page: "sources" as const },
    { n: 3, label: "Generate", page: "prompt-lab" as const },
    { n: 4, label: "Review", page: "flashcards" as const },
    { n: 5, label: "Cram plan", page: "cram" as const },
  ];

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">New here? Start with the 5-step study loop</h3>
          <p className="mt-0.5 text-sm text-slate-400">
            A sample course is loaded so you can explore. Tap a step to jump in, or read the full guide.
          </p>
        </div>
        <button className="flex-none text-slate-500 hover:text-slate-200" onClick={close} aria-label="Dismiss">
          ✕
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {steps.map((s) => (
          <button key={s.n} className="chip hover:ring-1 hover:ring-teal-400/40" onClick={() => setPage(s.page)}>
            <span className="font-semibold text-teal-300">{s.n}</span> {s.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn btn-primary btn-sm" onClick={() => setPage("guide")}>Read the Guide</button>
        <button className="btn btn-ghost btn-sm" onClick={close}>Got it</button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400">{k}</dt>
      <dd className="truncate text-right font-medium">{v}</dd>
    </div>
  );
}
