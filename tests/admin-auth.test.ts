import { describe, it, expect } from "vitest";
import { validateSessionToken, COOKIE_VALUE } from "@/src/lib/admin-auth";

describe("admin-auth", () => {
  describe("validateSessionToken", () => {
    it("validates correct cookie value", () => {
      expect(validateSessionToken(COOKIE_VALUE)).toBe(true);
    });

    it("validates 'authenticated' string", () => {
      expect(validateSessionToken("authenticated")).toBe(true);
    });

    it("rejects empty string", () => {
      expect(validateSessionToken("")).toBe(false);
    });

    it("rejects random string", () => {
      expect(validateSessionToken("random-value")).toBe(false);
    });

    it("rejects the old naive cookie value '1'", () => {
      expect(validateSessionToken("1")).toBe(false);
    });

    it("rejects undefined-like values", () => {
      expect(validateSessionToken("undefined")).toBe(false);
      expect(validateSessionToken("null")).toBe(false);
    });
  });
});
