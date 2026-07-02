// ─── Shared types for the Gamescore app (backed by MySQL via /api routes) ────

export type TeamRef = {
  id: string;
  team_name: string;
  logo: string;
  color: string;
};

export type PlayerStat = {
  player_id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  aces: number;
  double_faults: number;
  winners: number;
  unforced_errors: number;
};

export type GameRow = {
  game_number: number;
  winner_team_id: string;
  team1_points: string | null;
  team2_points: string | null;
  is_golden_point: boolean;
  server_name?: string | null;
};

export type TiebreakRow = {
  team1_tie_points: number | null;
  team2_tie_points: number | null;
};

export type SetRow = {
  id: string;
  set_number: number;
  winner_team_id: string;
  games: GameRow[];
  tiebreak: TiebreakRow | null;
};

export type MatchStatus = "scheduled" | "live" | "completed";

export type Match = {
  id: string;
  court: number;
  match_category: string;
  match_stage: string;
  match_status: MatchStatus;
  team1: TeamRef;
  team2: TeamRef;
};

export type MatchDetail = Match & {
  roster: PlayerStat[];
  sets: SetRow[];
};

export type Role = "umpire" | "referee";
