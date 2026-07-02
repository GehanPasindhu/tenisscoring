import { NextRequest, NextResponse } from "next/server";
import { deleteSet, updateSet } from "@/utils/lib/matches";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const { set } = await req.json();
  await updateSet(setId, set);
  return NextResponse.json(set);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  await deleteSet(setId);
  return new NextResponse(null, { status: 204 });
}
