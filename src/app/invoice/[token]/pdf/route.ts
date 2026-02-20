import { NextRequest } from "next/server";
import { renderInvoicePdf } from "@/src/lib/invoice-service";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const pdfBuffer = await renderInvoicePdf(token);

  if (!pdfBuffer) {
    return new Response("Invoice not found", { status: 404 });
  }

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename=invoice-${token}.pdf`,
    },
  });
}
