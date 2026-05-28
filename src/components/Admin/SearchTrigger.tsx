"use client";

export default function SearchTrigger() {
  return (
    <button
      onClick={() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
      }}
      className="hidden sm:flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5 text-[12px] text-[#6B7280] hover:bg-[#F3F4F6] hover:border-[#D1D5DB] transition-colors cursor-pointer"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span>Search</span>
      <kbd className="ml-1 rounded border border-[#E5E7EB] bg-white px-1 py-0.5 text-[10px] font-mono font-medium">⌘K</kbd>
    </button>
  );
}
