import { supabaseAdmin as supabase } from "@/utils/lib/supabase";
import { NextResponse } from "next/server";

// GET /api/matches/scores?match_id=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const match_id = searchParams.get("match_id");
  if (!match_id) return NextResponse.json({ error: "match_id required" }, { status: 400 });

  const { data: match, error: matchError } = await supabase
    .from("slpl_matches")
    .select("id, team1_id, team2_id, team1:team1_id(id, team_name), team2:team2_id(id, team_name)")
    .eq("id", match_id)
    .single();
  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 });

  const { data: sets } = await supabase
    .from("slpl_sets")
    .select("id, set_number, winner_team_id")
    .eq("match_id", match_id)
    .is("deleted_at", null)
    .order("set_number");

  const setIds = (sets ?? []).map((s: any) => s.id);

  // Fetch regular games only — exclude any legacy tiebreak rows, newest first
  const { data: games } = setIds.length > 0
    ? await supabase
        .from("slpl_set_games")
        .select("id, set_id, game_number, winner_team_id, team1_points, team2_points, is_golden_point")
        .in("set_id", setIds)
        .neq("is_tiebreak_game", true)
        .is("deleted_at", null)
        .order("game_number", { ascending: false })
    : { data: [] };

  // Fetch tiebreaks from dedicated table
  const { data: tiebreaks } = setIds.length > 0
    ? await supabase
        .from("slpl_tie_breaks")
        .select("set_id, team1_tie_points, team2_tie_points")
        .in("set_id", setIds)
    : { data: [] };

  const tiebreakMap: Record<string, { team1_tie_points: number | null; team2_tie_points: number | null }> = {};
  (tiebreaks ?? []).forEach((tb: any) => {
    tiebreakMap[tb.set_id] = {
      team1_tie_points: tb.team1_tie_points,
      team2_tie_points: tb.team2_tie_points,
    };
  });

  return NextResponse.json({
    team1: (match as any).team1,
    team2: (match as any).team2,
    sets: (sets ?? []).map((s: any) => ({
      id: s.id,
      set_number: s.set_number,
      winner_team_id: s.winner_team_id,
      games: (games ?? []).filter((g: any) => g.set_id === s.id),
      tiebreak: tiebreakMap[s.id] ?? null,
    })),
  });
}

// POST /api/matches/scores — create a new empty set for a match, returns { id, set_number }
export async function POST(request: Request) {
  const { match_id, set_number } = await request.json();
  if (!match_id || !set_number)
    return NextResponse.json({ error: "match_id and set_number required" }, { status: 400 });

  const { data, error } = await supabase
    .from("slpl_sets")
    .insert([{ match_id, set_number }])
    .select("id, set_number")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// PUT /api/matches/scores
// Body: { match_id, sets: [{ set_number, winner_team_id, games: [...], tiebreak: { team1_tie_points, team2_tie_points } | null }] }
export async function PUT(request: Request) {
  const { match_id, sets } = await request.json();
  if (!match_id || !Array.isArray(sets))
    return NextResponse.json({ error: "match_id and sets required" }, { status: 400 });

  for (const s of sets) {
    // Upsert the set row
    const { data: setRow, error: setErr } = await supabase
      .from("slpl_sets")
      .upsert(
        {
          match_id,
          set_number: s.set_number,
          winner_team_id: s.winner_team_id || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "match_id,set_number" },
      )
      .select("id")
      .single();
    if (setErr) return NextResponse.json({ error: setErr.message }, { status: 400 });

    const set_id = setRow.id;

    // Delete all existing games for this set (including any legacy tiebreak games) then re-insert
    await supabase.from("slpl_set_games").delete().eq("set_id", set_id);

    if (s.games && s.games.length > 0) {
      const gameRows = s.games
        .filter((g: any) => !g.is_tiebreak_game)   // never write tiebreak games here
        .map((g: any, idx: number) => ({
          match_id,
          set_id,
          game_number: g.game_number ?? idx + 1,
          winner_team_id: g.winner_team_id || null,
          team1_points: g.team1_points ?? "0",
          team2_points: g.team2_points ?? "0",
          is_tiebreak_game: false,
          is_golden_point: g.is_golden_point ?? false,
        }));
      if (gameRows.length > 0) {
        const { error: gErr } = await supabase.from("slpl_set_games").insert(gameRows);
        if (gErr) return NextResponse.json({ error: gErr.message }, { status: 400 });
      }
    }

    // Handle tiebreak — delete then re-insert into slpl_tie_breaks
    await supabase.from("slpl_tie_breaks").delete().eq("set_id", set_id);

    if (s.tiebreak !== null && s.tiebreak !== undefined) {
      const { error: tbErr } = await supabase.from("slpl_tie_breaks").insert({
        match_id,
        set_id,
        team1_tie_points: s.tiebreak.team1_tie_points ?? 0,
        team2_tie_points: s.tiebreak.team2_tie_points ?? 0,
      });
      if (tbErr) return NextResponse.json({ error: tbErr.message }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/matches/scores?set_id=...
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const set_id = searchParams.get("set_id");
  if (!set_id) return NextResponse.json({ error: "set_id required" }, { status: 400 });

  // Delete tiebreak and games first (in case CASCADE isn't set), then the set
  await supabase.from("slpl_tie_breaks").delete().eq("set_id", set_id);
  await supabase.from("slpl_set_games").delete().eq("set_id", set_id);
  const { error } = await supabase.from("slpl_sets").delete().eq("id", set_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
