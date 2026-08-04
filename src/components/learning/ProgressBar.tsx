type ProgressBarProps = {
  value: number;
  label?: string;
};

export default function ProgressBar({ value, label }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      {label && <div className="mb-2 flex justify-between text-sm"><span className="text-slate-400">{label}</span><strong className="text-teal-300">{safeValue}%</strong></div>}
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-teal-300 to-indigo-400 transition-all" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
