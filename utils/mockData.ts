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

export type MockMatch = {
  id: string;
  court: number;
  match_category: string;
  match_stage: string;
  team1: MockTeamRef;
  team2: MockTeamRef;
};

export const SEASON_ID = "2bedc1aa-aedc-4d21-9b2e-fd94f6d04835";

// ─── Teams ─────────────────────────────────────────────────────────────────

export const mockTeams: Record<string, MockTeamRef> = {
  t1: { id: "t1", team_name: "Colombo Smashers", logo: "", color: "#f97316" },
  t2: { id: "t2", team_name: "Kandy Aces", logo: "", color: "#3182ce" },
  t3: { id: "t3", team_name: "Galle Rally", logo: "", color: "#38a169" },
  t4: { id: "t4", team_name: "Negombo Net Kings", logo: "", color: "#805ad5" },
};

// ─── Live matches, keyed by court number ────────────────────────────────────

export const mockLiveMatches: Record<number, MockMatch> = {
  1: {
    id: "m1",
    court: 1,
    match_category: "mens_double",
    match_stage: "group",
    team1: mockTeams.t1,
    team2: mockTeams.t2,
  },
  2: {
    id: "m2",
    court: 2,
    match_category: "mixed_double",
    match_stage: "group",
    team1: mockTeams.t3,
    team2: mockTeams.t4,
  },
};

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
  m2: [],
};

// ─── Player stats, keyed by match id ─────────────────────────────────────────

export const mockRosterByMatch: Record<string, MockPlayerStat[]> = {
  m1: [
    { player_id: "p1", team_id: "t1", first_name: "Dilan", last_name: "Perera", aces: 3, double_faults: 1, winners: 5, unforced_errors: 2, season_id: SEASON_ID },
    { player_id: "p2", team_id: "t1", first_name: "Kasun", last_name: "Silva", aces: 1, double_faults: 0, winners: 2, unforced_errors: 4, season_id: SEASON_ID },
    { player_id: "p3", team_id: "t2", first_name: "Nuwan", last_name: "Fernando", aces: 2, double_faults: 2, winners: 3, unforced_errors: 1, season_id: SEASON_ID },
    { player_id: "p4", team_id: "t2", first_name: "Ravi", last_name: "Jayasuriya", aces: 0, double_faults: 1, winners: 1, unforced_errors: 3, season_id: SEASON_ID },
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

export const mockUser = { full_name: "Demo Referee", role: "match_ref" as const };

// ─── Simple id generator for locally-created records ────────────────────────

let idCounter = 1000;
export function nextMockId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
