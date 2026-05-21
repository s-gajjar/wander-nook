"use client";

import { useState } from "react";

type ReplayResult = {
  paymentId: string;
  subscriptionId: string;
  ok: boolean;
  orderStatus?: string;
  paymentStatus?: string;
  orderName?: string;
  invoiceNumber?: string;
  invoiceCreated?: boolean;
  invoiceEmailSent?: boolean;
  invoiceEmailSkippedReason?: string;
  error?: string;
};

function parseEntries(input: string) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const paymentId = line.match(/pay_[A-Za-z0-9]+/i)?.[0] || "";
      const subscriptionId = line.match(/sub_[A-Za-z0-9]+/i)?.[0] || "";
      return { paymentId, subscriptionId };
    })
    .filter((entry) => entry.paymentId);
}

export default function ReplayAutopayForm() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ReplayResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setResults([]);

    const entries = parseEntries(value);
    if (entries.length === 0) {
      setMessage("Paste at least one line containing a pay_... id. sub_... is optional.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/autopay/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; results?: ReplayResult[] }
        | null;

      if (!response.ok || !data?.ok || !Array.isArray(data.results)) {
        throw new Error(data?.error || "Replay failed.");
      }

      setResults(data.results);
      setMessage(`Processed ${data.results.length} entr${data.results.length === 1 ? "y" : "ies"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Replay failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="border-b border-[#F3F4F6] px-6 py-4">
        <h2 className="text-[15px] font-semibold text-[#111827]">Replay Razorpay Payments</h2>
        <p className="mt-1 text-[12px] text-[#9CA3AF] leading-relaxed">
          Paste one line per payment using any format that contains <code className="rounded bg-[#F3F4F6] px-1 py-0.5 text-[11px] font-mono">pay_...</code>. 
          If you also have <code className="rounded bg-[#F3F4F6] px-1 py-0.5 text-[11px] font-mono">sub_...</code>, include it.
        </p>
      </div>

      <div className="px-6 py-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={5}
            className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-[13px] text-[#111827] font-mono placeholder:text-[#9CA3AF] focus:border-[#6366F1] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/10 transition-all"
            placeholder={"pay_ABC123\npay_XYZ789 sub_QWE987"}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#111827] px-4 py-2.5 text-[13px] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:bg-[#1F2937] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Replaying..." : "Replay Payments"}
            </button>
            {message && <span className="text-[12px] text-[#6B7280]">{message}</span>}
          </div>
        </form>

        {results.length > 0 && (
          <div className="mt-5 overflow-x-auto rounded-xl border border-[#E8ECF0]">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
                  <th className="px-4 py-2.5 font-medium">Payment</th>
                  <th className="px-4 py-2.5 font-medium">Subscription</th>
                  <th className="px-4 py-2.5 font-medium">Result</th>
                  <th className="px-4 py-2.5 font-medium">Order</th>
                  <th className="px-4 py-2.5 font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={`${result.paymentId}:${result.subscriptionId}`} className="border-b border-[#F9FAFB] last:border-0">
                    <td className="px-4 py-3 font-mono text-[11px] text-[#374151]">{result.paymentId}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#374151]">{result.subscriptionId || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${result.ok ? "text-[#059669]" : "text-[#DC2626]"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${result.ok ? "bg-[#10B981]" : "bg-[#EF4444]"}`}></span>
                        {result.error
                          ? result.error.slice(0, 40)
                          : result.orderStatus === "payment_not_captured"
                            ? `Skipped: ${result.paymentStatus || "not captured"}`
                            : "OK"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#374151]">{result.orderName || result.orderStatus || "-"}</td>
                    <td className="px-4 py-3 text-[#374151]">
                      {result.invoiceNumber
                        ? `${result.invoiceNumber}${result.invoiceCreated ? " (new)" : ""}`
                        : result.invoiceEmailSkippedReason || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
