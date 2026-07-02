import { NextRequest, NextResponse } from "next/server";
import { createMatch, fetchMatches } from "@/utils/lib/matches";

export async function GET() {
  const matches = await fetchMatches();
  return NextResponse.json(matches);
}

export async function POST(req: NextRequest) {
  const { court, category, sideANames, sideBNames } = await req.json();
  const match = await createMatch(court, category, sideANames, sideBNames);
  return NextResponse.json(match, { status: 201 });
}
