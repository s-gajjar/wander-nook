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
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });

  const totalPaid = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.amountPaise, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-[#111827] tracking-[-0.02em]">Orders</h1>
          <p className="mt-1 text-[14px] text-[#6B7280]">
            {orders.length} order{orders.length !== 1 ? "s" : ""} · Total paid:{" "}
            <span className="font-medium text-[#111827] tabular-nums">{formatCurrency(totalPaid, "INR")}</span>
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-[#E8ECF0] bg-white p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6] mb-3">
            <span className="text-xl">📦</span>
          </div>
          <p className="text-[14px] text-[#6B7280]">No orders yet. Orders will appear here after one-time payments are completed.</p>
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
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[#111827] whitespace-nowrap">
                      <Link href={`/admin/orders/${order.id}`} className="hover:text-[#4F46E5] transition-colors">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#111827]">{order.customer.fullName}</p>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">{order.customer.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280]">{order.planLabel}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-[#111827] tabular-nums">
                      {formatCurrency(order.amountPaise, order.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-medium ${
                        order.paymentMethod === "razorpay-onetime"
                          ? "bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]"
                          : order.paymentMethod === "razorpay-autopay"
                            ? "bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE]"
                            : "bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]"
                      }`}>
                        {order.paymentMethod === "razorpay-onetime"
                          ? "One-time"
                          : order.paymentMethod === "razorpay-autopay"
                            ? "Autopay"
                            : "Shopify"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        order.status === "paid"
                          ? "bg-[#ECFDF5] text-[#059669]"
                          : order.status === "failed"
                            ? "bg-[#FEF2F2] text-[#DC2626]"
                            : "bg-[#FEF3C7] text-[#D97706]"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          order.status === "paid" ? "bg-[#10B981]"
                            : order.status === "failed" ? "bg-[#EF4444]"
                            : "bg-[#F59E0B]"
                        }`}></span>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280] whitespace-nowrap">
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
