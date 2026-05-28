import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";
import Pagination from "@/src/components/Admin/Pagination";

export const dynamic = "force-dynamic";

const PER_PAGE = 25;

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageStr } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10) || 1);

  const where: Prisma.CustomerWhereInput = {};
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }

  const [customers, totalCount] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { invoices: true, orders: true } } },
      skip: (currentPage - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.customer.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold text-[#111827] tracking-[-0.02em]">Customers</h1>
          <p className="mt-1 text-[13px] sm:text-[14px] text-[#6B7280]">
            {totalCount} customer{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <a
          href="/api/admin/export/customers"
          className="self-start sm:self-auto rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          Export CSV
        </a>
      </div>

      {/* Search */}
      <form method="GET" className="w-full sm:max-w-md">
        <input
          type="search"
          name="q"
          defaultValue={q || ""}
          placeholder="Search by name, email, phone, city..."
          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#6366F1] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/10 transition-all"
        />
      </form>

      {/* Desktop table */}
      <section className="hidden md:block rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
                <th className="px-5 py-2.5 font-medium">Name</th>
                <th className="px-5 py-2.5 font-medium">Email</th>
                <th className="px-5 py-2.5 font-medium">Phone</th>
                <th className="px-5 py-2.5 font-medium">City</th>
                <th className="px-5 py-2.5 font-medium">Invoices</th>
                <th className="px-5 py-2.5 font-medium">Orders</th>
                <th className="px-5 py-2.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#F3F4F6] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[#111827]">
                    <Link href={`/admin/customers/${c.id}`} className="hover:text-[#4F46E5] transition-colors">
                      {c.fullName}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-[#6B7280]">{c.email}</td>
                  <td className="px-5 py-3.5 text-[#6B7280] tabular-nums">{c.phone}</td>
                  <td className="px-5 py-3.5 text-[#6B7280]">{c.city}, {c.state}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex rounded-full bg-[#EEF2FF] text-[#4F46E5] px-2 py-0.5 text-[11px] font-medium">{c._count.invoices}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex rounded-full bg-[#FFF7ED] text-[#C2410C] px-2 py-0.5 text-[11px] font-medium">{c._count.orders}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[#9CA3AF]">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mobile cards */}
      <section className="md:hidden space-y-3">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/admin/customers/${c.id}`}
            className="block rounded-xl border border-[#E8ECF0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#D1D5DB] active:bg-[#F9FAFB] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white text-[13px] font-semibold shrink-0">
                {c.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#111827] truncate">{c.fullName}</p>
                <p className="text-[11px] text-[#6B7280] truncate">{c.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F3F4F6] text-[11px] text-[#6B7280]">
              <span>{c.city}, {c.state}</span>
              <span className="ml-auto tabular-nums">{c.phone}</span>
            </div>
            <div className="flex gap-3 mt-2">
              <span className="inline-flex rounded-full bg-[#EEF2FF] text-[#4F46E5] px-2 py-0.5 text-[10px] font-medium">{c._count.invoices} invoices</span>
              <span className="inline-flex rounded-full bg-[#FFF7ED] text-[#C2410C] px-2 py-0.5 text-[10px] font-medium">{c._count.orders} orders</span>
              <span className="ml-auto text-[10px] text-[#9CA3AF]">{formatDate(c.createdAt)}</span>
            </div>
          </Link>
        ))}
      </section>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        basePath="/admin/customers"
      />
    </div>
  );
}
