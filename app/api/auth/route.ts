import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/utils/lib/supabase";

export const COOKIE = "gs_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

type GSRole = "match_ref" | "scoring_ref";

async function resolveUser(
  username: string,
  password: string,
): Promise<{ role: GSRole; full_name: string | null } | null> {
  // Check match refs
  const { data: matchRef } = await supabaseAdmin
    .from("slpl_match_refs")
    .select("id, password_hash, full_name")
    .eq("username", username.trim())
    .single();

  if (matchRef && (await bcrypt.compare(password, matchRef.password_hash))) {
    return { role: "match_ref", full_name: matchRef.full_name };
  }

  // Check scoring refs
  const { data: scoringRef } = await supabaseAdmin
    .from("slpl_refree_logins")
    .select("id, password_hash, full_name")
    .eq("username", username.trim())
    .single();

  if (scoringRef && (await bcrypt.compare(password, scoringRef.password_hash))) {
    return { role: "scoring_ref", full_name: scoringRef.full_name };
  }

  return null;
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const user = await resolveUser(username, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const payload = JSON.stringify({ role: user.role, full_name: user.full_name });
  const res = NextResponse.json({ ok: true, role: user.role, full_name: user.full_name });
  res.cookies.set(COOKIE, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}

export async function GET(req: NextRequest) {
  const raw = req.cookies.get(COOKIE)?.value;
  if (!raw) return NextResponse.json({ loggedIn: false });
  try {
    const { role, full_name } = JSON.parse(raw);
    return NextResponse.json({ loggedIn: true, role, full_name });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
