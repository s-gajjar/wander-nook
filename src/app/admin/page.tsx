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

export default async function AdminDashboardPage() {
  const [customers, invoices, revenue, conversionEvents, subscribers] = await Promise.all([
    prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      include: {
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    }),
    prisma.invoice.findMany({
      orderBy: {
        issuedAt: "desc",
      },
      take: 100,
      include: {
        customer: true,
      },
    }),
    prisma.invoice.aggregate({
      _sum: {
        amountPaise: true,
      },
    }),
    prisma.conversionEvent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    }),
    prisma.newsletterSubscriber.findMany({
      where: {
        status: "active",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage customer billing data, invoices, and subscriptions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/blog/new"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                New Blog Post
              </Link>
              <form action="/api/admin/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
              Customers
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{customers.length}</p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
              Invoices
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{invoices.length}</p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
              Revenue (tracked)
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(revenue._sum.amountPaise || 0, "INR")}
            </p>
          </article>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Newsletter Subscribers</h2>
            <span className="text-xs text-slate-500">Active {subscribers.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-900">{subscriber.email}</td>
                    <td className="py-3 pr-4">{subscriber.name || "-"}</td>
                    <td className="py-3 pr-4">{subscriber.source || "-"}</td>
                    <td className="py-3 pr-4">{formatDate(subscriber.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Recent Invoices</h2>
            <span className="text-xs text-slate-500">Latest {invoices.length}</span>
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
                    <td className="py-3 pr-4">{formatCurrency(invoice.amountPaise, invoice.currency)}</td>
                    <td className="py-3 pr-4">{formatDate(invoice.issuedAt)}</td>
                    <td className="py-3 pr-4">
                      {invoice.emailSentAt ? formatDate(invoice.emailSentAt) : "Not sent"}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="space-y-2">
                        <Link
                          href={`/invoice/${invoice.publicToken}`}
                          target="_blank"
                          className="inline-flex rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700"
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

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Customers</h2>
            <span className="text-xs text-slate-500">Latest {customers.length}</span>
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
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-900">{customer.fullName}</td>
                    <td className="py-3 pr-4">{customer.email}</td>
                    <td className="py-3 pr-4">{customer.phone}</td>
                    <td className="py-3 pr-4">
                      {customer.city}, {customer.state}
                    </td>
                    <td className="py-3 pr-4">{customer._count.invoices}</td>
                    <td className="py-3 pr-4">{formatDate(customer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Conversion Funnel Events</h2>
            <span className="text-xs text-slate-500">Latest {conversionEvents.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Payment</th>
                  <th className="py-2 pr-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {conversionEvents.map((event) => (
                  <tr key={event.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-900">{event.eventName}</td>
                    <td className="py-3 pr-4">{event.customerEmail || "-"}</td>
                    <td className="py-3 pr-4">{event.planId || "-"}</td>
                    <td className="py-3 pr-4">{event.razorpayPaymentId || "-"}</td>
                    <td className="py-3 pr-4">{formatDate(event.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
