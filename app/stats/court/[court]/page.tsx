"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Box, HStack, VStack, Text, Spinner,
  Button
} from "@chakra-ui/react";
import {
  MdBarChart,
  MdOutlineSportsTennis,
  MdOutlineFlashOn,
  MdOutlineErrorOutline,
  MdOutlineTrendingDown,
  MdChevronLeft,
  MdAdd,
  MdRemove,
} from "react-icons/md";

type Team = { id: string; team_name: string };
type PlayerStatRow = {
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

type LastUpdate = {
  player_id: string;
  key: string;
  delta: number;
  ts: number;
};

const SEASON_ID = "2bedc1aa-aedc-4d21-9b2e-fd94f6d04835";

const STAT_FIELDS = [
  { key: "aces", label: "Aces", color: "green.500", hex: "#38a169", icon: MdOutlineFlashOn },
  { key: "winners", label: "Winners", color: "blue.500", hex: "#3182ce", icon: MdOutlineSportsTennis },
  { key: "double_faults", label: "D. Faults", color: "red.500", hex: "#e53e3e", icon: MdOutlineTrendingDown },
  { key: "unforced_errors", label: "U. Errors", color: "orange.500", hex: "#dd6b20", icon: MdOutlineErrorOutline },
];

export default function StatsCourtPage() {
  const params = useParams();
  const court = Number(params.court);
  const [matchId, setMatchId] = useState<string>("");
  const [team1, setTeam1] = useState<Team | null>(null);
  const [team2, setTeam2] = useState<Team | null>(null);
  const [roster, setRoster] = useState<PlayerStatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<LastUpdate | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const rosterRef = useRef<PlayerStatRow[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    rosterRef.current = roster;
  }, [roster]);

  useEffect(() => {
    if (!court) return;

    const loadMatch = async () => {
      setLoading(true);
      try {
        const matchRes = await fetch(`/api/live-match?court=${court}`);
        const match = await matchRes.json();

        if (!match) return;

        setTeam1(match.team1);
        setTeam2(match.team2);
        setMatchId(match.id);

        const statsRes = await fetch(`/api/matches/player-stats?match_id=${match.id}`);
        const data = await statsRes.json();

        const rosterWithSeason = (data.roster || []).map((p: PlayerStatRow) => ({
          ...p,
          season_id: SEASON_ID,
        }));
        setRoster(rosterWithSeason);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadMatch();
  }, [court]);

  const autoSave = () => {
    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!team1) return;
      try {
        const payload = rosterRef.current.map((p) => ({ ...p, season_id: SEASON_ID }));
        await fetch(`/api/matches/player-stats`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ match_id: matchId, stats: payload }),
        });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 1500);
      } catch (err) {
        console.error(err);
        setSaveStatus("idle");
      }
    }, 500);
  };

  const updatePlayer = (player: PlayerStatRow, key: string, delta: number) => {
    const current = player[key as keyof PlayerStatRow] as number;
    const next = Math.max(0, current + delta);
    const updated = { ...player, [key]: next, season_id: SEASON_ID };

    const newRoster = roster.map((p) => p.player_id === updated.player_id ? updated : p);
    rosterRef.current = newRoster;
    setRoster(newRoster);

    // Flash last update
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    setLastUpdate({ player_id: player.player_id, key, delta, ts: Date.now() });
    flashTimeoutRef.current = setTimeout(() => setLastUpdate(null), 3000);

    autoSave();
  };

  if (loading)
    return (
      <Box h="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="orange.500" />
      </Box>
    );

  if (!team1 || !team2)
    return (
      <Box p={10} textAlign="center">
        <Text fontSize="xl" fontWeight="bold" color="gray.500">
          No live match on Court {court}
        </Text>
      </Box>
    );

  const team1Players = roster.filter((p) => p.team_id === team1.id);
  const team2Players = roster.filter((p) => p.team_id === team2.id);

  return (
    <Box minH="100vh" w="full" bg="white" py={8}>
      <VStack maxW="500px" mx="auto" px={4} gap={8} align="stretch">
        {/* Header */}
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between" align="center">
            <Button
              size="sm"
              variant="subtle"
              colorScheme="gray"
              borderRadius="full"
              px={4}
              onClick={() => window.history.back()}
            >
              <MdChevronLeft size={18} /> Back
            </Button>
            <VStack align="flex-end" gap={0}>
              <Text fontSize="xl" fontWeight="900" letterSpacing="tight" color="gray.800">
                COURT {court}
              </Text>
              <Text fontSize="10px" fontWeight="bold" color="blue.500" letterSpacing="widest">
                PLAYER STATISTICS
              </Text>
            </VStack>
          </HStack>

          <HStack
            bg="white" p={4} borderRadius="2xl"
            border="2px solid" borderColor="gray.100"
            justify="center" gap={3}
          >
            <MdBarChart size={24} color="#3182ce" />
            <Text fontWeight="800" fontSize="lg" color="gray.700">Live Match Tracking</Text>
          </HStack>
        </VStack>

        {/* Teams */}
        <VStack gap={6} align="stretch">
          {[
            { team: team1, players: team1Players, color: "blue.500" },
            { team: team2, players: team2Players, color: "orange.500" },
          ].map(({ team, players, color }) => (
            <Box
              key={team.id}
              bg="white" borderRadius="3xl" p={6}
              border="2px solid" borderColor="gray.100"
            >
              <HStack mb={5} justify="space-between">
                <Text fontWeight="900" fontSize="lg" color="gray.800">{team.team_name}</Text>
                <Box w={3} h={3} borderRadius="full" bg={color} />
              </HStack>

              {players.length === 0 ? (
                <Box py={6} textAlign="center" border="1px dashed" borderColor="gray.100" borderRadius="2xl">
                  <Text color="gray.400" fontSize="sm" fontWeight="600">No players assigned</Text>
                </Box>
              ) : (
                <VStack gap={5}>
                  {players.map((player) => (
                    <Box key={player.player_id} bg="gray.50" borderRadius="2xl" p={4} w="full">
                      <Text fontWeight="800" fontSize="lg" mb={4} color="gray.700">
                        {player.first_name} {player.last_name}
                      </Text>
                      <HStack gap={3} flexWrap="wrap">
                        {STAT_FIELDS.map(({ key, label, hex, icon: Icon }) => {
                          const val = player[key as keyof PlayerStatRow] as number;
                          const isFlashing =
                            lastUpdate?.player_id === player.player_id &&
                            lastUpdate?.key === key;
                          return (
                            <VStack
                              key={key}
                              flex={1}
                              minW="95px"
                              bg="white"
                              p={3}
                              borderRadius="xl"
                              border="2px solid"
                              borderColor={isFlashing ? hex : "gray.100"}
                              gap={2}
                              transition="border-color 0.2s"
                            >
                              <HStack gap={1.5} color="gray.400">
                                <Icon size={14} />
                                <Text fontSize="10px" fontWeight="900" letterSpacing="wider" textTransform="uppercase">
                                  {label}
                                </Text>
                              </HStack>

                              {/* Value */}
                              <Text
                                fontSize="2xl"
                                fontWeight="900"
                                color={isFlashing ? hex : "gray.700"}
                                lineHeight="1"
                                transition="color 0.2s"
                              >
                                {val}
                              </Text>

                              {/* Last update badge */}
                              <Box h="16px">
                                {isFlashing && lastUpdate && (
                                  <Text
                                    fontSize="10px"
                                    fontWeight="800"
                                    color={lastUpdate.delta > 0 ? "green.500" : "red.500"}
                                  >
                                    {lastUpdate.delta > 0 ? `+${lastUpdate.delta}` : lastUpdate.delta}
                                  </Text>
                                )}
                              </Box>

                              {/* +/- buttons */}
                              <HStack gap={2} w="full">
                                <Button
                                  flex={1}
                                  h="32px"
                                  minW={0}
                                  bg="red.50"
                                  color="red.500"
                                  borderRadius="lg"
                                  fontSize="lg"
                                  fontWeight="900"
                                  _hover={{ bg: "red.100" }}
                                  _active={{ bg: "red.200" }}
                                  onClick={() => updatePlayer(player, key, -1)}
                                  disabled={val === 0}
                                >
                                  <MdRemove size={16} />
                                </Button>
                                <Button
                                  flex={1}
                                  h="32px"
                                  minW={0}
                                  bg="green.50"
                                  color="green.600"
                                  borderRadius="lg"
                                  fontSize="lg"
                                  fontWeight="900"
                                  _hover={{ bg: "green.100" }}
                                  _active={{ bg: "green.200" }}
                                  onClick={() => updatePlayer(player, key, +1)}
                                >
                                  <MdAdd size={16} />
                                </Button>
                              </HStack>
                            </VStack>
                          );
                        })}
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          ))}
        </VStack>

        <Box pt={4} textAlign="center">
          <Text fontSize="xs" fontWeight="bold" letterSpacing="widest"
            color={saveStatus === "saved" ? "green.400" : saveStatus === "saving" ? "orange.400" : "gray.300"}
          >
            {saveStatus === "saved" ? "✓ SAVED" : saveStatus === "saving" ? "SAVING..." : "AUTO-SAVING STATS"}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}
