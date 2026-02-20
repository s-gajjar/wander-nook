import { NextRequest } from "next/server";
import { renderInvoiceDocument } from "@/src/lib/invoice-service";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const html = await renderInvoiceDocument(token);

  if (!html) {
    return new Response("Invoice not found", { status: 404 });
  }

  const origin = request.nextUrl.origin;
  const pdfDownloadUrl = `${origin}/invoice/${token}/pdf?download=1`;
  const withActions = html.replace(
    "</body>",
    `
      <div class="invoice-actions" role="toolbar" aria-label="Invoice actions">
        <a href="${pdfDownloadUrl}" class="invoice-action">Download PDF</a>
        <button type="button" class="invoice-action" onclick="window.print()">Print</button>
      </div>
      <style>
        .invoice-actions {
          position: fixed;
          right: 16px;
          top: 16px;
          z-index: 2000;
          display: flex;
          gap: 8px;
          background: rgba(255,255,255,0.92);
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 8px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
          backdrop-filter: blur(4px);
        }
        .invoice-action {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          font: 600 13px/1.2 "Inter", "Segoe UI", sans-serif;
          text-decoration: none;
          border-radius: 8px;
          padding: 8px 10px;
          cursor: pointer;
        }
        .invoice-action:hover {
          background: #f8fafc;
        }
        @media print {
          .invoice-actions { display: none !important; }
        }
      </style>
    </body>`
  );

  return new Response(withActions, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
