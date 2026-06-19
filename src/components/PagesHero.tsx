import { useStore } from "../store";
import BrandMark from "./BrandMark";

const TRUST_POINTS = ["Local-first", "Offline PWA", "Evidence-ranked", "No account required"];

export default function PagesHero() {
  const { setPage } = useStore();

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ink-900/70 p-5 shadow-brand backdrop-blur-2xl sm:p-8 lg:p-10">
      <div className="absolute inset-0 bg-hero-grid opacity-55" aria-hidden="true" />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" aria-hidden="true" />

      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <BrandMark size="lg" showText />
            <span className="rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">
              Medical study OS
            </span>
          </div>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
            Source-locked study intelligence for medical school.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Turn lecture notes, slides, professor wording, graphs, and weak topics into verified review sheets,
            Anki-ready cards, practice exams, and a finals cram plan — without sending your course library to a backend.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="btn btn-primary" onClick={() => setPage("sources")}>Build from my notes</button>
            <button className="btn btn-ghost" onClick={() => setPage("guide")}>Read the workflow</button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {TRUST_POINTS.map((point) => (
              <span key={point} className="brand-pill">{point}</span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl backdrop-blur-xl">
            <div className="rounded-2xl border border-white/10 bg-ink-950/80 p-4">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Evidence packet</p>
                  <p className="text-sm font-semibold text-slate-100">Cardiac physiology · Exam 2</p>
                </div>
                <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">locked</span>
              </div>

              <div className="mt-4 space-y-3">
                <EvidenceRow score="96" title="Professor wording preserved" text="Use only lecture phrasing for preload, afterload, Frank-Starling curve." />
                <EvidenceRow score="91" title="High-yield synthesis" text="Compare murmurs by timing, location, radiation, and maneuver response." />
                <EvidenceRow score="84" title="Weakness drill queued" text="Generate five trap-heavy MCQs from missed concepts and cited notes." />
              </div>

              <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/80">Next action</p>
                <p className="mt-1 text-sm text-slate-200">Review 18 due cards, then run a source-locked weak-topic drill.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EvidenceRow({ score, title, text }: { score: string; title: string; text: string }) {
  return (
    <div className="grid grid-cols-[3.25rem_1fr] gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-300/20 to-violet-400/20 text-sm font-bold text-teal-100">
        {score}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-400">{text}</p>
      </div>
    </div>
  );
}
