import { readFileSync } from "fs";
import path from "path";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import {
  type InvoiceTemplateInput,
  formatCurrency,
  getInvoiceLogos,
} from "@/src/lib/invoice-template";
import { getInvoiceCompanyProfile } from "@/src/lib/invoice-company-profile";

function safeText(value: string | null | undefined) {
  return (value || "-").trim() || "-";
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function toPublicFilePath(publicPath: string) {
  return path.join(process.cwd(), "public", publicPath.replace(/^\/+/, ""));
}

function readFileBuffer(filePath: string) {
  try {
    return readFileSync(filePath);
  } catch {
    return null;
  }
}

export async function generateInvoicePdfBuffer(input: InvoiceTemplateInput): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const company = getInvoiceCompanyProfile();
    const logos = getInvoiceLogos();
    const primaryLogoPath = toPublicFilePath(logos.primaryPublicPath);
    const secondaryLogoPath = toPublicFilePath(logos.secondaryPublicPath);
    const primaryLogo = readFileBuffer(primaryLogoPath);
    const secondaryLogo = readFileBuffer(secondaryLogoPath);

    const pageWidth = doc.page.width;
    const marginX = 28;
    const contentWidth = pageWidth - marginX * 2;
    const issuerY = 30;
    const taxHeaderY = 138;
    const bodyY = 236;

    doc.rect(marginX, issuerY, contentWidth, 96).stroke("#D6DCE5");

    if (secondaryLogo) {
      doc.image(secondaryLogo, marginX + 12, issuerY + 18, {
        width: 48,
        height: 48,
      });
    }

    const issuerInfoX = marginX + 72;
    doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(14).text(safeText(company.tradeName), issuerInfoX, issuerY + 14);
    doc.fillColor("#334155").font("Helvetica").fontSize(10.5);
    doc.text(`Email ID: ${safeText(company.email)}`, issuerInfoX, issuerY + 38);
    doc.text(`Contact Number: ${safeText(company.phone)}`, issuerInfoX, issuerY + 54);
    doc.text(`GST Number: ${safeText(company.gstNumber)}`, issuerInfoX, issuerY + 70);

    if (primaryLogo) {
      doc.image(primaryLogo, pageWidth - marginX - 190, issuerY + 18, {
        width: 170,
        fit: [170, 58],
        align: "right",
      });
    }

    doc.rect(marginX, taxHeaderY, contentWidth, 84).stroke("#D6DCE5");
    doc.fillColor("#163B7A").font("Helvetica-Bold").fontSize(24).text("Tax Invoice", marginX + 14, taxHeaderY + 14);
    doc.fillColor("#334155").font("Helvetica").fontSize(11);
    doc.text(`Invoice No: ${safeText(input.invoiceNumber)}`, marginX + 14, taxHeaderY + 48);
    doc.text(`Issue Date: ${formatDate(input.issuedAt)}`, marginX + 14, taxHeaderY + 63);
    doc.text(`Payment Date: ${formatDate(input.paymentCapturedAt || input.issuedAt)}`, marginX + 14, taxHeaderY + 78);

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

    const infoGap = 14;
    const infoBoxW = (contentWidth - infoGap) / 2;
    const infoBoxH = 132;
    const leftInfoX = marginX;
    const rightInfoX = marginX + infoBoxW + infoGap;

    const infoBox = (title: string, lines: string[], x: number) => {
      doc.rect(x, bodyY, infoBoxW, infoBoxH).stroke("#D6DCE5");
      doc.fillColor("#475569").font("Helvetica-Bold").fontSize(10).text(title.toUpperCase(), x + 10, bodyY + 9);
      doc.fillColor("#0F172A").font("Helvetica").fontSize(10.5).text(lines.join("\n"), x + 10, bodyY + 24, {
        width: infoBoxW - 20,
        lineGap: 2,
      });
    };

    infoBox(
      "Billed To",
      [
        safeText(input.customer.fullName),
        safeText(input.customer.email),
        safeText(input.customer.phone),
        safeText(customerAddress),
      ],
      leftInfoX
    );

    infoBox(
      "Payment Reference",
      [
        `${safeText(input.planLabel)} (${safeText(input.billingCycle)})`,
        `Period: ${formatDate(input.periodStart)} - ${formatDate(input.periodEnd)}`,
        `Payment ID: ${safeText(input.razorpayPaymentId)}`,
        `Subscription ID: ${safeText(input.razorpaySubscriptionId)}`,
        input.razorpayInvoiceId ? `Invoice ID: ${safeText(input.razorpayInvoiceId)}` : "",
        input.shopifyOrderName ? `Shopify Order: ${safeText(input.shopifyOrderName)}` : "",
      ].filter(Boolean),
      rightInfoX
    );

    const tableX = marginX;
    const tableY = bodyY + infoBoxH + 16;
    const tableWidth = contentWidth;

    doc.rect(tableX, tableY, tableWidth, 28).fillAndStroke("#F1F5F9", "#D6DCE5");
    doc.fillColor("#334155").font("Helvetica-Bold").fontSize(9.5);
    doc.text("DESCRIPTION", tableX + 8, tableY + 10);
    doc.text("PERIOD", tableX + tableWidth - 220, tableY + 10, { width: 90, align: "left" });
    doc.text("AMOUNT", tableX + tableWidth - 110, tableY + 10, { width: 92, align: "right" });

    doc.rect(tableX, tableY + 28, tableWidth, 42).stroke("#D6DCE5");
    doc.fillColor("#0F172A").font("Helvetica").fontSize(10.5);
    doc.text(`${safeText(input.planLabel)} subscription charge`, tableX + 8, tableY + 44, {
      width: tableWidth - 240,
    });
    doc.text(
      `${formatDate(input.periodStart)} - ${formatDate(input.periodEnd)}`,
      tableX + tableWidth - 220,
      tableY + 44,
      {
        width: 90,
      }
    );
    doc.text(
      formatCurrency(input.amountPaise, input.currency),
      tableX + tableWidth - 110,
      tableY + 44,
      {
        width: 92,
        align: "right",
      }
    );

    const summaryX = tableX + tableWidth - 250;
    const summaryY = tableY + 90;
    const summaryW = 250;

    doc.rect(summaryX, summaryY, summaryW, 24).stroke("#D6DCE5");
    doc.rect(summaryX, summaryY + 24, summaryW, 28).fillAndStroke("#EAF2FF", "#D6DCE5");

    doc.fillColor("#0F172A").font("Helvetica").fontSize(10.5);
    doc.text("Subtotal", summaryX + 10, summaryY + 8);
    doc.text(formatCurrency(input.amountPaise, input.currency), summaryX + 120, summaryY + 8, {
      width: 120,
      align: "right",
    });

    doc.fillColor("#0F3369").font("Helvetica-Bold").fontSize(11.5);
    doc.text("Total Paid", summaryX + 10, summaryY + 32);
    doc.text(formatCurrency(input.amountPaise, input.currency), summaryX + 120, summaryY + 32, {
      width: 120,
      align: "right",
    });

    doc
      .fillColor("#475569")
      .font("Helvetica")
      .fontSize(9.5)
      .text(
        `This is a computer-generated invoice. GST Number: ${safeText(company.gstNumber)}.`,
        tableX,
        summaryY + 66,
        {
          width: tableWidth,
        }
      );

    doc
      .fillColor("#64748B")
      .font("Helvetica")
      .fontSize(9.5)
      .text("For support, write to support@wondernook.in.", tableX, summaryY + 82, {
        width: tableWidth,
        align: "center",
      });

    doc.end();
  });
}
