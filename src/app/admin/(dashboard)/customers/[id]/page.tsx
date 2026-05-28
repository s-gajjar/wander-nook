import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { formatCurrency } from "@/src/lib/invoice-template";
import CopyAddressButton from "@/src/components/Admin/CopyAddressButton";

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
      subscriptions: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!customer) notFound();

  const totalInvoiceRevenue = customer.invoices.reduce((sum, inv) => sum + inv.amountPaise, 0);

  const recentInvoice = customer.invoices.find(
    (inv) => inv.issuedAt.getTime() > Date.now() - 45 * 24 * 60 * 60 * 1000
  );
  const hasActiveSubscription = !!recentInvoice;

  const currentPlan = customer.invoices[0]?.planLabel || customer.orders[0]?.planLabel || "—";
  const amountPerCycle = customer.invoices[0]?.amountPaise || customer.orders[0]?.amountPaise || 0;
  const billingCycle = customer.invoices[0]?.billingCycle || "month";

  const firstPaymentDate = customer.invoices.length > 0
    ? customer.invoices[customer.invoices.length - 1].issuedAt
    : customer.orders.length > 0
      ? customer.orders[customer.orders.length - 1].createdAt
      : customer.createdAt;
  const monthsActive = Math.max(1, Math.ceil((Date.now() - firstPaymentDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Link href="/admin/customers" className="text-[12px] sm:text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors">
          ← Customers
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-[20px] sm:text-[26px] font-semibold text-[#111827] tracking-[-0.02em]">{customer.fullName}</h1>
            <p className="mt-0.5 sm:mt-1 text-[12px] sm:text-[14px] text-[#6B7280]">
              Customer since {formatDate(customer.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {customer.subscriptions.length > 0 ? (
              customer.subscriptions.map((sub) => (
                <span key={sub.id} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-[12px] font-semibold ${
                  sub.status === "active" ? "bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]"
                    : sub.status === "cancelled" ? "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
                    : sub.status === "halted" ? "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                    : sub.status === "paused" ? "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]"
                    : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                }`}>
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                    sub.status === "active" ? "bg-[#10B981]"
                      : sub.status === "cancelled" ? "bg-[#EF4444]"
                      : "bg-[#F59E0B]"
                  }`}></span>
                  {sub.planLabel} — {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                </span>
              ))
            ) : hasActiveSubscription ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5] px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-[12px] font-semibold">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#10B981]"></span>
                Active Subscription
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile: Contact + WhatsApp first */}
      <div className="lg:hidden space-y-4">
        <section className="rounded-xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white text-[14px] font-semibold shrink-0">
                {customer.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#111827] text-[14px] truncate">{customer.fullName}</p>
                <p className="text-[11px] text-[#9CA3AF] truncate">{customer.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F3F4F6]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium">Phone</p>
                <p className="mt-0.5 text-[12px] text-[#111827] font-medium">{customer.phone}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium">City</p>
                <p className="mt-0.5 text-[12px] text-[#111827] font-medium">{customer.city}</p>
              </div>
            </div>
            <a
              href={`https://wa.me/91${customer.phone.replace(/\D/g, "").replace(/^91/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#25D366] text-white px-4 py-2.5 text-[13px] font-semibold hover:bg-[#1DA851] transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.108-1.128l-.29-.174-2.868.852.852-2.868-.174-.29A8 8 0 1112 20z"/></svg>
              WhatsApp
            </a>
          </div>
        </section>
      </div>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
        {/* Left — 2 cols */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          {/* Stats */}
          <section className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <StatCard label="Total Paid" value={formatCurrency(totalInvoiceRevenue, "INR")} subtitle={`${customer.invoices.length} payment${customer.invoices.length !== 1 ? "s" : ""}`} />
            <StatCard label="Current Plan" value={currentPlan} subtitle={amountPerCycle ? `${formatCurrency(amountPerCycle, "INR")}/${billingCycle}` : "—"} />
            <StatCard label="Months Active" value={`${monthsActive} month${monthsActive !== 1 ? "s" : ""}`} subtitle={`since ${formatDate(firstPaymentDate)}`} />
          </section>

          {/* Invoices */}
          <section className="rounded-xl sm:rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#F3F4F6] px-4 sm:px-5 py-3 sm:py-4">
              <h2 className="text-[14px] sm:text-[15px] font-semibold text-[#111827]">Invoices</h2>
              <span className="text-[11px] sm:text-[12px] font-medium text-[#9CA3AF] bg-[#F3F4F6] rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1">{customer.invoices.length}</span>
            </div>
            {customer.invoices.length === 0 ? (
              <div className="px-4 sm:px-5 py-6 sm:py-8 text-center"><p className="text-[12px] sm:text-[13px] text-[#9CA3AF]">No invoices yet.</p></div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
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

                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-[#F3F4F6]">
                  {customer.invoices.map((inv) => (
                    <div key={inv.id} className="px-4 py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Link href={`/invoice/${inv.publicToken}`} target="_blank" className="font-medium text-[12px] text-[#111827] hover:text-[#4F46E5]">
                          {inv.invoiceNumber}
                        </Link>
                        <span className="font-semibold text-[13px] text-[#111827] tabular-nums">{formatCurrency(inv.amountPaise, inv.currency)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-medium text-[#374151]">{inv.planLabel}</span>
                        <span className="text-[11px] text-[#6B7280]">{formatDate(inv.issuedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Orders */}
          <section className="rounded-xl sm:rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#F3F4F6] px-4 sm:px-5 py-3 sm:py-4">
              <h2 className="text-[14px] sm:text-[15px] font-semibold text-[#111827]">Orders</h2>
              <span className="text-[11px] sm:text-[12px] font-medium text-[#9CA3AF] bg-[#F3F4F6] rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1">{customer.orders.length}</span>
            </div>
            {customer.orders.length === 0 ? (
              <div className="px-4 sm:px-5 py-6 sm:py-8 text-center"><p className="text-[12px] sm:text-[13px] text-[#9CA3AF]">No orders yet.</p></div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
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

                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-[#F3F4F6]">
                  {customer.orders.map((order) => (
                    <div key={order.id} className="px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-[12px] text-[#111827] hover:text-[#4F46E5]">
                          {order.orderNumber}
                        </Link>
                        <span className="font-semibold text-[13px] text-[#111827] tabular-nums">{formatCurrency(order.amountPaise, order.currency)}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-medium text-[#374151]">{order.planLabel}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          order.status === "paid" ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FEF3C7] text-[#D97706]"
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${order.status === "paid" ? "bg-[#10B981]" : "bg-[#F59E0B]"}`}></span>
                          {order.status}
                        </span>
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium border ${
                          order.fulfillmentStatus === "delivered" ? "bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]"
                            : order.fulfillmentStatus === "shipped" ? "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]"
                            : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                        }`}>{order.fulfillmentStatus}</span>
                        <span className="text-[10px] text-[#6B7280] ml-auto">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        {/* Right sidebar — hidden on mobile (shown above as compact card) */}
        <div className="hidden lg:block space-y-6">
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
              <a
                href={`https://wa.me/91${customer.phone.replace(/\D/g, "").replace(/^91/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#25D366] text-white px-4 py-2.5 text-[13px] font-semibold hover:bg-[#1DA851] transition-colors mt-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.108-1.128l-.29-.174-2.868.852.852-2.868-.174-.29A8 8 0 1112 20z"/></svg>
                WhatsApp
              </a>
            </div>
          </section>

          {/* Address */}
          <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-[#F3F4F6] px-5 py-4">
              <h2 className="text-[15px] font-semibold text-[#111827]">Address</h2>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div className="text-[14px] text-[#374151] leading-relaxed space-y-1">
                <p className="font-medium text-[#111827]">{customer.fullName}</p>
                <p>{customer.addressLine1}</p>
                {customer.addressLine2 && <p>{customer.addressLine2}</p>}
                <p>{customer.city}, {customer.state} {customer.pincode}</p>
                <p>{customer.country}</p>
                <p className="pt-2 text-[13px] text-[#6B7280] tabular-nums">{customer.phone}</p>
              </div>
              <CopyAddressButton address={[customer.fullName, customer.addressLine1, customer.addressLine2, `${customer.city}, ${customer.state} ${customer.pincode}`, customer.country, customer.phone].filter(Boolean).join("\n")} />
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

      {/* Mobile: Address + Subscription (below tables) */}
      <div className="lg:hidden space-y-4">
        <section className="rounded-xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="border-b border-[#F3F4F6] px-4 py-3">
            <h2 className="text-[14px] font-semibold text-[#111827]">Address</h2>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div className="text-[13px] text-[#374151] leading-relaxed space-y-0.5">
              <p className="font-medium text-[#111827]">{customer.fullName}</p>
              <p>{customer.addressLine1}</p>
              {customer.addressLine2 && <p>{customer.addressLine2}</p>}
              <p>{customer.city}, {customer.state} {customer.pincode}</p>
              <p>{customer.country}</p>
            </div>
            <CopyAddressButton address={[customer.fullName, customer.addressLine1, customer.addressLine2, `${customer.city}, ${customer.state} ${customer.pincode}`, customer.country, customer.phone].filter(Boolean).join("\n")} />
          </div>
        </section>

        {recentInvoice && (
          <section className="rounded-xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-[#F3F4F6] px-4 py-3">
              <h2 className="text-[14px] font-semibold text-[#111827]">Subscription</h2>
            </div>
            <div className="px-4 py-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium">Plan</p>
                <p className="mt-0.5 text-[12px] text-[#111827] font-medium">{recentInvoice.planLabel}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium">Cycle</p>
                <p className="mt-0.5 text-[12px] text-[#111827] font-medium">{recentInvoice.billingCycle}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium">Last Payment</p>
                <p className="mt-0.5 text-[12px] text-[#111827] font-medium">{formatDate(recentInvoice.issuedAt)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium">Sub ID</p>
                <p className="mt-0.5 text-[11px] text-[#111827] font-medium font-mono truncate">{recentInvoice.razorpaySubscriptionId}</p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Activity Timeline */}
      <section className="rounded-xl sm:rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="border-b border-[#F3F4F6] px-4 sm:px-5 py-3 sm:py-4">
          <h2 className="text-[14px] sm:text-[15px] font-semibold text-[#111827]">Activity Timeline</h2>
        </div>
        <div className="px-4 sm:px-5 py-4 sm:py-5">
          <div className="relative pl-5 sm:pl-6 space-y-0">
            {buildTimeline(customer).map((event, i) => (
              <div key={i} className="relative pb-5 sm:pb-6 last:pb-0">
                <div className="absolute left-[-14px] sm:left-[-17px] top-2 bottom-0 w-px bg-[#E5E7EB]" />
                <div className={`absolute left-[-18px] sm:left-[-21px] top-[6px] w-[9px] h-[9px] rounded-full border-2 border-white ${
                  event.type === "payment" ? "bg-[#10B981]"
                    : event.type === "shipped" ? "bg-[#6366F1]"
                    : event.type === "delivered" ? "bg-[#059669]"
                    : event.type === "subscribed" ? "bg-[#8B5CF6]"
                    : event.type === "failed" ? "bg-[#EF4444]"
                    : event.type === "cancelled" ? "bg-[#DC2626]"
                    : "bg-[#9CA3AF]"
                }`} />
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-[12px] sm:text-[13px] font-medium text-[#111827] truncate">{event.title}</p>
                    {event.subtitle && <p className="text-[10px] sm:text-[11px] text-[#6B7280] mt-0.5 truncate">{event.subtitle}</p>}
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#9CA3AF] whitespace-nowrap tabular-nums shrink-0">{formatDate(event.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <article className="rounded-xl sm:rounded-2xl border border-[#E8ECF0] bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">{label}</p>
      <p className="mt-1.5 sm:mt-2 text-[18px] sm:text-[20px] font-bold text-[#111827] tracking-[-0.02em] tabular-nums leading-none">{value}</p>
      <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-[12px] text-[#9CA3AF]">{subtitle}</p>
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

type TimelineEvent = {
  type: "subscribed" | "payment" | "shipped" | "delivered" | "failed" | "cancelled" | "email" | "order";
  title: string;
  subtitle?: string;
  date: Date;
};

function buildTimeline(customer: {
  createdAt: Date;
  invoices: Array<{ issuedAt: Date; planLabel: string; amountPaise: number; currency: string; emailSentAt: Date | null; invoiceNumber: string }>;
  orders: Array<{ createdAt: Date; orderNumber: string; planLabel: string; fulfillmentStatus: string; shippedAt: Date | null; deliveredAt: Date | null }>;
  subscriptions: Array<{ startedAt: Date; planLabel: string; status: string; cancelledAt: Date | null; failedAt: Date | null; failureReason: string | null }>;
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({ type: "subscribed", title: "Customer registered", date: customer.createdAt });

  for (const sub of customer.subscriptions) {
    events.push({ type: "subscribed", title: `Subscribed to ${sub.planLabel}`, date: sub.startedAt });
    if (sub.cancelledAt) {
      events.push({ type: "cancelled", title: `Cancelled ${sub.planLabel}`, date: sub.cancelledAt });
    }
    if (sub.failedAt && sub.failureReason) {
      events.push({ type: "failed", title: "Payment failed", subtitle: sub.failureReason, date: sub.failedAt });
    }
  }

  for (const inv of customer.invoices) {
    events.push({
      type: "payment",
      title: `Payment received — ₹${(inv.amountPaise / 100).toFixed(0)}`,
      subtitle: `${inv.invoiceNumber} · ${inv.planLabel}`,
      date: inv.issuedAt,
    });
    if (inv.emailSentAt) {
      events.push({ type: "email", title: "Invoice emailed", subtitle: inv.invoiceNumber, date: inv.emailSentAt });
    }
  }

  for (const order of customer.orders) {
    if (order.shippedAt) {
      events.push({ type: "shipped", title: `Shipped — ${order.orderNumber}`, date: order.shippedAt });
    }
    if (order.deliveredAt) {
      events.push({ type: "delivered", title: `Delivered — ${order.orderNumber}`, date: order.deliveredAt });
    }
  }

  events.sort((a, b) => b.date.getTime() - a.date.getTime());
  return events;
}
