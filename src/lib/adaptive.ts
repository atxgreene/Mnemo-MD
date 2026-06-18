import type { Flashcard, WeakTopic } from "../types";

/**
 * Lightweight adaptive-exam engine (local-first, no AI required).
 *
 * It treats each flashcard as an item with an estimated difficulty derived from
 * the topic's tracked confidence and the card's spaced-repetition maturity. A
 * running ability estimate (theta) plus per-topic weights steer selection toward
 * items near the student's current level, biased to weak and freshly-missed
 * topics — a simplified IRT/CAT loop.
 */

export interface ExamAnswer {
  cardId: string;
  topic: string;
  correct: boolean;
}

export function cardTopic(c: Flashcard): string {
  return (c.tags[0] || "general").toLowerCase();
}

export function topicConfidence(weak: WeakTopic[], topic: string): number {
  const t = weak.find((w) => w.topic.toLowerCase() === topic.toLowerCase());
  return t ? t.confidence : 3;
}

/** Estimated difficulty in roughly [-1.5, 1.5]: weak topics & new cards harder. */
export function cardDifficulty(c: Flashcard, weak: WeakTopic[]): number {
  const conf = topicConfidence(weak, cardTopic(c));
  let d = (3 - conf) / 2; // confidence 1 → +1 (hard), 5 → -1 (easy)
  if (c.intervalDays >= 21) d -= 0.3; // mature = better known
  if (c.reps === 0 && !c.lastReviewed) d += 0.3; // brand new = harder
  return Math.max(-1.5, Math.min(1.5, d));
}

export function initTopicWeights(cards: Flashcard[], weak: WeakTopic[]): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const c of cards) {
    const t = cardTopic(c);
    if (weights[t] === undefined) {
      const conf = topicConfidence(weak, t);
      weights[t] = conf <= 2 ? 3 : conf === 3 ? 2 : 1;
    }
  }
  return weights;
}

/** Pick the next item: closest difficulty to ability, biased by topic weight. */
export function selectNext(
  pool: Flashcard[],
  askedIds: Set<string>,
  theta: number,
  weights: Record<string, number>,
  weak: WeakTopic[]
): Flashcard | null {
  const candidates = pool.filter((c) => !askedIds.has(c.id));
  if (candidates.length === 0) return null;
  let best: Flashcard | null = null;
  let bestScore = -Infinity;
  for (const c of candidates) {
    const match = -Math.abs(cardDifficulty(c, weak) - theta);
    const bias = (weights[cardTopic(c)] ?? 1) * 0.6;
    const score = match + bias + Math.random() * 0.3;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

/** Ability update after an answer. */
export function nextTheta(theta: number, correct: boolean): number {
  const step = 0.4;
  return Math.max(-2, Math.min(2, theta + (correct ? step : -step)));
}

/** Topic weight update: missing a topic makes it more likely to recur. */
export function updateWeights(
  weights: Record<string, number>,
  topic: string,
  correct: boolean
): Record<string, number> {
  const cur = weights[topic] ?? 1;
  return { ...weights, [topic]: Math.max(0.5, Math.min(6, cur * (correct ? 0.8 : 1.6))) };
}

/** 0..100 display value for the ability meter. */
export function abilityPct(theta: number): number {
  return Math.round(((theta + 2) / 4) * 100);
}
