import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/utils/lib/db";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT role, full_name FROM credentials WHERE username = ? AND password = ?",
    [username, password],
  );

  const cred = rows[0];
  if (!cred) {
    return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
  }

  return NextResponse.json({ role: cred.role, full_name: cred.full_name });
}
