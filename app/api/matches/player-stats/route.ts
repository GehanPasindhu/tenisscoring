import { supabaseAdmin as supabase } from "@/utils/lib/supabase";
import { NextResponse } from "next/server";

// ─── Types ──────────────────────────────────────────────────────────────
interface PlayerStat {
  player_id: string;
  team_id: string;
  aces?: number;
  double_faults?: number;
  winners?: number;
  unforced_errors?: number;
   season_id?: string;
}

interface Match {
  id: string;
  team1_id: string;
  team2_id: string;
  team1: { id: string; team_name: string } | null;
  team2: { id: string; team_name: string } | null;
}

// GET /api/matches/player-stats?match_id=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const match_id = searchParams.get("match_id");
  if (!match_id) return NextResponse.json({ error: "match_id required" }, { status: 400 });

  // Get match teams
  const { data: match, error: matchError } = await supabase
    .from("slpl_matches")
    .select(
      "id, team1_id, team2_id, team1:team1_id(id, team_name), team2:team2_id(id, team_name)"
    )
    .eq("id", match_id)
    .single();
  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 });

  // Get roster for this match
  const { data: rosterRows } = await supabase
    .from("slpl_match_players")
    .select(`player_id, team_id, slpl_players(id, first_name, last_name)`)
    .eq("match_id", match_id);

  // Get existing stats
  const { data: existingStats } = await supabase
    .from("slpl_match_player_stats")
    .select("player_id, team_id, aces, double_faults, winners, unforced_errors")
    .eq("match_id", match_id);

  const statsMap: Record<string, PlayerStat> = {};
  (existingStats ?? []).forEach((s) => { statsMap[s.player_id] = s; });

  const roster = (rosterRows ?? []).map((row) => {
    const rawP = row.slpl_players as { id: string; first_name: string; last_name: string } | { id: string; first_name: string; last_name: string }[] | null;
    const p = Array.isArray(rawP) ? rawP[0] : rawP;
    const s = statsMap[row.player_id] ?? {};
    return {
      player_id: row.player_id,
      team_id: row.team_id,
      first_name: p?.first_name ?? "",
      last_name: p?.last_name ?? "",
      aces: s.aces ?? 0,
      double_faults: s.double_faults ?? 0,
      winners: s.winners ?? 0,
      unforced_errors: s.unforced_errors ?? 0,
    };
  });

  return NextResponse.json({
    team1: match?.team1 ?? null,
    team2: match?.team2 ?? null,
    roster,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const match_id = body.match_id as string;
  const stats = body.stats as PlayerStat[];

  if (!match_id || !Array.isArray(stats))
    return NextResponse.json({ error: "match_id and stats required" }, { status: 400 });

  // Replace old stats with new ones
  const { error: delErr } = await supabase
    .from("slpl_match_player_stats")
    .delete()
    .eq("match_id", match_id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (stats.length > 0) {
    const rows = stats.map((s) => ({
      match_id,
      player_id: s.player_id,
      team_id: s.team_id,
      aces: s.aces ?? 0,
      double_faults: s.double_faults ?? 0,
      winners: s.winners ?? 0,
      unforced_errors: s.unforced_errors ?? 0,
        season_id: s.season_id, 
    }));
    const { error } = await supabase.from("slpl_match_player_stats").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
