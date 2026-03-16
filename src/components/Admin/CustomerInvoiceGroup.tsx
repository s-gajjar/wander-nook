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

  const latestInvoice = group.invoices[0];

  return (
    <>
      <tr
        className="border-b border-slate-100 align-top cursor-pointer transition-colors hover:bg-slate-50"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <td className="py-3 pr-4">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block text-[10px] leading-none text-slate-400 transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
            >
              ▶
            </span>
            <div>
              <p className="font-medium text-slate-900">{group.customerName}</p>
              <p className="text-xs text-slate-500">{group.customerEmail}</p>
              {group.customerPhone && (
                <p className="text-xs text-slate-400">{group.customerPhone}</p>
              )}
            </div>
          </div>
        </td>
        <td className="py-3 pr-4">
          <p className="font-medium text-slate-900">{group.invoices.length}</p>
        </td>
        <td className="py-3 pr-4">
          {formatCurrencyClient(group.totalAmountPaise, group.latestCurrency)}
        </td>
        <td className="py-3 pr-4">{formatDateClient(group.latestIssuedAt)}</td>
        <td className="py-3 pr-4">
          <span className="text-xs text-slate-500">
            {expanded ? "Click to collapse" : "Click to expand"}
          </span>
        </td>
      </tr>

      {expanded &&
        group.invoices.map((invoice) => (
          <tr
            key={invoice.id}
            className="border-b border-slate-50 bg-slate-50/60 align-top"
          >
            <td className="py-2.5 pl-8 pr-4">
              <p className="text-sm font-medium text-slate-800">{invoice.invoiceNumber}</p>
              <p className="text-[11px] text-slate-400">{invoice.razorpayPaymentId}</p>
            </td>
            <td className="py-2.5 pr-4">
              <span className="inline-flex items-center rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {invoice.planLabel}
              </span>
            </td>
            <td className="py-2.5 pr-4 text-sm text-slate-700">
              {formatCurrencyClient(invoice.amountPaise, invoice.currency)}
            </td>
            <td className="py-2.5 pr-4 text-sm text-slate-700">
              {formatDateClient(invoice.issuedAt)}
              <p className="text-[11px] text-slate-400">
                Email: {invoice.emailSentAt ? formatDateClient(invoice.emailSentAt) : "Not sent"}
              </p>
            </td>
            <td className="py-2.5 pr-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/invoice/${invoice.publicToken}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
