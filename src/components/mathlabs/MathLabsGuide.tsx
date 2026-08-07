"use client";

export default function MathLabsGuide({
  message,
  compact = false,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 ${compact ? "" : "rounded-[2rem] border border-cyan-300/20 bg-cyan-300/[0.06] p-5 sm:p-6"}`}>
      <div className={`relative flex-none ${compact ? "h-16 w-16" : "h-24 w-24"}`} aria-hidden="true">
        <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-[0_10px_20px_rgba(34,211,238,0.2)]">
          <defs>
            <linearGradient id="guideBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#67e8f9" />
              <stop offset="1" stopColor="#818cf8" />
            </linearGradient>
          </defs>
          <rect x="22" y="24" width="76" height="72" rx="28" fill="url(#guideBody)" />
          <rect x="31" y="35" width="58" height="42" rx="18" fill="#0f172a" />
          <circle cx="48" cy="55" r="7" fill="#f8fafc" />
          <circle cx="72" cy="55" r="7" fill="#f8fafc" />
          <circle cx="50" cy="56" r="3" fill="#14b8a6" />
          <circle cx="70" cy="56" r="3" fill="#14b8a6" />
          <path d="M48 68 Q60 78 72 68" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
          <path d="M60 24 V12" stroke="#67e8f9" strokeWidth="5" strokeLinecap="round" />
          <circle cx="60" cy="9" r="6" fill="#fbbf24" />
          <rect x="11" y="46" width="16" height="30" rx="8" fill="#818cf8" />
          <rect x="93" y="46" width="16" height="30" rx="8" fill="#818cf8" />
          <path d="M42 95 V108" stroke="#67e8f9" strokeWidth="8" strokeLinecap="round" />
          <path d="M78 95 V108" stroke="#67e8f9" strokeWidth="8" strokeLinecap="round" />
          <path d="M35 108 H48" stroke="#f8fafc" strokeWidth="7" strokeLinecap="round" />
          <path d="M72 108 H85" stroke="#f8fafc" strokeWidth="7" strokeLinecap="round" />
          <text x="60" y="90" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="900">π</text>
        </svg>
      </div>
      <div className="relative flex-1 rounded-2xl border border-white/10 bg-slate-950/50 p-4 sm:p-5">
        <span className="absolute -left-2 top-7 h-4 w-4 rotate-45 border-b border-l border-white/10 bg-slate-950/50" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Mati · guía MathLabs</p>
        <p className="mt-2 leading-7 text-slate-200">{message}</p>
      </div>
    </div>
  );
}
