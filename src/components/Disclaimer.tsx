/** Visible academic-integrity disclaimer used across the app. */
export default function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-100/90 ${className}`}
    >
      <strong>Mnemo Med is an educational study tool.</strong> Verify all outputs against your official course
      materials. Do not use it to cheat or violate academic policies.
    </div>
  );
}
