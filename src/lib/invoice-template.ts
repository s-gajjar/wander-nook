import { getSiteUrl } from "@/src/lib/site-url";
import { getInvoiceCompanyProfile } from "@/src/lib/invoice-company-profile";

type InvoiceCustomer = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type InvoiceTemplateInput = {
  invoiceNumber: string;
  issuedAt: Date;
  paymentCapturedAt?: Date | null;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  amountPaise: number;
  currency: string;
  billingCycle: string;
  planLabel: string;
  razorpayPaymentId: string;
  razorpaySubscriptionId: string;
  razorpayInvoiceId?: string | null;
  shopifyOrderName?: string | null;
  customer: InvoiceCustomer;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatCurrency(amountPaise: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountPaise / 100);
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function resolveUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

function normalizePublicPath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export function getInvoiceLogos() {
  const primary = (process.env.INVOICE_PRIMARY_LOGO_URL || "/wander-stamps-logo.png").trim();
  const secondary = (process.env.INVOICE_SECONDARY_LOGO_URL || "/wander-logo.png").trim();

  return {
    primaryUrl: resolveUrl(primary),
    secondaryUrl: resolveUrl(secondary),
    primaryPublicPath: normalizePublicPath(primary),
    secondaryPublicPath: normalizePublicPath(secondary),
  };
}

function invoiceStyles() {
  return `
    :root {
      --ink: #0f172a;
      --muted: #475569;
      --line: #d4dae2;
      --panel: #060606;
      --paper: #ffffff;
      --soft: #f7f9fc;
      --brand: #163b7a;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      background: var(--soft);
      color: var(--ink);
      font-family: "Plus Jakarta Sans", "Avenir Next", "Segoe UI", sans-serif;
      line-height: 1.45;
    }

    .shell {
      max-width: 1120px;
      margin: 24px auto;
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 22px 44px rgba(15, 23, 42, 0.1);
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(250px, 320px) 1fr;
      min-height: 100%;
    }

    .left {
      background: var(--panel);
      color: #f8fafc;
      padding: 20px 16px;
    }

    .left h1 {
      margin: 0;
      text-align: center;
      letter-spacing: 0.11em;
      font-size: 26px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .left .stamp {
      margin: 14px auto;
      width: 160px;
      height: 160px;
      border-radius: 999px;
      object-fit: contain;
      background: #fff;
      border: 1px solid rgba(255, 255, 255, 0.26);
      padding: 4px;
      display: block;
    }

    .left .brand {
      margin-top: 8px;
      text-align: center;
      font-size: 24px;
      line-height: 1.1;
      font-weight: 700;
      color: #fbbf24;
    }

    .left .section {
      margin-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.18);
      padding-top: 12px;
    }

    .left .label {
      margin: 0 0 3px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.78);
      font-weight: 600;
    }

    .left p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: #e5e7eb;
    }

    .right {
      padding: 20px 24px;
    }

    .top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid var(--line);
      padding-bottom: 10px;
      margin-bottom: 14px;
    }

    .title {
      margin: 0;
      color: var(--brand);
      font-size: 24px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .meta {
      margin: 2px 0 0;
      font-size: 13px;
      color: var(--muted);
    }

    .wordmark {
      width: 220px;
      max-width: 100%;
      height: auto;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 14px;
    }

    .box {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 12px;
      background: #fff;
    }

    .box h3 {
      margin: 0 0 8px;
      font-size: 11px;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: var(--muted);
    }

    .box p {
      margin: 2px 0;
      font-size: 13px;
      color: #1e293b;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid var(--line);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 10px;
    }

    th {
      text-align: left;
      background: #f1f5f9;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #334155;
      padding: 10px;
      border-bottom: 1px solid var(--line);
    }

    td {
      font-size: 13px;
      padding: 10px;
      border-bottom: 1px solid #e7ecf3;
      vertical-align: top;
    }

    tr:last-child td { border-bottom: none; }

    .align-right { text-align: right; }

    .summary {
      margin-left: auto;
      width: 320px;
      border: 1px solid var(--line);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 10px;
    }

    .summary .row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 13px;
      padding: 10px 12px;
      border-bottom: 1px solid #e7ecf3;
    }

    .summary .row:last-child {
      border-bottom: none;
      background: #eaf2ff;
      color: #0f3369;
      font-size: 15px;
      font-weight: 700;
    }

    .note {
      font-size: 12px;
      color: #475569;
      border: 1px dashed #ced6e3;
      border-radius: 10px;
      background: #f8fafc;
      padding: 10px;
    }

    .footer {
      font-size: 11px;
      margin-top: 8px;
      color: #64748b;
      text-align: center;
    }

    @media print {
      body { background: #fff; }
      .shell {
        margin: 0;
        border: none;
        border-radius: 0;
        box-shadow: none;
      }
    }

    @media (max-width: 820px) {
      .layout { grid-template-columns: 1fr; }
      .right { padding: 16px; }
      .summary { width: 100%; }
      .grid { grid-template-columns: 1fr; }
    }
  `;
}

function invoiceContent(input: InvoiceTemplateInput) {
  const company = getInvoiceCompanyProfile();
  const { primaryUrl, secondaryUrl } = getInvoiceLogos();

  const customerAddress = [
    input.customer.addressLine1,
    input.customer.addressLine2,
    input.customer.city,
    input.customer.state,
    input.customer.pincode,
    input.customer.country,
  ]
    .filter(Boolean)
    .join(", ");

  const invoiceAmount = formatCurrency(input.amountPaise, input.currency);

  return `
    <div class="shell">
      <div class="layout">
        <aside class="left">
          <h1>Invoice</h1>
          <img class="stamp" src="${escapeHtml(secondaryUrl)}" alt="Wander Stamps" />
          <p class="brand">${escapeHtml(company.tradeName)}</p>

          <div class="section">
            <p>${company.addressLines.map((line) => escapeHtml(line)).join("<br />")}</p>
          </div>

          <div class="section">
            <p class="label">Email ID</p>
            <p>${escapeHtml(company.email)}</p>
          </div>

          <div class="section">
            <p class="label">Contact Number</p>
            <p>${escapeHtml(company.phone)}</p>
          </div>

          <div class="section">
            <p class="label">Company Name</p>
            <p>${escapeHtml(company.companyName)}</p>
            <p class="label" style="margin-top:8px;">Trade Name</p>
            <p>${escapeHtml(company.tradeName)}</p>
            <p class="label" style="margin-top:8px;">GST Number</p>
            <p>${escapeHtml(company.gstNumber)}</p>
          </div>

          <div class="section">
            <p class="label">Bank Details</p>
            <p>Name of Bank: ${escapeHtml(company.bankName)}</p>
            <p>Name of Branch: ${escapeHtml(company.bankBranch)}</p>
            <p>Account No.: ${escapeHtml(company.bankAccountNumber)}</p>
            <p>Account Type: ${escapeHtml(company.bankAccountType)}</p>
            <p>IFSC Code: ${escapeHtml(company.bankIfsc)}</p>
          </div>
        </aside>

        <main class="right">
          <header class="top">
            <div>
              <h2 class="title">Tax Invoice</h2>
              <p class="meta">Invoice No: <strong>${escapeHtml(input.invoiceNumber)}</strong></p>
              <p class="meta">Issue Date: ${escapeHtml(formatDate(input.issuedAt))}</p>
              <p class="meta">Payment Date: ${escapeHtml(formatDate(input.paymentCapturedAt || input.issuedAt))}</p>
            </div>
            <img class="wordmark" src="${escapeHtml(primaryUrl)}" alt="Wander Nook" />
          </header>

          <section class="grid">
            <div class="box">
              <h3>Billed To</h3>
              <p><strong>${escapeHtml(input.customer.fullName)}</strong></p>
              <p>${escapeHtml(input.customer.email)}</p>
              <p>${escapeHtml(input.customer.phone)}</p>
              <p>${escapeHtml(customerAddress)}</p>
            </div>

            <div class="box">
              <h3>Payment Reference</h3>
              <p><strong>Plan:</strong> ${escapeHtml(input.planLabel)} (${escapeHtml(input.billingCycle)})</p>
              <p><strong>Period:</strong> ${escapeHtml(`${formatDate(input.periodStart)} - ${formatDate(input.periodEnd)}`)}</p>
              <p><strong>Razorpay Payment ID:</strong> ${escapeHtml(input.razorpayPaymentId)}</p>
              <p><strong>Razorpay Subscription ID:</strong> ${escapeHtml(input.razorpaySubscriptionId)}</p>
              ${input.razorpayInvoiceId ? `<p><strong>Razorpay Invoice ID:</strong> ${escapeHtml(input.razorpayInvoiceId)}</p>` : ""}
              ${input.shopifyOrderName ? `<p><strong>Shopify Order:</strong> ${escapeHtml(input.shopifyOrderName)}</p>` : ""}
            </div>
          </section>

          <table aria-label="Invoice items">
            <thead>
              <tr>
                <th style="width: 52%;">Description</th>
                <th style="width: 24%;">Subscription Period</th>
                <th style="width: 24%;" class="align-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${escapeHtml(input.planLabel)} subscription charge</td>
                <td>${escapeHtml(`${formatDate(input.periodStart)} - ${formatDate(input.periodEnd)}`)}</td>
                <td class="align-right">${escapeHtml(invoiceAmount)}</td>
              </tr>
            </tbody>
          </table>

          <div class="summary">
            <div class="row">
              <span>Subtotal</span>
              <span>${escapeHtml(invoiceAmount)}</span>
            </div>
            <div class="row">
              <span>Total Paid</span>
              <span>${escapeHtml(invoiceAmount)}</span>
            </div>
          </div>

          <div class="note">
            This is a computer-generated invoice for subscription payment. GST Number: <strong>${escapeHtml(
              company.gstNumber
            )}</strong>.
          </div>

          <p class="footer">For support, write to ${escapeHtml(company.email)}.</p>
        </main>
      </div>
    </div>
  `;
}

export function renderInvoiceHtml(input: InvoiceTemplateInput) {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Invoice ${escapeHtml(input.invoiceNumber)}</title>
      <style>${invoiceStyles()}</style>
    </head>
    <body>
      ${invoiceContent(input)}
    </body>
  </html>`;
}

export function renderInvoiceEmailHtml(params: {
  customerName: string;
  invoiceNumber: string;
  invoiceUrl: string;
  amountPaise: number;
  currency: string;
  planLabel: string;
  billingCycle: string;
  issuedAt: Date;
}) {
  const amount = formatCurrency(params.amountPaise, params.currency);
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color:#0f172a; background:#f8fafc; padding:20px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr>
          <td style="padding:18px 20px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;">
            <h2 style="margin:0;font-size:20px;color:#1f3f87;">Your Wander Nook Invoice</h2>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 20px; font-size:14px; line-height:1.6;">
            <p style="margin:0 0 12px;">Hi ${escapeHtml(params.customerName)},</p>
            <p style="margin:0 0 12px;">Thanks for your payment. Your invoice PDF is attached and you can also view it online.</p>
            <p style="margin:0 0 8px;"><strong>Invoice #</strong> ${escapeHtml(params.invoiceNumber)}</p>
            <p style="margin:0 0 8px;"><strong>Plan</strong> ${escapeHtml(params.planLabel)} (${escapeHtml(params.billingCycle)})</p>
            <p style="margin:0 0 8px;"><strong>Amount</strong> ${escapeHtml(amount)}</p>
            <p style="margin:0 0 16px;"><strong>Date</strong> ${escapeHtml(formatDate(params.issuedAt))}</p>
            <a href="${escapeHtml(params.invoiceUrl)}" style="display:inline-block;padding:10px 16px;background:#1f3f87;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">View Invoice</a>
          </td>
        </tr>
      </table>
    </div>
  `;
}
