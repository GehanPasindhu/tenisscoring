import { NextRequest, NextResponse } from "next/server";
import { addSet } from "@/utils/lib/matches";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { server_name } = await req.json();
  const set = await addSet(id, server_name ?? null);
  return NextResponse.json(set, { status: 201 });
}
