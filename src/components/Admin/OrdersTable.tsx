"use client";

import { useState } from "react";
import OrderDrawer from "@/src/components/Admin/OrderDrawer";

type OrderRow = {
  id: string;
  orderNumber: string;
  planLabel: string;
  amountPaise: number;
  currency: string;
  status: string;
  paymentMethod: string;
  fulfillmentStatus: string;
  createdAt: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
};

type Props = {
  orders: OrderRow[];
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

export default function OrdersTable({ orders }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E8ECF0] bg-white p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <p className="text-[14px] text-[#6B7280]">No orders match your filters.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <section className="hidden md:block rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
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
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedId(order.id)}
                  className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5 font-medium text-[#111827] whitespace-nowrap">
                    {order.orderNumber}
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
                    <MethodBadge method={order.paymentMethod} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <FulfillmentBadge status={order.fulfillmentStatus} />
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

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => (
          <button
            key={order.id}
            onClick={() => setSelectedId(order.id)}
            className="w-full text-left rounded-xl border border-[#E8ECF0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#D1D5DB] active:bg-[#F9FAFB] transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#111827] truncate">{order.orderNumber}</p>
                <p className="text-[12px] text-[#6B7280] mt-0.5 truncate">{order.customer.fullName}</p>
              </div>
              <p className="text-[14px] font-bold text-[#111827] tabular-nums shrink-0">
                {formatCurrency(order.amountPaise, order.currency)}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <StatusBadge status={order.status} />
              <MethodBadge method={order.paymentMethod} />
              <FulfillmentBadge status={order.fulfillmentStatus} />
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F3F4F6]">
              <p className="text-[11px] text-[#9CA3AF]">{order.planLabel}</p>
              <p className="text-[11px] text-[#9CA3AF]">{formatDate(order.createdAt)}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Drawer */}
      <OrderDrawer orderId={selectedId} onClose={() => setSelectedId(null)} />
    </>
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
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium border ${styles}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "paid"
      ? "bg-[#ECFDF5] text-[#059669]"
      : status === "failed"
        ? "bg-[#FEF2F2] text-[#DC2626]"
        : "bg-[#FEF3C7] text-[#D97706]";
  const dotColor = status === "paid" ? "bg-[#10B981]" : status === "failed" ? "bg-[#EF4444]" : "bg-[#F59E0B]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
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
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium border ${styles}`}>
      {status}
    </span>
  );
}
