import { supabaseAdmin as supabase } from "@/utils/lib/supabase";
import { NextResponse } from "next/server";

function formatCategory(cat: string | null): string {
  if (!cat) return "";
  return cat.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// GET /api/matches/players?match_id=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const match_id = searchParams.get("match_id");
  if (!match_id) return NextResponse.json({ error: "match_id required" }, { status: 400 });

  // Get match to know the two team IDs
  const { data: match, error: matchError } = await supabase
    .from("slpl_matches")
    .select("id, team1_id, team2_id")
    .eq("id", match_id)
    .single();

  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 });

  const teamIds = [match.team1_id, match.team2_id].filter(Boolean);

  // Fetch all players in either team
  const { data: teamPlayers, error: tpError } = await supabase
    .from("slpl_team_players")
    .select(`
      team_id,
      player_id,
      slpl_players!inner (
        id, first_name, last_name,
        slpl_player_profiles ( profile_photo )
      )
    `)
    .in("team_id", teamIds)
    .is("slpl_players.deleted_at", null);

  if (tpError) return NextResponse.json({ error: tpError.message }, { status: 500 });

  // Fetch already-assigned players for this match
  const { data: assigned, error: assignedError } = await supabase
    .from("slpl_match_players")
    .select("player_id, team_id")
    .eq("match_id", match_id);

  if (assignedError) return NextResponse.json({ error: assignedError.message }, { status: 500 });

  const assignedSet = new Set((assigned ?? []).map((a: any) => a.player_id));

  const roster = (teamPlayers ?? []).map((tp: any) => {
    const p = tp.slpl_players;
    const profile = Array.isArray(p.slpl_player_profiles) ? p.slpl_player_profiles[0] : p.slpl_player_profiles;
    return {
      player_id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      profile_photo: profile?.profile_photo ?? null,
      team_id: tp.team_id,
      selected: assignedSet.has(p.id),
    };
  });

  return NextResponse.json({
    team1_id: match.team1_id,
    team2_id: match.team2_id,
    roster,
  });
}

// POST /api/matches/players  — set selected players for a match (replaces all)
export async function POST(request: Request) {
  const { match_id, players } = await request.json();
  // players: { player_id: string; team_id: string }[]

  if (!match_id) return NextResponse.json({ error: "match_id required" }, { status: 400 });

  // Snapshot existing assignments before replacing
  const { data: prevAssigned } = await supabase
    .from("slpl_match_players")
    .select("player_id")
    .eq("match_id", match_id);

  const prevSet = new Set((prevAssigned ?? []).map((a: any) => a.player_id));
  const newPlayers: { player_id: string; team_id: string }[] = players ?? [];
  const newSet = new Set(newPlayers.map((p) => p.player_id));

  // Players added in this save (not in previous set)
  const newlyAdded = newPlayers.filter((p) => !prevSet.has(p.player_id));

  // Delete all existing then re-insert
  const { error: delError } = await supabase
    .from("slpl_match_players")
    .delete()
    .eq("match_id", match_id);

  if (delError) return NextResponse.json({ error: delError.message }, { status: 400 });

  if (newPlayers.length > 0) {
    const rows = newPlayers.map((p) => ({
      match_id,
      player_id: p.player_id,
      team_id: p.team_id,
    }));
    const { error: insError } = await supabase.from("slpl_match_players").insert(rows);
    if (insError) return NextResponse.json({ error: insError.message }, { status: 400 });
  }

  // Notify newly added players
  if (newlyAdded.length > 0) {
    // Fetch match details for the notification message
    const { data: matchInfo } = await supabase
      .from("slpl_matches")
      .select(`
        id, scheduled_at, court_number, match_category,
        team1:team1_id(team_name),
        team2:team2_id(team_name)
      `)
      .eq("id", match_id)
      .single();

    const t1 = (matchInfo as any)?.team1?.team_name ?? "Team 1";
    const t2 = (matchInfo as any)?.team2?.team_name ?? "Team 2";
    const cat = (matchInfo as any)?.match_category ?? null;
    const court = (matchInfo as any)?.court_number;
    const dateStr = matchInfo?.scheduled_at
      ? new Date(matchInfo.scheduled_at).toLocaleString("en-US", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
        })
      : "";

    const notifTitle = "You've been selected for a match!";
    const notifBody = `${cat ? `[${formatCategory(cat)}] ` : ""}${t1} vs ${t2}${court ? ` — Court ${court}` : ""}${dateStr ? ` on ${dateStr}` : ""}. Good luck!`;

    for (const p of newlyAdded) {
      // Insert personal notification
      await supabase.from("slpl_notifications").insert([{
        user_id: p.player_id,
        title: notifTitle,
        body: notifBody,
        type: "info",
      }]);

      // Push notification via stored Expo token
      const { data: tokenRow } = await supabase
        .from("user_push_tokens")
        .select("expo_token")
        .eq("user_id", p.player_id)
        .maybeSingle() as { data: { expo_token: string } | null };

      if (tokenRow?.expo_token) {
        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: tokenRow.expo_token,
            title: notifTitle,
            body: notifBody,
            sound: "default",
          }),
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}
