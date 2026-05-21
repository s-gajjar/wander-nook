import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { formatCurrency } from "@/src/lib/invoice-template";
import ResendInvoiceButton from "@/src/components/Admin/ResendInvoiceButton";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const invoices = await prisma.invoice.findMany({
    orderBy: { issuedAt: "desc" },
    take: 300,
    include: { customer: true },
  });

  const filtered = q
    ? invoices.filter((inv) => {
        const search = q.toLowerCase();
        return (
          inv.invoiceNumber.toLowerCase().includes(search) ||
          inv.customer.fullName.toLowerCase().includes(search) ||
          inv.customer.email.toLowerCase().includes(search) ||
          inv.razorpayPaymentId.toLowerCase().includes(search)
        );
      })
    : invoices;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#111827] tracking-[-0.02em]">Invoices</h1>
          <p className="mt-1 text-[14px] text-[#6B7280]">
            {filtered.length} invoice{filtered.length !== 1 ? "s" : ""} · View or resend any invoice.
          </p>
        </div>
        <Link
          href="/api/admin/export/invoices"
          className="rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          Export CSV
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="max-w-md">
        <input
          type="search"
          name="q"
          defaultValue={q || ""}
          placeholder="Search invoices, customers, payment IDs..."
          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#6366F1] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/10 transition-all"
        />
      </form>

      <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
                <th className="px-5 py-2.5 font-medium">Invoice</th>
                <th className="px-5 py-2.5 font-medium">Customer</th>
                <th className="px-5 py-2.5 font-medium">Plan</th>
                <th className="px-5 py-2.5 font-medium text-right">Amount</th>
                <th className="px-5 py-2.5 font-medium">Issued</th>
                <th className="px-5 py-2.5 font-medium">Email</th>
                <th className="px-5 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr key={invoice.id} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors align-top">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[#111827]">{invoice.invoiceNumber}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5 font-mono">{invoice.razorpayPaymentId}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/customers/${invoice.customerId}`} className="font-medium text-[#111827] hover:text-[#4F46E5] transition-colors">
                      {invoice.customer.fullName}
                    </Link>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">{invoice.customer.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-[#374151]">{invoice.planLabel}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-[#111827] tabular-nums">{formatCurrency(invoice.amountPaise, invoice.currency)}</td>
                  <td className="px-5 py-3.5 text-[#6B7280]">{formatDate(invoice.issuedAt)}</td>
                  <td className="px-5 py-3.5">
                    {invoice.emailSentAt ? (
                      <span className="inline-flex items-center gap-1 text-[#059669] text-[11px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                        {formatDate(invoice.emailSentAt)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#9CA3AF]">Not sent</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/invoice/${invoice.publicToken}`} target="_blank"
                        className="inline-flex rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        View
                      </Link>
                      <ResendInvoiceButton invoiceId={invoice.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
