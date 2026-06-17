import type { WeakTopic } from "../types";

/**
 * Weakness memory scoring.
 *
 * Priority (0..100) rises when a topic is low-confidence, has many missed
 * questions, and hasn't been studied recently. The cram planner and dashboard
 * use this to decide what to front-load.
 */
export function calculateWeaknessPriority(t: WeakTopic): number {
  // Confidence 1..5 -> weakness 0..1 (1 = weakest)
  const weakness = (5 - t.confidence) / 4;

  // Missed questions saturate at ~10
  const missed = Math.min(t.missedQuestions, 10) / 10;

  // Staleness: 0 today, ramping to 1 around two weeks
  let staleness = 0.5;
  if (t.lastStudied) {
    const days = (Date.now() - t.lastStudied) / 86_400_000;
    staleness = Math.min(days / 14, 1);
  }

  const score = weakness * 0.6 + missed * 0.25 + staleness * 0.15;
  return Math.round(score * 100);
}

export type WeaknessBand = "weak" | "medium" | "strong";

export function band(t: WeakTopic): WeaknessBand {
  if (t.confidence <= 2) return "weak";
  if (t.confidence === 3) return "medium";
  return "strong";
}

/** Topics in recommended review order (highest priority first). */
export function recommendedOrder(topics: WeakTopic[]): WeakTopic[] {
  return [...topics]
    .map((t) => ({ ...t, priority: calculateWeaknessPriority(t) }))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

/** 0..100 overall study confidence across all tracked topics. */
export function studyConfidenceScore(topics: WeakTopic[]): number {
  if (topics.length === 0) return 0;
  const avg = topics.reduce((s, t) => s + t.confidence, 0) / topics.length;
  return Math.round(((avg - 1) / 4) * 100);
}
