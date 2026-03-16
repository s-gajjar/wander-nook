import { prisma } from "@/src/lib/prisma";
import { formatCurrency } from "@/src/lib/invoice-template";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [invoiceCount, customerCount, revenue, subscriberCount, eventCount, recentInvoices] =
    await Promise.all([
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
        <h2 className="text-lg font-semibold text-indigo-900">PostHog Integration</h2>
        <p className="mt-1 text-sm text-indigo-700">
          PostHog is capturing pageviews, clicks, and custom events automatically on your site.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-indigo-700">
          <li>Pageviews, page leaves, and autocapture are enabled</li>
          <li>Server-side events can be sent from API routes</li>
          <li>
            Visit{" "}
            <a href="https://us.posthog.com" target="_blank" rel="noopener noreferrer" className="font-medium underline">
              us.posthog.com
            </a>{" "}
            for full dashboards, funnels, and session recordings
          </li>
          <li>
            Set <code className="rounded bg-indigo-100 px-1 text-xs">POSTHOG_PERSONAL_API_KEY</code> to pull live PostHog insights directly into this page
          </li>
        </ul>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}
