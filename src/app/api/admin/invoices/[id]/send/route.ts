import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, adminUnauthorizedJson } from "@/src/lib/admin-auth";
import { resendInvoiceEmail } from "@/src/lib/invoice-service";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(request)) {
    return adminUnauthorizedJson();
  }

  try {
    const { id } = await context.params;
    const result = await resendInvoiceEmail(id);

    return NextResponse.json({
      ok: true,
      emailSent: result.emailSent,
      emailSkippedReason: result.emailSkippedReason,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to resend invoice email.",
      },
      { status: 500 }
    );
  }
}
