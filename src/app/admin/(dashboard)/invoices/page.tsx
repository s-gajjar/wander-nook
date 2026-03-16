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
        <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
        <p className="mt-1 text-sm text-slate-600">
          All invoices across every customer. View or resend any invoice individually.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">All Invoices</h2>
          <span className="text-xs text-slate-500">{invoices.length} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                <th className="py-2 pr-4">Invoice</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Issued</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-900">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-slate-500">{invoice.razorpayPaymentId}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-900">{invoice.customer.fullName}</p>
                    <p className="text-xs text-slate-500">{invoice.customer.email}</p>
                  </td>
                  <td className="py-3 pr-4">{invoice.planLabel}</td>
                  <td className="py-3 pr-4">
                    {formatCurrency(invoice.amountPaise, invoice.currency)}
                  </td>
                  <td className="py-3 pr-4">{formatDate(invoice.issuedAt)}</td>
                  <td className="py-3 pr-4">
                    {invoice.emailSentAt ? formatDate(invoice.emailSentAt) : "Not sent"}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/invoice/${invoice.publicToken}`}
                        target="_blank"
                        className="inline-flex rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
