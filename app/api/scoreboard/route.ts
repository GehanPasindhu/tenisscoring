import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/lib/supabase";

const SCRIPT_URL = process.env.GSCRIPT_SCOREBOARD_URL;

export async function POST(req: Request) {
  if (!SCRIPT_URL) {
    return NextResponse.json(
      { error: "GSCRIPT_SCOREBOARD_URL not configured" },
      { status: 500 },
    );
  }

  const {
    court_number,
    team1_id,
    team2_id,
    t1_name,
    t1_logo,
    t2_name,
    t2_logo,
    t1_game_points,
    t2_game_points,
    t1_set1,
    t1_set2,
    t1_set3,
    t2_set1,
    t2_set2,
    t2_set3,
    t1_sets_won,
    t2_sets_won,
    t1_games_won,
    t2_games_won,
    t1_match_points,
    t2_match_points,
    match_category,
    match_stage,
  } = await req.json();

  if (!court_number || !t1_name || !t2_name) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  // Fetch standings points server-side, scoped to the match's own stage/group.
  // "group" stage spans multiple groups (Group A, Group B, ...), so each team's
  // OWN group_id is used; knockout stages map 1:1 to a single group via match_stage.
  let t1_total = 0;
  let t2_total = 0;
  if (team1_id && team2_id) {
    const isGroupStage = !match_stage || match_stage === "group";

    let t1_group_id: string | null = null;
    let t2_group_id: string | null = null;

    if (isGroupStage) {
      const { data: teamRows } = await supabaseAdmin
        .from("slpl_teams")
        .select("id, group_id")
        .in("id", [team1_id, team2_id]);
      t1_group_id = teamRows?.find((t) => t.id === team1_id)?.group_id ?? null;
      t2_group_id = teamRows?.find((t) => t.id === team2_id)?.group_id ?? null;
    } else {
      const { data: group } = await supabaseAdmin
        .from("slpl_groups")
        .select("id")
        .eq("match_stage", match_stage)
        .maybeSingle();
      t1_group_id = group?.id ?? null;
      t2_group_id = group?.id ?? null;
    }

    const { data: standings } = await supabaseAdmin
      .from("slpl_league_standings")
      .select("team_id, group_id, points")
      .in("team_id", [team1_id, team2_id]);

    if (standings) {
      for (const row of standings) {
        if (row.team_id === team1_id && row.group_id === t1_group_id) t1_total = row.points ?? 0;
        if (row.team_id === team2_id && row.group_id === t2_group_id) t2_total = row.points ?? 0;
      }
    }
  }

  const TEAM_BGCOLOR: Record<string, string> = {
    "Ahangama Ballers": "0f2f1a",
    "Ella Archers": "32572d",
    "Colombo Aces": "201e5a",
    "Galle Fort Mariners": "14253f",
    "Yala Rangers": "03462f",
    "Trinco Titans": "201e5a",
    "The Recovery Room Arugambay": "0c0c0c",
    "Weligama Sharks": "441111",
  };

  const TEAM_BGCOLOR_LIGHT: Record<string, string> = {
    "Ahangama Ballers": "#1d964d",
    "Ella Archers": "#83ab3f",
    "Colombo Aces": "#217ab7",
    "Galle Fort Mariners": "#424278",
    "Yala Rangers": "#a2a337",
    "Trinco Titans": "#3a518e",
    "The Recovery Room Arugambay": "#4c4c4d",
    "Weligama Sharks": "#d22027",
  };

  const TEAM_SHORT_NAME: Record<string, string> = {
    "Ahangama Ballers": "Ballers",
    "Ella Archers": "Archers",
    "Colombo Aces": "Aces",
    "Galle Fort Mariners": "Mariners",
    "Yala Rangers": "Rangers",
    "Trinco Titans": "Titans",
    "The Recovery Room Arugambay": "TRR Arugambay",
    "Weligama Sharks": "Sharks",
  };

  const t1_bgcolor = TEAM_BGCOLOR[t1_name?.trim()] ?? "441111";
  const t2_bgcolor = TEAM_BGCOLOR[t2_name?.trim()] ?? "441111";
  const t1_bgcolor_lite = TEAM_BGCOLOR_LIGHT[t1_name?.trim()] ?? "#1d964d";
  const t2_bgcolor_lite = TEAM_BGCOLOR_LIGHT[t2_name?.trim()] ?? "#83ab3f";
  const t1_short = TEAM_SHORT_NAME[t1_name?.trim()] ?? t1_name;
  const t2_short = TEAM_SHORT_NAME[t2_name?.trim()] ?? t2_name;

  const sheet = court_number === 1 ? "C1_Scoreboard" : "C2_Scoreboard";

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sheet,
        t1_logo: t1_logo ?? "",
        t1_name: t1_short,
        t1_bgcolor,
        t1_game_points: t1_game_points ?? 0,
        t1_set1: t1_set1 ?? "",
        t1_set2: t1_set2 ?? "",
        t1_set3: t1_set3 ?? "",
        t1_total,
        t2_logo: t2_logo ?? "",
        t2_name: t2_short,
        t2_bgcolor,
        t2_game_points: t2_game_points ?? 0,
        t2_set1: t2_set1 ?? "",
        t2_set2: t2_set2 ?? "",
        t2_set3: t2_set3 ?? "",
        t2_total,
        t1_bgcolor_lite,
        t2_bgcolor_lite,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: 502 });
    }

    // Push to matchstat sheet (C1_matchstat / C2_matchstat)
    const TEAM_BACKGROUND_MAP: Record<string, string> = {
      "Colombo Aces":
        "//image.singular.live/63e33f1478e661a53fde274c4f20b74c/images/5JO1cJxSHkStZtSkyZdsPV_w774h979.png",
      "Ahangama Ballers":
        "//image.singular.live/63e33f1478e661a53fde274c4f20b74c/images/0P1hhYV0hqKfvhtrxCFn82_w774h979.png",
      "Ella Archers":
        "//image.singular.live/63e33f1478e661a53fde274c4f20b74c/images/6td0M0e4MYqrfFRUoxQFg1_w774h979.png",
      "Galle Fort Mariners":
        "//image.singular.live/63e33f1478e661a53fde274c4f20b74c/images/1UUv9MNxKR7ieiYQcelNQw_w774h979.png",
      "Yala Rangers":
        "//image.singular.live/63e33f1478e661a53fde274c4f20b74c/images/0YPeCZ6oFEILUdcBruur9i_w774h979.png",
      "Trinco Titans":
        "//image.singular.live/63e33f1478e661a53fde274c4f20b74c/images/5Ok7oIb1itPhuRL53nvwaG_w774h979.png",
      "The Recovery Room Arugambay":
        "//image.singular.live/63e33f1478e661a53fde274c4f20b74c/images/01ZxYYGagfP0le4btF6ghJ_w774h979.png",
      "Weligama Sharks":
        "//image.singular.live/63e33f1478e661a53fde274c4f20b74c/images/5Yly5wLAH7J4napZ7ZiiRZ_w774h979.png",
      "Eventistry Sports - 1":
        "//image.singular.live/63e33f1478e661a53fde274c4f20b74c/images/5Yly5wLAH7J4napZ7ZiiRZ_w774h979.png",
    };
    const DEFAULT_BG =
      "//image.singular.live/63e33f1478e661a53fde274c4f20b74c/images/5JO1cJxSHkStZtSkyZdsPV_w774h979.png";

    const matchsetSheet = court_number === 1 ? "C1_matchstat" : "C2_matchstat";
    fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sheet: matchsetSheet,
        t1_name,
        t1_sets_won: t1_sets_won ?? 0,
        t1_games_won: t1_games_won ?? 0,
        t1_match_points: t1_match_points ?? 0,
        t1_league_points: t1_total,
        t1_logo: t1_logo ?? "",
        t1_background: TEAM_BACKGROUND_MAP[t1_name?.trim()] ?? DEFAULT_BG,
        t1_bgcolor,
        t2_name,
        t2_sets_won: t2_sets_won ?? 0,
        t2_games_won: t2_games_won ?? 0,
        t2_match_points: t2_match_points ?? 0,
        t2_league_points: t2_total,
        t2_logo: t2_logo ?? "",
        t2_background: TEAM_BACKGROUND_MAP[t2_name?.trim()] ?? DEFAULT_BG,
        t2_bgcolor,
        games_cat: match_category ?? "",
      }),
    }).catch(console.error);

    return NextResponse.json({ ok: true, t1_total, t2_total });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
