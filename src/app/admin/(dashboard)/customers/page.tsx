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
        <h1 className="text-[26px] font-semibold text-[#111827] tracking-[-0.02em]">Customers</h1>
        <p className="mt-1 text-[14px] text-[#6B7280]">
          Click a customer to expand their invoice history. View or resend individual invoices.
        </p>
      </div>

      {/* Grouped invoices by customer */}
      <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#111827]">Invoices by Customer</h2>
          <span className="text-[12px] font-medium text-[#9CA3AF] bg-[#F3F4F6] rounded-full px-2.5 py-1">{invoicesByCustomer.length} customers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
                <th className="px-5 py-2.5 font-medium">Customer</th>
                <th className="px-5 py-2.5 font-medium">Invoices</th>
                <th className="px-5 py-2.5 font-medium">Total Paid</th>
                <th className="px-5 py-2.5 font-medium">Latest Charged</th>
                <th className="px-5 py-2.5 font-medium">Actions</th>
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
      <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#111827]">All Customers</h2>
          <span className="text-[12px] font-medium text-[#9CA3AF] bg-[#F3F4F6] rounded-full px-2.5 py-1">{customers.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
                <th className="px-5 py-2.5 font-medium">Name</th>
                <th className="px-5 py-2.5 font-medium">Email</th>
                <th className="px-5 py-2.5 font-medium">Phone</th>
                <th className="px-5 py-2.5 font-medium">City</th>
                <th className="px-5 py-2.5 font-medium">Invoices</th>
                <th className="px-5 py-2.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[#111827]">{c.fullName}</td>
                  <td className="px-5 py-3.5 text-[#6B7280]">{c.email}</td>
                  <td className="px-5 py-3.5 text-[#6B7280] tabular-nums">{c.phone}</td>
                  <td className="px-5 py-3.5 text-[#6B7280]">{c.city}, {c.state}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex rounded-full bg-[#EEF2FF] text-[#4F46E5] px-2 py-0.5 text-[11px] font-medium">
                      {c._count.invoices}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#9CA3AF]">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
