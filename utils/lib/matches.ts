import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2";
import pool from "@/utils/lib/db";
import type { GameRow, Match, MatchDetail, MatchStatus, PlayerStat, SetRow, TiebreakRow } from "@/utils/types";

const MATCH_SELECT = `
  SELECT m.id, m.court, m.match_category, m.match_stage, m.match_status,
    t1.id AS t1_id, t1.team_name AS t1_name, t1.logo AS t1_logo, t1.color AS t1_color,
    t2.id AS t2_id, t2.team_name AS t2_name, t2.logo AS t2_logo, t2.color AS t2_color
  FROM matches m
  JOIN teams t1 ON m.team1_id = t1.id
  JOIN teams t2 ON m.team2_id = t2.id
`;

function rowToMatch(row: RowDataPacket): Match {
  return {
    id: row.id,
    court: row.court,
    match_category: row.match_category,
    match_stage: row.match_stage,
    match_status: row.match_status as MatchStatus,
    team1: { id: row.t1_id, team_name: row.t1_name, logo: row.t1_logo, color: row.t1_color },
    team2: { id: row.t2_id, team_name: row.t2_name, logo: row.t2_logo, color: row.t2_color },
  };
}

function splitName(fullName: string): { first_name: string; last_name: string } {
  const trimmed = fullName.trim();
  const idx = trimmed.indexOf(" ");
  if (idx === -1) return { first_name: trimmed, last_name: "" };
  return { first_name: trimmed.slice(0, idx), last_name: trimmed.slice(idx + 1) };
}

async function insertPlayers(matchId: string, teamId: string, names: string[]) {
  for (const name of names) {
    const { first_name, last_name } = splitName(name);
    await pool.query(
      "INSERT INTO players (player_id, match_id, team_id, first_name, last_name) VALUES (?, ?, ?, ?, ?)",
      [`p_${randomUUID()}`, matchId, teamId, first_name, last_name],
    );
  }
}

export async function fetchMatches(): Promise<Match[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`${MATCH_SELECT} ORDER BY m.court, m.created_at`);
  return rows.map(rowToMatch);
}

export async function fetchMatchById(id: string): Promise<Match | null> {
  const [rows] = await pool.query<RowDataPacket[]>(`${MATCH_SELECT} WHERE m.id = ?`, [id]);
  return rows[0] ? rowToMatch(rows[0]) : null;
}

export async function fetchLiveMatchForCourt(court: number): Promise<Match | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `${MATCH_SELECT} WHERE m.court = ? AND m.match_status = 'live' LIMIT 1`,
    [court],
  );
  return rows[0] ? rowToMatch(rows[0]) : null;
}

export async function fetchMatchDetail(id: string): Promise<MatchDetail | null> {
  const match = await fetchMatchById(id);
  if (!match) return null;

  const [rosterRows] = await pool.query<RowDataPacket[]>("SELECT * FROM players WHERE match_id = ?", [id]);
  const roster: PlayerStat[] = rosterRows.map((r) => ({
    player_id: r.player_id,
    team_id: r.team_id,
    first_name: r.first_name,
    last_name: r.last_name,
    aces: r.aces,
    double_faults: r.double_faults,
    winners: r.winners,
    unforced_errors: r.unforced_errors,
  }));

  const [setRows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM sets WHERE match_id = ? ORDER BY set_number",
    [id],
  );

  const sets: SetRow[] = [];
  for (const s of setRows) {
    const [gameRows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM games WHERE set_id = ? ORDER BY game_number DESC",
      [s.id],
    );
    const games: GameRow[] = gameRows.map((g) => ({
      game_number: g.game_number,
      winner_team_id: g.winner_team_id ?? "",
      team1_points: g.team1_points,
      team2_points: g.team2_points,
      is_golden_point: !!g.is_golden_point,
      server_name: g.server_name,
    }));
    const tiebreak: TiebreakRow | null =
      s.tiebreak_team1 != null || s.tiebreak_team2 != null
        ? { team1_tie_points: s.tiebreak_team1, team2_tie_points: s.tiebreak_team2 }
        : null;
    sets.push({ id: s.id, set_number: s.set_number, winner_team_id: s.winner_team_id ?? "", games, tiebreak });
  }

  return { ...match, roster, sets };
}

export async function createMatch(
  court: number,
  category: string,
  sideANames: string[],
  sideBNames: string[],
): Promise<Match> {
  const matchId = `m_${randomUUID()}`;
  const teamAId = `t_${randomUUID()}`;
  const teamBId = `t_${randomUUID()}`;

  await pool.query("INSERT INTO teams (id, team_name, logo, color) VALUES (?, ?, '', '#f97316')", [
    teamAId,
    sideANames.join(" / "),
  ]);
  await pool.query("INSERT INTO teams (id, team_name, logo, color) VALUES (?, ?, '', '#3182ce')", [
    teamBId,
    sideBNames.join(" / "),
  ]);
  await pool.query(
    "INSERT INTO matches (id, court, match_category, match_stage, match_status, team1_id, team2_id) VALUES (?, ?, ?, 'group', 'scheduled', ?, ?)",
    [matchId, court, category, teamAId, teamBId],
  );
  await insertPlayers(matchId, teamAId, sideANames);
  await insertPlayers(matchId, teamBId, sideBNames);

  return (await fetchMatchById(matchId))!;
}

export async function updateMatch(
  matchId: string,
  category: string,
  sideANames: string[],
  sideBNames: string[],
): Promise<Match | null> {
  const match = await fetchMatchById(matchId);
  if (!match) return null;

  await pool.query("UPDATE teams SET team_name = ? WHERE id = ?", [sideANames.join(" / "), match.team1.id]);
  await pool.query("UPDATE teams SET team_name = ? WHERE id = ?", [sideBNames.join(" / "), match.team2.id]);
  await pool.query("UPDATE matches SET match_category = ? WHERE id = ?", [category, matchId]);
  await pool.query("DELETE FROM players WHERE match_id = ?", [matchId]);
  await insertPlayers(matchId, match.team1.id, sideANames);
  await insertPlayers(matchId, match.team2.id, sideBNames);

  return fetchMatchById(matchId);
}

// Setting a match live automatically un-lives any other live match on the
// same court, since only one match per court can be live at a time.
export async function setMatchStatus(matchId: string, status: MatchStatus): Promise<Match | null> {
  const match = await fetchMatchById(matchId);
  if (!match) return null;

  if (status === "live") {
    await pool.query(
      "UPDATE matches SET match_status = 'scheduled' WHERE court = ? AND id != ? AND match_status = 'live'",
      [match.court, matchId],
    );
  }
  await pool.query("UPDATE matches SET match_status = ? WHERE id = ?", [status, matchId]);

  return fetchMatchById(matchId);
}

export async function deleteMatch(matchId: string): Promise<void> {
  const match = await fetchMatchById(matchId);
  if (!match) return;
  await pool.query("DELETE FROM matches WHERE id = ?", [matchId]);
  await pool.query("DELETE FROM teams WHERE id IN (?, ?)", [match.team1.id, match.team2.id]);
}

export async function addSet(matchId: string, serverName: string | null): Promise<SetRow> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COALESCE(MAX(set_number), 0) AS maxNum FROM sets WHERE match_id = ?",
    [matchId],
  );
  const nextNum = (rows[0]?.maxNum ?? 0) + 1;
  const setId = `s_${randomUUID()}`;

  await pool.query("INSERT INTO sets (id, match_id, set_number) VALUES (?, ?, ?)", [setId, matchId, nextNum]);
  await pool.query(
    "INSERT INTO games (set_id, game_number, server_name) VALUES (?, 1, ?)",
    [setId, serverName],
  );

  return {
    id: setId,
    set_number: nextNum,
    winner_team_id: "",
    games: [
      {
        game_number: 1,
        winner_team_id: "",
        team1_points: null,
        team2_points: null,
        is_golden_point: false,
        server_name: serverName,
      },
    ],
    tiebreak: null,
  };
}

export async function updateSet(setId: string, set: SetRow): Promise<void> {
  await pool.query(
    "UPDATE sets SET winner_team_id = ?, tiebreak_team1 = ?, tiebreak_team2 = ? WHERE id = ?",
    [set.winner_team_id || null, set.tiebreak?.team1_tie_points ?? null, set.tiebreak?.team2_tie_points ?? null, setId],
  );
  await pool.query("DELETE FROM games WHERE set_id = ?", [setId]);
  for (const g of set.games) {
    await pool.query(
      "INSERT INTO games (set_id, game_number, winner_team_id, team1_points, team2_points, is_golden_point, server_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [setId, g.game_number, g.winner_team_id || null, g.team1_points, g.team2_points, g.is_golden_point, g.server_name ?? null],
    );
  }
}

export async function deleteSet(setId: string): Promise<void> {
  await pool.query("DELETE FROM sets WHERE id = ?", [setId]);
}
