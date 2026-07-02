// ─── Mock data used to drive the UI locally, without any backend/Supabase. ────
// This file replaces all former API/Supabase calls with static/in-memory data.

export type MockTeamRef = {
  id: string;
  team_name: string;
  logo: string;
  color: string;
};

export type MockPlayerStat = {
  player_id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  aces: number;
  double_faults: number;
  winners: number;
  unforced_errors: number;
  season_id: string;
};

export type MockGame = {
  game_number: number;
  winner_team_id: string;
  team1_points: string | null;
  team2_points: string | null;
  is_golden_point: boolean;
  server_name?: string | null;
};

export type MockTiebreak = {
  team1_tie_points: number | null;
  team2_tie_points: number | null;
};

export type MockSet = {
  id: string;
  set_number: number;
  winner_team_id: string;
  games: MockGame[];
  tiebreak: MockTiebreak | null;
};

export type MockMatchStatus = "scheduled" | "live" | "completed";

export type MockMatch = {
  id: string;
  court: number;
  match_category: string;
  match_stage: string;
  match_status: MockMatchStatus;
  team1: MockTeamRef;
  team2: MockTeamRef;
};

export const SEASON_ID = "2bedc1aa-aedc-4d21-9b2e-fd94f6d04835";

// ─── Teams ─────────────────────────────────────────────────────────────────

export const mockTeams: Record<string, MockTeamRef> = {
  // Singles match: "team" is just the player themself, no club name.
  t1: { id: "t1", team_name: "Dilan Perera", logo: "", color: "#f97316" },
  t2: { id: "t2", team_name: "Nuwan Fernando", logo: "", color: "#3182ce" },
  // Doubles pair: "team" is the two players paired together, no club name.
  t3: { id: "t3", team_name: "Chamari Athapaththu / Ishara Perera", logo: "", color: "#38a169" },
  t4: { id: "t4", team_name: "Sanath Bandara / Malik Weerasinghe", logo: "", color: "#805ad5" },
};

// ─── Matches — a court can have any number scheduled; at most one is "live" ──

export const mockMatches: MockMatch[] = [
  {
    id: "m1",
    court: 1,
    match_category: "mens_singles",
    match_stage: "group",
    match_status: "live",
    team1: mockTeams.t1,
    team2: mockTeams.t2,
  },
  {
    id: "m2",
    court: 2,
    match_category: "mixed_double",
    match_stage: "group",
    match_status: "live",
    team1: mockTeams.t3,
    team2: mockTeams.t4,
  },
];

export function getLiveMatchForCourt(court: number): MockMatch | undefined {
  return mockMatches.find((m) => m.court === court && m.match_status === "live");
}

export function getMatchesForCourt(court: number): MockMatch[] {
  return mockMatches.filter((m) => m.court === court);
}

// ─── Sets, keyed by match id ─────────────────────────────────────────────────

export const mockSetsByMatch: Record<string, MockSet[]> = {
  m1: [
    {
      id: "s1-1",
      set_number: 1,
      winner_team_id: "t1",
      games: [
        { game_number: 6, winner_team_id: "t1", team1_points: "Game", team2_points: "30", is_golden_point: false },
        { game_number: 5, winner_team_id: "t2", team1_points: "30", team2_points: "Game", is_golden_point: false },
        { game_number: 4, winner_team_id: "t1", team1_points: "Game", team2_points: "15", is_golden_point: false },
      ],
      tiebreak: null,
    },
  ],
  m2: [
    {
      id: "s2-1",
      set_number: 1,
      winner_team_id: "t3",
      games: [
        { game_number: 7, winner_team_id: "t3", team1_points: "Game", team2_points: "40", is_golden_point: false },
        { game_number: 6, winner_team_id: "t4", team1_points: "40", team2_points: "Game", is_golden_point: false },
        { game_number: 5, winner_team_id: "t3", team1_points: "Game", team2_points: "30", is_golden_point: false },
        { game_number: 4, winner_team_id: "t4", team1_points: "15", team2_points: "Game", is_golden_point: false },
      ],
      tiebreak: { team1_tie_points: 7, team2_tie_points: 5 },
    },
    {
      id: "s2-2",
      set_number: 2,
      winner_team_id: "",
      games: [
        { game_number: 2, winner_team_id: "t4", team1_points: "30", team2_points: "Game", is_golden_point: false },
        {
          game_number: 1,
          winner_team_id: "",
          team1_points: "30",
          team2_points: "15",
          is_golden_point: false,
          server_name: "Chamari Athapaththu",
        },
      ],
      tiebreak: null,
    },
  ],
};

// ─── Player stats, keyed by match id ─────────────────────────────────────────

export const mockRosterByMatch: Record<string, MockPlayerStat[]> = {
  m1: [
    { player_id: "p1", team_id: "t1", first_name: "Dilan", last_name: "Perera", aces: 3, double_faults: 1, winners: 5, unforced_errors: 2, season_id: SEASON_ID },
    { player_id: "p3", team_id: "t2", first_name: "Nuwan", last_name: "Fernando", aces: 2, double_faults: 2, winners: 3, unforced_errors: 1, season_id: SEASON_ID },
  ],
  m2: [
    { player_id: "p5", team_id: "t3", first_name: "Chamari", last_name: "Athapaththu", aces: 4, double_faults: 0, winners: 6, unforced_errors: 1, season_id: SEASON_ID },
    { player_id: "p6", team_id: "t3", first_name: "Ishara", last_name: "Perera", aces: 1, double_faults: 1, winners: 2, unforced_errors: 2, season_id: SEASON_ID },
    { player_id: "p7", team_id: "t4", first_name: "Sanath", last_name: "Bandara", aces: 2, double_faults: 0, winners: 3, unforced_errors: 0, season_id: SEASON_ID },
    { player_id: "p8", team_id: "t4", first_name: "Malik", last_name: "Weerasinghe", aces: 0, double_faults: 2, winners: 1, unforced_errors: 5, season_id: SEASON_ID },
  ],
};

// ─── Announcements ────────────────────────────────────────────────────────

export type MockAnnouncement = {
  id: string;
  message: string;
  created_at: string;
};

export const mockAnnouncements: MockAnnouncement[] = [
  { id: "a1", message: "Court 1 finals rescheduled to 4:00 PM.", created_at: "2026-07-02T09:00:00Z" },
  { id: "a2", message: "Please collect your player badges from the registration desk.", created_at: "2026-07-01T15:30:00Z" },
];

// ─── Groups ───────────────────────────────────────────────────────────────

export const mockGroups: { id: string; name: string; created_at?: string }[] = [
  { id: "g1", name: "Group A", created_at: "2026-06-01T00:00:00Z" },
  { id: "g2", name: "Group B", created_at: "2026-06-01T00:00:00Z" },
];

// ─── League standings ───────────────────────────────────────────────────────

export type MockStanding = {
  team_id: string;
  team_name: string;
  played: number;
  won: number;
  lost: number;
  points: number;
};

export const mockLeagueStandings: MockStanding[] = [
  { team_id: "t1", team_name: "Colombo Smashers", played: 4, won: 3, lost: 1, points: 9 },
  { team_id: "t2", team_name: "Kandy Aces", played: 4, won: 2, lost: 2, points: 6 },
  { team_id: "t3", team_name: "Galle Rally", played: 4, won: 2, lost: 2, points: 6 },
  { team_id: "t4", team_name: "Negombo Net Kings", played: 4, won: 1, lost: 3, points: 3 },
];

// ─── Auth ─────────────────────────────────────────────────────────────────

export type MockRole = "umpire" | "referee";

export type MockCredential = {
  username: string;
  password: string;
  role: MockRole;
  full_name: string;
};

export const mockCredentials: MockCredential[] = [
  { username: "umpire", password: "umpire@2026", role: "umpire", full_name: "Court Umpire" },
  { username: "referee", password: "refree@26", role: "referee", full_name: "Match Referee" },
];

// ─── Simple id generator for locally-created records ────────────────────────

let idCounter = 1000;
export function nextMockId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

// ─── Match creation / editing (referee dashboard mutates this shared state) ──
// Player names are entered freehand by the referee — no predefined player pool.

function splitName(fullName: string): { first_name: string; last_name: string } {
  const trimmed = fullName.trim();
  const idx = trimmed.indexOf(" ");
  if (idx === -1) return { first_name: trimmed, last_name: "" };
  return { first_name: trimmed.slice(0, idx), last_name: trimmed.slice(idx + 1) };
}

function buildRoster(teamId: string, names: string[]): MockPlayerStat[] {
  return names.map((name) => {
    const { first_name, last_name } = splitName(name);
    return {
      player_id: nextMockId("p"),
      team_id: teamId,
      first_name,
      last_name,
      aces: 0,
      double_faults: 0,
      winners: 0,
      unforced_errors: 0,
      season_id: SEASON_ID,
    };
  });
}

export function assignMatch(
  court: number,
  category: string,
  sideANames: string[],
  sideBNames: string[],
): MockMatch {
  const matchId = nextMockId("m");
  const teamAId = nextMockId("t");
  const teamBId = nextMockId("t");

  const match: MockMatch = {
    id: matchId,
    court,
    match_category: category,
    match_stage: "group",
    match_status: "scheduled",
    team1: { id: teamAId, team_name: sideANames.join(" / "), logo: "", color: "#f97316" },
    team2: { id: teamBId, team_name: sideBNames.join(" / "), logo: "", color: "#3182ce" },
  };

  mockMatches.push(match);
  mockSetsByMatch[matchId] = [];
  mockRosterByMatch[matchId] = [
    ...buildRoster(teamAId, sideANames),
    ...buildRoster(teamBId, sideBNames),
  ];

  return match;
}

// Edits an existing match in place, preserving its id/team ids/status
// (and therefore its sets/roster linkage) while updating names and category.
export function updateMatch(
  matchId: string,
  category: string,
  sideANames: string[],
  sideBNames: string[],
): MockMatch | null {
  const existing = mockMatches.find((m) => m.id === matchId);
  if (!existing) return null;

  const team1: MockTeamRef = { ...existing.team1, team_name: sideANames.join(" / ") };
  const team2: MockTeamRef = { ...existing.team2, team_name: sideBNames.join(" / ") };

  existing.match_category = category;
  existing.team1 = team1;
  existing.team2 = team2;
  mockRosterByMatch[existing.id] = [
    ...buildRoster(team1.id, sideANames),
    ...buildRoster(team2.id, sideBNames),
  ];

  return existing;
}

// Setting a match live automatically un-lives any other live match on the
// same court, since only one match per court can be live at a time.
export function setMatchStatus(matchId: string, status: MockMatchStatus) {
  const existing = mockMatches.find((m) => m.id === matchId);
  if (!existing) return;

  if (status === "live") {
    for (const m of mockMatches) {
      if (m.court === existing.court && m.id !== matchId && m.match_status === "live") {
        m.match_status = "scheduled";
      }
    }
  }
  existing.match_status = status;
}

export function deleteMatch(matchId: string) {
  const idx = mockMatches.findIndex((m) => m.id === matchId);
  if (idx === -1) return;
  mockMatches.splice(idx, 1);
  delete mockSetsByMatch[matchId];
  delete mockRosterByMatch[matchId];
}
