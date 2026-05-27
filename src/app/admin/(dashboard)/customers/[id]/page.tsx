import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { formatCurrency } from "@/src/lib/invoice-template";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(value);
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      invoices: { orderBy: { issuedAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) notFound();

  const totalInvoiceRevenue = customer.invoices.reduce((sum, inv) => sum + inv.amountPaise, 0);
  const totalOrderRevenue = customer.orders.filter((o) => o.status === "paid").reduce((sum, o) => sum + o.amountPaise, 0);

  // Active subscription = at least 1 invoice in last 45 days
  const recentInvoice = customer.invoices.find(
    (inv) => inv.issuedAt.getTime() > Date.now() - 45 * 24 * 60 * 60 * 1000
  );
  const hasActiveSubscription = !!recentInvoice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/admin/customers" className="text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors">
            ← Customers
          </Link>
          <h1 className="mt-2 text-[26px] font-semibold text-[#111827] tracking-[-0.02em]">{customer.fullName}</h1>
          <p className="mt-1 text-[14px] text-[#6B7280]">
            Customer since {formatDate(customer.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveSubscription && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5] px-3 py-1.5 text-[12px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
              Active Subscription
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total Paid (Invoices)" value={formatCurrency(totalInvoiceRevenue, "INR")} subtitle={`${customer.invoices.length} invoices`} />
            <StatCard label="Total Paid (Orders)" value={formatCurrency(totalOrderRevenue, "INR")} subtitle={`${customer.orders.length} orders`} />
            <StatCard label="Lifetime Value" value={formatCurrency(totalInvoiceRevenue + totalOrderRevenue, "INR")} subtitle="All-time" />
          </section>

          {/* Invoices */}
          <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
              <h2 className="text-[15px] font-semibold text-[#111827]">Invoices</h2>
              <span className="text-[12px] font-medium text-[#9CA3AF] bg-[#F3F4F6] rounded-full px-2.5 py-1">{customer.invoices.length}</span>
            </div>
            {customer.invoices.length === 0 ? (
              <div className="px-5 py-8 text-center"><p className="text-[13px] text-[#9CA3AF]">No invoices yet.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
                      <th className="px-5 py-2.5 font-medium">Invoice</th>
                      <th className="px-5 py-2.5 font-medium">Plan</th>
                      <th className="px-5 py-2.5 font-medium text-right">Amount</th>
                      <th className="px-5 py-2.5 font-medium">Date</th>
                      <th className="px-5 py-2.5 font-medium">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/invoice/${inv.publicToken}`} target="_blank" className="font-medium text-[#111827] hover:text-[#4F46E5] transition-colors">
                            {inv.invoiceNumber}
                          </Link>
                          <p className="text-[10px] text-[#9CA3AF] mt-0.5 font-mono">{inv.razorpayPaymentId}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-[#374151]">{inv.planLabel}</span>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-[#111827] tabular-nums">{formatCurrency(inv.amountPaise, inv.currency)}</td>
                        <td className="px-5 py-3 text-[#6B7280]">{formatDate(inv.issuedAt)}</td>
                        <td className="px-5 py-3">
                          {inv.emailSentAt ? (
                            <span className="inline-flex items-center gap-1 text-[#059669] text-[11px] font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>Sent
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#9CA3AF]">Not sent</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Orders */}
          <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
              <h2 className="text-[15px] font-semibold text-[#111827]">Orders</h2>
              <span className="text-[12px] font-medium text-[#9CA3AF] bg-[#F3F4F6] rounded-full px-2.5 py-1">{customer.orders.length}</span>
            </div>
            {customer.orders.length === 0 ? (
              <div className="px-5 py-8 text-center"><p className="text-[13px] text-[#9CA3AF]">No orders yet.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
                      <th className="px-5 py-2.5 font-medium">Order</th>
                      <th className="px-5 py-2.5 font-medium">Plan</th>
                      <th className="px-5 py-2.5 font-medium text-right">Amount</th>
                      <th className="px-5 py-2.5 font-medium">Status</th>
                      <th className="px-5 py-2.5 font-medium">Fulfillment</th>
                      <th className="px-5 py-2.5 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.orders.map((order) => (
                      <tr key={order.id} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/admin/orders/${order.id}`} className="font-medium text-[#111827] hover:text-[#4F46E5] transition-colors">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-[#374151]">{order.planLabel}</span>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-[#111827] tabular-nums">{formatCurrency(order.amountPaise, order.currency)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            order.status === "paid" ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FEF3C7] text-[#D97706]"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${order.status === "paid" ? "bg-[#10B981]" : "bg-[#F59E0B]"}`}></span>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-medium border ${
                            order.fulfillmentStatus === "delivered" ? "bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]"
                              : order.fulfillmentStatus === "shipped" ? "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]"
                              : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                          }`}>{order.fulfillmentStatus}</span>
                        </td>
                        <td className="px-5 py-3 text-[#6B7280]">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Contact info */}
          <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-[#F3F4F6] px-5 py-4">
              <h2 className="text-[15px] font-semibold text-[#111827]">Contact Info</h2>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-[#F3F4F6]">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white text-[15px] font-semibold">
                  {customer.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[#111827] text-[14px]">{customer.fullName}</p>
                  <p className="text-[12px] text-[#9CA3AF]">{customer.email}</p>
                </div>
              </div>
              <InfoRow label="Phone" value={customer.phone} />
              <InfoRow label="Email" value={customer.email} />
              <InfoRow label="Joined" value={formatDateTime(customer.createdAt)} />
            </div>
          </section>

          {/* Address */}
          <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-[#F3F4F6] px-5 py-4">
              <h2 className="text-[15px] font-semibold text-[#111827]">Address</h2>
            </div>
            <div className="px-5 py-5 text-[14px] text-[#374151] leading-relaxed space-y-1">
              <p className="font-medium text-[#111827]">{customer.fullName}</p>
              <p>{customer.addressLine1}</p>
              {customer.addressLine2 && <p>{customer.addressLine2}</p>}
              <p>{customer.city}, {customer.state} {customer.pincode}</p>
              <p>{customer.country}</p>
              <p className="pt-2 text-[13px] text-[#6B7280] tabular-nums">{customer.phone}</p>
            </div>
          </section>

          {/* Subscription info */}
          {recentInvoice && (
            <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="border-b border-[#F3F4F6] px-5 py-4">
                <h2 className="text-[15px] font-semibold text-[#111827]">Subscription</h2>
              </div>
              <div className="px-5 py-5 space-y-3">
                <InfoRow label="Plan" value={recentInvoice.planLabel} />
                <InfoRow label="Cycle" value={recentInvoice.billingCycle} />
                <InfoRow label="Last Payment" value={formatDate(recentInvoice.issuedAt)} />
                <InfoRow label="Subscription ID" value={recentInvoice.razorpaySubscriptionId} mono />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <article className="rounded-2xl border border-[#E8ECF0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">{label}</p>
      <p className="mt-2 text-[20px] font-bold text-[#111827] tracking-[-0.02em] tabular-nums leading-none">{value}</p>
      <p className="mt-2 text-[12px] text-[#9CA3AF]">{subtitle}</p>
    </article>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium">{label}</p>
      <p className={`mt-0.5 text-[13px] text-[#111827] font-medium break-all ${mono ? "font-mono text-[12px]" : ""}`}>{value}</p>
    </div>
  );
}
