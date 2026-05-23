import { describe, it, expect, beforeAll } from "vitest";
import { createSessionToken, validateSessionToken } from "@/src/lib/admin-auth";

// Set test secret
beforeAll(() => {
  process.env.ADMIN_PASSWORD = "test-secret-password-123";
});

describe("admin-auth", () => {
  describe("createSessionToken", () => {
    it("creates a token in the format timestamp.signature", () => {
      const token = createSessionToken();
      expect(token).toMatch(/^\d+\.[a-f0-9]+$/);
    });

    it("creates tokens with current timestamp", () => {
      const token = createSessionToken();
      const [timestampStr] = token.split(".");
      const timestamp = parseInt(timestampStr, 10);
      const now = Math.floor(Date.now() / 1000);
      expect(Math.abs(timestamp - now)).toBeLessThan(2);
    });
  });

  describe("validateSessionToken", () => {
    it("validates a freshly created token", () => {
      const token = createSessionToken();
      expect(validateSessionToken(token)).toBe(true);
    });

    it("rejects empty string", () => {
      expect(validateSessionToken("")).toBe(false);
    });

    it("rejects token without dot separator", () => {
      expect(validateSessionToken("nodotshere")).toBe(false);
    });

    it("rejects token with invalid timestamp", () => {
      expect(validateSessionToken("notanumber.abc123")).toBe(false);
    });

    it("rejects token with wrong signature", () => {
      const token = createSessionToken();
      const [timestamp] = token.split(".");
      expect(validateSessionToken(`${timestamp}.deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef`)).toBe(false);
    });

    it("rejects expired token (>8 hours old)", () => {
      // Create a token with timestamp 9 hours in the past
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 9 * 60 * 60;
      const crypto = require("crypto");
      const payload = `admin:${expiredTimestamp}`;
      const signature = crypto
        .createHmac("sha256", process.env.ADMIN_PASSWORD)
        .update(payload)
        .digest("hex");
      const expiredToken = `${expiredTimestamp}.${signature}`;
      expect(validateSessionToken(expiredToken)).toBe(false);
    });

    it("accepts token within 8 hour window", () => {
      // Create a token with timestamp 7 hours ago (still valid)
      const recentTimestamp = Math.floor(Date.now() / 1000) - 7 * 60 * 60;
      const crypto = require("crypto");
      const payload = `admin:${recentTimestamp}`;
      const signature = crypto
        .createHmac("sha256", process.env.ADMIN_PASSWORD)
        .update(payload)
        .digest("hex");
      const validToken = `${recentTimestamp}.${signature}`;
      expect(validateSessionToken(validToken)).toBe(true);
    });

    it("rejects the old naive cookie value '1'", () => {
      expect(validateSessionToken("1")).toBe(false);
    });
  });
});
