"use client";

import { useState, useEffect, useCallback } from "react";
import FulfillmentActions from "@/src/components/Admin/FulfillmentActions";

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

type Customer = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

type Order = {
  id: string;
  orderNumber: string;
  planId: string;
  planLabel: string;
  amountPaise: number;
  currency: string;
  status: string;
  paymentMethod: string;
  fulfillmentStatus: string;
  razorpayPaymentId: string;
  razorpayOrderId: string | null;
  razorpaySubscriptionId: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  notes: string | null;
  shippingAddress: ShippingAddress | null;
  createdAt: string;
  fulfilledAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  customer: Customer;
};

type Props = {
  orderId: string | null;
  onClose: () => void;
};

function formatCurrency(paise: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function OrderDrawer({ orderId, onClose }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      if (!res.ok) throw new Error("Failed to load order");
      const data = (await res.json()) as { order: Order };
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    } else {
      setOrder(null);
    }
  }, [orderId, fetchOrder]);

  // Close on escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (orderId) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [orderId, onClose]);

  if (!orderId) return null;

  const address = order?.shippingAddress;
  const shippingLine1 = address?.line1 || address?.addressLine1 || order?.customer.addressLine1 || "";
  const shippingLine2 = address?.line2 || address?.addressLine2 || order?.customer.addressLine2 || "";
  const shippingCity = address?.city || order?.customer.city || "";
  const shippingState = address?.state || order?.customer.state || "";
  const shippingPincode = address?.pincode || order?.customer.pincode || "";
  const shippingCountry = address?.country || order?.customer.country || "";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[540px] bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.08)] overflow-y-auto animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label="Order details"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8ECF0] bg-white/95 backdrop-blur-sm px-5 py-4">
          <div className="min-w-0">
            {order && (
              <>
                <h2 className="text-[18px] font-semibold text-[#111827] tracking-[-0.02em] truncate">
                  {order.orderNumber}
                </h2>
                <p className="text-[12px] text-[#6B7280] mt-0.5">{formatDate(order.createdAt)}</p>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors shrink-0"
            aria-label="Close drawer"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-4 text-[13px] text-[#DC2626]">
              {error}
            </div>
          )}

          {order && !loading && (
            <>
              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={order.status} />
                <MethodBadge method={order.paymentMethod} />
                <FulfillmentBadge status={order.fulfillmentStatus} />
              </div>

              {/* Order summary */}
              <Section title="Order Summary">
                <div className="flex items-center justify-between py-3 border-b border-[#F9FAFB]">
                  <div>
                    <p className="font-medium text-[#111827] text-[14px]">{order.planLabel}</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">Plan ID: {order.planId}</p>
                  </div>
                  <p className="font-semibold text-[#111827] text-[16px] tabular-nums">
                    {formatCurrency(order.amountPaise, order.currency)}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <p className="font-semibold text-[#111827] text-[14px]">Total</p>
                  <p className="font-bold text-[#111827] text-[18px] tabular-nums">
                    {formatCurrency(order.amountPaise, order.currency)}
                  </p>
                </div>
              </Section>

              {/* Fulfillment */}
              <FulfillmentActions
                orderId={order.id}
                currentStatus={order.fulfillmentStatus}
                trackingNumber={order.trackingNumber}
                trackingUrl={order.trackingUrl}
              />

              {/* Customer */}
              <Section title="Customer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white text-[13px] font-semibold shrink-0">
                    {order.customer.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#111827] text-[14px] truncate">{order.customer.fullName}</p>
                    <p className="text-[12px] text-[#9CA3AF] truncate">{order.customer.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F3F4F6]">
                  <DetailItem label="Phone" value={order.customer.phone} />
                  <DetailItem label="Email" value={order.customer.email} />
                </div>
              </Section>

              {/* Shipping address */}
              <Section title="Shipping Address">
                <div className="text-[13px] text-[#374151] leading-relaxed space-y-0.5">
                  <p className="font-medium text-[#111827]">{order.customer.fullName}</p>
                  <p>{shippingLine1}</p>
                  {shippingLine2 && <p>{shippingLine2}</p>}
                  <p>{shippingCity}, {shippingState} {shippingPincode}</p>
                  <p>{shippingCountry}</p>
                </div>
              </Section>

              {/* Payment details */}
              <Section title="Payment Details">
                <div className="space-y-3">
                  <DetailItem label="Payment ID" value={order.razorpayPaymentId} mono />
                  {order.razorpayOrderId && <DetailItem label="Razorpay Order ID" value={order.razorpayOrderId} mono />}
                  {order.razorpaySubscriptionId && <DetailItem label="Subscription ID" value={order.razorpaySubscriptionId} mono />}
                  <DetailItem label="Currency" value={order.currency} />
                  <DetailItem label="Created" value={formatDate(order.createdAt)} />
                  {order.fulfilledAt && <DetailItem label="Fulfilled" value={formatDate(order.fulfilledAt)} />}
                  {order.shippedAt && <DetailItem label="Shipped" value={formatDate(order.shippedAt)} />}
                  {order.deliveredAt && <DetailItem label="Delivered" value={formatDate(order.deliveredAt)} />}
                  {order.trackingNumber && <DetailItem label="Tracking #" value={order.trackingNumber} mono />}
                  {order.trackingUrl && (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium">Tracking URL</p>
                      <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-0.5 text-[13px] text-[#4F46E5] hover:underline break-all">
                        {order.trackingUrl}
                      </a>
                    </div>
                  )}
                </div>
              </Section>

              {/* Notes */}
              {order.notes && (
                <Section title="Notes">
                  <p className="text-[13px] text-[#374151] leading-relaxed">{order.notes}</p>
                </Section>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#E8ECF0] bg-white overflow-hidden">
      <div className="border-b border-[#F3F4F6] px-4 py-3">
        <h3 className="text-[13px] font-semibold text-[#111827]">{title}</h3>
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium">{label}</p>
      <p className={`mt-0.5 text-[13px] text-[#111827] font-medium break-all ${mono ? "font-mono text-[12px]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "paid"
      ? "bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]"
      : status === "failed"
        ? "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
        : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]";
  const dotColor = status === "paid" ? "bg-[#10B981]" : status === "failed" ? "bg-[#EF4444]" : "bg-[#F59E0B]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  const styles =
    method === "razorpay-onetime"
      ? "bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]"
      : method === "razorpay-autopay"
        ? "bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]"
        : "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]";
  const label =
    method === "razorpay-onetime" ? "One-time" : method === "razorpay-autopay" ? "Autopay" : "Legacy";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium border ${styles}`}>
      {label}
    </span>
  );
}

function FulfillmentBadge({ status }: { status: string }) {
  const styles =
    status === "delivered"
      ? "bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]"
      : status === "shipped"
        ? "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]"
        : status === "fulfilled"
          ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
          : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium border ${styles}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
