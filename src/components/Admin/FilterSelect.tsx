"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  name: string;
  options: { value: string; label: string }[];
};

export default function FilterSelect({ name, options }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get(name) || "all";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value === "all") {
      params.delete(name);
    } else {
      params.set(name, e.target.value);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-[13px] text-[#374151] focus:border-[#6366F1] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/10 transition-all appearance-none pr-8 cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
