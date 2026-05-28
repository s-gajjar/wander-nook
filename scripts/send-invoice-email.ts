import { prisma } from "@/src/lib/prisma";
import { sendTransactionalEmail } from "@/src/lib/mailer";
import { generateInvoicePdfBuffer } from "@/src/lib/invoice-pdf";
import { renderInvoiceEmailHtml, formatCurrency, type InvoiceTemplateInput } from "@/src/lib/invoice-template";
import { getSiteUrl } from "@/src/lib/site-url";

const invoiceId = "cmpp8d5oq00029km3m3dbm79d";

async function main() {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { customer: true },
  });

  if (!invoice) {
    console.error("Invoice not found");
    process.exit(1);
  }

  console.log(`Sending invoice ${invoice.invoiceNumber} to ${invoice.customer.email}...`);

  const templateInput: InvoiceTemplateInput = {
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt,
    paymentCapturedAt: invoice.paymentCapturedAt,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
    amountPaise: invoice.amountPaise,
    currency: invoice.currency,
    billingCycle: invoice.billingCycle,
    planLabel: invoice.planLabel,
    razorpayPaymentId: invoice.razorpayPaymentId,
    razorpaySubscriptionId: invoice.razorpaySubscriptionId,
    razorpayInvoiceId: invoice.razorpayInvoiceId,
    shopifyOrderName: invoice.shopifyOrderName,
    customer: {
      fullName: invoice.customer.fullName,
      email: invoice.customer.email,
      phone: invoice.customer.phone,
      addressLine1: invoice.customer.addressLine1 || "",
      addressLine2: invoice.customer.addressLine2,
      city: invoice.customer.city || "",
      state: invoice.customer.state || "",
      pincode: invoice.customer.pincode || "",
      country: invoice.customer.country || "India",
    },
  };

  const pdfBuffer = await generateInvoicePdfBuffer(templateInput);
  console.log(`PDF generated: ${pdfBuffer.length} bytes`);

  const invoiceUrl = `${getSiteUrl()}/invoice/${invoice.publicToken}`;
  const emailHtml = renderInvoiceEmailHtml({
    customerName: invoice.customer.fullName,
    invoiceNumber: invoice.invoiceNumber,
    invoiceUrl,
    amountPaise: invoice.amountPaise,
    currency: invoice.currency,
    planLabel: invoice.planLabel,
    billingCycle: invoice.billingCycle,
    issuedAt: invoice.issuedAt,
  });

  const result = await sendTransactionalEmail({
    to: invoice.customer.email,
    subject: `Invoice ${invoice.invoiceNumber} - Wander Nook`,
    html: emailHtml,
    text: `Hi ${invoice.customer.fullName}, your invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.amountPaise, invoice.currency)} (${invoice.planLabel}) is attached. View online: ${invoiceUrl}`,
    attachments: [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  console.log("Email result:", result);

  if (result.sent) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { emailSentAt: new Date() },
    });
    console.log("✓ Email sent and invoice marked as emailed!");
  } else {
    console.log("✗ Email not sent:", result.skippedReason);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
