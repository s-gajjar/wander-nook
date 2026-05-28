"use client";

import AnimatedNumber from "./AnimatedNumber";

export default function AnimatedStatCard({
  label,
  value,
  subtitle,
  highlight,
  prefix = "",
  numericValue,
}: {
  label: string;
  value: string;
  subtitle: string;
  highlight?: boolean;
  prefix?: string;
  numericValue?: number;
}) {
  const showAnimated = numericValue !== undefined && numericValue > 0;

  return (
    <article className={`rounded-xl sm:rounded-2xl border p-3.5 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
      highlight ? "border-[#FDE68A] bg-[#FFFBEB] dark:border-[#92400E] dark:bg-[#78350F]/20" : "border-[#E8ECF0] bg-white dark:border-[#1F2937] dark:bg-[#111827]"
    }`}>
      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] dark:text-[#6B7280]">{label}</p>
      <p className={`mt-1.5 sm:mt-2 text-[18px] sm:text-[24px] font-bold tracking-[-0.02em] tabular-nums leading-none ${highlight ? "text-[#D97706]" : "text-[#111827] dark:text-[#F9FAFB]"}`}>
        {showAnimated ? (
          <AnimatedNumber value={numericValue} prefix={prefix} />
        ) : (
          value
        )}
      </p>
      <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-[12px] text-[#9CA3AF] dark:text-[#6B7280] truncate">{subtitle}</p>
    </article>
  );
}
