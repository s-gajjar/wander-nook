import { describe, it, expect } from "vitest";
import crypto from "crypto";

// Re-implement the webhook signature verification for isolated testing
function verifyWebhookSignature(rawBody: string, signature: string, secret: string) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  if (signature.length !== expectedSignature.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "utf8"),
    Buffer.from(signature, "utf8")
  );
}

describe("webhook signature verification", () => {
  const secret = "test_webhook_secret_123";

  it("accepts valid signature", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: {} });
    const signature = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("hex");

    expect(verifyWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("rejects invalid signature", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: {} });
    const fakeSignature = "a".repeat(64); // wrong signature

    expect(verifyWebhookSignature(body, fakeSignature, secret)).toBe(false);
  });

  it("rejects tampered body", () => {
    const originalBody = JSON.stringify({ event: "payment.captured", amount: 1000 });
    const signature = crypto
      .createHmac("sha256", secret)
      .update(originalBody, "utf8")
      .digest("hex");

    const tamperedBody = JSON.stringify({ event: "payment.captured", amount: 99999 });
    expect(verifyWebhookSignature(tamperedBody, signature, secret)).toBe(false);
  });

  it("rejects empty signature", () => {
    const body = JSON.stringify({ event: "test" });
    expect(verifyWebhookSignature(body, "", secret)).toBe(false);
  });

  it("rejects wrong secret", () => {
    const body = JSON.stringify({ event: "test" });
    const signature = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("hex");

    expect(verifyWebhookSignature(body, signature, "wrong_secret")).toBe(false);
  });

  it("handles unicode body correctly", () => {
    const body = JSON.stringify({ name: "रवि कुमार", event: "payment.captured" });
    const signature = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("hex");

    expect(verifyWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("is sensitive to whitespace differences", () => {
    const body1 = '{"event":"test"}';
    const body2 = '{ "event": "test" }';
    const signature = crypto
      .createHmac("sha256", secret)
      .update(body1, "utf8")
      .digest("hex");

    expect(verifyWebhookSignature(body1, signature, secret)).toBe(true);
    expect(verifyWebhookSignature(body2, signature, secret)).toBe(false);
  });
});
