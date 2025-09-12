import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url) {
      return new Response("Missing url", { status: 400 });
    }

    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return new Response("Failed to fetch file", { status: 502 });
    }

    const filename = "Wander Nook Launch.pdf";
    const headers = new Headers(upstream.headers);
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.delete("transfer-encoding");

    return new Response(upstream.body, { status: 200, headers });
  } catch (e) {
    console.error("Download proxy error", e);
    return new Response("Server error", { status: 500 });
  }
} 