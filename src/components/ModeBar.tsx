import { useStore } from "../store";
import type { ModeToggles } from "../types";

const MODES: { key: keyof ModeToggles; label: string; desc: string }[] = [
  { key: "sourceLocked", label: "Source-Locked", desc: "Use only provided notes; flag unsupported answers" },
  { key: "preserveLanguage", label: "Preserve Professor Language", desc: "Keep exact wording & definitions" },
  { key: "premedReasoning", label: "Premed Reasoning", desc: "Mechanism-level, clinical framing" },
  { key: "highYield", label: "High-Yield", desc: "Exam-relevant concepts & traps" },
  { key: "finalsCram", label: "Finals Cram", desc: "Compressed, prioritized material" },
  { key: "academicIntegrity", label: "Academic Integrity", desc: "Study & understand, never cheat" },
];

/** The global generation-mode bar. Toggles affect every generated prompt. */
export default function ModeBar() {
  const { state, setModes } = useStore();
  const m = state.modes;
  return (
    <div className="glass-soft p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <span>🛡️ Generation Modes</span>
        <span className="text-xs font-normal text-slate-500">— applied to every prompt</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {MODES.map((mode) => {
          const on = m[mode.key];
          return (
            <button
              key={mode.key}
              title={mode.desc}
              onClick={() => setModes({ [mode.key]: !on })}
              className={`badge transition ${
                on
                  ? "border-teal-400/40 bg-teal-400/15 text-teal-200"
                  : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
              }`}
            >
              <span>{on ? "●" : "○"}</span>
              {mode.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
