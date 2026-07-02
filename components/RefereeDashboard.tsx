"use client";

import { Box, Button, HStack, Input, Spinner, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { MdAdd, MdClose, MdExpandLess, MdExpandMore, MdLogout, MdTableChart } from "react-icons/md";
import { GiTennisBall } from "react-icons/gi";
import { formatCategory } from "@/utils/enums";
import {
  createMatch,
  deleteMatch as apiDeleteMatch,
  fetchMatchDetail,
  fetchMatches,
  setMatchStatus as apiSetMatchStatus,
  updateMatch as apiUpdateMatch,
} from "@/utils/api";
import type { Match, MatchDetail, MatchStatus } from "@/utils/types";

const CATEGORIES = ["mens_singles", "womens_singles", "mens_double", "womens_double", "mixed_double"] as const;
const COURTS = [1, 2];
const STATUS_FLOW: MatchStatus[] = ["scheduled", "live", "completed"];
const STATUS_STYLE: Record<MatchStatus, { bg: string; color: string }> = {
  scheduled: { bg: "gray.100", color: "gray.600" },
  live: { bg: "orange.100", color: "orange.600" },
  completed: { bg: "green.100", color: "green.700" },
};

function playersNeeded(category: string): number {
  return category.endsWith("_singles") ? 1 : 2;
}

// A team's display name may join multiple players with " / " (doubles pairs).
// Renders each player individually, tagging the one currently serving with a ball icon.
function TeamNameWithServer({
  teamName,
  serverName,
  fontSize = "md",
  fontWeight = "900",
  color = "gray.800",
}: {
  teamName: string;
  serverName: string | null;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
}) {
  const target = serverName?.trim() ?? null;
  const names = teamName.split(" / ");

  return (
    <Text as="span" fontSize={fontSize} fontWeight={fontWeight} color={color}>
      {names.map((name, i) => (
        <Text as="span" key={i}>
          {i > 0 && " / "}
          {name}
          {target != null && name.trim() === target && (
            <Text as="span" ml={1}>
              (<GiTennisBall style={{ display: "inline", verticalAlign: "middle" }} size={12} color="#f97316" />)
            </Text>
          )}
        </Text>
      ))}
    </Text>
  );
}

// ─── Create / Edit Match Modal ─────────────────────────────────────────────

type MatchModalTarget =
  | { mode: "create"; presetCourt?: number }
  | { mode: "edit"; match: Match };

function MatchModal({
  target,
  onClose,
  onSaved,
}: {
  target: MatchModalTarget;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = target.mode === "edit";
  const editingMatch = isEdit ? target.match : null;

  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    (editingMatch?.match_category as (typeof CATEGORIES)[number]) ?? "mens_singles",
  );
  const [court, setCourt] = useState<number>(
    isEdit ? editingMatch!.court : (target.presetCourt ?? 1),
  );
  const needed = playersNeeded(category);
  const courtLocked = isEdit || target.presetCourt != null;

  const initialNames = (match: Match | null, side: "team1" | "team2", count: number) => {
    const names = match ? match[side].team_name.split(" / ") : [];
    return Array.from({ length: count }, (_, i) => names[i] ?? "");
  };

  const [sideA, setSideA] = useState<string[]>(initialNames(editingMatch, "team1", needed));
  const [sideB, setSideB] = useState<string[]>(initialNames(editingMatch, "team2", needed));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCategoryChange = (c: (typeof CATEGORIES)[number]) => {
    const n = playersNeeded(c);
    setCategory(c);
    setSideA((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? ""));
    setSideB((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? ""));
  };

  const handleSave = async () => {
    const cleanA = sideA.map((n) => n.trim());
    const cleanB = sideB.map((n) => n.trim());
    if (cleanA.some((n) => !n) || cleanB.some((n) => !n)) {
      setError("Enter a name for every player.");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await apiUpdateMatch(target.match.id, category, cleanA, cleanB);
      } else {
        await createMatch(court, category, cleanA, cleanB);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save match.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      position="fixed"
      inset={0}
      bg="blackAlpha.500"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1000}
      p={6}
      onClick={onClose}
    >
      <Box bg="white" borderRadius="2xl" p={6} w="full" maxW="480px" onClick={(e) => e.stopPropagation()}>
        <HStack justify="space-between" mb={5}>
          <Text fontWeight="900" fontSize="lg" color="gray.800">
            {isEdit ? `Edit Match — Court ${editingMatch?.court}` : "Create Match"}
          </Text>
          <Button size="xs" variant="ghost" color="gray.400" onClick={onClose} borderRadius="full">
            <MdClose size={16} />
          </Button>
        </HStack>

        <VStack align="stretch" gap={4}>
          <VStack align="stretch" gap={2}>
            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase">Category</Text>
            <HStack wrap="wrap" gap={2}>
              {CATEGORIES.map((c) => (
                <Button
                  key={c}
                  size="xs"
                  variant={category === c ? "solid" : "outline"}
                  bg={category === c ? "orange.500" : "white"}
                  color={category === c ? "white" : "gray.600"}
                  borderColor={category === c ? "orange.500" : "gray.200"}
                  borderRadius="full"
                  onClick={() => handleCategoryChange(c)}
                >
                  {formatCategory(c)}
                </Button>
              ))}
            </HStack>
          </VStack>

          <VStack align="stretch" gap={2}>
            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase">Court</Text>
            <HStack gap={2}>
              {COURTS.map((c) => (
                <Button
                  key={c}
                  size="xs"
                  variant={court === c ? "solid" : "outline"}
                  bg={court === c ? "orange.500" : "white"}
                  color={court === c ? "white" : "gray.600"}
                  borderColor={court === c ? "orange.500" : "gray.200"}
                  borderRadius="full"
                  disabled={courtLocked}
                  onClick={() => setCourt(c)}
                >
                  Court {c}
                </Button>
              ))}
            </HStack>
          </VStack>

          <HStack align="flex-start" gap={4}>
            <VStack align="stretch" gap={2} flex={1}>
              <Text fontSize="xs" fontWeight="700" color="blue.500" textTransform="uppercase">Side A</Text>
              {sideA.map((name, i) => (
                <Input
                  key={i}
                  value={name}
                  onChange={(e) =>
                    setSideA((prev) => prev.map((n, idx) => (idx === i ? e.target.value : n)))
                  }
                  placeholder={`Player ${i + 1} name`}
                  size="sm"
                  color="gray.800"
                />
              ))}
            </VStack>
            <VStack align="stretch" gap={2} flex={1}>
              <Text fontSize="xs" fontWeight="700" color="orange.500" textTransform="uppercase">Side B</Text>
              {sideB.map((name, i) => (
                <Input
                  key={i}
                  value={name}
                  onChange={(e) =>
                    setSideB((prev) => prev.map((n, idx) => (idx === i ? e.target.value : n)))
                  }
                  placeholder={`Player ${i + 1} name`}
                  size="sm"
                  color="gray.800"
                />
              ))}
            </VStack>
          </HStack>

          {error && (
            <Box bg="red.50" border="1px solid" borderColor="red.200" borderRadius="lg" px={3} py={2}>
              <Text fontSize="sm" color="red.600" fontWeight="600">{error}</Text>
            </Box>
          )}

          <Button
            bg="orange.500"
            color="white"
            borderRadius="xl"
            fontWeight="black"
            _hover={{ bg: "orange.600" }}
            onClick={handleSave}
            loading={saving}
          >
            {isEdit ? "Save Changes" : "Create Match"}
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}

// ─── View Match Modal ──────────────────────────────────────────────────────

function ViewMatchModal({ matchId, onClose }: { matchId: string; onClose: () => void }) {
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);

  useEffect(() => {
    fetchMatchDetail(matchId)
      .then(setMatch)
      .finally(() => setLoading(false));
  }, [matchId]);

  const sets = match?.sets ?? [];
  const sortedSets = [...sets].sort((a, b) => a.set_number - b.set_number);
  const latestSet = [...sets].sort((a, b) => b.set_number - a.set_number)[0];
  const activeGame = latestSet?.games.find((g) => !g.winner_team_id);
  const currentServerName = activeGame?.server_name ?? null;

  return (
    <Box
      position="fixed"
      inset={0}
      bg="blackAlpha.500"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1000}
      p={6}
      onClick={onClose}
    >
      <Box bg="white" borderRadius="2xl" p={6} w="full" maxW="440px" onClick={(e) => e.stopPropagation()}>
        <HStack justify="space-between" mb={5}>
          <Text fontWeight="900" fontSize="lg" color="gray.800">
            {match ? `Court ${match.court} — Match Details` : "Match Details"}
          </Text>
          <Button size="xs" variant="ghost" color="gray.400" onClick={onClose} borderRadius="full">
            <MdClose size={16} />
          </Button>
        </HStack>

        {loading ? (
          <Spinner size="sm" color="orange.500" />
        ) : !match ? (
          <Text fontSize="sm" color="gray.400">Match not found.</Text>
        ) : (
          <VStack align="stretch" gap={4}>
            <Box>
              <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="widest">
                {formatCategory(match.match_category).toUpperCase()} · {match.match_status.toUpperCase()}
              </Text>
              <Text mt={1}>
                <TeamNameWithServer teamName={match.team1.team_name} serverName={currentServerName} />
                <Text as="span" color="gray.300" fontWeight="400" mx={2}>vs</Text>
                <TeamNameWithServer teamName={match.team2.team_name} serverName={currentServerName} />
              </Text>
            </Box>

            <VStack align="stretch" gap={2}>
              <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase">Sets</Text>
              {sets.length === 0 ? (
                <Text fontSize="sm" color="gray.400">No sets recorded yet.</Text>
              ) : (
                <VStack align="stretch" gap={1.5}>
                  <HStack justify="space-between">
                    <Text fontSize="10px" fontWeight="800" color="blue.500" flex={1} truncate>
                      {match.team1.team_name}
                    </Text>
                    <Text fontSize="10px" fontWeight="800" color="gray.400" w="40px" textAlign="center">
                      SET
                    </Text>
                    <Text fontSize="10px" fontWeight="800" color="orange.500" flex={1} textAlign="right" truncate>
                      {match.team2.team_name}
                    </Text>
                  </HStack>
                  {sortedSets.map((s) => {
                    const gamesT1 = s.games.filter((g) => g.winner_team_id === match.team1.id).length;
                    const gamesT2 = s.games.filter((g) => g.winner_team_id === match.team2.id).length;

                    // Fall back to comparing tiebreak points directly when winner_team_id
                    // wasn't persisted, so a completed tiebreak still displays correctly.
                    let setWinner = s.winner_team_id;
                    if (!setWinner && s.tiebreak?.team1_tie_points != null && s.tiebreak?.team2_tie_points != null) {
                      if (s.tiebreak.team1_tie_points > s.tiebreak.team2_tie_points) setWinner = match.team1.id;
                      else if (s.tiebreak.team2_tie_points > s.tiebreak.team1_tie_points) setWinner = match.team2.id;
                    }

                    // A tiebreak-decided set folds into the game score: winner gets +1
                    // (e.g. 6 games + tiebreak win = 7), loser shows their tiebreak
                    // points as a superscript (e.g. 6²).
                    const tbWinsT1 = s.tiebreak && setWinner === match.team1.id;
                    const tbWinsT2 = s.tiebreak && setWinner === match.team2.id;
                    const t1 = tbWinsT1 ? gamesT1 + 1 : gamesT1;
                    const t2 = tbWinsT2 ? gamesT2 + 1 : gamesT2;
                    const t1Sup = tbWinsT2 ? s.tiebreak?.team1_tie_points : null;
                    const t2Sup = tbWinsT1 ? s.tiebreak?.team2_tie_points : null;

                    const isExpanded = expandedSetId === s.id;
                    const gamesAsc = [...s.games].sort((a, b) => a.game_number - b.game_number);

                    return (
                      <Box
                        key={s.id}
                        bg="gray.50"
                        borderRadius="lg"
                        overflow="hidden"
                        cursor="pointer"
                        onClick={() => setExpandedSetId(isExpanded ? null : s.id)}
                      >
                        <VStack align="stretch" gap={0} px={3} py={2}>
                          <HStack justify="space-between">
                            <HStack flex={1} gap={0.5} align="flex-start">
                              <Text fontSize="lg" fontWeight="900" color="gray.800">{t1}</Text>
                              {t1Sup != null && (
                                <Text fontSize="10px" fontWeight="800" color="gray.400" mt={0.5}>{t1Sup}</Text>
                              )}
                            </HStack>
                            <HStack w="40px" justify="center" gap={0.5}>
                              <Text fontSize="10px" color="gray.400" fontWeight="700">
                                {s.set_number}
                              </Text>
                              {isExpanded ? (
                                <MdExpandLess size={14} color="#9ca3af" />
                              ) : (
                                <MdExpandMore size={14} color="#9ca3af" />
                              )}
                            </HStack>
                            <HStack flex={1} gap={0.5} align="flex-start" justify="flex-end">
                              {t2Sup != null && (
                                <Text fontSize="10px" fontWeight="800" color="gray.400" mt={0.5}>{t2Sup}</Text>
                              )}
                              <Text fontSize="lg" fontWeight="900" color="gray.800">{t2}</Text>
                            </HStack>
                          </HStack>
                          {s.tiebreak && !setWinner && (
                            <HStack justify="space-between">
                              <Text flex={1} fontSize="xs" color="gray.400" fontWeight="700">
                                TB {s.tiebreak.team1_tie_points ?? 0}
                              </Text>
                              <Box w="40px" />
                              <Text flex={1} textAlign="right" fontSize="xs" color="gray.400" fontWeight="700">
                                TB {s.tiebreak.team2_tie_points ?? 0}
                              </Text>
                            </HStack>
                          )}
                        </VStack>

                        {isExpanded && (
                          <VStack align="stretch" gap={1} bg="white" px={3} py={2} borderTop="1px solid" borderColor="gray.100">
                            {gamesAsc.length === 0 ? (
                              <Text fontSize="xs" color="gray.300">No games recorded.</Text>
                            ) : (
                              gamesAsc.map((g) => (
                                <HStack key={g.game_number} justify="space-between">
                                  <Text flex={1} fontSize="sm" fontWeight={g.winner_team_id === match.team1.id ? "900" : "500"} color={g.winner_team_id === match.team1.id ? "blue.600" : "gray.600"}>
                                    {g.team1_points ?? "-"}
                                  </Text>
                                  <Text w="40px" textAlign="center" fontSize="10px" color="gray.300" fontWeight="700">
                                    G{g.game_number}
                                  </Text>
                                  <Text flex={1} textAlign="right" fontSize="sm" fontWeight={g.winner_team_id === match.team2.id ? "900" : "500"} color={g.winner_team_id === match.team2.id ? "orange.600" : "gray.600"}>
                                    {g.team2_points ?? "-"}
                                  </Text>
                                </HStack>
                              ))
                            )}
                          </VStack>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </VStack>
          </VStack>
        )}
      </Box>
    </Box>
  );
}

// ─── Referee Dashboard ─────────────────────────────────────────────────────

export default function RefereeDashboard({
  userName,
  onLogout,
}: {
  userName: string | null;
  onLogout: () => void;
}) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalTarget, setModalTarget] = useState<MatchModalTarget | null>(null);
  const [viewingMatchId, setViewingMatchId] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    fetchMatches()
      .then(setMatches)
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const cycleStatus = async (matchId: string, current: MatchStatus) => {
    const next = STATUS_FLOW[(STATUS_FLOW.indexOf(current) + 1) % STATUS_FLOW.length];
    await apiSetMatchStatus(matchId, next);
    refresh();
  };

  const handleDelete = async (m: Match) => {
    if (!window.confirm(`Delete the match on Court ${m.court} (${m.team1.team_name} vs ${m.team2.team_name})?`)) return;
    await apiDeleteMatch(m.id);
    refresh();
  };

  return (
    <Box minH="100vh" w="full" bg="gray.50" display="flex">
      {/* Sidebar */}
      <VStack
        w="240px"
        flexShrink={0}
        minH="100vh"
        bg="white"
        borderRight="1px solid"
        borderColor="gray.100"
        p={5}
        align="stretch"
        justify="space-between"
      >
        <VStack align="stretch" gap={8}>
          <VStack align="start" gap={0}>
            <Text fontSize="2xl" fontWeight="900" letterSpacing="tighter" color="gray.900" lineHeight="1">
              Gamescore
            </Text>
            <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="widest">
              REFEREE
            </Text>
          </VStack>

          <VStack align="stretch" gap={1}>
            <HStack
              px={3}
              py={2.5}
              bg="orange.50"
              color="orange.600"
              borderRadius="xl"
              gap={3}
            >
              <MdTableChart size={18} />
              <Text fontSize="sm" fontWeight="800">Matches</Text>
            </HStack>
          </VStack>
        </VStack>

        <VStack align="stretch" gap={3}>
          {userName && (
            <Text fontSize="xs" color="gray.500" fontWeight="600">
              👋 {userName}
            </Text>
          )}
          <Button
            size="sm"
            variant="ghost"
            color="gray.400"
            justifyContent="flex-start"
            onClick={onLogout}
            _hover={{ color: "red.500", bg: "red.50" }}
            borderRadius="xl"
          >
            <MdLogout size={16} />
            <Text ml={2} fontSize="xs" fontWeight="700">Sign out</Text>
          </Button>
        </VStack>
      </VStack>

      {/* Main content */}
      <Box flex={1} p={8}>
        <HStack justify="space-between" mb={6}>
          <Text fontSize="xl" fontWeight="900" color="gray.800">Matches</Text>
          <Button
            bg="orange.500"
            color="white"
            borderRadius="xl"
            fontWeight="black"
            _hover={{ bg: "orange.600" }}
            onClick={() => setModalTarget({ mode: "create" })}
          >
            <MdAdd size={18} /> New Match
          </Button>
        </HStack>

        <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100" overflowX="auto">
          <Box as="table" w="full" minW="720px" style={{ borderCollapse: "collapse" }}>
            <Box as="thead" bg="gray.50">
              <Box as="tr">
                {["Court", "Category", "Side A", "Side B", "Status", ""].map((h) => (
                  <Box
                    as="th"
                    key={h}
                    textAlign="left"
                    px={4}
                    py={3}
                    fontSize="10px"
                    fontWeight="black"
                    color="gray.400"
                    letterSpacing="widest"
                  >
                    {h}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box as="tbody">
              {loading ? (
                <Box as="tr">
                  <Box as="td" {...{ colSpan: 6 }} px={4} py={8} textAlign="center">
                    <Spinner size="sm" color="orange.500" />
                  </Box>
                </Box>
              ) : matches.length === 0 ? (
                <Box as="tr">
                  <Box as="td" {...{ colSpan: 6 }} px={4} py={8} textAlign="center">
                    <Text fontSize="sm" color="gray.400">No matches scheduled yet.</Text>
                  </Box>
                </Box>
              ) : (
                matches.map((m) => (
                  <Box as="tr" key={m.id} borderTop="1px solid" borderColor="gray.100">
                    <Box as="td" px={4} py={4} fontSize="sm" fontWeight="800" color="gray.700">
                      Court {m.court}
                    </Box>
                    <Box as="td" px={4} py={4} fontSize="xs" fontWeight="700" color="gray.500">
                      {formatCategory(m.match_category)}
                    </Box>
                    <Box as="td" px={4} py={4} fontSize="sm" color="gray.700">
                      {m.team1.team_name}
                    </Box>
                    <Box as="td" px={4} py={4} fontSize="sm" color="gray.700">
                      {m.team2.team_name}
                    </Box>
                    <Box as="td" px={4} py={4}>
                      <Button
                        size="2xs"
                        borderRadius="full"
                        variant="solid"
                        bg={STATUS_STYLE[m.match_status].bg}
                        color={STATUS_STYLE[m.match_status].color}
                        fontWeight="800"
                        _hover={{ opacity: 0.85 }}
                        onClick={() => cycleStatus(m.id, m.match_status)}
                      >
                        {m.match_status.toUpperCase()}
                      </Button>
                    </Box>
                    <Box as="td" px={4} py={4}>
                      <HStack gap={1.5} justify="flex-end">
                        <Button
                          size="2xs"
                          variant="outline"
                          borderRadius="lg"
                          color="gray.600"
                          borderColor="gray.200"
                          fontWeight="700"
                          _hover={{ bg: "gray.50", color: "gray.800" }}
                          onClick={() => setViewingMatchId(m.id)}
                        >
                          View
                        </Button>
                        <Button
                          size="2xs"
                          variant="outline"
                          borderRadius="lg"
                          color="blue.600"
                          borderColor="blue.200"
                          fontWeight="700"
                          _hover={{ bg: "blue.50" }}
                          onClick={() => setModalTarget({ mode: "edit", match: m })}
                        >
                          Edit
                        </Button>
                        <Button
                          size="2xs"
                          variant="outline"
                          borderRadius="lg"
                          color="red.600"
                          borderColor="red.200"
                          fontWeight="700"
                          _hover={{ bg: "red.50" }}
                          onClick={() => handleDelete(m)}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {modalTarget && (
        <MatchModal
          target={modalTarget}
          onClose={() => setModalTarget(null)}
          onSaved={() => {
            setModalTarget(null);
            refresh();
          }}
        />
      )}

      {viewingMatchId !== null && (
        <ViewMatchModal matchId={viewingMatchId} onClose={() => setViewingMatchId(null)} />
      )}
    </Box>
  );
}
