import type { RetrievalResult, SourceMaterial, SourceType } from "../types";

/**
 * Mnemosyne Lite — a lightweight, local, dependency-free retrieval layer.
 *
 * v1 does not use a real vector database. Instead it simulates useful
 * retrieval through keyword / tag / topic matching, exact-phrase bonuses,
 * recency weighting, and importance weighting — then returns ranked,
 * highlighted evidence snippets. This is the seam where a real vector
 * backend (Mnemosyne Core) would later plug in.
 */

const STOPWORDS = new Set([
  "the","a","an","of","to","in","on","and","or","is","are","was","were","be",
  "for","with","that","this","it","as","at","by","from","into","than","then",
  "what","which","who","whom","how","why","when","where","does","do","did",
  "can","could","should","would","may","might","will","about","explain","define",
  "describe","list","compare","contrast","between","using","use","based","note",
]);

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9+-]+/g) || []).filter(
    (w) => w.length > 2 && !STOPWORDS.has(w)
  );
}

export interface RetrievalOptions {
  limit?: number;
  /** Restrict to these source types (empty = all). */
  types?: SourceType[];
  /** Restrict to sources matching these topic strings (empty = all). */
  topics?: string[];
}

const RECENCY_WINDOW = 1000 * 60 * 60 * 24 * 30; // ~30 days

/** Build a readable evidence snippet centered on the first keyword hit. */
function buildSnippet(content: string, keywords: string[]): string {
  const clean = content.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const lower = clean.toLowerCase();
  let idx = -1;
  for (const k of keywords) {
    const found = lower.indexOf(k);
    if (found !== -1 && (idx === -1 || found < idx)) idx = found;
  }
  if (idx === -1) return clean.slice(0, 220) + (clean.length > 220 ? "…" : "");
  const start = Math.max(0, idx - 90);
  const end = Math.min(clean.length, idx + 150);
  return (start > 0 ? "…" : "") + clean.slice(start, end).trim() + (end < clean.length ? "…" : "");
}

/**
 * Core retrieval: given a free-text query, return the most relevant source
 * snippets with relevance scores and matched keywords.
 */
export function retrieveRelevantSources(
  query: string,
  sources: SourceMaterial[],
  options: RetrievalOptions = {}
): RetrievalResult[] {
  const { limit = 6, types = [], topics = [] } = options;
  const qTokens = tokenize(query);
  const qLower = query.toLowerCase().trim();
  const now = Date.now();

  let pool = sources;
  if (types.length) pool = pool.filter((s) => types.includes(s.type));
  if (topics.length) {
    const wanted = topics.map((t) => t.toLowerCase());
    pool = pool.filter((s) =>
      s.topics.some((t) => wanted.includes(t.toLowerCase()))
    );
  }

  const results: RetrievalResult[] = [];

  for (const s of pool) {
    const haystack = (s.title + " " + s.content + " " + s.tags.join(" ") + " " + s.topics.join(" ")).toLowerCase();
    const matched = new Set<string>();
    let score = 0;

    // Keyword frequency in content/title
    for (const tok of qTokens) {
      const occurrences = haystack.split(tok).length - 1;
      if (occurrences > 0) {
        matched.add(tok);
        score += Math.min(occurrences, 4) * 2;
      }
    }

    // Tag + topic matches (strong signal)
    for (const tag of s.tags) {
      if (qTokens.includes(tag.toLowerCase())) {
        score += 4;
        matched.add(tag.toLowerCase());
      }
    }
    for (const topic of s.topics) {
      const tl = topic.toLowerCase();
      if (qLower.includes(tl) || qTokens.some((t) => tl.includes(t))) {
        score += 5;
        matched.add(tl);
      }
    }

    // Exact phrase match bonus
    if (qLower.length > 4 && haystack.includes(qLower)) score += 8;

    // Importance weighting (1..5)
    score += (s.importance - 1) * 1.5;

    // Recency weighting — newer sources nudge upward
    const age = now - s.dateAdded;
    if (age < RECENCY_WINDOW) score += (1 - age / RECENCY_WINDOW) * 2;

    if (score <= 0) continue;

    results.push({
      sourceId: s.id,
      sourceTitle: s.title,
      sourceType: s.type,
      tags: s.tags,
      matchedKeywords: [...matched],
      snippet: buildSnippet(s.content, [...matched]),
      score: Math.round(score * 10) / 10,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

/** Normalize a raw score to a 0..100 relevance percentage for display. */
export function relevancePct(results: RetrievalResult[], score: number): number {
  const max = results.reduce((m, r) => Math.max(m, r.score), 1);
  return Math.round((score / max) * 100);
}
