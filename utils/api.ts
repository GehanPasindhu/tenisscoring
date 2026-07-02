import type { Match, MatchDetail, MatchStatus, Role, SetRow } from "@/utils/types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export async function login(username: string, password: string): Promise<{ role: Role; full_name: string }> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return json(res);
}

export function fetchMatches(): Promise<Match[]> {
  return fetch("/api/matches").then((res) => json(res));
}

export function fetchLiveMatch(court: number): Promise<MatchDetail | null> {
  return fetch(`/api/matches/live?court=${court}`).then((res) => json(res));
}

export function fetchMatchDetail(matchId: string): Promise<MatchDetail> {
  return fetch(`/api/matches/${matchId}`).then((res) => json(res));
}

export function createMatch(
  court: number,
  category: string,
  sideANames: string[],
  sideBNames: string[],
): Promise<Match> {
  return fetch("/api/matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ court, category, sideANames, sideBNames }),
  }).then((res) => json(res));
}

export function updateMatch(
  matchId: string,
  category: string,
  sideANames: string[],
  sideBNames: string[],
): Promise<Match> {
  return fetch(`/api/matches/${matchId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, sideANames, sideBNames }),
  }).then((res) => json(res));
}

export function setMatchStatus(matchId: string, status: MatchStatus): Promise<Match> {
  return fetch(`/api/matches/${matchId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }).then((res) => json(res));
}

export function deleteMatch(matchId: string): Promise<void> {
  return fetch(`/api/matches/${matchId}`, { method: "DELETE" }).then((res) => json(res));
}

export function addSet(matchId: string, serverName: string | null): Promise<SetRow> {
  return fetch(`/api/matches/${matchId}/sets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ server_name: serverName }),
  }).then((res) => json(res));
}

export function updateSet(matchId: string, setId: string, set: SetRow): Promise<SetRow> {
  return fetch(`/api/matches/${matchId}/sets/${setId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ set }),
  }).then((res) => json(res));
}

export function deleteSet(matchId: string, setId: string): Promise<void> {
  return fetch(`/api/matches/${matchId}/sets/${setId}`, { method: "DELETE" }).then((res) => json(res));
}
