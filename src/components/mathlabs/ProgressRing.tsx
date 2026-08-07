"use client";

export default function ProgressRing({
  value,
  label,
  size = 124,
}: {
  value: number;
  label: string;
  size?: number;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" viewBox="0 0 110 110" width={size} height={size}>
          <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            stroke="url(#mathlabs-ring)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
          <defs>
            <linearGradient id="mathlabs-ring" x1="0" x2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-2xl font-black text-white">{safe}%</span>
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
