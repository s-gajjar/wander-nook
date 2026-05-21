"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Overview", icon: "◻" },
  { href: "/admin/customers", label: "Customers", icon: "◎" },
  { href: "/admin/orders", label: "Orders", icon: "◈" },
  { href: "/admin/invoices", label: "Invoices", icon: "◇" },
  { href: "/admin/subscribers", label: "Subscribers", icon: "◉" },
  { href: "/admin/events", label: "Events", icon: "◆" },
  { href: "/admin/analytics", label: "Analytics", icon: "◐" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="flex gap-1 overflow-x-auto scrollbar-none">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
            isActive(item.href)
              ? "bg-[#111827] text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
              : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
