import { prisma } from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";
import FilterSelect from "@/src/components/Admin/FilterSelect";
import OrdersTable from "@/src/components/Admin/OrdersTable";
import Pagination from "@/src/components/Admin/Pagination";

export const dynamic = "force-dynamic";

const PER_PAGE = 25;

function formatCurrency(paise: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; fulfillment?: string; page?: string }>;
}) {
  const { q, status, fulfillment, page: pageStr } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10) || 1);

  // Build where clause
  const where: Prisma.OrderWhereInput = {};
  if (status && status !== "all") where.status = status;
  if (fulfillment && fulfillment !== "all") where.fulfillmentStatus = fulfillment;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { customer: { fullName: { contains: q, mode: "insensitive" } } },
      { customer: { email: { contains: q, mode: "insensitive" } } },
      { customer: { phone: { contains: q } } },
    ];
  }

  const [orders, totalCount, totalPaidAgg] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
      skip: (currentPage - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({
      where: { ...where, status: "paid" },
      _sum: { amountPaise: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PER_PAGE);
  const totalPaid = totalPaidAgg._sum.amountPaise || 0;

  // Serialize for client component
  const serializedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    planLabel: o.planLabel,
    amountPaise: o.amountPaise,
    currency: o.currency,
    status: o.status,
    paymentMethod: o.paymentMethod,
    fulfillmentStatus: o.fulfillmentStatus,
    createdAt: o.createdAt.toISOString(),
    customer: {
      fullName: o.customer.fullName,
      email: o.customer.email,
      phone: o.customer.phone,
    },
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold text-[#111827] tracking-[-0.02em]">
            Orders
          </h1>
          <p className="mt-1 text-[13px] sm:text-[14px] text-[#6B7280]">
            {totalCount} order{totalCount !== 1 ? "s" : ""} · Total paid:{" "}
            <span className="font-medium text-[#111827] tabular-nums">
              {formatCurrency(totalPaid, "INR")}
            </span>
          </p>
        </div>
        <a
          href="/api/admin/export/orders"
          className="self-start sm:self-auto rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          Export CSV
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchForm currentQuery={q || ""} />
        <div className="flex gap-2 overflow-x-auto">
          <FilterSelect
            name="status"
            options={[
              { value: "all", label: "All statuses" },
              { value: "paid", label: "Paid" },
              { value: "pending", label: "Pending" },
              { value: "failed", label: "Failed" },
            ]}
          />
          <FilterSelect
            name="fulfillment"
            options={[
              { value: "all", label: "All fulfillment" },
              { value: "unfulfilled", label: "Unfulfilled" },
              { value: "fulfilled", label: "Fulfilled" },
              { value: "shipped", label: "Shipped" },
              { value: "delivered", label: "Delivered" },
            ]}
          />
        </div>
      </div>

      {/* Orders table / cards + drawer */}
      <OrdersTable orders={serializedOrders} />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        basePath="/admin/orders"
      />
    </div>
  );
}

function SearchForm({ currentQuery }: { currentQuery: string }) {
  return (
    <form method="GET" className="flex-1 min-w-0">
      <input
        type="search"
        name="q"
        defaultValue={currentQuery}
        placeholder="Search orders, customers..."
        className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#6366F1] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/10 transition-all"
      />
    </form>
  );
}
