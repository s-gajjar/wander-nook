import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { formatCurrency } from "@/src/lib/invoice-template";
import FulfillmentActions from "@/src/components/Admin/FulfillmentActions";
import CopyAddressButton from "@/src/components/Admin/CopyAddressButton";

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
            <div className="px-5 py-5 space-y-4">
              <div className="text-[14px] text-[#374151] leading-relaxed space-y-1">
                <p className="font-medium text-[#111827]">{order.customer.fullName}</p>
                <p>{shippingLine1}</p>
                {shippingLine2 && <p>{shippingLine2}</p>}
                <p>{shippingCity}, {shippingState} {shippingPincode}</p>
                <p>{shippingCountry}</p>
                <p className="pt-2 text-[13px] text-[#6B7280] tabular-nums">{shippingPhone}</p>
              </div>
              <CopyAddressButton address={[order.customer.fullName, shippingLine1, shippingLine2, `${shippingCity}, ${shippingState} ${shippingPincode}`, shippingCountry, shippingPhone].filter(Boolean).join("\n")} />
              <a
                href={`https://wa.me/91${order.customer.phone.replace(/\D/g, "").replace(/^91/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#25D366] text-white px-4 py-2.5 text-[13px] font-semibold hover:bg-[#1DA851] transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.108-1.128l-.29-.174-2.868.852.852-2.868-.174-.29A8 8 0 1112 20z"/></svg>
                WhatsApp Customer
              </a>
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
