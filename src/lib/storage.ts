import type { AppState } from "../types";

/**
 * Local-first persistence. Everything lives in the browser — no backend,
 * no network, no accounts. This keeps the student's notes private by default.
 */

const STORAGE_KEY = "mnemo-med:v1";

/** Lightweight unique id (no external dependency, no typing surprises). */
export function uid(prefix = ""): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function saveToStorage(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode / quota). Fail quietly.
  }
}

export function loadFromStorage(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
