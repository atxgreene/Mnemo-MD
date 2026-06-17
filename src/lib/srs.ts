import type { Flashcard, ReviewGrade } from "../types";
import { uid } from "./storage";

/**
 * Spaced-repetition scheduling — an Anki-flavored SM-2 in day units.
 *
 * Each card carries an ease factor, current interval, rep streak, and a `due`
 * timestamp. Grading a card returns a new card with the next due date.
 * Everything is local; reviews never leave the device.
 */

const MIN_EASE = 1.3;
const DAY = 86_400_000;

export function newFlashcard(
  front: string,
  back: string,
  opts: Partial<Pick<Flashcard, "tags" | "sourceId" | "deck">> = {}
): Flashcard {
  return {
    id: uid("card_"),
    front: front.trim(),
    back: back.trim(),
    tags: opts.tags ?? [],
    sourceId: opts.sourceId,
    deck: opts.deck ?? "Default",
    ease: 2.5,
    intervalDays: 0,
    reps: 0,
    lapses: 0,
    due: Date.now(), // new cards are due immediately
    createdAt: Date.now(),
  };
}

export function reviewCard(card: Flashcard, grade: ReviewGrade, now = Date.now()): Flashcard {
  let { ease, intervalDays, reps, lapses } = card;

  switch (grade) {
    case "again":
      reps = 0;
      lapses += 1;
      ease = Math.max(MIN_EASE, ease - 0.2);
      intervalDays = 0; // relearn in this session
      break;
    case "hard":
      ease = Math.max(MIN_EASE, ease - 0.15);
      intervalDays = reps === 0 ? 1 : Math.max(1, Math.round(intervalDays * 1.2));
      reps += 1;
      break;
    case "good":
      intervalDays = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(intervalDays * ease);
      reps += 1;
      break;
    case "easy":
      ease += 0.15;
      intervalDays = reps === 0 ? 3 : reps === 1 ? 5 : Math.round(intervalDays * ease * 1.3);
      reps += 1;
      break;
  }

  const due = grade === "again" ? now + 60_000 : now + intervalDays * DAY;
  return { ...card, ease, intervalDays, reps, lapses, due, lastReviewed: now };
}

export function isDue(card: Flashcard, now = Date.now()): boolean {
  return card.due <= now;
}

export function dueCards(cards: Flashcard[], now = Date.now()): Flashcard[] {
  return cards.filter((c) => isDue(c, now)).sort((a, b) => a.due - b.due);
}

/** Human-friendly preview of the next interval for a grade (for button labels). */
export function previewInterval(card: Flashcard, grade: ReviewGrade): string {
  const next = reviewCard(card, grade);
  if (grade === "again") return "<10m";
  if (next.intervalDays < 1) return "<1d";
  if (next.intervalDays === 1) return "1d";
  if (next.intervalDays < 30) return `${next.intervalDays}d`;
  if (next.intervalDays < 365) return `${Math.round(next.intervalDays / 30)}mo`;
  return `${(next.intervalDays / 365).toFixed(1)}y`;
}

export interface DeckStats {
  total: number;
  due: number;
  fresh: number; // never reviewed
  learning: number; // reps in progress
  mature: number; // interval >= 21d
}

export function deckStats(cards: Flashcard[], now = Date.now()): DeckStats {
  return {
    total: cards.length,
    due: cards.filter((c) => isDue(c, now)).length,
    fresh: cards.filter((c) => c.reps === 0 && !c.lastReviewed).length,
    learning: cards.filter((c) => c.reps > 0 && c.intervalDays < 21).length,
    mature: cards.filter((c) => c.intervalDays >= 21).length,
  };
}

/**
 * Parse Anki-style CSV (Front,Back,Tags,Source,Difficulty) into flashcards.
 * Tolerates quoted fields, an optional header row, and missing trailing columns.
 */
export function parseCardsCSV(csv: string, deck = "Imported"): Flashcard[] {
  const rows = parseCSV(csv);
  const cards: Flashcard[] = [];
  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length < 2) continue;
    const front = cols[0]?.trim();
    const back = cols[1]?.trim();
    if (!front || !back) continue;
    // Skip a header row.
    if (i === 0 && /^front$/i.test(front) && /^back$/i.test(back)) continue;
    const tags = (cols[2] ?? "").split(/[\s;]+/).map((t) => t.trim()).filter(Boolean);
    cards.push(newFlashcard(front, back, { tags, deck }));
  }
  return cards;
}

/** Minimal RFC-4180-ish CSV parser (handles quotes, escaped quotes, newlines). */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/\r\n?/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}
