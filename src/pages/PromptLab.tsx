import { useState } from "react";
import GeneratorPage from "../components/GeneratorPage";
import type { PromptMode } from "../types";
import { PROMPT_MODE_LABELS } from "../types";

// Modes that the universal Prompt Lab covers (others have dedicated pages).
const LAB_MODES: PromptMode[] = [
  "review-sheet",
  "explain-premed",
  "professor-wording",
  "weak-drill",
  "missed-autopsy",
];

const CONFIG: Record<
  string,
  { queryLabel: string; placeholder: string; queryAs: "topic" | "userQuestions"; multiline: boolean; subtitle: string }
> = {
  "review-sheet": {
    queryLabel: "Focus topic (optional)",
    placeholder: "e.g. membrane transport — leave blank for all topics in scope",
    queryAs: "topic",
    multiline: false,
    subtitle: "Build a verified, high-yield review sheet grounded in your notes.",
  },
  "explain-premed": {
    queryLabel: "Concept to explain",
    placeholder: "e.g. the proton-motive force",
    queryAs: "topic",
    multiline: false,
    subtitle: "Plain-language intuition that builds to the precise mechanism.",
  },
  "professor-wording": {
    queryLabel: "Topic / lecture to parse (optional)",
    placeholder: "e.g. cell cycle checkpoints",
    queryAs: "topic",
    multiline: false,
    subtitle: "Extract and preserve the professor's exact phrasing, then translate it.",
  },
  "weak-drill": {
    queryLabel: "Topic to drill",
    placeholder: "e.g. oxidative phosphorylation",
    queryAs: "topic",
    multiline: false,
    subtitle: "An intensive drill targeting a weak topic.",
  },
  "missed-autopsy": {
    queryLabel: "Missed questions (paste them)",
    placeholder: "Paste the questions you got wrong, with your answers…",
    queryAs: "userQuestions",
    multiline: true,
    subtitle: "Diagnose why you missed questions and close the concept gap.",
  },
};

export default function PromptLab() {
  const [mode, setMode] = useState<PromptMode>("review-sheet");
  const cfg = CONFIG[mode];

  return (
    <GeneratorPage
      key={mode}
      mode={mode}
      icon="🧪"
      title="Prompt Lab"
      subtitle={cfg.subtitle}
      queryLabel={cfg.queryLabel}
      queryPlaceholder={cfg.placeholder}
      queryAs={cfg.queryAs}
      multiline={cfg.multiline}
      modeSelector={
        <div className="flex flex-wrap gap-2">
          {LAB_MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`btn btn-sm ${mode === m ? "btn-primary" : "btn-ghost"}`}
            >
              {PROMPT_MODE_LABELS[m]}
            </button>
          ))}
        </div>
      }
    />
  );
}
