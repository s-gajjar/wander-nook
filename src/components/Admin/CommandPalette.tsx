"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type SearchResult = {
  type: "customer" | "order" | "page";
  title: string;
  subtitle?: string;
  href: string;
  icon: "user" | "box" | "page";
};

const PAGES: SearchResult[] = [
  { type: "page", title: "Dashboard", href: "/admin", icon: "page" },
  { type: "page", title: "Orders", href: "/admin/orders", icon: "page" },
  { type: "page", title: "Customers", href: "/admin/customers", icon: "page" },
  { type: "page", title: "Analytics", href: "/admin/analytics", icon: "page" },
  { type: "page", title: "Unfulfilled Orders", href: "/admin/orders?fulfillment=unfulfilled", icon: "box" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ⌘K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults(PAGES);
      setSelectedIndex(0);
    }
  }, [open]);

  // Search
  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(PAGES);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  // Reset selected when results change
  useEffect(() => { setSelectedIndex(0); }, [results]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigate(results[selectedIndex]);
    }
  };

  const navigate = (result: SearchResult) => {
    setOpen(false);
    router.push(result.href);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="fixed inset-x-0 top-[15%] z-50 mx-auto w-full max-w-[560px] px-4">
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1F2937] shadow-2xl shadow-black/20 animate-in slide-in-from-top-2 duration-200">
          {/* Input */}
          <div className="flex items-center gap-3 border-b border-[#F3F4F6] dark:border-[#374151] px-4 py-3">
            <svg className="w-5 h-5 text-[#9CA3AF] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search customers, orders, pages..."
              className="flex-1 text-[15px] text-[#111827] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] outline-none bg-transparent"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-[#E5E7EB] border-t-[#6366F1] rounded-full animate-spin" />
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-1.5 py-0.5 text-[11px] text-[#6B7280] font-medium">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[320px] overflow-y-auto py-2">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] text-[#9CA3AF]">No results found</p>
              </div>
            ) : (
              results.map((result, i) => (
                <button
                  key={`${result.type}-${result.href}-${i}`}
                  onClick={() => navigate(result)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selectedIndex ? "bg-[#F3F4FF] dark:bg-[#374151]" : "hover:bg-[#F9FAFB] dark:hover:bg-[#374151]"
                  }`}
                >
                  {/* Icon */}
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                    result.icon === "user" ? "bg-[#EEF2FF] text-[#6366F1]"
                      : result.icon === "box" ? "bg-[#FEF3C7] text-[#D97706]"
                      : "bg-[#F3F4F6] text-[#6B7280]"
                  }`}>
                    {result.icon === "user" && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    )}
                    {result.icon === "box" && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    )}
                    {result.icon === "page" && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[#111827] truncate">{result.title}</p>
                    {result.subtitle && <p className="text-[11px] text-[#9CA3AF] truncate">{result.subtitle}</p>}
                  </div>

                  {/* Type badge */}
                  <span className="shrink-0 rounded-md bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] font-medium text-[#6B7280] uppercase">
                    {result.type}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#F3F4F6] dark:border-[#374151] px-4 py-2 flex items-center gap-4 text-[11px] text-[#9CA3AF]">
            <span className="flex items-center gap-1"><kbd className="font-mono">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="font-mono">↵</kbd> select</span>
            <span className="flex items-center gap-1"><kbd className="font-mono">esc</kbd> close</span>
          </div>
        </div>
      </div>
    </>
  );
}
