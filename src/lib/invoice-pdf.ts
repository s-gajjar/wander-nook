import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
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

function imageExists(filePath: string) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
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

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const leftWidth = 215;
    const rightStart = leftWidth + 24;

    doc.rect(0, 0, leftWidth, pageHeight).fill("#050505");

    doc.fillColor("#FFFFFF").fontSize(28).font("Helvetica-Bold").text("INVOICE", 28, 34, {
      width: leftWidth - 56,
      align: "center",
    });

    if (imageExists(secondaryLogoPath)) {
      doc.image(secondaryLogoPath, 48, 86, {
        width: 120,
        height: 120,
      });
    }

    doc
      .fillColor("#FBBF24")
      .font("Helvetica-Bold")
      .fontSize(18)
      .text(safeText(company.tradeName), 26, 216, {
        width: leftWidth - 52,
        align: "center",
      });

    const leftSection = (
      label: string,
      lines: string[],
      y: number,
      nextOffset = 62
    ) => {
      doc
        .fillColor("#C7D2FE")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(label.toUpperCase(), 26, y, {
          width: leftWidth - 52,
          align: "left",
        });

      doc
        .fillColor("#E5E7EB")
        .font("Helvetica")
        .fontSize(10.5)
        .text(lines.filter(Boolean).join("\n"), 26, y + 13, {
          width: leftWidth - 52,
          align: "left",
          lineGap: 2,
        });

      return y + nextOffset;
    };

    let y = 258;
    y = leftSection("Address", company.addressLines, y, 82);
    y = leftSection("Email ID", [company.email], y, 48);
    y = leftSection("Contact Number", [company.phone], y, 48);
    y = leftSection("Company Name", [company.companyName], y, 46);
    y = leftSection("Trade Name", [company.tradeName], y, 46);
    y = leftSection("GST Number", [company.gstNumber], y, 46);
    leftSection(
      "Bank Details",
      [
        `Name of Bank: ${company.bankName}`,
        `Name of Branch: ${company.bankBranch}`,
        `Account No.: ${company.bankAccountNumber}`,
        `Account Type: ${company.bankAccountType}`,
        `IFSC Code: ${company.bankIfsc}`,
      ],
      y,
      90
    );

    doc.rect(rightStart, 30, pageWidth - rightStart - 24, 120).stroke("#D6DCE5");

    doc.fillColor("#163B7A").font("Helvetica-Bold").fontSize(24).text("Tax Invoice", rightStart + 14, 42);

    doc.fillColor("#334155").font("Helvetica").fontSize(11);
    doc.text(`Invoice No: ${safeText(input.invoiceNumber)}`, rightStart + 14, 76);
    doc.text(`Issue Date: ${formatDate(input.issuedAt)}`, rightStart + 14, 93);
    doc.text(`Payment Date: ${formatDate(input.paymentCapturedAt || input.issuedAt)}`, rightStart + 14, 110);

    if (imageExists(primaryLogoPath)) {
      doc.image(primaryLogoPath, pageWidth - 220, 44, {
        width: 180,
        fit: [180, 80],
      });
    }

    const rightBox = (title: string, lines: string[], boxY: number) => {
      const boxWidth = (pageWidth - rightStart - 30 - 14) / 2;
      const x = title === "Billed To" ? rightStart : rightStart + boxWidth + 14;

      doc.rect(x, boxY, boxWidth, 132).stroke("#D6DCE5");
      doc.fillColor("#475569").font("Helvetica-Bold").fontSize(10).text(title.toUpperCase(), x + 10, boxY + 9);
      doc.fillColor("#0F172A").font("Helvetica").fontSize(10.5).text(lines.join("\n"), x + 10, boxY + 24, {
        width: boxWidth - 18,
        lineGap: 2,
      });
    };

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

    rightBox(
      "Billed To",
      [
        safeText(input.customer.fullName),
        safeText(input.customer.email),
        safeText(input.customer.phone),
        safeText(customerAddress),
      ],
      166
    );

    rightBox(
      "Payment Reference",
      [
        `${safeText(input.planLabel)} (${safeText(input.billingCycle)})`,
        `Period: ${formatDate(input.periodStart)} - ${formatDate(input.periodEnd)}`,
        `Payment ID: ${safeText(input.razorpayPaymentId)}`,
        `Subscription ID: ${safeText(input.razorpaySubscriptionId)}`,
        input.razorpayInvoiceId ? `Invoice ID: ${safeText(input.razorpayInvoiceId)}` : "",
      ].filter(Boolean),
      166
    );

    const tableX = rightStart;
    const tableY = 318;
    const tableWidth = pageWidth - rightStart - 24;

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

    doc.end();
  });
}
