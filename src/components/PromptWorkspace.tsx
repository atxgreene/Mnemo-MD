import { useStore } from "../store";
import type { PromptMode } from "../types";
import { PROMPT_MODE_LABELS } from "../types";
import { uid } from "../lib/storage";
import { exportMarkdown, exportText } from "../lib/exporters";
import { CopyButton } from "../ui";

/**
 * Shared output workspace: renders a generated prompt with copy / save /
 * export actions. Used by every generator page.
 */
export default function PromptWorkspace({
  mode,
  prompt,
  sourceIds = [],
  title,
}: {
  mode: PromptMode;
  prompt: string;
  sourceIds?: string[];
  title?: string;
}) {
  const { state, addOutput, setPage } = useStore();

  const label = PROMPT_MODE_LABELS[mode];
  const outputTitle = title || `${label} — ${state.profile.courseName || "Mnemo Med"}`;

  const save = () => {
    addOutput({
      id: uid("out_"),
      title: outputTitle,
      mode,
      date: Date.now(),
      course: state.profile.courseName,
      sourceIds,
      content: prompt,
      tags: [label],
    });
  };

  return (
    <div className="glass-soft p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span>📝 Generated Prompt</span>
          <span className="chip">{label}</span>
          <span className="chip">{state.profile.preferredModel}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => exportText(outputTitle, prompt)}>
            ⬇ .txt
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => exportMarkdown(outputTitle, prompt)}>
            ⬇ .md
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              save();
              setPage("vault");
            }}
          >
            💾 Save to Vault
          </button>
          <CopyButton text={prompt} label="Copy prompt" />
        </div>
      </div>
      <pre className="max-h-[460px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-ink-950/80 p-4 font-mono text-[12.5px] leading-relaxed text-slate-200">
        {prompt}
      </pre>
      <p className="mt-2 text-xs text-slate-500">
        Paste this into {state.profile.preferredModel}. For image analysis, attach the actual figure alongside it.
      </p>
    </div>
  );
}
