import { NextRequest, NextResponse } from "next/server";
import { setMatchStatus } from "@/utils/lib/matches";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  const match = await setMatchStatus(id, status);
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  return NextResponse.json(match);
}
