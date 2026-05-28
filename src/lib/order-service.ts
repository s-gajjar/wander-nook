import { prisma } from "@/src/lib/prisma";
import { sendTransactionalEmail } from "@/src/lib/mailer";
import type { RazorpayOnetimePlanConfig } from "@/src/lib/razorpay-server";

const ORDER_NOTIFICATION_EMAIL = "contact@wandernook.in";

export type OrderCustomerDetails = {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type CreateOrderInput = {
  plan: RazorpayOnetimePlanConfig;
  customer: OrderCustomerDetails;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  paymentMethod: "razorpay-onetime" | "razorpay-autopay";
};

export type CreateOrderResult = {
  orderId: string;
  orderNumber: string;
  customerId: string;
  created: boolean;
  notificationSent: boolean;
  customerEmailSent: boolean;
};

function buildOrderNumber(razorpayOrderId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const suffix = razorpayOrderId.replace(/^order_/i, "").slice(0, 8).toUpperCase();
  return `WN-${year}${month}${day}-${suffix}`;
}

function buildOrderNotificationHtml(input: {
  orderNumber: string;
  customer: OrderCustomerDetails;
  plan: RazorpayOnetimePlanConfig;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  createdAt: Date;
}) {
  const address = [
    input.customer.addressLine1,
    input.customer.addressLine2,
    input.customer.city,
    input.customer.state,
    input.customer.pincode,
    input.customer.country,
  ]
    .filter(Boolean)
    .join(", ");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <h2 style="margin: 0 0 8px; color: #166534; font-size: 20px;">🎉 New Order Received!</h2>
    <p style="margin: 0; font-size: 15px; color: #15803d;">Order <strong>${input.orderNumber}</strong> has been placed.</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <tr>
      <td style="padding: 8px 0; color: #6b7280; width: 140px;">Order Number</td>
      <td style="padding: 8px 0; font-weight: 600;">${input.orderNumber}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #6b7280;">Plan</td>
      <td style="padding: 8px 0; font-weight: 600;">${input.plan.displayName}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #6b7280;">Amount</td>
      <td style="padding: 8px 0; font-weight: 600;">₹${input.plan.amountInr}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #6b7280;">Date</td>
      <td style="padding: 8px 0;">${input.createdAt.toLocaleDateString("en-IN", { dateStyle: "long" })}</td>
    </tr>
  </table>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

  <h3 style="font-size: 16px; margin: 0 0 12px; color: #374151;">Customer Details</h3>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <tr>
      <td style="padding: 6px 0; color: #6b7280; width: 140px;">Name</td>
      <td style="padding: 6px 0;">${input.customer.name}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #6b7280;">Email</td>
      <td style="padding: 6px 0;">${input.customer.email}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #6b7280;">Phone</td>
      <td style="padding: 6px 0;">${input.customer.phone}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #6b7280;">Address</td>
      <td style="padding: 6px 0;">${address}</td>
    </tr>
  </table>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

  <h3 style="font-size: 16px; margin: 0 0 12px; color: #374151;">Payment Details</h3>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <tr>
      <td style="padding: 6px 0; color: #6b7280; width: 140px;">Payment ID</td>
      <td style="padding: 6px 0; font-family: monospace; font-size: 13px;">${input.razorpayPaymentId}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #6b7280;">Order ID</td>
      <td style="padding: 6px 0; font-family: monospace; font-size: 13px;">${input.razorpayOrderId}</td>
    </tr>
  </table>

  <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
    This is an automated notification from Wander Nook.
  </p>
</body>
</html>`.trim();
}

function buildOrderNotificationText(input: {
  orderNumber: string;
  customer: OrderCustomerDetails;
  plan: RazorpayOnetimePlanConfig;
  razorpayPaymentId: string;
  razorpayOrderId: string;
}) {
  return [
    `New Order: ${input.orderNumber}`,
    `Plan: ${input.plan.displayName} - ₹${input.plan.amountInr}`,
    "",
    "Customer:",
    `  Name: ${input.customer.name}`,
    `  Email: ${input.customer.email}`,
    `  Phone: ${input.customer.phone}`,
    `  Address: ${input.customer.addressLine1}${input.customer.addressLine2 ? ", " + input.customer.addressLine2 : ""}, ${input.customer.city}, ${input.customer.state}, ${input.customer.pincode}`,
    "",
    "Payment:",
    `  Razorpay Payment ID: ${input.razorpayPaymentId}`,
    `  Razorpay Order ID: ${input.razorpayOrderId}`,
  ].join("\n");
}

function buildCustomerConfirmationHtml(input: {
  orderNumber: string;
  customer: OrderCustomerDetails;
  plan: RazorpayOnetimePlanConfig;
  createdAt: Date;
}) {
  const address = [
    input.customer.addressLine1,
    input.customer.addressLine2,
    input.customer.city,
    input.customer.state,
    input.customer.pincode,
    input.customer.country,
  ]
    .filter(Boolean)
    .join(", ");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="margin: 0; font-size: 24px; color: #111827;">Wander Nook</h1>
  </div>

  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
    <p style="margin: 0 0 8px; font-size: 28px;">✓</p>
    <h2 style="margin: 0 0 8px; color: #166534; font-size: 20px;">Order Confirmed!</h2>
    <p style="margin: 0; font-size: 15px; color: #15803d;">Thank you for your purchase, ${input.customer.name.split(" ")[0]}!</p>
  </div>

  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <h3 style="margin: 0 0 12px; font-size: 16px; color: #374151;">Order Summary</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Order Number</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right;">${input.orderNumber}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Plan</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right;">${input.plan.displayName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Amount Paid</td>
        <td style="padding: 8px 0; font-weight: 600; text-align: right;">₹${input.plan.amountInr}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Valid For</td>
        <td style="padding: 8px 0; text-align: right;">${input.plan.durationMonths} months</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Date</td>
        <td style="padding: 8px 0; text-align: right;">${input.createdAt.toLocaleDateString("en-IN", { dateStyle: "long" })}</td>
      </tr>
    </table>
  </div>

  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <h3 style="margin: 0 0 12px; font-size: 16px; color: #374151;">Shipping Address</h3>
    <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">
      ${input.customer.name}<br/>
      ${address}<br/>
      Phone: ${input.customer.phone}
    </p>
  </div>

  <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 32px;">
    If you have any questions, reply to this email or reach us at contact@wandernook.in
  </p>
  <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 16px;">
    © ${input.createdAt.getFullYear()} Wander Nook. All rights reserved.
  </p>
</body>
</html>`.trim();
}

function buildCustomerConfirmationText(input: {
  orderNumber: string;
  customer: OrderCustomerDetails;
  plan: RazorpayOnetimePlanConfig;
}) {
  return [
    `Hi ${input.customer.name.split(" ")[0]},`,
    "",
    "Your order has been confirmed! Here are the details:",
    "",
    `Order Number: ${input.orderNumber}`,
    `Plan: ${input.plan.displayName}`,
    `Amount Paid: ₹${input.plan.amountInr}`,
    `Valid For: ${input.plan.durationMonths} months`,
    "",
    "Shipping Address:",
    `${input.customer.addressLine1}${input.customer.addressLine2 ? ", " + input.customer.addressLine2 : ""}`,
    `${input.customer.city}, ${input.customer.state}, ${input.customer.pincode}`,
    `Phone: ${input.customer.phone}`,
    "",
    "If you have any questions, reply to this email or reach us at contact@wandernook.in",
    "",
    "Thank you!",
    "Wander Nook",
  ].join("\n");
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const orderNumber = buildOrderNumber(input.razorpayOrderId);

  // Check for existing order (idempotency via razorpayPaymentId unique constraint)
  const existing = await prisma.order.findUnique({
    where: { razorpayPaymentId: input.razorpayPaymentId },
    select: { id: true, orderNumber: true, customerId: true },
  });

  if (existing) {
    return {
      orderId: existing.id,
      orderNumber: existing.orderNumber,
      customerId: existing.customerId,
      created: false,
      notificationSent: false,
      customerEmailSent: false,
    };
  }

  // Upsert customer
  const customer = await prisma.customer.upsert({
    where: { email: input.customer.email.toLowerCase() },
    update: {
      fullName: input.customer.name,
      phone: input.customer.phone,
      addressLine1: input.customer.addressLine1,
      addressLine2: input.customer.addressLine2 || null,
      city: input.customer.city,
      state: input.customer.state,
      pincode: input.customer.pincode,
      country: input.customer.country || "India",
    },
    create: {
      fullName: input.customer.name,
      email: input.customer.email.toLowerCase(),
      phone: input.customer.phone,
      addressLine1: input.customer.addressLine1,
      addressLine2: input.customer.addressLine2 || null,
      city: input.customer.city,
      state: input.customer.state,
      pincode: input.customer.pincode,
      country: input.customer.country || "India",
    },
  });

  // Create order
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: customer.id,
      planId: input.plan.id,
      planLabel: input.plan.displayName,
      amountPaise: input.plan.amountPaise,
      currency: input.plan.currency,
      status: "paid",
      paymentMethod: input.paymentMethod,
      razorpayPaymentId: input.razorpayPaymentId,
      razorpayOrderId: input.razorpayOrderId,
      shippingAddress: {
        name: input.customer.name,
        addressLine1: input.customer.addressLine1,
        addressLine2: input.customer.addressLine2 || "",
        city: input.customer.city,
        state: input.customer.state,
        pincode: input.customer.pincode,
        country: input.customer.country,
        phone: input.customer.phone,
      },
    },
  });

  // Send notification email to business
  let notificationSent = false;
  try {
    const now = new Date();
    const result = await sendTransactionalEmail({
      to: ORDER_NOTIFICATION_EMAIL,
      subject: `New Order ${orderNumber} - ${input.customer.name} (₹${input.plan.amountInr})`,
      html: buildOrderNotificationHtml({
        orderNumber,
        customer: input.customer,
        plan: input.plan,
        razorpayPaymentId: input.razorpayPaymentId,
        razorpayOrderId: input.razorpayOrderId,
        createdAt: now,
      }),
      text: buildOrderNotificationText({
        orderNumber,
        customer: input.customer,
        plan: input.plan,
        razorpayPaymentId: input.razorpayPaymentId,
        razorpayOrderId: input.razorpayOrderId,
      }),
    });
    notificationSent = result.sent;
  } catch (error) {
    console.error("Failed to send order notification email", error);
  }

  // Send confirmation email to customer
  let customerEmailSent = false;
  try {
    const now = new Date();
    const result = await sendTransactionalEmail({
      to: input.customer.email,
      subject: `Order Confirmed - ${orderNumber} | Wander Nook`,
      html: buildCustomerConfirmationHtml({
        orderNumber,
        customer: input.customer,
        plan: input.plan,
        createdAt: now,
      }),
      text: buildCustomerConfirmationText({
        orderNumber,
        customer: input.customer,
        plan: input.plan,
      }),
    });
    customerEmailSent = result.sent;
  } catch (error) {
    console.error("Failed to send customer confirmation email", error);
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerId: customer.id,
    created: true,
    notificationSent,
    customerEmailSent,
  };
}
