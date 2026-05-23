import { describe, it, expect } from "vitest";
import { validateBody, customerSchema, loginSchema, onetimeCreateSchema } from "@/src/lib/validations";

describe("validations", () => {
  describe("customerSchema", () => {
    const validCustomer = {
      name: "Ravi Kumar",
      email: "ravi@example.com",
      phone: "9876543210",
      addressLine1: "123 MG Road",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
    };

    it("accepts valid customer data", () => {
      const result = customerSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = customerSchema.safeParse({ ...validCustomer, name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = customerSchema.safeParse({ ...validCustomer, email: "notanemail" });
      expect(result.success).toBe(false);
    });

    it("rejects short phone", () => {
      const result = customerSchema.safeParse({ ...validCustomer, phone: "123" });
      expect(result.success).toBe(false);
    });

    it("rejects phone with letters", () => {
      const result = customerSchema.safeParse({ ...validCustomer, phone: "98765abc10" });
      expect(result.success).toBe(false);
    });

    it("lowercases email", () => {
      const result = customerSchema.safeParse({ ...validCustomer, email: "RAVI@Example.COM" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("ravi@example.com");
      }
    });

    it("defaults country to India", () => {
      const result = customerSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.country).toBe("India");
      }
    });

    it("rejects missing required fields", () => {
      const result = customerSchema.safeParse({ name: "Test" });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("accepts valid password", () => {
      const result = loginSchema.safeParse({ password: "my-secret" });
      expect(result.success).toBe(true);
    });

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({ password: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing password", () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("onetimeCreateSchema", () => {
    const validBody = {
      planId: "annual-onetime",
      customer: {
        name: "Ravi Kumar",
        email: "ravi@test.com",
        phone: "9876543210",
        addressLine1: "123 Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
    };

    it("accepts valid onetime create body", () => {
      const result = onetimeCreateSchema.safeParse(validBody);
      expect(result.success).toBe(true);
    });

    it("rejects missing planId", () => {
      const result = onetimeCreateSchema.safeParse({ ...validBody, planId: "" });
      expect(result.success).toBe(false);
    });

    it("accepts optional tracking data", () => {
      const result = onetimeCreateSchema.safeParse({
        ...validBody,
        tracking: { fbp: "fb.123", fbc: "fb.456", eventSourceUrl: "https://wandernook.in" },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("validateBody helper", () => {
    it("returns success with valid data", () => {
      const result = validateBody(loginSchema, { password: "test" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBe("test");
      }
    });

    it("returns error message with path for invalid data", () => {
      const result = validateBody(customerSchema, { name: "", email: "bad" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
        expect(typeof result.error).toBe("string");
      }
    });
  });
});
