import { useRef, useState } from "react";
import { useStore } from "../store";
import type { PromptMode } from "../types";
import { PROMPT_MODE_LABELS } from "../types";
import { uid } from "../lib/storage";
import { exportMarkdown, exportText } from "../lib/exporters";
import { aiReady, providerLabel, runPrompt, type ImageInput } from "../lib/ai/run";
import { CopyButton } from "../ui";

/**
 * Shared output workspace: renders a generated prompt with copy / save /
 * export actions, and — when an AI connection is configured — a "Run with AI"
 * button that streams the model's response in-app.
 */
export default function PromptWorkspace({
  mode,
  prompt,
  sourceIds = [],
  title,
  image,
}: {
  mode: PromptMode;
  prompt: string;
  sourceIds?: string[];
  title?: string;
  /** When provided (Image/Graph mode), the AI run includes the image for vision analysis. */
  image?: ImageInput;
}) {
  const { state, addOutput, setPage } = useStore();
  const ai = state.ai;
  const canRun = aiReady(ai);

  const [result, setResult] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef("");

  const label = PROMPT_MODE_LABELS[mode];
  const outputTitle = title || `${label} — ${state.profile.courseName || "Mnemo Med"}`;

  const savePrompt = () => {
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

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult("");
    resultRef.current = "";
    try {
      const full = await runPrompt(
        prompt,
        ai,
        (delta) => {
          resultRef.current += delta;
          setResult(resultRef.current);
        },
        image
      );
      const text = full || resultRef.current;
      setResult(text);
      // Auto-save the AI response to the Vault.
      addOutput({
        id: uid("out_"),
        title: `${outputTitle} (${providerLabel(ai.provider)})`,
        mode: "pasted-output",
        date: Date.now(),
        course: state.profile.courseName,
        sourceIds,
        content: text,
        tags: [label, providerLabel(ai.provider)],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setRunning(false);
    }
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
          <button className="btn btn-ghost btn-sm" onClick={() => exportText(outputTitle, prompt)}>⬇ .txt</button>
          <button className="btn btn-ghost btn-sm" onClick={() => exportMarkdown(outputTitle, prompt)}>⬇ .md</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { savePrompt(); setPage("vault"); }}>💾 Save to Vault</button>
          {canRun && (
            <button className="btn btn-primary btn-sm" disabled={running} onClick={run}>
              {running ? "Running…" : `▶ ${image ? "Analyze" : "Run"} with ${providerLabel(ai.provider)}`}
            </button>
          )}
          <CopyButton text={prompt} label="Copy prompt" />
        </div>
      </div>

      <pre className="max-h-[460px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-ink-950/80 p-4 font-mono text-[12.5px] leading-relaxed text-slate-200">
        {prompt}
      </pre>

      {!canRun ? (
        <p className="mt-2 text-xs text-slate-500">
          Paste this into {state.profile.preferredModel}. Want one-click generation?{" "}
          <button className="text-teal-300 hover:underline" onClick={() => setPage("settings")}>Connect an AI in Settings</button>.
          For image analysis, attach the actual figure alongside the prompt.
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          Connected to {providerLabel(ai.provider)}. Responses are saved to your Output Vault. Always verify against your notes.
        </p>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/[0.06] px-3 py-2 text-sm text-rose-200">⚠️ {error}</div>
      )}

      {(result || running) && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              {providerLabel(ai.provider)} response {running && <span className="text-slate-500">· streaming…</span>}
            </span>
            {result && !running && <CopyButton text={result} className="btn btn-ghost btn-sm" />}
          </div>
          <pre className="max-h-[460px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-teal-400/20 bg-ink-950/80 p-4 text-[13px] leading-relaxed text-slate-100">
            {result || "…"}
          </pre>
        </div>
      )}
    </div>
  );
}
