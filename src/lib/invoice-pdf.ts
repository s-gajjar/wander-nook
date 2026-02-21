import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  type InvoiceTemplateInput,
  formatCurrency,
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
    const words = paragraph.split(/\s+/).filter(Boolean);
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
    page.drawText(line, {
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
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
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
  drawTextBlock({
    page,
    text: `Email ID: ${safeText(company.email)}`,
    x: issuerInfoX,
    top: issuerTop + 38,
    maxWidth: 250,
    font: regularFont,
    size: 10.5,
    color: COLOR_MUTED,
  });
  drawTextBlock({
    page,
    text: `Contact Number: ${safeText(company.phone)}`,
    x: issuerInfoX,
    top: issuerTop + 54,
    maxWidth: 250,
    font: regularFont,
    size: 10.5,
    color: COLOR_MUTED,
  });
  drawTextBlock({
    page,
    text: `GST Number: ${safeText(company.gstNumber)}`,
    x: issuerInfoX,
    top: issuerTop + 70,
    maxWidth: 250,
    font: regularFont,
    size: 10.5,
    color: COLOR_MUTED,
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
    top: taxHeaderTop + 14,
    maxWidth: 260,
    font: boldFont,
    size: 24,
    color: COLOR_BRAND,
  });
  drawTextBlock({
    page,
    text: `Invoice No: ${safeText(input.invoiceNumber)}`,
    x: marginX + 14,
    top: taxHeaderTop + 48,
    maxWidth: 280,
    font: regularFont,
    size: 11,
    color: COLOR_MUTED,
  });
  drawTextBlock({
    page,
    text: `Issue Date: ${formatDate(input.issuedAt)}`,
    x: marginX + 14,
    top: taxHeaderTop + 63,
    maxWidth: 280,
    font: regularFont,
    size: 11,
    color: COLOR_MUTED,
  });
  drawTextBlock({
    page,
    text: `Payment Date: ${formatDate(input.paymentCapturedAt || input.issuedAt)}`,
    x: marginX + 14,
    top: taxHeaderTop + 78,
    maxWidth: 320,
    font: regularFont,
    size: 11,
    color: COLOR_MUTED,
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

  const renderInfoBox = (title: string, lines: string[], x: number) => {
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
    drawTextBlock({
      page,
      text: lines.join("\n"),
      x: x + 10,
      top: bodyTop + 24,
      maxWidth: infoBoxW - 20,
      font: regularFont,
      size: 10.5,
      color: COLOR_INK,
      lineHeight: 14,
    });
  };

  renderInfoBox(
    "Billed To",
    [
      safeText(input.customer.fullName),
      safeText(input.customer.email),
      safeText(input.customer.phone),
      safeText(customerAddress),
    ],
    leftInfoX
  );

  renderInfoBox(
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
  const tableTop = bodyTop + infoBoxH + 16;
  const tableWidth = contentWidth;
  const headerHeight = 28;
  const rowHeight = 42;

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
    text: "PERIOD",
    x: tableX + tableWidth - 220,
    top: tableTop + 10,
    maxWidth: 90,
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
    top: tableTop + 44,
    maxWidth: tableWidth - 240,
    font: regularFont,
    size: 10.5,
    color: COLOR_INK,
  });
  drawTextBlock({
    page,
    text: `${formatDate(input.periodStart)} - ${formatDate(input.periodEnd)}`,
    x: tableX + tableWidth - 220,
    top: tableTop + 44,
    maxWidth: 90,
    font: regularFont,
    size: 10.5,
    color: COLOR_INK,
  });
  drawRightAlignedText({
    page,
    text: formatCurrency(input.amountPaise, input.currency),
    rightX: tableX + tableWidth - 18,
    top: tableTop + 44,
    font: regularFont,
    size: 10.5,
    color: COLOR_INK,
  });

  const summaryX = tableX + tableWidth - 250;
  const summaryTop = tableTop + 90;
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
    text: formatCurrency(input.amountPaise, input.currency),
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
    text: formatCurrency(input.amountPaise, input.currency),
    rightX: summaryX + summaryW - 10,
    top: summaryTop + 32,
    font: boldFont,
    size: 11.5,
    color: COLOR_BRAND,
  });

  drawTextBlock({
    page,
    text: `This is a computer-generated invoice. GST Number: ${safeText(company.gstNumber)}.`,
    x: tableX,
    top: summaryTop + 66,
    maxWidth: tableWidth,
    font: regularFont,
    size: 9.5,
    color: COLOR_MUTED,
  });
  drawTextBlock({
    page,
    text: "For support, write to support@wondernook.in.",
    x: tableX,
    top: summaryTop + 82,
    maxWidth: tableWidth,
    font: regularFont,
    size: 9.5,
    color: rgb(0x64 / 255, 0x74 / 255, 0x8b / 255),
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
