import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { formatCurrency } from "@/src/lib/invoice-template";
import FilterSelect from "@/src/components/Admin/FilterSelect";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(value);
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; fulfillment?: string }>;
}) {
  const { q, status, fulfillment } = await searchParams;

  // Build where clause
  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (fulfillment && fulfillment !== "all") where.fulfillmentStatus = fulfillment;

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    where,
    include: { customer: true },
  });

  // Client-side text search (name, email, order number)
  const filtered = q
    ? orders.filter((o) => {
        const search = q.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(search) ||
          o.customer.fullName.toLowerCase().includes(search) ||
          o.customer.email.toLowerCase().includes(search) ||
          o.customer.phone.includes(search)
        );
      })
    : orders;

  const totalPaid = filtered.filter((o) => o.status === "paid").reduce((sum, o) => sum + o.amountPaise, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#111827] tracking-[-0.02em]">Orders</h1>
          <p className="mt-1 text-[14px] text-[#6B7280]">
            {filtered.length} order{filtered.length !== 1 ? "s" : ""} · Total paid:{" "}
            <span className="font-medium text-[#111827] tabular-nums">{formatCurrency(totalPaid, "INR")}</span>
          </p>
        </div>
        <Link
          href="/api/admin/export/orders"
          className="rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          Export CSV
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <SearchForm currentQuery={q || ""} />
        <FilterSelect
          name="status"
          options={[
            { value: "all", label: "All statuses" },
            { value: "paid", label: "Paid" },
            { value: "pending", label: "Pending" },
            { value: "failed", label: "Failed" },
          ]}
        />
        <FilterSelect
          name="fulfillment"
          options={[
            { value: "all", label: "All fulfillment" },
            { value: "unfulfilled", label: "Unfulfilled" },
            { value: "fulfilled", label: "Fulfilled" },
            { value: "shipped", label: "Shipped" },
            { value: "delivered", label: "Delivered" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E8ECF0] bg-white p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[14px] text-[#6B7280]">No orders match your filters.</p>
        </div>
      ) : (
        <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                  <th className="px-5 py-3 font-medium">Fulfillment</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#F3F4F6] transition-colors relative group">
                    <td className="px-5 py-3.5 font-medium text-[#111827] whitespace-nowrap">
                      <Link href={`/admin/orders/${order.id}`} className="absolute inset-0" aria-label={`View order ${order.orderNumber}`} />
                      <span className="relative pointer-events-none">{order.orderNumber}</span>
                    </td>
                    <td className="px-5 py-3.5 relative pointer-events-none">
                      <p className="font-medium text-[#111827]">{order.customer.fullName}</p>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">{order.customer.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280] relative pointer-events-none">{order.planLabel}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-[#111827] tabular-nums relative pointer-events-none">
                      {formatCurrency(order.amountPaise, order.currency)}
                    </td>
                    <td className="px-5 py-3.5 relative pointer-events-none">
                      <MethodBadge method={order.paymentMethod} />
                    </td>
                    <td className="px-5 py-3.5 relative pointer-events-none">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 relative pointer-events-none">
                      <FulfillmentBadge status={order.fulfillmentStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280] whitespace-nowrap relative pointer-events-none">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function SearchForm({ currentQuery }: { currentQuery: string }) {
  return (
    <form method="GET" className="flex-1 min-w-[200px]">
      <input
        type="search"
        name="q"
        defaultValue={currentQuery}
        placeholder="Search orders, customers..."
        className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#6366F1] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/10 transition-all"
      />
    </form>
  );
}

function MethodBadge({ method }: { method: string }) {
  const styles = method === "razorpay-onetime"
    ? "bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]"
    : method === "razorpay-autopay"
      ? "bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]"
      : "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]";
  const label = method === "razorpay-onetime" ? "One-time"
    : method === "razorpay-autopay" ? "Autopay" : "Legacy";
  return <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-medium border ${styles}`}>{label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles = status === "paid" ? "bg-[#ECFDF5] text-[#059669]"
    : status === "failed" ? "bg-[#FEF2F2] text-[#DC2626]"
    : "bg-[#FEF3C7] text-[#D97706]";
  const dotColor = status === "paid" ? "bg-[#10B981]" : status === "failed" ? "bg-[#EF4444]" : "bg-[#F59E0B]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {status}
    </span>
  );
}

function FulfillmentBadge({ status }: { status: string }) {
  const styles = status === "delivered" ? "bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]"
    : status === "shipped" ? "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]"
    : status === "fulfilled" ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
    : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]";
  return <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-medium border ${styles}`}>{status}</span>;
}
