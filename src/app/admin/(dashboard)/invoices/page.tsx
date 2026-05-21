import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { formatCurrency } from "@/src/lib/invoice-template";
import ResendInvoiceButton from "@/src/components/Admin/ResendInvoiceButton";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function AdminInvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { issuedAt: "desc" },
    take: 200,
    include: { customer: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold text-[#111827] tracking-[-0.02em]">Invoices</h1>
        <p className="mt-1 text-[14px] text-[#6B7280]">
          All invoices across every customer. View or resend any invoice individually.
        </p>
      </div>

      <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#111827]">All Invoices</h2>
          <span className="text-[12px] font-medium text-[#9CA3AF] bg-[#F3F4F6] rounded-full px-2.5 py-1">{invoices.length} total</span>
        </div>

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
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors align-top">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[#111827]">{invoice.invoiceNumber}</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5 font-mono">{invoice.razorpayPaymentId}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[#111827]">{invoice.customer.fullName}</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">{invoice.customer.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-[#374151]">
                      {invoice.planLabel}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-[#111827] tabular-nums">
                    {formatCurrency(invoice.amountPaise, invoice.currency)}
                  </td>
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
                      <Link
                        href={`/invoice/${invoice.publicToken}`}
                        target="_blank"
                        className="inline-flex rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                      >
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
