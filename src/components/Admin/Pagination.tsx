"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  /** Base path, e.g. "/admin/orders" */
  basePath: string;
}

export default function Pagination({ currentPage, totalPages, totalItems, basePath }: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  }

  // Compute visible page numbers
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <p className="text-[12px] text-[#6B7280]">
        {totalItems} total result{totalItems !== 1 ? "s" : ""}
      </p>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        {/* Previous */}
        {currentPage > 1 ? (
          <Link
            href={buildHref(currentPage - 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[12px] text-[#374151] hover:bg-[#F3F4F6] transition-colors"
            aria-label="Previous page"
          >
            ←
          </Link>
        ) : (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#F3F4F6] text-[12px] text-[#D1D5DB] cursor-not-allowed">
            ←
          </span>
        )}

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="inline-flex h-8 w-8 items-center justify-center text-[12px] text-[#9CA3AF]">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(p)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-medium transition-colors ${
                p === currentPage
                  ? "bg-[#4F46E5] text-white shadow-sm"
                  : "border border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]"
              }`}
              aria-current={p === currentPage ? "page" : undefined}
            >
              {p}
            </Link>
          )
        )}

        {/* Next */}
        {currentPage < totalPages ? (
          <Link
            href={buildHref(currentPage + 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[12px] text-[#374151] hover:bg-[#F3F4F6] transition-colors"
            aria-label="Next page"
          >
            →
          </Link>
        ) : (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#F3F4F6] text-[12px] text-[#D1D5DB] cursor-not-allowed">
            →
          </span>
        )}
      </nav>
    </div>
  );
}
