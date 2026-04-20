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
    .filter((entry) => entry.paymentId && entry.subscriptionId);
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
      setMessage("Paste at least one line containing both a pay_... and sub_... id.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/autopay/replay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-slate-900">Replay Razorpay Payments</h2>
        <p className="mt-1 text-sm text-slate-600">
          Paste one line per payment using any format that contains both `pay_...` and `sub_...`.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder={"pay_ABC123 sub_DEF456\npay_XYZ789, sub_QWE987"}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Replaying..." : "Replay Payments"}
          </button>
          {message ? <span className="text-sm text-slate-600">{message}</span> : null}
        </div>
      </form>

      {results.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                <th className="py-2 pr-4">Payment</th>
                <th className="py-2 pr-4">Subscription</th>
                <th className="py-2 pr-4">Result</th>
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={`${result.paymentId}:${result.subscriptionId}`} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-mono text-xs text-slate-700">{result.paymentId}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-700">{result.subscriptionId}</td>
                  <td className={`py-3 pr-4 ${result.ok ? "text-emerald-700" : "text-rose-700"}`}>
                    {result.error
                      ? result.error
                      : result.orderStatus === "payment_not_captured"
                        ? `Skipped: ${result.paymentStatus || "not captured"}`
                        : "OK"}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">{result.orderName || result.orderStatus || "-"}</td>
                  <td className="py-3 pr-4 text-slate-700">
                    {result.invoiceNumber
                      ? `${result.invoiceNumber}${result.invoiceCreated ? " (new)" : ""}`
                      : result.invoiceEmailSkippedReason || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
