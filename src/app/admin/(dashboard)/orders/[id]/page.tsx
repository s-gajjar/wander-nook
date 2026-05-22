import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { formatCurrency } from "@/src/lib/invoice-template";
import FulfillmentActions from "@/src/components/Admin/FulfillmentActions";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(value);
}

type ShippingAddress = {
  line1?: string;
  line2?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  phone?: string;
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!order) notFound();

  const address = order.shippingAddress as ShippingAddress | null;
  const shippingLine1 = address?.line1 || address?.addressLine1 || order.customer.addressLine1;
  const shippingLine2 = address?.line2 || address?.addressLine2 || order.customer.addressLine2;
  const shippingCity = address?.city || order.customer.city;
  const shippingState = address?.state || order.customer.state;
  const shippingPincode = address?.pincode || order.customer.pincode;
  const shippingCountry = address?.country || order.customer.country;
  const shippingPhone = address?.phone || order.customer.phone;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link href="/admin/orders" className="text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors">
            ← Orders
          </Link>
          <h1 className="mt-2 text-[26px] font-semibold text-[#111827] tracking-[-0.02em]">{order.orderNumber}</h1>
          <p className="mt-1 text-[14px] text-[#6B7280]">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold border ${
            order.status === "paid" ? "bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]"
              : order.status === "failed" ? "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
              : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
          }`}>
            <span className={`w-2 h-2 rounded-full ${order.status === "paid" ? "bg-[#10B981]" : order.status === "failed" ? "bg-[#EF4444]" : "bg-[#F59E0B]"}`}></span>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
          <span className={`inline-flex rounded-full px-3 py-1.5 text-[12px] font-medium border ${
            order.paymentMethod === "razorpay-onetime" ? "bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]"
              : order.paymentMethod === "razorpay-autopay" ? "bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]"
              : "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]"
          }`}>
            {order.paymentMethod === "razorpay-onetime" ? "One-time Payment"
              : order.paymentMethod === "razorpay-autopay" ? "Autopay"
              : "Legacy Checkout"}
          </span>
          <span className={`inline-flex rounded-full px-3 py-1.5 text-[12px] font-medium border ${
            order.fulfillmentStatus === "delivered" ? "bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]"
              : order.fulfillmentStatus === "shipped" ? "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]"
              : order.fulfillmentStatus === "fulfilled" ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
              : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
          }`}>
            {order.fulfillmentStatus.charAt(0).toUpperCase() + order.fulfillmentStatus.slice(1)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order summary */}
          <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-[#F3F4F6] px-6 py-4">
              <h2 className="text-[15px] font-semibold text-[#111827]">Order Summary</h2>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between py-3 border-b border-[#F9FAFB]">
                <div>
                  <p className="font-medium text-[#111827] text-[14px]">{order.planLabel}</p>
                  <p className="text-[12px] text-[#9CA3AF] mt-0.5">Plan ID: {order.planId}</p>
                </div>
                <p className="font-semibold text-[#111827] text-[16px] tabular-nums">{formatCurrency(order.amountPaise, order.currency)}</p>
              </div>
              <div className="flex items-center justify-between pt-4">
                <p className="font-semibold text-[#111827] text-[14px]">Total</p>
                <p className="font-bold text-[#111827] text-[18px] tabular-nums">{formatCurrency(order.amountPaise, order.currency)}</p>
              </div>
            </div>
          </section>

          {/* Fulfillment management */}
          <FulfillmentActions
            orderId={order.id}
            currentStatus={order.fulfillmentStatus}
            trackingNumber={order.trackingNumber}
            trackingUrl={order.trackingUrl}
          />

          {/* Payment details */}
          <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-[#F3F4F6] px-6 py-4">
              <h2 className="text-[15px] font-semibold text-[#111827]">Payment Details</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <DetailRow label="Payment ID" value={order.razorpayPaymentId} mono />
              {order.razorpayOrderId && <DetailRow label="Razorpay Order ID" value={order.razorpayOrderId} mono />}
              {order.razorpaySubscriptionId && <DetailRow label="Subscription ID" value={order.razorpaySubscriptionId} mono />}
              <DetailRow label="Payment Method" value={
                order.paymentMethod === "razorpay-onetime" ? "Razorpay One-time"
                  : order.paymentMethod === "razorpay-autopay" ? "Razorpay Autopay"
                  : "Legacy Checkout"
              } />
              <DetailRow label="Currency" value={order.currency} />
              <DetailRow label="Created" value={formatDate(order.createdAt)} />
              {order.fulfilledAt && <DetailRow label="Fulfilled" value={formatDate(order.fulfilledAt)} />}
              {order.shippedAt && <DetailRow label="Shipped" value={formatDate(order.shippedAt)} />}
              {order.deliveredAt && <DetailRow label="Delivered" value={formatDate(order.deliveredAt)} />}
              {order.trackingNumber && <DetailRow label="Tracking" value={order.trackingNumber} mono />}
            </div>
          </section>

          {/* Notes */}
          {order.notes && (
            <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="border-b border-[#F3F4F6] px-6 py-4">
                <h2 className="text-[15px] font-semibold text-[#111827]">Notes</h2>
              </div>
              <div className="px-6 py-5">
                <p className="text-[14px] text-[#374151] leading-relaxed">{order.notes}</p>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-[#F3F4F6] px-5 py-4">
              <h2 className="text-[15px] font-semibold text-[#111827]">Customer</h2>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white text-[14px] font-semibold">
                  {order.customer.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <Link href={`/admin/customers/${order.customer.id}`} className="font-semibold text-[#111827] text-[14px] hover:text-[#4F46E5] transition-colors">
                    {order.customer.fullName}
                  </Link>
                  <p className="text-[12px] text-[#9CA3AF]">{order.customer.email}</p>
                </div>
              </div>
              <div className="space-y-3 pt-3 border-t border-[#F3F4F6]">
                <SidebarRow label="Phone" value={order.customer.phone} />
                <SidebarRow label="Email" value={order.customer.email} />
              </div>
            </div>
          </section>

          {/* Shipping address */}
          <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-[#F3F4F6] px-5 py-4">
              <h2 className="text-[15px] font-semibold text-[#111827]">Shipping Address</h2>
            </div>
            <div className="px-5 py-5 text-[14px] text-[#374151] leading-relaxed space-y-1">
              <p className="font-medium text-[#111827]">{order.customer.fullName}</p>
              <p>{shippingLine1}</p>
              {shippingLine2 && <p>{shippingLine2}</p>}
              <p>{shippingCity}, {shippingState} {shippingPincode}</p>
              <p>{shippingCountry}</p>
              <p className="pt-2 text-[13px] text-[#6B7280] tabular-nums">{shippingPhone}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-[13px] text-[#6B7280] shrink-0">{label}</p>
      <p className={`text-[13px] text-[#111827] font-medium text-right break-all ${mono ? "font-mono text-[12px]" : ""}`}>{value}</p>
    </div>
  );
}

function SidebarRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium">{label}</p>
      <p className="mt-0.5 text-[13px] text-[#111827] font-medium break-all">{value}</p>
    </div>
  );
}
