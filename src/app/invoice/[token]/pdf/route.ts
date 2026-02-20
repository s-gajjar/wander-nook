import { NextRequest } from "next/server";
import { renderInvoicePdf } from "@/src/lib/invoice-service";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const pdfBuffer = await renderInvoicePdf(token);
    const asDownload = request.nextUrl.searchParams.get("download") === "1";

    if (!pdfBuffer) {
      return new Response("Invoice not found", { status: 404 });
    }

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, no-store",
        "Content-Disposition": `${asDownload ? "attachment" : "inline"}; filename=invoice-${token}.pdf`,
      },
    });
  } catch (error) {
    console.error("Failed to render invoice PDF", error);
    return new Response("Failed to render invoice PDF", { status: 500 });
  }
}
