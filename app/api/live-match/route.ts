import { supabaseAdmin as supabase } from "@/utils/lib/supabase";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  const court = Number(req.nextUrl.searchParams.get("court"));

  const { data, error } = await supabase
    .from("slpl_matches")
    .select(`
      id,
      court_number,
      team1:team1_id (
        id,
        team_name,
        logo,
        color
      ),
      team2:team2_id (
        id,
        team_name,
        logo,
        color
      ),
      match_category,
      match_stage
    `)
    .eq("court_number", court)
    .eq("status", "live")
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? null);
}
