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
  const legacyPrimary = (process.env.INVOICE_PRIMARY_LOGO_URL || "").trim();
  const legacySecondary = (process.env.INVOICE_SECONDARY_LOGO_URL || "").trim();

  const inferBrandFromLegacy = [legacyPrimary, legacySecondary].find((value) =>
    /wander-logo|nook/i.test(value)
  );
  const inferStampFromLegacy = [legacyPrimary, legacySecondary].find((value) =>
    /stamp/i.test(value)
  );

  const primary = (
    process.env.INVOICE_BRAND_LOGO_URL ||
    inferBrandFromLegacy ||
    legacySecondary ||
    "/wander-logo.png"
  ).trim();
  const secondary = (
    process.env.INVOICE_STAMP_LOGO_URL ||
    inferStampFromLegacy ||
    legacyPrimary ||
    "/wander-stamps-logo.png"
  ).trim();

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
      overflow: visible;
      box-shadow: 0 22px 44px rgba(15, 23, 42, 0.1);
      padding: 20px 24px 22px;
    }

    .issuer-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 12px;
      background: #ffffff;
    }

    .issuer {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .issuer .stamp {
      width: 54px;
      height: 54px;
      object-fit: contain;
      flex: 0 0 auto;
      margin-top: 2px;
    }

    .issuer-name {
      margin: 0 0 4px;
      font-size: 18px;
      line-height: 1.1;
      font-weight: 700;
      color: #0f172a;
    }

    .issuer-detail {
      margin: 1px 0;
      font-size: 13px;
      color: #334155;
      line-height: 1.45;
    }

    .issuer-detail strong {
      color: #0f172a;
      font-weight: 700;
    }

    .top {
      display: flex;
      align-items: center;
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
      margin: 3px 0 0;
      font-size: 13px;
      color: var(--muted);
    }

    .wordmark {
      width: 220px;
      max-width: 100%;
      height: auto;
      margin-left: auto;
      display: block;
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
      .shell { padding: 14px; }
      .issuer-row,
      .top {
        flex-direction: column;
        align-items: flex-start;
      }
      .summary { width: 100%; }
      .grid { grid-template-columns: 1fr; }
      .wordmark { width: 180px; }
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
      <header class="issuer-row">
        <div class="issuer">
          <img class="stamp" src="${escapeHtml(secondaryUrl)}" alt="Wander Stamps" />
          <div>
            <p class="issuer-name">${escapeHtml(company.tradeName)}</p>
            <p class="issuer-detail"><strong>Email ID:</strong> ${escapeHtml(company.email)}</p>
            <p class="issuer-detail"><strong>Contact Number:</strong> ${escapeHtml(company.phone)}</p>
            <p class="issuer-detail"><strong>GST Number:</strong> ${escapeHtml(company.gstNumber)}</p>
          </div>
        </div>
        <img class="wordmark" src="${escapeHtml(primaryUrl)}" alt="Wander Nook" />
      </header>

      <header class="top">
        <div>
          <h2 class="title">Tax Invoice</h2>
          <p class="meta">Invoice No: <strong>${escapeHtml(input.invoiceNumber)}</strong></p>
          <p class="meta">Issue Date: ${escapeHtml(formatDate(input.issuedAt))}</p>
          <p class="meta">Payment Date: ${escapeHtml(formatDate(input.paymentCapturedAt || input.issuedAt))}</p>
        </div>
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

      <p class="footer">For support, write to support@wondernook.in.</p>
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
  const { primaryUrl, secondaryUrl } = getInvoiceLogos();
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color:#0f172a; background:#eef3fb; padding:22px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:660px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #dce5f2;overflow:hidden;">
        <tr>
          <td style="padding:16px 20px;background:linear-gradient(135deg,#f4f7fc,#ecf2ff);border-bottom:1px solid #dce5f2;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="vertical-align:top;">
                  <img src="${escapeHtml(
                    secondaryUrl
                  )}" alt="Wander Stamps" width="42" height="42" style="display:block;object-fit:contain;margin-bottom:8px;" />
                  <h2 style="margin:0;font-size:22px;color:#163b7a;line-height:1.25;">Your Wander Nook Invoice</h2>
                </td>
                <td style="text-align:right;vertical-align:top;">
                  <img src="${escapeHtml(
                    primaryUrl
                  )}" alt="Wander Nook" width="170" style="max-width:100%;height:auto;display:inline-block;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px; font-size:14px; line-height:1.65;">
            <p style="margin:0 0 12px;">Hi ${escapeHtml(params.customerName)},</p>
            <p style="margin:0 0 14px;">Thanks for your payment. Your styled invoice PDF is attached. You can also open it online anytime.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dce5f2;border-radius:10px;background:#f8fbff;">
              <tr>
                <td style="padding:12px 14px;border-bottom:1px solid #e5edf8;"><strong>Invoice #</strong></td>
                <td style="padding:12px 14px;border-bottom:1px solid #e5edf8;text-align:right;">${escapeHtml(
                  params.invoiceNumber
                )}</td>
              </tr>
              <tr>
                <td style="padding:12px 14px;border-bottom:1px solid #e5edf8;"><strong>Plan</strong></td>
                <td style="padding:12px 14px;border-bottom:1px solid #e5edf8;text-align:right;">${escapeHtml(
                  params.planLabel
                )} (${escapeHtml(params.billingCycle)})</td>
              </tr>
              <tr>
                <td style="padding:12px 14px;border-bottom:1px solid #e5edf8;"><strong>Amount</strong></td>
                <td style="padding:12px 14px;border-bottom:1px solid #e5edf8;text-align:right;">${escapeHtml(
                  amount
                )}</td>
              </tr>
              <tr>
                <td style="padding:12px 14px;"><strong>Date</strong></td>
                <td style="padding:12px 14px;text-align:right;">${escapeHtml(formatDate(params.issuedAt))}</td>
              </tr>
            </table>
            <p style="margin:18px 0 0;">
              <a href="${escapeHtml(
                params.invoiceUrl
              )}" style="display:inline-block;padding:11px 16px;background:#163b7a;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">View Invoice</a>
            </p>
            <p style="margin:16px 0 0;color:#475569;font-size:13px;">For support, write to support@wondernook.in.</p>
          </td>
        </tr>
      </table>
    </div>
  `;
}
