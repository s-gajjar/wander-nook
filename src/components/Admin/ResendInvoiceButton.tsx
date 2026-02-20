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
        setMessage("Email sent");
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
        className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending..." : "Resend Email"}
      </button>
      {message ? <span className="text-xs text-slate-500">{message}</span> : null}
    </div>
  );
}
