interface MetricCardProps {
  title: string;
  subtitle: string;
  value: string;
  trendLabel: string;
  trendPositive: boolean;
  sparklinePath: string;
  sparklineColor: string;
}

export function MetricCard({
  title,
  subtitle,
  value,
  trendLabel,
  trendPositive,
  sparklinePath,
  sparklineColor,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-[var(--admin-fg)]/50">{subtitle}</p>
        </div>
        <button className="rounded p-1 text-[var(--admin-fg)]/30 hover:bg-[var(--admin-muted)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
      <p
        className={`mt-1 text-xs ${
          trendPositive
            ? "text-emerald-500"
            : "text-red-500"
        }`}
      >
        {trendLabel}
      </p>
      <svg
        viewBox="0 0 200 50"
        className="mt-3 h-12 w-full"
        preserveAspectRatio="none"
      >
        <path
          d={sparklinePath}
          fill="none"
          stroke={sparklineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`${sparklinePath} L200,50 L0,50 Z`}
          fill={sparklineColor}
          opacity="0.1"
        />
      </svg>
    </div>
  );
}
