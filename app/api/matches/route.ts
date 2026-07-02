import { supabaseAdmin as supabase } from "@/utils/lib/supabase";
import { NextResponse } from "next/server";

function formatCategory(cat: string | null): string {
  if (!cat) return "";
  return cat.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const STATUS_ARENA: Record<string, { title: (t1: string, t2: string) => string; body: (t1: string, t2: string, cat: string | null) => string; type: string }> = {
  live:      { title: (t1, t2) => `LIVE: ${t1} vs ${t2}`, body: (t1, t2, cat) => `${cat ? `[${formatCategory(cat)}] ` : ""}${t1} vs ${t2} is now live!`, type: "result" },
  completed: { title: (t1, t2) => `Match Result: ${t1} vs ${t2}`, body: (t1, t2, cat) => `${cat ? `[${formatCategory(cat)}] ` : ""}${t1} vs ${t2} has concluded.`, type: "result" },
  walkover:  { title: (t1, t2) => `Walkover: ${t1} vs ${t2}`, body: (_t1, _t2, cat) => `${cat ? `[${formatCategory(cat)}] ` : ""}Match awarded as walkover.`, type: "general" },
  cancelled: { title: (t1, t2) => `Cancelled: ${t1} vs ${t2}`, body: (_t1, _t2, cat) => `${cat ? `[${formatCategory(cat)}] ` : ""}This match has been cancelled.`, type: "general" },
};

async function getTeamNames(team1_id: string, team2_id: string): Promise<[string, string]> {
  const { data } = await supabase
    .from("slpl_teams")
    .select("id, team_name")
    .in("id", [team1_id, team2_id]);
  const map = Object.fromEntries((data ?? []).map((t: any) => [t.id, t.team_name]));
  return [map[team1_id] ?? "Team 1", map[team2_id] ?? "Team 2"];
}

async function upsertArenaUpdate(matchId: string, status: string, team1: string, team2: string, cat: string | null, winnerName?: string) {
  const sourceRef = `match-status:${matchId}`;
  const template = STATUS_ARENA[status];
  if (!template) return;

  let title = template.title(team1, team2);
  let body = template.body(team1, team2, cat);

  // Override completed message with winner info
  if (status === "completed" && winnerName) {
    title = `Match Result: ${winnerName} wins!`;
    body = `${cat ? `[${formatCategory(cat)}] ` : ""}${winnerName} defeated the opposition in ${team1} vs ${team2}.`;
  }
  if (status === "walkover" && winnerName) {
    title = `Walkover: ${winnerName} advances`;
    body = `${cat ? `[${formatCategory(cat)}] ` : ""}${winnerName} has been awarded a walkover against ${team1 === winnerName ? team2 : team1}.`;
  }

  // Soft-delete previous announcement for this match
  await supabase
    .from("slpl_announcements")
    .update({ deleted_at: new Date().toISOString() })
    .eq("source_ref", sourceRef)
    .is("deleted_at", null);

  await supabase.from("slpl_announcements").insert([{ title, body, type: template.type, source_ref: sourceRef }]);
}

export async function GET() {
  const { data, error } = await supabase
    .from("slpl_matches")
    .select(`
      id, scheduled_at, court_number, status, match_category,
      team1:team1_id(id, team_name, color, logo),
      team2:team2_id(id, team_name, color, logo),
      winner:winner_team_id(id, team_name)
    `)
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const matches = (data ?? []).map((m: any) => ({
    id: m.id,
    scheduled_at: m.scheduled_at,
    court_number: m.court_number,
    status: m.status,
    match_category: m.match_category,
    team1: m.team1 ?? null,
    team2: m.team2 ?? null,
    winner: m.winner ?? null,
  }));

  return NextResponse.json(matches);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { team1_id, team2_id, scheduled_at, court_number, match_category } = body;

  const { data, error } = await supabase
    .from("slpl_matches")
    .insert([{ team1_id, team2_id, scheduled_at, court_number, match_category: match_category || null, status: "scheduled" }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Arena announcement for new match
  const [t1, t2] = await getTeamNames(team1_id, team2_id);
  const date = new Date(scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  await supabase.from("slpl_announcements").insert([{
    title: `Match Scheduled: ${t1} vs ${t2}`,
    body: `${match_category ? `[${formatCategory(match_category)}] ` : ""}${t1} vs ${t2} on Court ${court_number} — ${date}.`,
    type: "general",
    source_ref: `match-scheduled:${data.id}`,
  }]);

  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, status, winner_team_id, team1_id, team2_id, scheduled_at, court_number, match_category } = body;

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (status !== undefined) updates.status = status;
  if (winner_team_id !== undefined) updates.winner_team_id = winner_team_id;
  if (team1_id !== undefined) updates.team1_id = team1_id;
  if (team2_id !== undefined) updates.team2_id = team2_id;
  if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at;
  if (court_number !== undefined) updates.court_number = court_number;
  if (match_category !== undefined) updates.match_category = match_category;

  const { data, error } = await supabase
    .from("slpl_matches")
    .update(updates)
    .eq("id", id)
    .select(`
      id, scheduled_at, court_number, status, match_category,
      team1:team1_id(id, team_name),
      team2:team2_id(id, team_name),
      winner:winner_team_id(id, team_name)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Arena update for status changes
  if (status) {
    const t1 = (data as any).team1?.team_name ?? "Team 1";
    const t2 = (data as any).team2?.team_name ?? "Team 2";
    const cat = (data as any).match_category ?? null;
    const winnerName = (data as any).winner?.team_name ?? null;
    await upsertArenaUpdate(id, status, t1, t2, cat, winnerName);
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();

  const { error } = await supabase
    .from("slpl_matches")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Clean up arena announcements for this match
  await supabase
    .from("slpl_announcements")
    .update({ deleted_at: new Date().toISOString() })
    .like("source_ref", `match-%:${id}`)
    .is("deleted_at", null);

  return NextResponse.json({ success: true });
}
