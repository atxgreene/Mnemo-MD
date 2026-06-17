import type { RetrievalResult } from "../types";
import { SOURCE_TYPE_LABELS } from "../types";
import { relevancePct } from "../lib/retrieval";
import { EmptyState } from "../ui";

/**
 * Shows the evidence Mnemosyne Lite retrieved before any prompt is generated.
 * Source-locked generation depends on this being visible and trustworthy.
 */
export default function EvidencePanel({ results }: { results: RetrievalResult[] }) {
  if (!results.length) {
    return (
      <EmptyState
        icon="🔍"
        title="No evidence retrieved yet"
        hint="Enter a topic or question above to pull the most relevant snippets from your Source Library."
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {results.map((r, i) => {
        const pct = relevancePct(results, r.score);
        return (
          <div key={r.sourceId + i} className="glass-soft p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span>{r.sourceTitle}</span>
                <span className="chip">{SOURCE_TYPE_LABELS[r.sourceType]}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-slate-400">{pct}%</span>
              </div>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">“{r.snippet}”</p>
            {r.matchedKeywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.matchedKeywords.slice(0, 8).map((k) => (
                  <span key={k} className="rounded bg-teal-400/10 px-1.5 py-0.5 text-[11px] text-teal-200">
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
