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

export default async function AdminAnalyticsPage() {
  const [
    invoiceCount,
    customerCount,
    revenue,
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
    if (existing) { existing.amount += inv.amountPaise; existing.count += 1; }
    else dailyMap.set(key, { amount: inv.amountPaise, count: 1 });
  }
  const dailyRevenue = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, amount: data.amount, count: data.count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Revenue this month vs last month
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  let revenueThisMonth = 0, revenueLastMonth = 0, invoicesThisMonth = 0, invoicesLastMonth = 0;
  for (const inv of recentInvoices) {
    const m = inv.issuedAt.getMonth();
    const y = inv.issuedAt.getFullYear();
    if (m === thisMonth && y === thisYear) { revenueThisMonth += inv.amountPaise; invoicesThisMonth++; }
    else if ((m === thisMonth - 1 && y === thisYear) || (thisMonth === 0 && m === 11 && y === thisYear - 1)) { revenueLastMonth += inv.amountPaise; invoicesLastMonth++; }
  }

  const maxBarAmount = Math.max(...dailyRevenue.map((d) => d.amount), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold text-[#111827] tracking-[-0.02em]">Analytics</h1>
        <p className="mt-1 text-[14px] text-[#6B7280]">Business metrics, traffic, and web vitals.</p>
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
        <MetricCard label="Conversion Events" value={String(eventCount)} />
      </section>

      {/* Daily revenue chart */}
      <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="border-b border-[#F3F4F6] px-6 py-4">
          <h2 className="text-[15px] font-semibold text-[#111827]">Daily Revenue (Last 30 Days)</h2>
        </div>
        <div className="px-6 py-5">
          {dailyRevenue.length === 0 ? (
            <p className="text-[13px] text-[#9CA3AF]">No invoices in the last 30 days.</p>
          ) : (
            <div className="space-y-1.5">
              {dailyRevenue.map((day) => {
                const pct = Math.max(2, (day.amount / maxBarAmount) * 100);
                return (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-[11px] text-[#9CA3AF] tabular-nums">{day.date}</span>
                    <div className="flex-1">
                      <div className="h-5 rounded bg-[#6366F1]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-20 shrink-0 text-right text-[11px] font-medium text-[#111827] tabular-nums">
                      {formatCurrency(day.amount, "INR")}
                    </span>
                    <span className="w-12 shrink-0 text-right text-[10px] text-[#9CA3AF]">{day.count} inv</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* PostHog traffic stats */}
      {posthogTraffic ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard label="Pageviews (30d)" value={String(posthogTraffic.totalPageviews)} accent />
            <MetricCard label="Unique Visitors (30d)" value={String(posthogTraffic.totalVisitors)} accent />
            <MetricCard label="Sessions (30d)" value={posthogSessionSummary ? String(posthogSessionSummary.sessions) : "--"} accent />
            <MetricCard label="Avg Duration" value={posthogSessionSummary ? formatDuration(posthogSessionSummary.avgDurationSeconds) : "--"} accent />
            <MetricCard label="Bounce Rate" value={posthogSessionSummary ? `${posthogSessionSummary.bounceRate}%` : "--"} accent />
          </section>

          <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-[#F3F4F6] px-6 py-4">
              <h2 className="text-[15px] font-semibold text-[#111827]">Daily Traffic (Last 30 Days)</h2>
            </div>
            <div className="px-6 py-5">
              {posthogTraffic.daily.filter((d) => d.pageviews > 0).length === 0 ? (
                <p className="text-[13px] text-[#9CA3AF]">No traffic data yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {(() => {
                    const maxPv = Math.max(...posthogTraffic.daily.map((d) => d.pageviews), 1);
                    return posthogTraffic.daily.filter((d) => d.pageviews > 0).map((day) => {
                      const pct = Math.max(2, (day.pageviews / maxPv) * 100);
                      return (
                        <div key={day.date} className="flex items-center gap-3">
                          <span className="w-20 shrink-0 text-[11px] text-[#9CA3AF] tabular-nums">{day.date}</span>
                          <div className="flex-1">
                            <div className="h-5 rounded bg-[#8B5CF6]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-14 shrink-0 text-right text-[11px] font-medium text-[#111827] tabular-nums">{day.pageviews} pv</span>
                          <span className="w-12 shrink-0 text-right text-[10px] text-[#9CA3AF]">{day.visitors} uv</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-6">
          <h2 className="text-[15px] font-semibold text-[#92400E]">PostHog Traffic</h2>
          <p className="mt-1 text-[13px] text-[#A16207]">
            Could not fetch PostHog data. Make sure <code className="rounded bg-[#FEF3C7] px-1 text-[11px] font-mono">POSTHOG_PERSONAL_API_KEY</code> is set.
          </p>
        </section>
      )}

      {/* Top pages */}
      {posthogTopPages.length > 0 && (
        <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="border-b border-[#F3F4F6] px-6 py-4">
            <h2 className="text-[15px] font-semibold text-[#111827]">Top Pages (Last 30 Days)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
                  <th className="px-5 py-2.5 font-medium">Page</th>
                  <th className="px-5 py-2.5 font-medium text-right">Views</th>
                </tr>
              </thead>
              <tbody>
                {posthogTopPages.map((page) => (
                  <tr key={page.path} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-5 py-3 font-medium text-[#111827]">{page.path}</td>
                    <td className="px-5 py-3 text-right text-[#6B7280] tabular-nums">{page.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Breakdowns */}
      {(posthogDevices.length > 0 || posthogBrowsers.length > 0) && (
        <section className="grid gap-4 sm:grid-cols-2">
          <BreakdownTable title="Device Type" items={posthogDevices} labelHeader="Device" />
          <BreakdownTable title="Browser" items={posthogBrowsers} labelHeader="Browser" />
        </section>
      )}

      {(posthogCountries.length > 0 || posthogReferrers.length > 0) && (
        <section className="grid gap-4 sm:grid-cols-2">
          <BreakdownTable title="Country" items={posthogCountries} labelHeader="Country" />
          <BreakdownTable title="Referrer" items={posthogReferrers} labelHeader="Source" />
        </section>
      )}

      {posthogOS.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          <BreakdownTable title="Operating System" items={posthogOS} labelHeader="OS" />
          <div />
        </section>
      )}

      {/* Core Web Vitals */}
      {posthogWebVitals && (
        <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="border-b border-[#F3F4F6] px-6 py-4">
            <h2 className="text-[15px] font-semibold text-[#111827]">Core Web Vitals (30d Avg)</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-6">
            <VitalCard label="LCP" value={posthogWebVitals.lcpMs} unit="ms" good={2500} poor={4000} />
            <VitalCard label="FCP" value={posthogWebVitals.fcpMs} unit="ms" good={1800} poor={3000} />
            <VitalCard label="CLS" value={posthogWebVitals.cls} unit="" good={0.1} poor={0.25} />
            <VitalCard label="INP" value={posthogWebVitals.inpMs} unit="ms" good={200} poor={500} />
          </div>
        </section>
      )}

      {/* Session Replays */}
      {posthogSessions.length > 0 && (
        <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
            <h2 className="text-[15px] font-semibold text-[#111827]">Session Replays</h2>
            <a href="https://us.posthog.com/replay/recent" target="_blank" rel="noopener noreferrer"
              className="text-[12px] font-medium text-[#6B7280] hover:text-[#111827] transition-colors">
              View all in PostHog →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
                  <th className="px-5 py-2.5 font-medium">User</th>
                  <th className="px-5 py-2.5 font-medium">Start Page</th>
                  <th className="px-5 py-2.5 font-medium">Duration</th>
                  <th className="px-5 py-2.5 font-medium">Active</th>
                  <th className="px-5 py-2.5 font-medium">Clicks</th>
                  <th className="px-5 py-2.5 font-medium">Time</th>
                  <th className="px-5 py-2.5 font-medium">Replay</th>
                </tr>
              </thead>
              <tbody>
                {posthogSessions.map((session) => {
                  const startPage = (() => { try { return new URL(session.startUrl).pathname; } catch { return session.startUrl; } })();
                  const mins = Math.floor(session.durationSeconds / 60);
                  const secs = session.durationSeconds % 60;
                  const duration = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                  const activeMins = Math.floor(session.activeSeconds / 60);
                  const activeSecs = session.activeSeconds % 60;
                  const active = activeMins > 0 ? `${activeMins}m ${activeSecs}s` : `${activeSecs}s`;
                  const time = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(session.startTime));
                  return (
                    <tr key={session.id} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#111827]">{session.personName || "Anonymous"}</p>
                        <p className="max-w-[120px] truncate text-[10px] text-[#9CA3AF]">{session.distinctId.slice(0, 16)}</p>
                      </td>
                      <td className="px-5 py-3 text-[#6B7280]">{startPage}</td>
                      <td className="px-5 py-3 text-[#6B7280] tabular-nums">{duration}</td>
                      <td className="px-5 py-3 text-[#6B7280] tabular-nums">{active}</td>
                      <td className="px-5 py-3 text-[#6B7280] tabular-nums">{session.clickCount}</td>
                      <td className="px-5 py-3 text-[#9CA3AF] whitespace-nowrap">{time}</td>
                      <td className="px-5 py-3">
                        <a href={`https://us.posthog.com/replay/${session.id}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] px-2.5 py-1.5 text-[11px] font-medium text-[#6D28D9] hover:bg-[#EDE9FE] transition-colors">
                          Watch
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

      {/* PostHog info */}
      <section className="rounded-2xl border border-[#C7D2FE] bg-[#EEF2FF] p-6">
        <h2 className="text-[15px] font-semibold text-[#3730A3]">PostHog Integration Active</h2>
        <p className="mt-1 text-[13px] text-[#4338CA]">
          PostHog is live and capturing events. Traffic data above is pulled directly from PostHog.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-[13px] text-[#4338CA]">
          <li>Pageviews, page leaves, and autocapture are enabled</li>
          <li>Data refreshes every 5 minutes (cached server-side)</li>
          <li>
            <a href="https://us.posthog.com" target="_blank" rel="noopener noreferrer" className="font-medium underline">
              us.posthog.com
            </a>{" "}for full dashboards, funnels, and session recordings
          </li>
        </ul>
      </section>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <article className={`rounded-2xl border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
      accent ? "border-[#DDD6FE] bg-[#F5F3FF]" : "border-[#E8ECF0] bg-white"
    }`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">{label}</p>
      <p className={`mt-2 text-[24px] font-bold tracking-[-0.02em] tabular-nums leading-none ${accent ? "text-[#6D28D9]" : "text-[#111827]"}`}>
        {value}
      </p>
    </article>
  );
}

function BreakdownTable({ title, items, labelHeader = "Value" }: { title: string; items: Array<{ value: string; count: number }>; labelHeader?: string }) {
  if (items.length === 0) return null;
  const total = items.reduce((s, i) => s + i.count, 0);
  return (
    <div className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="border-b border-[#F3F4F6] px-5 py-4">
        <h2 className="text-[15px] font-semibold text-[#111827]">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
              <th className="px-5 py-2.5 font-medium">{labelHeader}</th>
              <th className="px-5 py-2.5 font-medium text-right">Views</th>
              <th className="px-5 py-2.5 font-medium text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.value} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors">
                <td className="px-5 py-2.5 font-medium text-[#111827]">{cleanLabel(item.value)}</td>
                <td className="px-5 py-2.5 text-right text-[#6B7280] tabular-nums">{item.count}</td>
                <td className="px-5 py-2.5 text-right text-[#9CA3AF] tabular-nums">
                  {total > 0 ? `${Math.round((item.count / total) * 100)}%` : "--"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VitalCard({ label, value, unit, good, poor }: { label: string; value: number | null; unit: string; good: number; poor: number }) {
  if (value == null) return (
    <div className="rounded-xl bg-[#F9FAFB] p-4 text-center border border-[#E8ECF0]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{label}</p>
      <p className="mt-1 text-[20px] font-bold text-[#D1D5DB]">--</p>
    </div>
  );
  const status = value <= good ? "good" : value <= poor ? "needs-improvement" : "poor";
  const colors: Record<string, string> = {
    good: "bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]",
    "needs-improvement": "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
    poor: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  };
  return (
    <div className={`rounded-xl border p-4 text-center ${colors[status]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-[20px] font-bold">{value}{unit}</p>
      <p className="mt-0.5 text-[10px] capitalize font-medium">{status.replace("-", " ")}</p>
    </div>
  );
}
