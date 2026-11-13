interface FlavorBarProps {
  label: string;
  value: number; // 0 – 10
  max?: number;
}

export function FlavorBar({ label, value, max = 10 }: FlavorBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-text-3">{label}</span>
      <div
        className="relative h-1.5 flex-1 rounded-full bg-surface-3"
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-brand-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-xs tabular-nums text-text-2">
        {value.toFixed(1)}
      </span>
    </div>
  );
}
