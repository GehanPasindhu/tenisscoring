import { NextRequest, NextResponse } from "next/server";
import { deleteMatch, fetchMatchDetail, updateMatch } from "@/utils/lib/matches";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await fetchMatchDetail(id);
  if (!detail) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  return NextResponse.json(detail);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { category, sideANames, sideBNames } = await req.json();
  const match = await updateMatch(id, category, sideANames, sideBNames);
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  return NextResponse.json(match);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteMatch(id);
  return new NextResponse(null, { status: 204 });
}
