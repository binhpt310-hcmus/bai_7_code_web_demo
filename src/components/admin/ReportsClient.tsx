"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrophyIcon } from "@phosphor-icons/react/ssr";
import { formatDateShort, formatVND } from "@/lib/format";
import type { RevenueReport } from "@/lib/repo";

type RangeKey = "today" | "7d" | "30d" | "custom";

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Hôm nay" },
  { key: "7d", label: "7 ngày" },
  { key: "30d", label: "30 ngày" },
  { key: "custom", label: "Tùy chọn" },
];

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeRange(range: RangeKey, customFrom: string, customTo: string) {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: endOfToday.toISOString() };
  }
  if (range === "7d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: endOfToday.toISOString() };
  }
  if (range === "30d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: endOfToday.toISOString() };
  }
  const from = customFrom ? new Date(`${customFrom}T00:00:00`) : new Date(now);
  const to = customTo ? new Date(`${customTo}T23:59:59`) : endOfToday;
  return { from: from.toISOString(), to: to.toISOString() };
}

export function ReportsClient() {
  const [range, setRange] = useState<RangeKey>("7d");
  const now = useMemo(() => new Date(), []);
  const [customFrom, setCustomFrom] = useState(toDateInputValue(now));
  const [customTo, setCustomTo] = useState(toDateInputValue(now));
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { from, to } = computeRange(range, customFrom, customTo);
    setLoading(true);
    fetch(`/api/admin/reports?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((res) => res.json())
      .then((data) => setReport(data.report))
      .finally(() => setLoading(false));
  }, [range, customFrom, customTo]);

  const chartData =
    report?.dailySeries.map((d) => ({
      date: formatDateShort(d.date),
      "Doanh thu": d.revenue,
    })) ?? [];

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="border-b border-border/70 bg-surface px-5 py-4 md:px-7">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Báo cáo doanh thu</h1>
        <p className="text-sm text-muted">
          Doanh thu chỉ tính các đơn đã thanh toán và không bị hủy.
        </p>
      </header>

      <div className="p-5 md:p-7">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setRange(opt.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors active:scale-[0.98] ${
                range === opt.key ? "bg-ink text-white" : "bg-surface text-muted border border-border hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
          {range === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
              />
              <span className="text-sm text-muted">đến</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Doanh thu" value={report ? formatVND(report.totalRevenue) : "..."} loading={loading} />
          <StatCard
            label="Đơn đã thanh toán"
            value={report ? String(report.paidOrderCount) : "..."}
            loading={loading}
          />
          <StatCard
            label="Trung bình / đơn"
            value={report ? formatVND(Math.round(report.averageOrderValue)) : "..."}
            loading={loading}
          />
        </div>

        <div className="mt-6 rounded-2xl bg-surface p-5 shadow-soft">
          <h2 className="mb-4 text-sm font-semibold text-ink">Doanh thu theo ngày</h2>
          {chartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Chưa có dữ liệu trong khoảng đã chọn.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "var(--color-muted)" }}
                  axisLine={{ stroke: "var(--color-border)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--color-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(value) => formatVND(Number(value))}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="Doanh thu" fill="var(--color-accent)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-surface p-5 shadow-soft">
          <h2 className="mb-4 text-sm font-semibold text-ink">Món bán chạy nhất</h2>
          {!report || report.topItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Chưa có dữ liệu trong khoảng đã chọn.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {report.topItems.map((item, idx) => (
                <li key={item.menuItemId} className="flex items-center gap-3 py-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      idx === 0 ? "bg-accent text-accent-ink" : "bg-ink/6 text-muted"
                    }`}
                  >
                    {idx === 0 ? <TrophyIcon size={14} weight="fill" /> : idx + 1}
                  </span>
                  <span className="flex-1 text-sm text-ink">{item.name}</span>
                  <span className="text-sm text-muted">{item.quantity} món</span>
                  <span className="w-28 text-right text-sm font-semibold text-ink">
                    {formatVND(item.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="rounded-2xl bg-surface p-5 shadow-soft">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-2 text-4xl font-semibold tracking-tight text-ink ${loading ? "opacity-40" : ""}`}>
        {value}
      </p>
    </div>
  );
}
