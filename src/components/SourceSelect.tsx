import { useStore } from "../store";
import { SOURCE_TYPE_LABELS } from "../types";
import { EmptyState } from "../ui";

/** Multi-select list of sources to feed into a prompt. */
export default function SourceSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const { state, setPage } = useStore();

  if (state.sources.length === 0) {
    return (
      <EmptyState
        icon="📚"
        title="No sources yet"
        hint="Add lecture notes, slides, or professor wording in the Source Library first."
      />
    );
  }

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const allIds = state.sources.map((s) => s.id);
  const allSelected = selected.length === allIds.length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">{selected.length} selected</span>
        <button
          className="text-xs font-medium text-teal-300 hover:underline"
          onClick={() => onChange(allSelected ? [] : allIds)}
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {state.sources.map((s) => {
          const on = selected.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                on ? "border-teal-400/40 bg-teal-400/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <span
                className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-md border-2 text-xs font-bold ${
                  on ? "border-teal-400 bg-teal-400 text-slate-900" : "border-slate-500"
                }`}
              >
                {on ? "✓" : ""}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{s.title}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="chip">{SOURCE_TYPE_LABELS[s.type]}</span>
                  {s.lockWording && <span className="text-cyan-300">🔒 wording locked</span>}
                  {s.topics.slice(0, 2).map((t) => (
                    <span key={t}>#{t}</span>
                  ))}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <button className="mt-2 text-xs text-slate-500 hover:text-slate-300" onClick={() => setPage("sources")}>
        + Manage sources
      </button>
    </div>
  );
}
