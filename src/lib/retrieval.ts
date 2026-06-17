import type { RetrievalResult, SourceMaterial, SourceType } from "../types";

/**
 * Mnemosyne Lite (v2) — local semantic retrieval.
 *
 * v1 was pure keyword/tag matching. v2 upgrades the ranking core to TF-IDF
 * cosine similarity over the source corpus, so conceptually-related notes
 * surface even when they don't share the exact query words — all still local,
 * dependency-free, and offline. Keyword / tag / topic / exact-phrase hits plus
 * recency & importance are layered on as boosts. This remains the seam where a
 * real embedding/vector backend (Mnemosyne Core) would later plug in.
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

type Vec = Map<string, number>;

/** Term-frequency map for a token list. */
function termFreq(tokens: string[]): Vec {
  const tf: Vec = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

/** Inverse document frequency across the corpus. */
function buildIdf(docTokens: string[][]): Vec {
  const df: Vec = new Map();
  for (const tokens of docTokens) {
    for (const term of new Set(tokens)) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const n = docTokens.length;
  const idf: Vec = new Map();
  for (const [term, count] of df) idf.set(term, Math.log((n + 1) / (count + 1)) + 1);
  return idf;
}

/** TF-IDF weighted vector for a term-frequency map. */
function tfidf(tf: Vec, idf: Vec): Vec {
  const v: Vec = new Map();
  let total = 0;
  for (const c of tf.values()) total += c;
  if (total === 0) return v;
  for (const [term, count] of tf) {
    const weight = (count / total) * (idf.get(term) ?? Math.log(2));
    if (weight > 0) v.set(term, weight);
  }
  return v;
}

function cosine(a: Vec, b: Vec): number {
  if (a.size === 0 || b.size === 0) return 0;
  // Iterate the smaller vector for the dot product.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [term, w] of small) {
    const o = large.get(term);
    if (o) dot += w * o;
  }
  let magA = 0;
  for (const w of a.values()) magA += w * w;
  let magB = 0;
  for (const w of b.values()) magB += w * w;
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Core retrieval: given a free-text query, return the most relevant source
 * snippets ranked by semantic (TF-IDF cosine) similarity plus lexical boosts.
 */
export function retrieveRelevantSources(
  query: string,
  sources: SourceMaterial[],
  options: RetrievalOptions = {}
): RetrievalResult[] {
  const { limit = 6, types = [], topics = [] } = options;
  const qLower = query.toLowerCase().trim();
  const qTokens = tokenize(query);
  const now = Date.now();

  let pool = sources;
  if (types.length) pool = pool.filter((s) => types.includes(s.type));
  if (topics.length) {
    const wanted = topics.map((t) => t.toLowerCase());
    pool = pool.filter((s) => s.topics.some((t) => wanted.includes(t.toLowerCase())));
  }
  if (pool.length === 0) return [];

  // Build the TF-IDF space over the candidate pool (+ the query as a pseudo-doc).
  const docTokenLists = pool.map((s) =>
    tokenize(`${s.title} ${s.content} ${s.tags.join(" ")} ${s.topics.join(" ")}`)
  );
  const idf = buildIdf([...docTokenLists, qTokens]);
  const qVec = tfidf(termFreq(qTokens), idf);

  const results: RetrievalResult[] = [];

  pool.forEach((s, i) => {
    const docTokens = docTokenLists[i];
    const docVec = tfidf(termFreq(docTokens), idf);

    // Semantic core: cosine similarity scaled to a comparable range.
    const semantic = cosine(qVec, docVec) * 20;

    const haystack = (s.title + " " + s.content + " " + s.tags.join(" ") + " " + s.topics.join(" ")).toLowerCase();
    const matched = new Set<string>();
    let lexical = 0;

    for (const tok of qTokens) {
      if (haystack.includes(tok)) matched.add(tok);
    }
    // Tag + topic matches (strong signal).
    for (const tag of s.tags) {
      if (qTokens.includes(tag.toLowerCase())) {
        lexical += 3;
        matched.add(tag.toLowerCase());
      }
    }
    for (const topic of s.topics) {
      const tl = topic.toLowerCase();
      if (qLower.includes(tl) || qTokens.some((t) => tl.includes(t))) {
        lexical += 4;
        matched.add(tl);
      }
    }
    // Exact phrase bonus.
    if (qLower.length > 4 && haystack.includes(qLower)) lexical += 6;

    // Importance + recency weighting.
    let weighting = (s.importance - 1) * 1.2;
    const age = now - s.dateAdded;
    if (age < RECENCY_WINDOW) weighting += (1 - age / RECENCY_WINDOW) * 1.5;

    const score = semantic + lexical + weighting;
    if (score <= 0.05) return;

    results.push({
      sourceId: s.id,
      sourceTitle: s.title,
      sourceType: s.type,
      tags: s.tags,
      matchedKeywords: [...matched],
      snippet: buildSnippet(s.content, matched.size ? [...matched] : qTokens),
      score: Math.round(score * 10) / 10,
    });
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

/** Normalize a raw score to a 0..100 relevance percentage for display. */
export function relevancePct(results: RetrievalResult[], score: number): number {
  const max = results.reduce((m, r) => Math.max(m, r.score), 1);
  return Math.round((score / max) * 100);
}
