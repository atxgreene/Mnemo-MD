/** Date helpers for the cram planner and dashboard countdown. */

export function calculateDaysUntilExam(examDate: string): number | null {
  if (!examDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate + "T00:00:00");
  if (isNaN(exam.getTime())) return null;
  return Math.round((exam.getTime() - today.getTime()) / 86_400_000);
}

export function formatDate(ts: number | string | undefined): string {
  if (ts === undefined || ts === "") return "—";
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatRelative(ts: number | undefined): string {
  if (!ts) return "never";
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return formatDate(ts);
}
