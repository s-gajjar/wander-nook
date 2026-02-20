import { NextRequest } from "next/server";
import { renderInvoiceDocument } from "@/src/lib/invoice-service";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const html = await renderInvoiceDocument(token);

  if (!html) {
    return new Response("Invoice not found", { status: 404 });
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
