import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "League endpoint is not implemented yet." },
    { status: 501 },
  );
}
