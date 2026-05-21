"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  currentStatus: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
};

const STATUSES = ["unfulfilled", "fulfilled", "shipped", "delivered"] as const;

export default function FulfillmentActions({ orderId, currentStatus, trackingNumber, trackingUrl }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tracking, setTracking] = useState(trackingNumber || "");
  const [trackUrl, setTrackUrl] = useState(trackingUrl || "");

  const currentIdx = STATUSES.indexOf(currentStatus as typeof STATUSES[number]);
  const nextStatus = currentIdx < STATUSES.length - 1 ? STATUSES[currentIdx + 1] : null;

  async function updateFulfillment(newStatus: string) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/fulfillment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillmentStatus: newStatus,
          trackingNumber: tracking || undefined,
          trackingUrl: trackUrl || undefined,
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Update failed");
      setMessage(`Updated to "${newStatus}"`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="border-b border-[#F3F4F6] px-6 py-4">
        <h2 className="text-[15px] font-semibold text-[#111827]">Fulfillment</h2>
      </div>
      <div className="px-6 py-5 space-y-4">
        {/* Progress bar */}
        <div className="flex items-center gap-1">
          {STATUSES.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`h-1.5 w-full rounded-full ${i <= currentIdx ? "bg-[#6366F1]" : "bg-[#E5E7EB]"}`} />
              <span className={`text-[10px] font-medium ${i <= currentIdx ? "text-[#4F46E5]" : "text-[#9CA3AF]"}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            </div>
          ))}
        </div>

        {/* Tracking inputs */}
        {(currentStatus === "fulfilled" || currentStatus === "shipped") && (
          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            <div>
              <label className="text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium">Tracking Number</label>
              <input
                type="text"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="e.g. DTDC12345"
                className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#111827] placeholder:text-[#D1D5DB] focus:border-[#6366F1] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/10 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium">Tracking URL</label>
              <input
                type="url"
                value={trackUrl}
                onChange={(e) => setTrackUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#111827] placeholder:text-[#D1D5DB] focus:border-[#6366F1] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/10 transition-all"
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          {nextStatus && (
            <button
              type="button"
              disabled={loading}
              onClick={() => updateFulfillment(nextStatus)}
              className="rounded-lg bg-[#111827] px-4 py-2.5 text-[13px] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:bg-[#1F2937] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : `Mark as ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}`}
            </button>
          )}
          {currentStatus === "delivered" && (
            <span className="text-[13px] font-medium text-[#059669]">Order fully delivered</span>
          )}
          {message && <span className="text-[12px] text-[#6B7280]">{message}</span>}
        </div>
      </div>
    </section>
  );
}
