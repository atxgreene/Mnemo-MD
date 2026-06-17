import { useRef, useState } from "react";
import { useStore } from "../store";
import type { Importance, SourceMaterial, SourceType } from "../types";
import { SOURCE_TYPE_LABELS } from "../types";
import { uid } from "../lib/storage";
import { formatRelative } from "../lib/dates";
import { extractTextFromFile, isIngestable } from "../lib/ingest";
import { Panel, SectionTitle, Field, EmptyState, parseList } from "../ui";

const TYPES = Object.keys(SOURCE_TYPE_LABELS) as SourceType[];

function blank(): Omit<SourceMaterial, "id" | "dateAdded"> {
  return {
    title: "",
    content: "",
    type: "lecture-notes",
    lectureNumber: "",
    tags: [],
    topics: [],
    importance: 3,
    lockWording: false,
  };
}

export default function Sources() {
  const { state, addSource, updateSource, removeSource } = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(blank());
  const [filter, setFilter] = useState<SourceType | "all">("all");
  const [importing, setImporting] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const onImport = async (file?: File) => {
    if (file) {
      // allow re-importing the same file later
      if (importRef.current) importRef.current.value = "";
    }
    if (!file) return;
    if (!isIngestable(file)) {
      setImporting("⚠️ Unsupported file type. Use PDF, image, or text.");
      setTimeout(() => setImporting(null), 4000);
      return;
    }
    try {
      setImporting("Starting…");
      const res = await extractTextFromFile(file, (stage, pct) =>
        setImporting(pct != null ? `${stage} ${Math.round(pct * 100)}%` : stage)
      );
      setEditing("new");
      setDraft({
        ...blank(),
        title: file.name.replace(/\.[^.]+$/, ""),
        content: res.text,
        type: res.suggestedType,
      });
      setImporting(null);
    } catch (e) {
      setImporting("⚠️ " + (e instanceof Error ? e.message : "Import failed."));
      setTimeout(() => setImporting(null), 7000);
    }
  };

  const startNew = () => {
    setEditing("new");
    setDraft(blank());
  };
  const startEdit = (s: SourceMaterial) => {
    setEditing(s.id);
    const { id, dateAdded, ...rest } = s;
    setDraft(rest);
  };
  const cancel = () => setEditing(null);

  const submit = () => {
    if (!draft.title.trim() || !draft.content.trim()) return;
    if (editing === "new") {
      addSource({ ...draft, id: uid("src_"), dateAdded: Date.now() });
    } else if (editing) {
      updateSource(editing, draft);
    }
    setEditing(null);
  };

  const shown = filter === "all" ? state.sources : state.sources.filter((s) => s.type === filter);

  return (
    <div className="space-y-5">
      <SectionTitle
        icon="📚"
        title="Source Library"
        subtitle="Paste notes, slides, professor wording, and practice questions. The raw material for everything."
        right={
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>
              ⬆ Import file
            </button>
            <button className="btn btn-primary btn-sm" onClick={startNew}>
              + Add Source
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".txt,.md,.markdown,.csv,.tsv,.json,application/pdf,image/*"
              className="hidden"
              onChange={(e) => onImport(e.target.files?.[0])}
            />
          </div>
        }
      />

      {importing && (
        <div className="glass-soft flex items-center gap-3 p-3 text-sm">
          {!importing.startsWith("⚠️") && (
            <span className="h-4 w-4 flex-none animate-spin rounded-full border-2 border-teal-400/30 border-t-teal-400" />
          )}
          <span className={importing.startsWith("⚠️") ? "text-amber-300" : "text-slate-300"}>{importing}</span>
        </div>
      )}

      <div className="glass-soft p-3 text-xs text-slate-400">
        📥 <b className="text-slate-300">Import:</b> drop in a PDF (text extracted locally), an image of notes/slides
        (OCR'd in-browser), or a .txt/.md/.csv file. Extracted text opens in the editor for review before you save.
        OCR downloads its engine on first use.
      </div>

      {editing && (
        <Panel>
          <h3 className="mb-4 font-semibold">{editing === "new" ? "New source" : "Edit source"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Lecture 4 — Membrane Transport" />
            </Field>
            <Field label="Source type">
              <select className="select" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as SourceType })}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{SOURCE_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Content" hint="Paste lecture notes, slide text, professor wording, or an image/graph description.">
              <textarea className="textarea min-h-[160px]" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} placeholder="Paste material here…" />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Lecture / unit #">
              <input className="input" value={draft.lectureNumber} onChange={(e) => setDraft({ ...draft, lectureNumber: e.target.value })} placeholder="e.g. 4" />
            </Field>
            <Field label="Topic tags" hint="Comma-separated">
              <input className="input" value={draft.topics.join(", ")} onChange={(e) => setDraft({ ...draft, topics: parseList(e.target.value) })} placeholder="membrane transport" />
            </Field>
            <Field label="Tags" hint="Comma-separated keywords">
              <input className="input" value={draft.tags.join(", ")} onChange={(e) => setDraft({ ...draft, tags: parseList(e.target.value) })} placeholder="transport, atp" />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-5">
            <Field label="Importance">
              <select className="select w-32" value={draft.importance} onChange={(e) => setDraft({ ...draft, importance: Number(e.target.value) as Importance })}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} {n === 5 ? "(critical)" : n === 1 ? "(low)" : ""}</option>
                ))}
              </select>
            </Field>
            <button
              type="button"
              onClick={() => setDraft({ ...draft, lockWording: !draft.lockWording })}
              className={`badge ${draft.lockWording ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-200" : "border-white/10 bg-white/5 text-slate-400"}`}
            >
              🔒 {draft.lockWording ? "Wording locked" : "Lock original wording"}
            </button>
            <div className="ml-auto flex gap-2">
              <button className="btn btn-ghost" onClick={cancel}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={!draft.title.trim() || !draft.content.trim()}>
                {editing === "new" ? "Add source" : "Save changes"}
              </button>
            </div>
          </div>
        </Panel>
      )}

      <div className="flex flex-wrap gap-2">
        <button className={`chip ${filter === "all" ? "ring-1 ring-teal-400/40" : ""}`} onClick={() => setFilter("all")}>
          All ({state.sources.length})
        </button>
        {TYPES.map((t) => {
          const n = state.sources.filter((s) => s.type === t).length;
          if (n === 0) return null;
          return (
            <button key={t} className={`chip ${filter === t ? "ring-1 ring-teal-400/40" : ""}`} onClick={() => setFilter(t)}>
              {SOURCE_TYPE_LABELS[t]} ({n})
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon="📚" title="No sources yet" hint="Click “Add Source” to paste your first set of notes." />
      ) : (
        <div className="space-y-3">
          {shown.map((s) => (
            <Panel key={s.id} className="!p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{s.title}</h3>
                    <span className="chip">{SOURCE_TYPE_LABELS[s.type]}</span>
                    {s.lectureNumber && <span className="chip">Lec {s.lectureNumber}</span>}
                    {s.lockWording && <span className="text-xs text-cyan-300">🔒 wording locked</span>}
                    <span className="text-xs text-slate-500">importance {s.importance}/5 · {formatRelative(s.dateAdded)}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-400">{s.content}</p>
                  {(s.topics.length > 0 || s.tags.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                      {s.topics.map((t) => (
                        <span key={t} className="rounded bg-teal-400/10 px-1.5 py-0.5 text-teal-200">#{t}</span>
                      ))}
                      {s.tags.map((t) => (
                        <span key={t} className="rounded bg-white/5 px-1.5 py-0.5">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-none gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(s)}>Edit</button>
                  <button className="btn btn-ghost btn-sm !text-rose-300" onClick={() => removeSource(s.id)}>Delete</button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
