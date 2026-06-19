type BrandMarkProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
};

const sizeClass = {
  sm: "h-8 w-8 rounded-xl",
  md: "h-10 w-10 rounded-2xl",
  lg: "h-14 w-14 rounded-[1.25rem]",
};

export default function BrandMark({ size = "md", showText = false, className = "" }: BrandMarkProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <span
        className={`${sizeClass[size]} relative grid flex-none place-items-center overflow-hidden border border-white/10 bg-ink-900 shadow-brand`}
        aria-hidden="true"
      >
        <span className="absolute inset-0 bg-brand-radial opacity-95" />
        <span className="absolute inset-[1px] rounded-[inherit] bg-ink-950/58" />
        <svg viewBox="0 0 64 64" className="relative h-[72%] w-[72%]" role="img" aria-label="Mnemo Med mark">
          <defs>
            <linearGradient id="mnemo-mark-gradient" x1="7" y1="8" x2="58" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#67E8F9" />
              <stop offset="0.5" stopColor="#5EEAD4" />
              <stop offset="1" stopColor="#A78BFA" />
            </linearGradient>
          </defs>
          <path
            d="M13 47V18.5c0-2.2 2.6-3.3 4.1-1.7l14.9 16 14.9-16c1.5-1.6 4.1-.5 4.1 1.7V47"
            fill="none"
            stroke="url(#mnemo-mark-gradient)"
            strokeWidth="5.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 47h26M32 33v14"
            fill="none"
            stroke="url(#mnemo-mark-gradient)"
            strokeWidth="5.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.88"
          />
          <circle cx="14" cy="15" r="3" fill="#67E8F9" />
          <circle cx="50" cy="15" r="3" fill="#A78BFA" />
          <circle cx="32" cy="51" r="3.2" fill="#5EEAD4" />
        </svg>
      </span>
      {showText && (
        <span className="min-w-0 leading-tight">
          <span className="block text-sm font-semibold tracking-tight text-slate-50">Mnemo Med</span>
          <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-teal-200/80">Source-locked study</span>
        </span>
      )}
    </div>
  );
}
