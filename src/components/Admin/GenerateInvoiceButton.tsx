"use client";

import { useState } from "react";

export function GenerateInvoiceButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/generate-invoice`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setResult(`Error: ${data.error}`);
        return;
      }

      if (data.alreadyExists) {
        setResult(`✓ Invoice already exists: ${data.invoiceNumber}`);
      } else {
        setResult(`✓ Invoice created: ${data.invoiceNumber}${data.emailSent ? " (email sent)" : ""}`);
      }
    } catch {
      setResult("Error: Network request failed");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <span className={`text-[10px] sm:text-[11px] font-medium ${result.startsWith("✓") ? "text-[#059669]" : "text-[#DC2626]"}`}>
        {result}
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2 py-1 text-[10px] sm:text-[11px] font-medium text-[#374151] shadow-sm hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all disabled:opacity-50"
    >
      {loading ? (
        <svg className="animate-spin h-3 w-3 text-[#6B7280]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="h-3 w-3 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      {loading ? "Generating…" : "Generate Invoice"}
    </button>
  );
}
