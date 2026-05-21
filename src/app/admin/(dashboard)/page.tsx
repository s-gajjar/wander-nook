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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[26px] font-semibold text-[#111827] tracking-[-0.02em]">Dashboard</h1>
        <p className="mt-1 text-[14px] text-[#6B7280]">
          Overview of your billing, customers, and subscriptions.
        </p>
      </div>

      {/* Stats cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Customers" value={String(customerCount)} href="/admin/customers" color="blue" />
        <StatCard label="Orders" value={String(orderCount)} href="/admin/orders" color="purple" />
        <StatCard label="Invoices" value={String(invoiceCount)} href="/admin/invoices" color="indigo" />
        <StatCard label="Revenue" value={formatCurrency(totalRevenuePaise, "INR")} color="green" />
        <StatCard label="Analytics" value="→" href="/admin/analytics" color="violet" />
      </section>

      {/* Quick links */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink href="/admin/customers" title="Customers" description="View all customers and invoices" icon="👤" />
        <QuickLink href="/admin/orders" title="Orders" description="One-time payment orders" icon="📦" />
        <QuickLink href="/admin/invoices" title="Invoices" description="Browse and resend invoices" icon="📄" />
        <QuickLink href="/admin/subscribers" title="Subscribers" description="Newsletter subscriber list" icon="📧" />
        <QuickLink href="/admin/events" title="Conversion Events" description="Funnel and payment events" icon="⚡" />
        <QuickLink href="/admin/analytics" title="Analytics" description="Revenue charts and traffic" icon="📊" />
        <QuickLink href="/admin/blog/new" title="New Blog Post" description="Write and publish content" icon="✍️" />
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
                        className="font-medium text-[#111827] hover:text-[#6366F1] transition-colors"
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
                        <p className="font-medium text-[#111827]">{order.orderNumber.slice(-12)}</p>
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

function StatCard({
  label,
  value,
  href,
  color = "blue",
}: {
  label: string;
  value: string;
  href?: string;
  color?: "blue" | "purple" | "indigo" | "green" | "violet";
}) {
  const colorMap = {
    blue: "from-[#EFF6FF] to-[#F0F9FF] border-[#DBEAFE]",
    purple: "from-[#FAF5FF] to-[#FDF4FF] border-[#E9D5FF]",
    indigo: "from-[#EEF2FF] to-[#F0F0FF] border-[#E0E7FF]",
    green: "from-[#ECFDF5] to-[#F0FDF4] border-[#D1FAE5]",
    violet: "from-[#F5F3FF] to-[#FAF5FF] border-[#DDD6FE]",
  };

  const inner = (
    <article
      className={`rounded-2xl border bg-gradient-to-br ${colorMap[color]} p-4.5 transition-all duration-150 ${
        href ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]" : ""
      }`}
      style={{ padding: "18px" }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">{label}</p>
      <p className="mt-2.5 text-[22px] font-bold text-[#111827] tracking-[-0.02em] tabular-nums leading-none">
        {value}
      </p>
    </article>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function QuickLink({ href, title, description, icon }: { href: string; title: string; description: string; icon: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-[#E8ECF0] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-150 hover:border-[#D1D5DB] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        <span className="text-[18px] mt-0.5">{icon}</span>
        <div>
          <h3 className="text-[13px] font-semibold text-[#111827] group-hover:text-[#4F46E5] transition-colors">{title}</h3>
          <p className="mt-0.5 text-[12px] text-[#9CA3AF] leading-relaxed">{description}</p>
        </div>
      </div>
    </Link>
  );
}
