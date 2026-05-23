import { prisma } from "@/src/lib/prisma";

export type AuditAction =
  | "order.create"
  | "order.fulfill"
  | "order.ship"
  | "order.deliver"
  | "order.update_tracking"
  | "invoice.create"
  | "invoice.resend"
  | "customer.create"
  | "customer.update"
  | "webhook.process"
  | "webhook.fail"
  | "admin.login"
  | "admin.logout"
  | "export.customers"
  | "export.invoices"
  | "export.orders";

export type AuditLogInput = {
  actor: "admin" | "system" | "webhook";
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
};

/**
 * Records an audit log entry. Non-blocking — never throws.
 */
export async function recordAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actor: input.actor,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        metadata: (input.metadata as object) ?? undefined,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error("[audit-log] Failed to record:", input.action, error);
  }
}

/**
 * Get client IP from request headers (Vercel forwarding).
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
