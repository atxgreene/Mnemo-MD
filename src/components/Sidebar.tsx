import { useState } from "react";
import { useStore } from "../store";
import type { PageId } from "../types";
import InstallButton from "./InstallButton";
import BrandMark from "./BrandMark";

const NAV: { id: PageId; label: string; icon: string; group?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "◌" },
  { id: "guide", label: "Guide", icon: "◇" },
  { id: "profile", label: "Course Profile", icon: "⌁" },
  { id: "sources", label: "Source Library", icon: "▤" },
  { id: "prompt-lab", label: "Prompt Lab", icon: "✦" },
  { id: "anki", label: "Anki Factory", icon: "▣" },
  { id: "practice", label: "Practice Builder", icon: "✎" },
  { id: "image", label: "Image / Graph", icon: "△" },
  { id: "verified", label: "Verified Answers", icon: "✓" },
  { id: "flashcards", label: "Flashcards (SRS)", icon: "▧" },
  { id: "quiz", label: "Quiz Mode", icon: "?" },
  { id: "adaptive", label: "Adaptive Exam", icon: "∞" },
  { id: "weakness", label: "Weakness Tracker", icon: "◎" },
  { id: "cram", label: "Cram Planner", icon: "◷" },
  { id: "vault", label: "Output Vault", icon: "▥" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar() {
  const { page, setPage } = useStore();
  const [open, setOpen] = useState(false);

  const go = (id: PageId) => {
    setPage(id);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-ink-950/86 px-4 pb-3 backdrop-blur-xl lg:hidden"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <BrandMark size="sm" showText />
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? "✕" : "☰"} Menu
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <nav className="absolute left-0 top-0 h-full w-72 max-w-[82%] overflow-y-auto border-r border-white/10 bg-ink-900 p-4 pt-16">
            <NavList page={page} go={go} />
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 flex-none flex-col border-r border-white/10 bg-ink-950/54 p-4 backdrop-blur-2xl lg:flex">
        <div className="px-2 pb-5 pt-1">
          <BrandMark showText />
        </div>
        <nav className="flex-1 overflow-y-auto pr-1">
          <NavList page={page} go={go} />
        </nav>
        <div className="mx-2 mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100/80">Privacy posture</p>
          <p className="mt-1 text-[11px] leading-snug text-slate-500">
            Local-first · No account · Your notes never leave this device.
          </p>
        </div>
      </aside>
    </>
  );
}

function NavList({ page, go }: { page: PageId; go: (id: PageId) => void }) {
  return (
    <div className="space-y-1">
      <CourseSwitcher />
      {NAV.map((n) => (
        <button key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => go(n.id)}>
          <span className="grid h-6 w-6 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-xs text-teal-100/80">
            {n.icon}
          </span>
          <span>{n.label}</span>
        </button>
      ))}
      <div className="pt-3">
        <InstallButton />
      </div>
    </div>
  );
}

function CourseSwitcher() {
  const { courses, activeCourseId, setActiveCourse, addCourse } = useStore();
  return (
    <div className="mb-3 px-1">
      <label className="label">Course</label>
      <select
        className="select"
        value={activeCourseId}
        onChange={(e) => {
          if (e.target.value === "__new") addCourse();
          else setActiveCourse(e.target.value);
        }}
      >
        {courses.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
        <option value="__new">＋ New course…</option>
      </select>
    </div>
  );
}
