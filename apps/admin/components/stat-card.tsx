import { Badge } from "@repo/ui/badge";

interface StatCardProps {
  label: string;
  value: string;
  trend: number;
}

export function StatCard({ label, value, trend }: StatCardProps) {
  const isPositive = trend >= 0;

  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
      <p className="text-sm text-[var(--admin-fg)]/50">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        <Badge variant={isPositive ? "success" : "danger"}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={isPositive ? "" : "rotate-180"}
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          {isPositive ? "+" : ""}
          {trend}%
        </Badge>
      </div>
    </div>
  );
}
