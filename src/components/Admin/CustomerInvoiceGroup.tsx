"use client";

import { useState } from "react";
import Link from "next/link";
import ResendInvoiceButton from "./ResendInvoiceButton";

export type SerializedInvoice = {
  id: string;
  invoiceNumber: string;
  publicToken: string;
  planLabel: string;
  billingCycle: string;
  amountPaise: number;
  currency: string;
  status: string;
  issuedAt: string;
  emailSentAt: string | null;
  razorpayPaymentId: string;
};

export type CustomerGroupData = {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCity: string;
  customerState: string;
  totalAmountPaise: number;
  latestCurrency: string;
  latestIssuedAt: string;
  invoices: SerializedInvoice[];
};

function formatCurrencyClient(amountPaise: number, currency: string) {
  const amount = amountPaise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateClient(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function CustomerInvoiceGroup({ group }: { group: CustomerGroupData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-b border-[#F9FAFB] align-top cursor-pointer transition-colors hover:bg-[#FAFBFC]"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-block text-[10px] leading-none text-[#9CA3AF] transition-transform duration-150 ${
                expanded ? "rotate-90" : ""
              }`}
            >
              ▶
            </span>
            <div>
              <Link
                href={`/admin/customers/${group.customerId}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-[#111827] hover:text-[#4F46E5] transition-colors"
              >
                {group.customerName}
              </Link>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">{group.customerEmail}</p>
              {group.customerPhone && (
                <p className="text-[11px] text-[#9CA3AF]">{group.customerPhone}</p>
              )}
            </div>
          </div>
        </td>
        <td className="px-5 py-3.5">
          <span className="inline-flex rounded-full bg-[#EEF2FF] text-[#4F46E5] px-2 py-0.5 text-[11px] font-medium">
            {group.invoices.length}
          </span>
        </td>
        <td className="px-5 py-3.5 font-semibold text-[#111827] tabular-nums">
          {formatCurrencyClient(group.totalAmountPaise, group.latestCurrency)}
        </td>
        <td className="px-5 py-3.5 text-[#6B7280]">{formatDateClient(group.latestIssuedAt)}</td>
        <td className="px-5 py-3.5">
          <span className="text-[11px] text-[#9CA3AF]">
            {expanded ? "Collapse" : "Expand"}
          </span>
        </td>
      </tr>

      {expanded &&
        group.invoices.map((invoice) => (
          <tr
            key={invoice.id}
            className="border-b border-[#F9FAFB] bg-[#FAFBFC] align-top"
          >
            <td className="py-3 pl-12 pr-5">
              <p className="text-[13px] font-medium text-[#111827]">{invoice.invoiceNumber}</p>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5 font-mono">{invoice.razorpayPaymentId}</p>
            </td>
            <td className="px-5 py-3">
              <span className="inline-flex rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-[#374151]">
                {invoice.planLabel}
              </span>
            </td>
            <td className="px-5 py-3 text-[13px] font-medium text-[#111827] tabular-nums">
              {formatCurrencyClient(invoice.amountPaise, invoice.currency)}
            </td>
            <td className="px-5 py-3 text-[13px] text-[#6B7280]">
              {formatDateClient(invoice.issuedAt)}
              <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                Email: {invoice.emailSentAt ? formatDateClient(invoice.emailSentAt) : "Not sent"}
              </p>
            </td>
            <td className="px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/invoice/${invoice.publicToken}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  View
                </Link>
                <div onClick={(e) => e.stopPropagation()}>
                  <ResendInvoiceButton invoiceId={invoice.id} />
                </div>
              </div>
            </td>
          </tr>
        ))}
    </>
  );
}
