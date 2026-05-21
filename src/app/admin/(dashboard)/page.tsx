import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { formatCurrency } from "@/src/lib/invoice-template";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function AdminDashboardPage() {
  const [customerCount, invoiceCount, orderCount, revenue, orderRevenue, recentInvoices, recentOrders] = await Promise.all([
    prisma.customer.count(),
    prisma.invoice.count(),
    prisma.order.count(),
    prisma.invoice.aggregate({ _sum: { amountPaise: true } }),
    prisma.order.aggregate({ _sum: { amountPaise: true }, where: { status: "paid" } }),
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

  const totalRevenuePaise = (revenue._sum.amountPaise || 0) + (orderRevenue._sum.amountPaise || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Overview of your billing, customers, and subscriptions.
        </p>
      </div>

      {/* Stats cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Customers" value={String(customerCount)} href="/admin/customers" />
        <StatCard label="Orders" value={String(orderCount)} href="/admin/orders" />
        <StatCard label="Invoices" value={String(invoiceCount)} href="/admin/invoices" />
        <StatCard label="Revenue" value={formatCurrency(totalRevenuePaise, "INR")} />
        <StatCard label="Analytics" value="→" href="/admin/analytics" accent />
      </section>

      {/* Quick links */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink href="/admin/customers" title="Customers" description="View all customers and expand their invoices" />
        <QuickLink href="/admin/orders" title="Orders" description="One-time payment orders" />
        <QuickLink href="/admin/invoices" title="Invoices" description="Browse and resend individual invoices" />
        <QuickLink href="/admin/subscribers" title="Subscribers" description="Newsletter subscriber list" />
        <QuickLink href="/admin/events" title="Conversion Events" description="Funnel and payment events" />
        <QuickLink href="/admin/analytics" title="Analytics" description="Revenue charts and PostHog metrics" />
        <QuickLink href="/admin/blog/new" title="New Blog Post" description="Write and publish a blog post" />
      </section>

      {/* Recent invoices */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Recent Invoices</h2>
          <Link href="/admin/invoices" className="text-xs font-medium text-slate-500 hover:text-slate-700">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                <th className="py-2 pr-4">Invoice</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/invoice/${inv.publicToken}`}
                      target="_blank"
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{inv.customer.fullName}</td>
                  <td className="py-3 pr-4">{formatCurrency(inv.amountPaise, inv.currency)}</td>
                  <td className="py-3 pr-4">{formatDate(inv.issuedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent orders */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs font-medium text-slate-500 hover:text-slate-700">
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-900">{order.orderNumber}</td>
                    <td className="py-3 pr-4">{order.customer.fullName}</td>
                    <td className="py-3 pr-4 text-slate-600">{order.planLabel}</td>
                    <td className="py-3 pr-4 tabular-nums">{formatCurrency(order.amountPaise, order.currency)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.status === "paid"
                          ? "bg-green-50 text-green-700"
                          : order.status === "failed"
                            ? "bg-red-50 text-red-700"
                            : "bg-yellow-50 text-yellow-700"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: string;
  href?: string;
  accent?: boolean;
}) {
  const inner = (
    <article
      className={`rounded-xl border p-4 shadow-sm transition-colors ${
        accent
          ? "border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
          : "border-slate-200 bg-white hover:bg-slate-50"
      } ${href ? "cursor-pointer" : ""}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent ? "text-indigo-700" : "text-slate-900"}`}>
        {value}
      </p>
    </article>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
    >
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </Link>
  );
}
