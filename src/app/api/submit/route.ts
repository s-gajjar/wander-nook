import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body: {
      name: string;
      email: string;
      contactNo: string;
      city: string;
      schoolName: string;
    } = await req.json();

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbyH6xdP3a9GSO2kSFMPm-JwaRvp65gkwGUAxw3msZKyu3WhBOaL-Xnv9ctmRK-9NV-n/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const text = await response.text();
      return NextResponse.json(
        { success: false, error: "Non-JSON response from Google", details: text },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: false, message: "Method not allowed" }, { status: 405 });
}
