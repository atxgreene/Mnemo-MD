import { useRef, useState } from "react";
import { useStore } from "../store";
import type { ModelTarget } from "../types";
import { exportJSON, importJSON } from "../lib/exporters";
import { Panel, SectionTitle, Field, Toggle } from "../ui";
import Disclaimer from "../components/Disclaimer";

const MODELS: ModelTarget[] = ["Claude", "ChatGPT", "Gemini", "Local LLM"];

export default function Settings() {
  const { state, setSettings, setModes, importData, resetData } = useStore();
  const s = state.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const onImport = async (file?: File) => {
    if (!file) return;
    try {
      const next = await importJSON(file);
      importData(next);
      setMsg("✓ Backup imported.");
    } catch (e) {
      setMsg("⚠️ " + (e instanceof Error ? e.message : "Import failed."));
    }
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <div className="space-y-5">
      <SectionTitle icon="⚙️" title="Settings" subtitle="Defaults, theme, and your local data." />

      <Panel>
        <h3 className="mb-3 font-semibold">Defaults</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle
            checked={s.defaultSourceLocked}
            onChange={(v) => {
              setSettings({ defaultSourceLocked: v });
              setModes({ sourceLocked: v });
            }}
            label="Source-Locked by default"
            description="Use only provided notes; flag unsupported answers."
          />
          <Toggle
            checked={s.defaultPreserveLanguage}
            onChange={(v) => {
              setSettings({ defaultPreserveLanguage: v });
              setModes({ preserveLanguage: v });
            }}
            label="Preserve professor language by default"
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Default AI model">
            <select className="select" value={s.defaultModel} onChange={(e) => setSettings({ defaultModel: e.target.value as ModelTarget })}>
              {MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="Theme">
            <select className="select" value={s.theme} onChange={(e) => setSettings({ theme: e.target.value as "dark" | "light" })}>
              <option value="dark">Soft dark (recommended)</option>
              <option value="light">Light</option>
            </select>
          </Field>
        </div>
      </Panel>

      <Panel>
        <h3 className="mb-1 font-semibold">Data</h3>
        <p className="mb-3 text-sm text-slate-400">Everything is stored locally in this browser. Back it up or move it between devices.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => exportJSON(state)}>⬇ Export all data (JSON)</button>
          <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>⬆ Import backup</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
          <button
            className="btn btn-ghost btn-sm !text-rose-300"
            onClick={() => {
              if (confirm("Reset all data to the sample course? This cannot be undone.")) resetData();
            }}
          >
            ↺ Reset all data
          </button>
        </div>
        {msg && <p className="mt-3 text-sm text-teal-300">{msg}</p>}
      </Panel>

      <Disclaimer />
      <p className="text-center text-xs text-slate-600">Mnemo Med v1 · The first productized layer of Mnemosyne Scholar.</p>
    </div>
  );
}
