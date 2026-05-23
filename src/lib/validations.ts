import { z } from "zod/v4";

/**
 * Shared validation schemas for API request bodies.
 */

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required").max(120).trim(),
  email: z.string().email("Invalid email address").max(120).trim().toLowerCase(),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(15)
    .regex(/^\d+$/, "Phone must contain only digits"),
  addressLine1: z.string().min(1, "Address is required").max(120).trim(),
  addressLine2: z.string().max(120).trim().optional().default(""),
  city: z.string().min(1, "City is required").max(80).trim(),
  state: z.string().min(1, "State is required").max(80).trim(),
  pincode: z.string().min(4, "Pincode is required").max(20).trim(),
  country: z.string().max(60).trim().optional().default("India"),
});

export const trackingSchema = z.object({
  fbp: z.string().max(120).optional().default(""),
  fbc: z.string().max(240).optional().default(""),
  eventSourceUrl: z.string().max(300).optional().default(""),
});

export const onetimeCreateSchema = z.object({
  planId: z.string().min(1, "Plan ID is required").max(40).trim(),
  customer: customerSchema,
  tracking: trackingSchema.optional(),
});

export const autopayCreateSchema = z.object({
  planId: z.string().min(1, "Plan ID is required").max(40).trim(),
  customer: customerSchema,
  tracking: trackingSchema.optional(),
});

export const onetimeVerifySchema = z.object({
  planId: z.string().min(1).max(40).trim(),
  customer: customerSchema,
  payment: z.object({
    razorpayPaymentId: z.string().min(1, "Payment ID required").max(80).trim(),
    razorpayOrderId: z.string().min(1, "Order ID required").max(80).trim(),
    razorpaySignature: z.string().min(1, "Signature required").max(200).trim(),
  }),
  tracking: trackingSchema.optional(),
});

export const fulfillmentUpdateSchema = z.object({
  fulfillmentStatus: z
    .enum(["unfulfilled", "fulfilled", "shipped", "delivered"])
    .optional(),
  trackingNumber: z.string().max(100).trim().optional(),
  trackingUrl: z.string().url().max(500).or(z.literal("")).optional(),
});

export const loginSchema = z.object({
  password: z.string().min(1, "Password is required").max(200),
});

export const newsletterSchema = z.object({
  email: z.string().email("Invalid email address").max(120).trim().toLowerCase(),
  name: z.string().max(120).trim().optional(),
  source: z.string().max(50).trim().optional(),
});

export const sampleRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(120).trim(),
  email: z.string().email("Invalid email address").max(120).trim().toLowerCase(),
  contactNo: z.string().max(20).trim().optional(),
  city: z.string().max(80).trim().optional(),
  schoolName: z.string().max(200).trim().optional(),
});

/**
 * Validates a request body against a Zod schema.
 * Returns either the validated data or an error response.
 */
export function validateBody<T>(
  schema: z.ZodType<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    const path = firstError.path.length > 0 ? `${firstError.path.join(".")}: ` : "";
    return { success: false, error: `${path}${firstError.message}` };
  }
  return { success: true, data: result.data };
}
