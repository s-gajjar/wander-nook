import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { formatCurrency } from "@/src/lib/invoice-template";
import RevenueChart from "@/src/components/Admin/RevenueChart";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function getMonthRange(offset: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function getMonthLabel(offset: number) {
  const { start } = getMonthRange(offset);
  return start.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const selectedPeriod = period === "last-month" ? "last-month" : period === "all-time" ? "all-time" : "this-month";

  // Date filters
  const dateFilter =
    selectedPeriod === "all-time"
      ? {}
      : selectedPeriod === "last-month"
        ? { gte: getMonthRange(-1).start, lte: getMonthRange(-1).end }
        : { gte: getMonthRange(0).start, lte: getMonthRange(0).end };

  const invoiceWhere = selectedPeriod === "all-time" ? {} : { issuedAt: dateFilter };
  const orderWhere = selectedPeriod === "all-time" ? { status: "paid" as const } : { status: "paid" as const, createdAt: dateFilter };

  // Stats - Revenue from invoices only (autopay). Orders with razorpay-onetime counted separately.
  const [customerCount, invoiceCount, orderCount, invoiceRevenue, onetimeOrderRevenue, recentInvoices, recentOrders] =
    await Promise.all([
      prisma.customer.count(),
      prisma.invoice.count({ where: invoiceWhere }),
      prisma.order.count({ where: orderWhere }),
      prisma.invoice.aggregate({ _sum: { amountPaise: true }, where: invoiceWhere }),
      prisma.order.aggregate({
        _sum: { amountPaise: true },
        where: { ...orderWhere, paymentMethod: "razorpay-onetime" },
      }),
      prisma.invoice.findMany({
        orderBy: { issuedAt: "desc" },
        take: 5,
        include: { customer: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: true },
      }),
    ]);

  // Total revenue = invoices (autopay) + one-time orders (no double counting)
  const totalRevenuePaise = (invoiceRevenue._sum.amountPaise || 0) + (onetimeOrderRevenue._sum.amountPaise || 0);

  // Chart data: daily revenue for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [dailyInvoices, dailyOrders] = await Promise.all([
    prisma.invoice.findMany({
      where: { issuedAt: { gte: thirtyDaysAgo } },
      select: { issuedAt: true, amountPaise: true },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: "paid",
        paymentMethod: "razorpay-onetime",
      },
      select: { createdAt: true, amountPaise: true },
    }),
  ]);

  // Aggregate by day
  const dailyMap: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = 0;
  }
  for (const inv of dailyInvoices) {
    const key = inv.issuedAt.toISOString().slice(0, 10);
    if (dailyMap[key] !== undefined) dailyMap[key] += inv.amountPaise;
  }
  for (const ord of dailyOrders) {
    const key = ord.createdAt.toISOString().slice(0, 10);
    if (dailyMap[key] !== undefined) dailyMap[key] += ord.amountPaise;
  }

  const chartData = Object.entries(dailyMap).map(([date, amount]) => ({
    date,
    amount: amount / 100,
  }));

  const periodLabel =
    selectedPeriod === "all-time"
      ? "All Time"
      : selectedPeriod === "last-month"
        ? getMonthLabel(-1)
        : getMonthLabel(0);

  return (
    <div className="space-y-8">
      {/* Header with period selector */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[26px] font-semibold text-[#111827] tracking-[-0.02em]">Dashboard</h1>
          <p className="mt-1 text-[14px] text-[#6B7280]">
            Revenue and order overview · <span className="font-medium text-[#374151]">{periodLabel}</span>
          </p>
        </div>
        <div className="flex rounded-lg border border-[#E5E7EB] bg-white p-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <PeriodTab href="/admin?period=this-month" label="This Month" active={selectedPeriod === "this-month"} />
          <PeriodTab href="/admin?period=last-month" label="Last Month" active={selectedPeriod === "last-month"} />
          <PeriodTab href="/admin?period=all-time" label="All Time" active={selectedPeriod === "all-time"} />
        </div>
      </div>

      {/* Stats cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenuePaise, "INR")} subtitle={`${invoiceCount} invoices + ${orderCount} orders`} />
        <StatCard label="Customers" value={String(customerCount)} subtitle="Total registered" />
        <StatCard label="Orders" value={String(orderCount)} subtitle={`${periodLabel}`} />
        <StatCard label="Invoices" value={String(invoiceCount)} subtitle={`${periodLabel}`} />
      </section>

      {/* Revenue chart */}
      <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-[#111827]">Revenue</h2>
            <p className="text-[12px] text-[#9CA3AF] mt-0.5">Last 30 days · Daily breakdown</p>
          </div>
          <p className="text-[18px] font-bold text-[#111827] tabular-nums">
            {formatCurrency(chartData.reduce((s, d) => s + d.amount * 100, 0), "INR")}
          </p>
        </div>
        <div className="px-6 py-5">
          <RevenueChart data={chartData} />
        </div>
      </section>

      {/* Quick links */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink href="/admin/customers" title="Customers" description="View all customers and invoices" />
        <QuickLink href="/admin/orders" title="Orders" description="One-time and subscription orders" />
        <QuickLink href="/admin/invoices" title="Invoices" description="Browse and resend invoices" />
        <QuickLink href="/admin/events" title="Conversion Events" description="Funnel and payment events" />
      </section>

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent invoices */}
        <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
            <h2 className="text-[15px] font-semibold text-[#111827]">Recent Invoices</h2>
            <Link href="/admin/invoices" className="text-[12px] font-medium text-[#6B7280] hover:text-[#111827] transition-colors">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#F3F4F6] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
                  <th className="px-5 py-2.5 font-medium">Invoice</th>
                  <th className="px-5 py-2.5 font-medium">Customer</th>
                  <th className="px-5 py-2.5 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/invoice/${inv.publicToken}`}
                        target="_blank"
                        className="font-medium text-[#111827] hover:text-[#4F46E5] transition-colors"
                      >
                        {inv.invoiceNumber.slice(-12)}
                      </Link>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">{formatDate(inv.issuedAt)}</p>
                    </td>
                    <td className="px-5 py-3 text-[#374151]">{inv.customer.fullName}</td>
                    <td className="px-5 py-3 text-right font-medium text-[#111827] tabular-nums">
                      {formatCurrency(inv.amountPaise, inv.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent orders */}
        <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
            <h2 className="text-[15px] font-semibold text-[#111827]">Recent Orders</h2>
            <Link href="/admin/orders" className="text-[12px] font-medium text-[#6B7280] hover:text-[#111827] transition-colors">
              View all →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[13px] text-[#9CA3AF]">No orders yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#F3F4F6] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
                    <th className="px-5 py-2.5 font-medium">Order</th>
                    <th className="px-5 py-2.5 font-medium">Customer</th>
                    <th className="px-5 py-2.5 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-[#111827] hover:text-[#4F46E5] transition-colors">
                          {order.orderNumber.replace("WN-SHOPIFY-", "#")}
                        </Link>
                        <p className="text-[11px] text-[#9CA3AF] mt-0.5">{formatDate(order.createdAt)}</p>
                      </td>
                      <td className="px-5 py-3 text-[#374151]">{order.customer.fullName}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-medium text-[#111827] tabular-nums">
                          {formatCurrency(order.amountPaise, order.currency)}
                        </span>
                        <span className={`ml-2 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          order.status === "paid"
                            ? "bg-[#ECFDF5] text-[#059669]"
                            : "bg-[#FEF3C7] text-[#D97706]"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PeriodTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-all ${
        active
          ? "bg-[#111827] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
          : "text-[#6B7280] hover:text-[#111827]"
      }`}
    >
      {label}
    </Link>
  );
}

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <article className="rounded-2xl border border-[#E8ECF0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">{label}</p>
      <p className="mt-2 text-[24px] font-bold text-[#111827] tracking-[-0.02em] tabular-nums leading-none">
        {value}
      </p>
      <p className="mt-2 text-[12px] text-[#9CA3AF]">{subtitle}</p>
    </article>
  );
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-[#E8ECF0] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-150 hover:border-[#D1D5DB] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
    >
      <h3 className="text-[13px] font-semibold text-[#111827] group-hover:text-[#4F46E5] transition-colors">{title}</h3>
      <p className="mt-0.5 text-[12px] text-[#9CA3AF] leading-relaxed">{description}</p>
    </Link>
  );
}
