import { prisma } from "@/src/lib/prisma";
import CustomerInvoiceGroup, {
  type CustomerGroupData,
} from "@/src/components/Admin/CustomerInvoiceGroup";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function AdminCustomersPage() {
  const [customers, invoices] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { _count: { select: { invoices: true } } },
    }),
    prisma.invoice.findMany({
      orderBy: { issuedAt: "desc" },
      take: 500,
      include: { customer: true },
    }),
  ]);

  const invoicesByCustomer: CustomerGroupData[] = invoices
    .reduce<
      Array<{
        customerId: string;
        customerName: string;
        customerEmail: string;
        customerPhone: string;
        customerCity: string;
        customerState: string;
        totalAmountPaise: number;
        latestIssuedAt: Date;
        latestCurrency: string;
        invoices: typeof invoices;
      }>
    >((groups, invoice) => {
      const existing = groups.find((g) => g.customerId === invoice.customerId);
      if (!existing) {
        groups.push({
          customerId: invoice.customerId,
          customerName: invoice.customer.fullName,
          customerEmail: invoice.customer.email,
          customerPhone: invoice.customer.phone,
          customerCity: invoice.customer.city,
          customerState: invoice.customer.state,
          totalAmountPaise: invoice.amountPaise,
          latestIssuedAt: invoice.issuedAt,
          latestCurrency: invoice.currency,
          invoices: [invoice],
        });
        return groups;
      }
      existing.invoices.push(invoice);
      existing.totalAmountPaise += invoice.amountPaise;
      if (invoice.issuedAt > existing.latestIssuedAt) {
        existing.latestIssuedAt = invoice.issuedAt;
        existing.latestCurrency = invoice.currency;
      }
      return groups;
    }, [])
    .sort((a, b) => b.latestIssuedAt.getTime() - a.latestIssuedAt.getTime())
    .map((group) => ({
      customerId: group.customerId,
      customerName: group.customerName,
      customerEmail: group.customerEmail,
      customerPhone: group.customerPhone,
      customerCity: `${group.customerCity}, ${group.customerState}`,
      customerState: group.customerState,
      totalAmountPaise: group.totalAmountPaise,
      latestCurrency: group.latestCurrency,
      latestIssuedAt: group.latestIssuedAt.toISOString(),
      invoices: group.invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        publicToken: inv.publicToken,
        planLabel: inv.planLabel,
        billingCycle: inv.billingCycle,
        amountPaise: inv.amountPaise,
        currency: inv.currency,
        status: inv.status,
        issuedAt: inv.issuedAt.toISOString(),
        emailSentAt: inv.emailSentAt?.toISOString() ?? null,
        razorpayPaymentId: inv.razorpayPaymentId,
      })),
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
        <p className="mt-1 text-sm text-slate-600">
          Click a customer to expand their invoice history. View or resend individual invoices.
        </p>
      </div>

      {/* Grouped invoices by customer */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Invoices by Customer</h2>
          <span className="text-xs text-slate-500">{invoicesByCustomer.length} customers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Invoices</th>
                <th className="py-2 pr-4">Total Paid</th>
                <th className="py-2 pr-4">Latest Charged</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoicesByCustomer.map((group) => (
                <CustomerInvoiceGroup key={group.customerId} group={group} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* All customers table */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">All Customers</h2>
          <span className="text-xs text-slate-500">{customers.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">City</th>
                <th className="py-2 pr-4">Invoices</th>
                <th className="py-2 pr-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-900">{c.fullName}</td>
                  <td className="py-3 pr-4">{c.email}</td>
                  <td className="py-3 pr-4">{c.phone}</td>
                  <td className="py-3 pr-4">{c.city}, {c.state}</td>
                  <td className="py-3 pr-4">{c._count.invoices}</td>
                  <td className="py-3 pr-4">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
