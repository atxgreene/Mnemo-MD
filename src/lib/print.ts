/**
 * Open a clean, print-ready window for a saved output (review sheet, cards, etc.).
 * Users can then print to paper or "Save as PDF" from the browser dialog.
 * Markdown is left as-is (readable in monospace); the focus is a tidy printout.
 */
export function printDocument(title: string, content: string): void {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) {
    alert("Please allow pop-ups to print, or use your browser's print (Ctrl/Cmd+P).");
    return;
  }
  const esc = (s: string) =>
    s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

  w.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      font: 14px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      color: #14181f; max-width: 760px; margin: 36px auto; padding: 0 22px; background: #fff;
    }
    header { border-bottom: 2px solid #5ad1c2; padding-bottom: 10px; margin-bottom: 18px; }
    h1 { font-size: 20px; margin: 0; }
    .meta { color: #667; font-size: 12px; margin-top: 4px; }
    pre { white-space: pre-wrap; word-wrap: break-word; font: 13px/1.6 ui-monospace, Menlo, Consolas, monospace; }
    footer { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 8px; color: #889; font-size: 11px; }
    @media print { body { margin: 0; max-width: none; } @page { margin: 18mm; } }
  </style>
</head>
<body>
  <header>
    <h1>${esc(title)}</h1>
    <div class="meta">Mnemo Med · ${new Date().toLocaleDateString()} · Verify against your official course materials.</div>
  </header>
  <pre>${esc(content)}</pre>
  <footer>Generated with Mnemo Med — source-locked study intelligence.</footer>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 200); };</script>
</body>
</html>`);
  w.document.close();
  w.focus();
}
