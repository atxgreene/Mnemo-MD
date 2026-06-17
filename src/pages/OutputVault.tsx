import { useState } from "react";
import { useStore } from "../store";
import { PROMPT_MODE_LABELS } from "../types";
import { uid } from "../lib/storage";
import { formatDate } from "../lib/dates";
import { exportMarkdown, exportText } from "../lib/exporters";
import { Panel, SectionTitle, Field, EmptyState, CopyButton } from "../ui";

export default function OutputVault() {
  const { state, addOutput, removeOutput } = useStore();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteBody, setPasteBody] = useState("");

  const items = state.outputs.filter((o) => {
    const q = search.toLowerCase();
    return !q || o.title.toLowerCase().includes(q) || o.content.toLowerCase().includes(q) || o.tags.some((t) => t.toLowerCase().includes(q));
  });

  const savePaste = () => {
    if (!pasteBody.trim()) return;
    addOutput({
      id: uid("out_"),
      title: pasteTitle.trim() || "Pasted AI output",
      mode: "pasted-output",
      date: Date.now(),
      course: state.profile.courseName,
      sourceIds: [],
      content: pasteBody,
      tags: ["pasted"],
    });
    setPasteTitle("");
    setPasteBody("");
    setAdding(false);
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        icon="🗄️"
        title="Output Vault"
        subtitle="Generated prompts and pasted AI outputs, stored locally."
        right={
          <button className="btn btn-primary btn-sm" onClick={() => setAdding((a) => !a)}>
            + Paste AI output
          </button>
        }
      />

      {adding && (
        <Panel>
          <Field label="Title">
            <input className="input" value={pasteTitle} onChange={(e) => setPasteTitle(e.target.value)} placeholder="e.g. Membrane transport review (Claude)" />
          </Field>
          <div className="mt-3">
            <Field label="Paste the AI's response">
              <textarea className="textarea min-h-[160px]" value={pasteBody} onChange={(e) => setPasteBody(e.target.value)} placeholder="Paste the generated review sheet / cards / answers here to keep them." />
            </Field>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={savePaste} disabled={!pasteBody.trim()}>Save</button>
          </div>
        </Panel>
      )}

      <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search outputs…" />

      {items.length === 0 ? (
        <EmptyState icon="🗄️" title="Vault is empty" hint="Save a generated prompt or paste an AI output to keep it here." />
      ) : (
        <div className="space-y-3">
          {items.map((o) => (
            <Panel key={o.id} className="!p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button className="text-left font-semibold hover:text-teal-300" onClick={() => setOpen(open === o.id ? null : o.id)}>
                    {o.title}
                  </button>
                  <span className="chip">{o.mode === "pasted-output" ? "Saved output" : PROMPT_MODE_LABELS[o.mode]}</span>
                  <span className="text-xs text-slate-500">{formatDate(o.date)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CopyButton text={o.content} className="btn btn-ghost btn-sm" />
                  <button className="btn btn-ghost btn-sm" onClick={() => exportMarkdown(o.title, o.content)}>.md</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => exportText(o.title, o.content)}>.txt</button>
                  <button className="btn btn-ghost btn-sm !text-rose-300" onClick={() => removeOutput(o.id)}>Delete</button>
                </div>
              </div>
              {open === o.id && (
                <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-ink-950/80 p-4 font-mono text-[12.5px] leading-relaxed text-slate-200">
                  {o.content}
                </pre>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
