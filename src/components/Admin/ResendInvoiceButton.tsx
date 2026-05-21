"use client";

import { useState } from "react";

type ResendInvoiceButtonProps = {
  invoiceId: string;
};

export default function ResendInvoiceButton({ invoiceId }: ResendInvoiceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/send`, {
        method: "POST",
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; emailSent?: boolean; emailSkippedReason?: string }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to resend invoice email.");
      }

      if (data.emailSent) {
        setMessage("Sent");
      } else {
        setMessage(`Skipped: ${data.emailSkippedReason || "provider not configured"}`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to resend invoice email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={onClick}
        className="rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Sending..." : "Resend"}
      </button>
      {message && (
        <span className={`text-[11px] font-medium ${message === "Sent" ? "text-[#059669]" : "text-[#9CA3AF]"}`}>
          {message}
        </span>
      )}
    </div>
  );
}
