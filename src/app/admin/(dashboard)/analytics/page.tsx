import { prisma } from "@/src/lib/prisma";
import { formatCurrency } from "@/src/lib/invoice-template";
import {
  fetchPostHogTrafficStats,
  fetchPostHogTopPages,
  fetchPostHogSessionRecordings,
  fetchPostHogSessionSummary,
  fetchPostHogBreakdown,
  fetchPostHogWebVitals,
} from "@/src/lib/posthog-server";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [
    invoiceCount,
    customerCount,
    revenue,
    subscriberCount,
    eventCount,
    recentInvoices,
    posthogTraffic,
    posthogTopPages,
    posthogSessions,
    posthogSessionSummary,
    posthogDevices,
    posthogBrowsers,
    posthogOS,
    posthogCountries,
    posthogReferrers,
    posthogWebVitals,
  ] = await Promise.all([
    prisma.invoice.count(),
    prisma.customer.count(),
    prisma.invoice.aggregate({ _sum: { amountPaise: true } }),
    prisma.newsletterSubscriber.count({ where: { status: "active" } }),
    prisma.conversionEvent.count(),
    prisma.invoice.findMany({
      orderBy: { issuedAt: "desc" },
      take: 500,
      select: { issuedAt: true, amountPaise: true },
    }),
    fetchPostHogTrafficStats("-30d"),
    fetchPostHogTopPages(),
    fetchPostHogSessionRecordings(20),
    fetchPostHogSessionSummary(),
    fetchPostHogBreakdown("$device_type"),
    fetchPostHogBreakdown("$browser"),
    fetchPostHogBreakdown("$os"),
    fetchPostHogBreakdown("$geoip_country_name"),
    fetchPostHogBreakdown("$referring_domain"),
    fetchPostHogWebVitals(),
  ]);

  // Revenue by day (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dailyMap = new Map<string, { amount: number; count: number }>();

  for (const inv of recentInvoices) {
    if (inv.issuedAt < thirtyDaysAgo) continue;
    const key = inv.issuedAt.toISOString().slice(0, 10);
    const existing = dailyMap.get(key);
    if (existing) {
      existing.amount += inv.amountPaise;
      existing.count += 1;
    } else {
      dailyMap.set(key, { amount: inv.amountPaise, count: 1 });
    }
  }

  const dailyRevenue = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, amount: data.amount, count: data.count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Revenue this month vs last month
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  let revenueThisMonth = 0;
  let revenueLastMonth = 0;
  let invoicesThisMonth = 0;
  let invoicesLastMonth = 0;

  for (const inv of recentInvoices) {
    const m = inv.issuedAt.getMonth();
    const y = inv.issuedAt.getFullYear();
    if (m === thisMonth && y === thisYear) {
      revenueThisMonth += inv.amountPaise;
      invoicesThisMonth += 1;
    } else if (
      (m === thisMonth - 1 && y === thisYear) ||
      (thisMonth === 0 && m === 11 && y === thisYear - 1)
    ) {
      revenueLastMonth += inv.amountPaise;
      invoicesLastMonth += 1;
    }
  }

  const maxBarAmount = Math.max(...dailyRevenue.map((d) => d.amount), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">Business metrics and revenue breakdown.</p>
      </div>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Total Revenue" value={formatCurrency(revenue._sum.amountPaise || 0, "INR")} />
        <MetricCard label="This Month" value={formatCurrency(revenueThisMonth, "INR")} />
        <MetricCard label="Last Month" value={formatCurrency(revenueLastMonth, "INR")} />
        <MetricCard label="Customers" value={String(customerCount)} />
        <MetricCard label="Invoices" value={String(invoiceCount)} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Invoices This Month" value={String(invoicesThisMonth)} />
        <MetricCard label="Invoices Last Month" value={String(invoicesLastMonth)} />
        <MetricCard label="Newsletter Subscribers" value={String(subscriberCount)} />
      </section>

      {/* Daily revenue chart */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Daily Revenue (Last 30 Days)</h2>
        {dailyRevenue.length === 0 ? (
          <p className="text-sm text-slate-400">No invoices in the last 30 days.</p>
        ) : (
          <div className="space-y-1.5">
            {dailyRevenue.map((day) => {
              const pct = Math.max(2, (day.amount / maxBarAmount) * 100);
              return (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-slate-500">{day.date}</span>
                  <div className="flex-1">
                    <div className="h-5 rounded-sm bg-indigo-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs font-medium text-slate-700">
                    {formatCurrency(day.amount, "INR")}
                  </span>
                  <span className="w-12 shrink-0 text-right text-[11px] text-slate-400">
                    {day.count} inv
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* PostHog traffic stats */}
      {posthogTraffic ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              label="Pageviews (30d)"
              value={String(posthogTraffic.totalPageviews)}
              accent
            />
            <MetricCard
              label="Unique Visitors (30d)"
              value={String(posthogTraffic.totalVisitors)}
              accent
            />
            <MetricCard
              label="Sessions (30d)"
              value={posthogSessionSummary ? String(posthogSessionSummary.sessions) : "—"}
              accent
            />
            <MetricCard
              label="Avg Duration"
              value={posthogSessionSummary ? formatDuration(posthogSessionSummary.avgDurationSeconds) : "—"}
              accent
            />
            <MetricCard
              label="Bounce Rate"
              value={posthogSessionSummary ? `${posthogSessionSummary.bounceRate}%` : "—"}
              accent
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Daily Traffic (Last 30 Days)
            </h2>
            {posthogTraffic.daily.filter((d) => d.pageviews > 0).length === 0 ? (
              <p className="text-sm text-slate-400">No traffic data yet.</p>
            ) : (
              <div className="space-y-1.5">
                {(() => {
                  const maxPv = Math.max(
                    ...posthogTraffic.daily.map((d) => d.pageviews),
                    1
                  );
                  return posthogTraffic.daily
                    .filter((d) => d.pageviews > 0)
                    .map((day) => {
                      const pct = Math.max(2, (day.pageviews / maxPv) * 100);
                      return (
                        <div key={day.date} className="flex items-center gap-3">
                          <span className="w-24 shrink-0 text-xs text-slate-500">
                            {day.date}
                          </span>
                          <div className="flex-1">
                            <div
                              className="h-5 rounded-sm bg-violet-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-16 shrink-0 text-right text-xs font-medium text-slate-700">
                            {day.pageviews} pv
                          </span>
                          <span className="w-14 shrink-0 text-right text-[11px] text-slate-400">
                            {day.visitors} uv
                          </span>
                        </div>
                      );
                    });
                })()}
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="rounded-xl border border-amber-100 bg-amber-50 p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-amber-900">PostHog Traffic</h2>
          <p className="mt-1 text-sm text-amber-700">
            Could not fetch PostHog data. Make sure{" "}
            <code className="rounded bg-amber-100 px-1 text-xs">POSTHOG_PERSONAL_API_KEY</code>{" "}
            is set with read access.
          </p>
        </section>
      )}

      {/* Top pages */}
      {posthogTopPages.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Top Pages (Last 30 Days)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="py-2 pr-4">Page</th>
                  <th className="py-2 pr-4 text-right">Views</th>
                </tr>
              </thead>
              <tbody>
                {posthogTopPages.map((page) => (
                  <tr key={page.path} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{page.path}</td>
                    <td className="py-2.5 pr-4 text-right text-slate-600">{page.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Breakdowns: Device Type & Browser */}
      {(posthogDevices.length > 0 || posthogBrowsers.length > 0) && (
        <section className="grid gap-4 sm:grid-cols-2">
          <BreakdownTable title="Device Type" items={posthogDevices} labelHeader="Device" />
          <BreakdownTable title="Browser" items={posthogBrowsers} labelHeader="Browser" />
        </section>
      )}

      {/* Breakdowns: Country & Referrer */}
      {(posthogCountries.length > 0 || posthogReferrers.length > 0) && (
        <section className="grid gap-4 sm:grid-cols-2">
          <BreakdownTable title="Country" items={posthogCountries} labelHeader="Country" />
          <BreakdownTable title="Referrer" items={posthogReferrers} labelHeader="Source" />
        </section>
      )}

      {/* Breakdown: OS */}
      {posthogOS.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          <BreakdownTable title="Operating System" items={posthogOS} labelHeader="OS" />
          <div />
        </section>
      )}

      {/* Core Web Vitals */}
      {posthogWebVitals && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Core Web Vitals (30d Avg)</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <VitalCard label="LCP" value={posthogWebVitals.lcpMs} unit="ms" good={2500} poor={4000} />
            <VitalCard label="FCP" value={posthogWebVitals.fcpMs} unit="ms" good={1800} poor={3000} />
            <VitalCard label="CLS" value={posthogWebVitals.cls} unit="" good={0.1} poor={0.25} />
            <VitalCard label="INP" value={posthogWebVitals.inpMs} unit="ms" good={200} poor={500} />
          </div>
        </section>
      )}

      {/* Session Replays */}
      {posthogSessions.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Session Replays</h2>
            <a
              href="https://us.posthog.com/replay/recent"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              View all in PostHog →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Start Page</th>
                  <th className="py-2 pr-4">Duration</th>
                  <th className="py-2 pr-4">Active</th>
                  <th className="py-2 pr-4">Clicks</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Replay</th>
                </tr>
              </thead>
              <tbody>
                {posthogSessions.map((session) => {
                  const startPage = (() => {
                    try {
                      return new URL(session.startUrl).pathname;
                    } catch {
                      return session.startUrl;
                    }
                  })();
                  const mins = Math.floor(session.durationSeconds / 60);
                  const secs = session.durationSeconds % 60;
                  const duration = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                  const activeMins = Math.floor(session.activeSeconds / 60);
                  const activeSecs = session.activeSeconds % 60;
                  const active = activeMins > 0 ? `${activeMins}m ${activeSecs}s` : `${activeSecs}s`;
                  const time = new Intl.DateTimeFormat("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(session.startTime));

                  return (
                    <tr key={session.id} className="border-b border-slate-100">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-slate-900">
                          {session.personName || "Anonymous"}
                        </p>
                        <p className="max-w-[140px] truncate text-[11px] text-slate-400">
                          {session.distinctId.slice(0, 16)}…
                        </p>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-700">{startPage}</td>
                      <td className="py-2.5 pr-4 text-slate-700">{duration}</td>
                      <td className="py-2.5 pr-4 text-slate-700">{active}</td>
                      <td className="py-2.5 pr-4 text-slate-700">{session.clickCount}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{time}</td>
                      <td className="py-2.5 pr-4">
                        <a
                          href={`https://us.posthog.com/replay/${session.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100"
                        >
                          ▶ Watch
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Conversion events summary */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Conversion Events</h2>
        <p className="text-sm text-slate-600">
          Total tracked events: <strong>{eventCount}</strong>
        </p>
        <p className="mt-2 text-xs text-slate-400">
          View detailed events on the{" "}
          <a href="/admin/events" className="text-indigo-600 hover:underline">Events page</a>.
        </p>
      </section>

      {/* PostHog info */}
      <section className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-indigo-900">PostHog Integration ✓</h2>
        <p className="mt-1 text-sm text-indigo-700">
          PostHog is live and capturing events. Traffic data above is pulled directly from PostHog.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-indigo-700">
          <li>Pageviews, page leaves, and autocapture are enabled</li>
          <li>Data refreshes every 5 minutes (cached server-side)</li>
          <li>
            Visit{" "}
            <a href="https://us.posthog.com" target="_blank" rel="noopener noreferrer" className="font-medium underline">
              us.posthog.com
            </a>{" "}
            for full dashboards, funnels, and session recordings
          </li>
        </ul>
      </section>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <article
      className={`rounded-xl border p-4 shadow-sm ${
        accent ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent ? "text-violet-700" : "text-slate-900"}`}>
        {value}
      </p>
    </article>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function cleanLabel(v: string): string {
  if (v === "$direct" || v === "$direct ") return "Direct";
  if (v === "null" || v === "None" || v === "" || v === "(unknown)") return "(unknown)";
  return v;
}

function BreakdownTable({
  title,
  items,
  labelHeader = "Value",
}: {
  title: string;
  items: Array<{ value: string; count: number }>;
  labelHeader?: string;
}) {
  if (items.length === 0) return null;
  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
            <th className="py-2 pr-4">{labelHeader}</th>
            <th className="py-2 pr-4 text-right">Views</th>
            <th className="py-2 pr-2 text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.value} className="border-b border-slate-100">
              <td className="py-2.5 pr-4 font-medium text-slate-900">{cleanLabel(item.value)}</td>
              <td className="py-2.5 pr-4 text-right text-slate-600">{item.count}</td>
              <td className="py-2.5 pr-2 text-right text-slate-400">
                {total > 0 ? `${Math.round((item.count / total) * 100)}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VitalCard({
  label,
  value,
  unit,
  good,
  poor,
}: {
  label: string;
  value: number | null;
  unit: string;
  good: number;
  poor: number;
}) {
  if (value == null)
    return (
      <div className="rounded-lg bg-slate-50 p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-xl font-semibold text-slate-300">—</p>
      </div>
    );

  const status = value <= good ? "good" : value <= poor ? "needs-improvement" : "poor";
  const colors: Record<string, string> = {
    good: "bg-green-50 text-green-700 border-green-200",
    "needs-improvement": "bg-amber-50 text-amber-700 border-amber-200",
    poor: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className={`rounded-lg border p-4 text-center ${colors[status]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-xl font-bold">
        {value}
        {unit}
      </p>
      <p className="mt-0.5 text-[11px] capitalize">{status.replace("-", " ")}</p>
    </div>
  );
}
