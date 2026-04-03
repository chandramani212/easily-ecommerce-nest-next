"use client";

import { useState } from "react";
import { StatCard } from "../components/stat-card";
import { MetricCard } from "../components/metric-card";
import { ProductPerformance } from "../components/product-performance";

const STATS = [
  { label: "Total Revenue", value: "$200,458.87", trend: 2.5 },
  { label: "Active Users", value: "9,528", trend: 9.5 },
  { label: "Customer Lifetime Value", value: "$849.54", trend: -1.6 },
  { label: "Acquisition Cost", value: "$9,528", trend: 3.5 },
];

const TIME_FILTERS = ["Weekly", "Monthly", "Yearly"];

const FUNNEL = [
  { label: "Ad Impression", color: "#818cf8", value: 82 },
  { label: "Website Session", color: "#60a5fa", value: 64 },
  { label: "App Download", color: "#34d399", value: 45 },
  { label: "New Users", color: "#fb923c", value: 28 },
];

export default function DashboardPage() {
  const [timeFilter, setTimeFilter] = useState("Weekly");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Overview</h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex gap-1 rounded-lg bg-[var(--admin-muted)] p-1">
            {TIME_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  timeFilter === f
                    ? "bg-[var(--admin-card)] shadow-sm"
                    : "text-[var(--admin-fg)]/50 hover:text-[var(--admin-fg)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-[var(--admin-border)] px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--admin-muted)]">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MetricCard
          title="Churn Rate"
          subtitle="Downgrade to Free plan"
          value="4.26%"
          trendLabel="0.31% than last Week"
          trendPositive={false}
          sparklinePath="M0,35 C20,30 40,38 60,25 C80,12 100,28 120,20 C140,15 160,8 180,18 C190,22 200,15 200,15"
          sparklineColor="#f87171"
        />
        <MetricCard
          title="User Growth"
          subtitle="New signups website + mobile"
          value="3,768"
          trendLabel="+3.85% than last Week"
          trendPositive={true}
          sparklinePath="M0,40 C20,38 40,35 60,30 C80,28 100,32 120,25 C140,18 160,15 180,10 C190,8 200,5 200,5"
          sparklineColor="#34d399"
        />
        <ProductPerformance />
      </div>

      <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold">Conversion Funnel</h3>
          <button className="rounded p-1 text-[var(--admin-fg)]/30 hover:bg-[var(--admin-muted)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          {FUNNEL.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {FUNNEL.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-sm text-[var(--admin-fg)]/50">
                {item.label}
              </span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-[var(--admin-muted)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${item.value}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <span className="w-10 text-right text-sm font-medium">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
