import { useState } from "react";
import { useStore } from "../store";
import type { PageId } from "../types";
import InstallButton from "./InstallButton";

const NAV: { id: PageId; label: string; icon: string; group?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "🩺" },
  { id: "profile", label: "Course Profile", icon: "🎓" },
  { id: "sources", label: "Source Library", icon: "📚" },
  { id: "prompt-lab", label: "Prompt Lab", icon: "🧪" },
  { id: "anki", label: "Anki Factory", icon: "🃏" },
  { id: "practice", label: "Practice Builder", icon: "✍️" },
  { id: "image", label: "Image / Graph", icon: "📈" },
  { id: "verified", label: "Verified Answers", icon: "✅" },
  { id: "flashcards", label: "Flashcards (SRS)", icon: "🗂️" },
  { id: "quiz", label: "Quiz Mode", icon: "❓" },
  { id: "weakness", label: "Weakness Tracker", icon: "🎯" },
  { id: "cram", label: "Cram Planner", icon: "🗓️" },
  { id: "vault", label: "Output Vault", icon: "🗄️" },
  { id: "settings", label: "Settings", icon: "⚙️" },
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
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-ink-950/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Brand />
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
      <aside className="sticky top-0 hidden h-screen w-64 flex-none flex-col border-r border-white/10 bg-ink-950/40 p-4 backdrop-blur-xl lg:flex">
        <div className="px-2 pb-4 pt-1">
          <Brand />
        </div>
        <nav className="flex-1 overflow-y-auto pr-1">
          <NavList page={page} go={go} />
        </nav>
        <p className="px-2 pt-3 text-[11px] leading-snug text-slate-500">
          Local-first · No account · Your notes never leave this device.
        </p>
      </aside>
    </>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 font-extrabold text-slate-900 shadow-glow">
        M
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold">Mnemo Med</div>
        <div className="text-[11px] text-slate-400">Source-locked study</div>
      </div>
    </div>
  );
}

function NavList({ page, go }: { page: PageId; go: (id: PageId) => void }) {
  return (
    <div className="space-y-1">
      {NAV.map((n) => (
        <button key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => go(n.id)}>
          <span className="text-base">{n.icon}</span>
          <span>{n.label}</span>
        </button>
      ))}
      <div className="pt-3">
        <InstallButton />
      </div>
    </div>
  );
}
