import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  // Search customers, orders, and pages in parallel
  const [customers, orders] = await Promise.all([
    prisma.customer.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { city: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, fullName: true, email: true, city: true },
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: q, mode: "insensitive" } },
          { customer: { fullName: { contains: q, mode: "insensitive" } } },
        ],
      },
      take: 5,
      select: { id: true, orderNumber: true, planLabel: true, fulfillmentStatus: true, customer: { select: { fullName: true } } },
    }),
  ]);

  // Page search
  const pages = [
    { title: "Dashboard", href: "/admin", keywords: ["dashboard", "home", "overview"] },
    { title: "Orders", href: "/admin/orders", keywords: ["orders", "fulfillment", "shipping"] },
    { title: "Customers", href: "/admin/customers", keywords: ["customers", "subscribers", "users"] },
    { title: "Analytics", href: "/admin/analytics", keywords: ["analytics", "revenue", "metrics", "cohort", "retention"] },
    { title: "Unfulfilled Orders", href: "/admin/orders?fulfillment=unfulfilled", keywords: ["unfulfilled", "pending", "ship", "to ship"] },
  ];

  const matchedPages = pages.filter(
    (p) => p.title.toLowerCase().includes(q.toLowerCase()) || p.keywords.some((k) => k.includes(q.toLowerCase()))
  );

  type SearchResult = {
    type: "customer" | "order" | "page";
    title: string;
    subtitle?: string;
    href: string;
    icon: "user" | "box" | "page";
  };

  const results: SearchResult[] = [
    ...matchedPages.map((p) => ({
      type: "page" as const,
      title: p.title,
      href: p.href,
      icon: "page" as const,
    })),
    ...customers.map((c) => ({
      type: "customer" as const,
      title: c.fullName,
      subtitle: `${c.email} · ${c.city}`,
      href: `/admin/customers/${c.id}`,
      icon: "user" as const,
    })),
    ...orders.map((o) => ({
      type: "order" as const,
      title: o.orderNumber,
      subtitle: `${o.customer.fullName} · ${o.planLabel} · ${o.fulfillmentStatus}`,
      href: `/admin/orders/${o.id}`,
      icon: "box" as const,
    })),
  ];

  return NextResponse.json({ results });
}
