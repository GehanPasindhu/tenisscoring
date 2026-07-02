import { NextRequest, NextResponse } from "next/server";
import { fetchLiveMatchForCourt, fetchMatchDetail } from "@/utils/lib/matches";

export async function GET(req: NextRequest) {
  const court = Number(req.nextUrl.searchParams.get("court"));
  const match = await fetchLiveMatchForCourt(court);
  if (!match) return NextResponse.json(null);

  const detail = await fetchMatchDetail(match.id);
  return NextResponse.json(detail);
}
