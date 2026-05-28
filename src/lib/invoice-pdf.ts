import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  type InvoiceTemplateInput,
  getInvoiceLogos,
} from "@/src/lib/invoice-template";
import { getInvoiceCompanyProfile } from "@/src/lib/invoice-company-profile";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

const COLOR_INK = rgb(0x0f / 255, 0x17 / 255, 0x2a / 255);
const COLOR_MUTED = rgb(0x47 / 255, 0x56 / 255, 0x69 / 255);
const COLOR_LINE = rgb(0xd6 / 255, 0xdc / 255, 0xe5 / 255);
const COLOR_BRAND = rgb(0x16 / 255, 0x3b / 255, 0x7a / 255);
const COLOR_SUMMARY_BG = rgb(0xea / 255, 0xf2 / 255, 0xff / 255);
const COLOR_TABLE_HEAD = rgb(0xf1 / 255, 0xf5 / 255, 0xf9 / 255);

function safeText(value: string | null | undefined) {
  return (value || "-").trim() || "-";
}

function sanitizePdfText(text: string) {
  return text.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}

function formatCurrencyForPdf(amountPaise: number, _currency: string) {
  const amount = amountPaise / 100;
  const amountText = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Rs. ${amountText}`;
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

async function loadImageBytes(url: string) {
  try {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) return null;
    const bytes = await response.arrayBuffer();
    return new Uint8Array(bytes);
  } catch {
    return null;
  }
}

function topToBottomY(top: number, elementHeight = 0) {
  return A4_HEIGHT - top - elementHeight;
}

function drawBox(page: PDFPage, x: number, top: number, width: number, height: number, fill?: typeof COLOR_INK) {
  page.drawRectangle({
    x,
    y: topToBottomY(top, height),
    width,
    height,
    borderColor: COLOR_LINE,
    borderWidth: 1,
    ...(fill ? { color: fill } : {}),
  });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    const words = sanitizePdfText(paragraph).split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = words[0];
    for (let i = 1; i < words.length; i += 1) {
      const candidate = `${current} ${words[i]}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    lines.push(current);
  }

  return lines;
}

function drawTextBlock(params: {
  page: PDFPage;
  text: string;
  x: number;
  top: number;
  maxWidth: number;
  font: PDFFont;
  size: number;
  color?: typeof COLOR_INK;
  lineHeight?: number;
}) {
  const {
    page,
    text,
    x,
    top,
    maxWidth,
    font,
    size,
    color = COLOR_INK,
    lineHeight = size + 3,
  } = params;

  const lines = wrapText(text, font, size, maxWidth);
  lines.forEach((line, index) => {
    const printableLine = sanitizePdfText(line);
    page.drawText(printableLine, {
      x,
      y: topToBottomY(top + index * lineHeight, size),
      size,
      font,
      color,
    });
  });

  return top + lines.length * lineHeight;
}

function drawRightAlignedText(params: {
  page: PDFPage;
  text: string;
  rightX: number;
  top: number;
  font: PDFFont;
  size: number;
  color?: typeof COLOR_INK;
}) {
  const { page, text, rightX, top, font, size, color = COLOR_INK } = params;
  const printableText = sanitizePdfText(text);
  const width = font.widthOfTextAtSize(printableText, size);
  page.drawText(printableText, {
    x: rightX - width,
    y: topToBottomY(top, size),
    size,
    font,
    color,
  });
}

async function embedImage(
  pdfDoc: PDFDocument,
  bytes: Uint8Array | null
): Promise<Awaited<ReturnType<PDFDocument["embedPng"]>> | Awaited<ReturnType<PDFDocument["embedJpg"]>> | null> {
  if (!bytes) return null;
  try {
    return await pdfDoc.embedPng(bytes);
  } catch {
    try {
      return await pdfDoc.embedJpg(bytes);
    } catch {
      return null;
    }
  }
}

function drawImageFit(params: {
  page: PDFPage;
  image: Awaited<ReturnType<PDFDocument["embedPng"]>> | Awaited<ReturnType<PDFDocument["embedJpg"]>>;
  x: number;
  top: number;
  maxWidth: number;
  maxHeight: number;
}) {
  const { page, image, x, top, maxWidth, maxHeight } = params;
  const imageSize = image.scale(1);
  const scale = Math.min(maxWidth / imageSize.width, maxHeight / imageSize.height);
  const width = imageSize.width * scale;
  const height = imageSize.height * scale;
  const offsetX = (maxWidth - width) / 2;
  const offsetY = (maxHeight - height) / 2;

  page.drawImage(image, {
    x: x + offsetX,
    y: topToBottomY(top + offsetY, height),
    width,
    height,
  });
}

export async function generateInvoicePdfBuffer(input: InvoiceTemplateInput): Promise<Buffer> {
  const company = getInvoiceCompanyProfile();
  const logos = getInvoiceLogos();
  const [primaryLogoBytes, secondaryLogoBytes] = await Promise.all([
    loadImageBytes(logos.primaryUrl),
    loadImageBytes(logos.secondaryUrl),
  ]);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const [primaryLogo, secondaryLogo] = await Promise.all([
    embedImage(pdfDoc, primaryLogoBytes),
    embedImage(pdfDoc, secondaryLogoBytes),
  ]);

  const marginX = 28;
  const contentWidth = A4_WIDTH - marginX * 2;
  const issuerTop = 30;
  const taxHeaderTop = 138;
  const bodyTop = 236;

  drawBox(page, marginX, issuerTop, contentWidth, 96);

  if (secondaryLogo) {
    drawImageFit({
      page,
      image: secondaryLogo,
      x: marginX + 12,
      top: issuerTop + 18,
      maxWidth: 48,
      maxHeight: 48,
    });
  }

  const issuerInfoX = marginX + 72;
  drawTextBlock({
    page,
    text: safeText(company.tradeName),
    x: issuerInfoX,
    top: issuerTop + 14,
    maxWidth: 210,
    font: boldFont,
    size: 14,
    color: COLOR_INK,
  });

  // Draw label+value pairs with bold labels
  const issuerDetails = [
    { label: "Email ID: ", value: safeText(company.email) },
    { label: "Contact Number: ", value: safeText(company.phone) },
    { label: "GST Number: ", value: safeText(company.gstNumber) },
  ];
  issuerDetails.forEach((item, idx) => {
    const yPos = issuerTop + 36 + idx * 16;
    const labelWidth = boldFont.widthOfTextAtSize(item.label, 10.5);
    page.drawText(sanitizePdfText(item.label), {
      x: issuerInfoX,
      y: topToBottomY(yPos, 10.5),
      size: 10.5,
      font: boldFont,
      color: COLOR_INK,
    });
    page.drawText(sanitizePdfText(item.value), {
      x: issuerInfoX + labelWidth,
      y: topToBottomY(yPos, 10.5),
      size: 10.5,
      font: regularFont,
      color: COLOR_MUTED,
    });
  });

  if (primaryLogo) {
    drawImageFit({
      page,
      image: primaryLogo,
      x: marginX + contentWidth - 177,
      top: issuerTop + 18,
      maxWidth: 165,
      maxHeight: 52,
    });
  }

  drawBox(page, marginX, taxHeaderTop, contentWidth, 84);
  drawTextBlock({
    page,
    text: "Tax Invoice",
    x: marginX + 14,
    top: taxHeaderTop + 12,
    maxWidth: 260,
    font: boldFont,
    size: 22,
    color: COLOR_BRAND,
  });

  // Invoice meta with bold labels
  const invoiceMeta = [
    { label: "Invoice No: ", value: safeText(input.invoiceNumber) },
    { label: "Issue Date: ", value: formatDate(input.issuedAt) },
    { label: "Payment Date: ", value: formatDate(input.paymentCapturedAt || input.issuedAt) },
  ];
  invoiceMeta.forEach((item, idx) => {
    const yPos = taxHeaderTop + 42 + idx * 14;
    const metaX = marginX + 14;
    const labelW = boldFont.widthOfTextAtSize(item.label, 10.5);
    page.drawText(sanitizePdfText(item.label), {
      x: metaX,
      y: topToBottomY(yPos, 10.5),
      size: 10.5,
      font: boldFont,
      color: COLOR_INK,
    });
    page.drawText(sanitizePdfText(item.value), {
      x: metaX + labelW,
      y: topToBottomY(yPos, 10.5),
      size: 10.5,
      font: regularFont,
      color: COLOR_MUTED,
    });
  });

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

  const renderInfoBox = (title: string, lines: { label?: string; value: string }[], x: number) => {
    drawBox(page, x, bodyTop, infoBoxW, infoBoxH);
    drawTextBlock({
      page,
      text: title.toUpperCase(),
      x: x + 10,
      top: bodyTop + 9,
      maxWidth: infoBoxW - 20,
      font: boldFont,
      size: 10,
      color: COLOR_MUTED,
    });
    let lineY = bodyTop + 26;
    for (const item of lines) {
      if (item.label) {
        const labelW = boldFont.widthOfTextAtSize(item.label, 10);
        page.drawText(sanitizePdfText(item.label), {
          x: x + 10,
          y: topToBottomY(lineY, 10),
          size: 10,
          font: boldFont,
          color: COLOR_INK,
        });
        const valLines = wrapText(item.value, regularFont, 10, infoBoxW - 24 - labelW);
        valLines.forEach((vl, vi) => {
          page.drawText(sanitizePdfText(vl), {
            x: x + 10 + labelW,
            y: topToBottomY(lineY + vi * 13, 10),
            size: 10,
            font: regularFont,
            color: COLOR_INK,
          });
        });
        lineY += Math.max(1, valLines.length) * 13;
      } else {
        const valLines = wrapText(item.value, regularFont, 10, infoBoxW - 20);
        valLines.forEach((vl, vi) => {
          page.drawText(sanitizePdfText(vl), {
            x: x + 10,
            y: topToBottomY(lineY + vi * 13, 10),
            size: 10,
            font: regularFont,
            color: COLOR_INK,
          });
        });
        lineY += Math.max(1, valLines.length) * 13;
      }
    }
  };

  renderInfoBox(
    "Billed To",
    [
      { value: safeText(input.customer.fullName) },
      { value: safeText(input.customer.email) },
      { value: safeText(input.customer.phone) },
      { value: safeText(customerAddress) },
    ],
    leftInfoX
  );

  renderInfoBox(
    "Payment Reference",
    [
      { label: "Plan: ", value: `${safeText(input.planLabel)} (${safeText(input.billingCycle)})` },
      { label: "Period: ", value: `${formatDate(input.periodStart)} - ${formatDate(input.periodEnd)}` },
      { label: "Payment ID: ", value: safeText(input.razorpayPaymentId) },
      ...(input.razorpaySubscriptionId ? [{ label: "Subscription ID: ", value: safeText(input.razorpaySubscriptionId) }] : []),
      ...(input.razorpayInvoiceId ? [{ label: "Invoice ID: ", value: safeText(input.razorpayInvoiceId) }] : []),
      ...(input.shopifyOrderName ? [{ label: "Order: ", value: safeText(input.shopifyOrderName) }] : []),
    ],
    rightInfoX
  );

  const tableX = marginX;
  const tableTop = bodyTop + infoBoxH + 16;
  const tableWidth = contentWidth;
  const headerHeight = 28;
  const rowHeight = 32;
  const periodColX = tableX + tableWidth - 260;
  const periodColW = 150;

  drawBox(page, tableX, tableTop, tableWidth, headerHeight, COLOR_TABLE_HEAD);
  drawTextBlock({
    page,
    text: "DESCRIPTION",
    x: tableX + 8,
    top: tableTop + 10,
    maxWidth: 220,
    font: boldFont,
    size: 9.5,
    color: COLOR_MUTED,
  });
  drawTextBlock({
    page,
    text: "SUBSCRIPTION PERIOD",
    x: periodColX,
    top: tableTop + 10,
    maxWidth: periodColW,
    font: boldFont,
    size: 9.5,
    color: COLOR_MUTED,
  });
  drawRightAlignedText({
    page,
    text: "AMOUNT",
    rightX: tableX + tableWidth - 18,
    top: tableTop + 10,
    font: boldFont,
    size: 9.5,
    color: COLOR_MUTED,
  });

  drawBox(page, tableX, tableTop + headerHeight, tableWidth, rowHeight);
  drawTextBlock({
    page,
    text: `${safeText(input.planLabel)} subscription charge`,
    x: tableX + 8,
    top: tableTop + headerHeight + 11,
    maxWidth: periodColX - tableX - 16,
    font: regularFont,
    size: 10.5,
    color: COLOR_INK,
  });
  drawTextBlock({
    page,
    text: `${formatDate(input.periodStart)} - ${formatDate(input.periodEnd)}`,
    x: periodColX,
    top: tableTop + headerHeight + 11,
    maxWidth: periodColW,
    font: regularFont,
    size: 10.5,
    color: COLOR_INK,
  });
  drawRightAlignedText({
    page,
    text: formatCurrencyForPdf(input.amountPaise, input.currency),
    rightX: tableX + tableWidth - 18,
    top: tableTop + headerHeight + 11,
    font: regularFont,
    size: 10.5,
    color: COLOR_INK,
  });

  const summaryX = tableX + tableWidth - 250;
  const summaryTop = tableTop + headerHeight + rowHeight + 14;
  const summaryW = 250;

  drawBox(page, summaryX, summaryTop, summaryW, 24);
  drawBox(page, summaryX, summaryTop + 24, summaryW, 28, COLOR_SUMMARY_BG);

  drawTextBlock({
    page,
    text: "Subtotal",
    x: summaryX + 10,
    top: summaryTop + 8,
    maxWidth: 120,
    font: regularFont,
    size: 10.5,
    color: COLOR_INK,
  });
  drawRightAlignedText({
    page,
    text: formatCurrencyForPdf(input.amountPaise, input.currency),
    rightX: summaryX + summaryW - 10,
    top: summaryTop + 8,
    font: regularFont,
    size: 10.5,
    color: COLOR_INK,
  });

  drawTextBlock({
    page,
    text: "Total Paid",
    x: summaryX + 10,
    top: summaryTop + 32,
    maxWidth: 120,
    font: boldFont,
    size: 11.5,
    color: COLOR_BRAND,
  });
  drawRightAlignedText({
    page,
    text: formatCurrencyForPdf(input.amountPaise, input.currency),
    rightX: summaryX + summaryW - 10,
    top: summaryTop + 32,
    font: boldFont,
    size: 11.5,
    color: COLOR_BRAND,
  });

  // Dispatch notes
  const dispatchTop = summaryTop + 66;
  drawTextBlock({
    page,
    text: "Important Information:",
    x: tableX,
    top: dispatchTop,
    maxWidth: tableWidth,
    font: boldFont,
    size: 9.5,
    color: COLOR_INK,
  });
  drawTextBlock({
    page,
    text: "- We dispatch on the 1st and 16th of every month. You should typically receive it within 2-3 days.",
    x: tableX + 8,
    top: dispatchTop + 16,
    maxWidth: tableWidth - 16,
    font: regularFont,
    size: 9,
    color: COLOR_MUTED,
  });
  drawTextBlock({
    page,
    text: "- Your subscription begins from the earliest 1st or 16th.",
    x: tableX + 8,
    top: dispatchTop + 30,
    maxWidth: tableWidth - 16,
    font: regularFont,
    size: 9,
    color: COLOR_MUTED,
  });

  drawTextBlock({
    page,
    text: `This is a computer-generated invoice. GST Number: ${safeText(company.gstNumber)}.`,
    x: tableX,
    top: dispatchTop + 52,
    maxWidth: tableWidth,
    font: regularFont,
    size: 9.5,
    color: COLOR_MUTED,
  });
  drawTextBlock({
    page,
    text: "For support, write to contact@wandernook.in.",
    x: tableX,
    top: dispatchTop + 68,
    maxWidth: tableWidth,
    font: regularFont,
    size: 9.5,
    color: rgb(0x64 / 255, 0x74 / 255, 0x8b / 255),
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
