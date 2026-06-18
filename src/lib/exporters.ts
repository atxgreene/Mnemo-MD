import type { PersistedState } from "../types";

/** File export / import utilities. All client-side; nothing leaves the device. */

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slug(s: string): string {
  return (s || "mnemo-med").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "mnemo-med";
}

export function exportText(name: string, content: string): void {
  download(`${slug(name)}.txt`, content, "text/plain;charset=utf-8");
}

export function exportMarkdown(name: string, content: string): void {
  download(`${slug(name)}.md`, content, "text/markdown;charset=utf-8");
}

/** Build CSV text from rows (header + records) and download it. */
export function exportCSV(name: string, rows: string[][]): void {
  const escapeCell = (c: string) => {
    const v = c ?? "";
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  const csv = rows.map((r) => r.map(escapeCell).join(",")).join("\n");
  download(`${slug(name)}.csv`, csv, "text/csv;charset=utf-8");
}

export function exportJSON(state: PersistedState): void {
  // Never write AI keys/tokens into a backup file.
  const safe: PersistedState = {
    ...state,
    ai: {
      ...state.ai,
      claudeKey: "",
      openaiKey: "",
      geminiKey: "",
      geminiAccessToken: undefined,
      geminiTokenExpiry: undefined,
    },
  };
  const payload = JSON.stringify({ app: "mnemo-med", version: 3, exportedAt: Date.now(), state: safe }, null, 2);
  download(`mnemo-med-backup-${new Date().toISOString().slice(0, 10)}.json`, payload, "application/json");
}

/** Parse a previously exported backup file. Resolves with the raw state (the store normalizes it). */
export function importJSON(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const state = parsed?.state ?? parsed;
        const ok = state && typeof state === "object" && ("courses" in state || "sources" in state || "profile" in state);
        if (!ok) throw new Error("This does not look like a Mnemo Med backup.");
        resolve(state);
      } catch (e) {
        reject(e instanceof Error ? e : new Error("Invalid backup file."));
      }
    };
    reader.readAsText(file);
  });
}
