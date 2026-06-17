import { useStore } from "../store";

/** Source-lock + preserve-language status badges (trust signals). */
export default function StatusBadges() {
  const { state } = useStore();
  const { sourceLocked, preserveLanguage } = state.modes;
  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={`badge ${
          sourceLocked
            ? "border-teal-400/40 bg-teal-400/15 text-teal-200"
            : "border-amber-400/40 bg-amber-400/10 text-amber-200"
        }`}
      >
        🔒 {sourceLocked ? "Source-Locked" : "Source-Lock OFF"}
      </span>
      <span
        className={`badge ${
          preserveLanguage
            ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-200"
            : "border-white/10 bg-white/5 text-slate-400"
        }`}
      >
        🗣️ {preserveLanguage ? "Professor Language Preserved" : "Language Not Locked"}
      </span>
      <span className="badge border-white/10 bg-white/5 text-slate-400">📎 Evidence Required</span>
    </div>
  );
}
