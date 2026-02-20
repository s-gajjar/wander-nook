import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoiceByPublicToken } from "@/src/lib/invoice-service";
import { formatCurrency } from "@/src/lib/invoice-template";

export const dynamic = "force-dynamic";

type InvoicePageProps = {
  params: Promise<{ token: string }>;
};

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { token } = await params;
  const invoice = await getInvoiceByPublicToken(token);

  if (!invoice) {
    notFound();
  }

  const printHref = `/invoice/${invoice.publicToken}/print`;
  const pdfHref = `/invoice/${invoice.publicToken}/pdf`;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Invoice {invoice.invoiceNumber}</h1>
              <p className="mt-1 text-sm text-slate-600">
                Issued on {formatDate(invoice.issuedAt)} · {invoice.planLabel}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={pdfHref}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800"
                target="_blank"
              >
                Open PDF
              </Link>
              <Link
                href={printHref}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800"
                target="_blank"
              >
                Open Printable Invoice
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Billing Details
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-900">{invoice.customer.fullName}</p>
              <p className="text-sm text-slate-700">{invoice.customer.email}</p>
              <p className="text-sm text-slate-700">{invoice.customer.phone}</p>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Payment Details
              </h2>
              <p className="mt-2 text-sm text-slate-700">Payment ID: {invoice.razorpayPaymentId}</p>
              <p className="text-sm text-slate-700">Subscription ID: {invoice.razorpaySubscriptionId}</p>
              <p className="text-sm text-slate-700">
                Amount: {formatCurrency(invoice.amountPaise, invoice.currency)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <iframe
            title={`Invoice ${invoice.invoiceNumber}`}
            src={pdfHref}
            className="h-[1200px] w-full rounded-xl"
          />
        </section>
      </div>
    </main>
  );
}
