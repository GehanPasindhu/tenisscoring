"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Box, HStack, Text, Spinner, VStack, Button } from "@chakra-ui/react";
import SetEditor, { type SetRow } from "@/components/setEditor";
import { formatCategory } from "@/utils/enums";
import { MdAdd } from "react-icons/md";

type Team = { id: string; team_name: string; logo?: string | null };

export default function RefCourtPage() {
  const params = useParams();
  const court = Number(params.court);
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  const [matchId, setMatchId] = useState<string>("");
  const [matchStage, setMatchStage] = useState<string>("group");
  const [team1, setTeam1] = useState<Team | null>(null);
  const [team2, setTeam2] = useState<Team | null>(null);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSet, setAddingSet] = useState(false);

  const [activeSetIndex, setActiveSetIndex] = useState(0);

  // Fetch live match + scores
  useEffect(() => {
    if (!court) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/live-match?court=${court}`);
        const match = await res.json();
        if (!match) {
          setLoading(false);
          return;
        }

        setMatchId(match.id);
        setMatchStage(match.match_stage ?? "group");
        setTeam1(match.team1);
        setTeam2(match.team2);

        const scoreRes = await fetch(
          `/api/matches/scores?match_id=${match.id}`,
        );
        const scoreData = await scoreRes.json();

        // Sort existing sets newest first (highest set_number at top)
        const sorted = (scoreData.sets ?? [])
          .sort((a: SetRow, b: SetRow) => b.set_number - a.set_number);
        setSets(sorted);
      } catch {
        setTeam1(null);
        setTeam2(null);
        setSets([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [court]);

  // Compute scoreboard payload from current sets and push to Google Sheets
  const pushScoreboard = (allSets: SetRow[]) => {
    if (!team1 || !team2) return;

    // Sort ascending by set_number for set1/set2/set3 columns
    const sorted = [...allSets].sort((a, b) => a.set_number - b.set_number);

    const gamesWon = (set: SetRow, teamId: string) =>
      set.games.filter((g) => g.winner_team_id === teamId).length;

    // Current game points: tiebreak if active, otherwise latest game without a winner
    const latestSet = sorted[sorted.length - 1];
    const activeGame = latestSet?.games.find((g) => !g.winner_team_id);
    const tiebreak = latestSet?.tiebreak;

    const POINT_MAP: Record<string, number> = { "0": 0, "15": 1, "30": 2, "40": 3, "Game": 4, "game": 4, "GAME": 4 };
    const toPointVal = (p: string | null | undefined) => POINT_MAP[p ?? ""] ?? 0;

    // Current game display points — raw tennis values (0,15,30,40,Game) or tiebreak raw number
    const t1_game_points = tiebreak
      ? (tiebreak.team1_tie_points ?? 0)
      : (activeGame?.team1_points ?? 0);
    const t2_game_points = tiebreak
      ? (tiebreak.team2_tie_points ?? 0)
      : (activeGame?.team2_points ?? 0);

    // Total match points: same mapping as matchview (0/1/2/3/4) summed across all games + tiebreaks
    const t1_match_points = sorted.reduce((total, s) => {
      const gameSum = s.games.reduce((sum, g) => sum + toPointVal(g.team1_points), 0);
      const tbSum = s.tiebreak?.team1_tie_points ?? 0;
      return total + gameSum + tbSum;
    }, 0);
    const t2_match_points = sorted.reduce((total, s) => {
      const gameSum = s.games.reduce((sum, g) => sum + toPointVal(g.team2_points), 0);
      const tbSum = s.tiebreak?.team2_tie_points ?? 0;
      return total + gameSum + tbSum;
    }, 0);

    // Sets won in this match
    const t1_sets_won = sorted.filter((s) => s.winner_team_id === team1.id).length;
    const t2_sets_won = sorted.filter((s) => s.winner_team_id === team2.id).length;

    // Total games won across all sets
    const t1_games_won = sorted.reduce((acc, s) => acc + gamesWon(s, team1.id), 0);
    const t2_games_won = sorted.reduce((acc, s) => acc + gamesWon(s, team2.id), 0);

    fetch("/api/scoreboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        court_number: court,
        team1_id: team1.id,
        team2_id: team2.id,
        t1_name: team1.team_name,
        t1_logo: team1.logo ?? "",
        t1_game_points,
        t1_set1: sorted[0] != null ? gamesWon(sorted[0], team1.id) : "",
        t1_set2: sorted[1] != null ? gamesWon(sorted[1], team1.id) : "",
        t1_set3: sorted[2] != null ? gamesWon(sorted[2], team1.id) : "",
        t1_sets_won,
        t1_games_won,
        t1_match_points,
        t2_name: team2.team_name,
        t2_logo: team2.logo ?? "",
        t2_game_points,
        t2_set1: sorted[0] != null ? gamesWon(sorted[0], team2.id) : "",
        t2_set2: sorted[1] != null ? gamesWon(sorted[1], team2.id) : "",
        t2_set3: sorted[2] != null ? gamesWon(sorted[2], team2.id) : "",
        t2_sets_won,
        t2_games_won,
        t2_match_points,
        match_category: category ?? "",
        match_stage: matchStage,
      }),
    }).catch(console.error);
  };

  // Creates the set row in DB immediately, then adds to state with the real id
  const addSet = async () => {
    if (!matchId) return;
    setAddingSet(true);
    try {
      const nextNum = sets.length + 1;
      const res = await fetch("/api/matches/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: matchId, set_number: nextNum }),
      });
      const data = await res.json();
      if (data.id) {
        const newSet: SetRow = { id: data.id, set_number: data.set_number, winner_team_id: "", games: [], tiebreak: null };
        setSets((prev) => {
          const updated = [newSet, ...prev];
          pushScoreboard(updated);
          return updated;
        });
        setActiveSetIndex(0);
      }
    } finally {
      setAddingSet(false);
    }
  };

  if (loading) return <Spinner size="xl" mx="auto" mt="20" />;

  if (!team1 || !team2) {
    return (
      <Box p={4} textAlign="center">
        <Text fontSize="lg" fontWeight="bold">
          No live match on Court {court}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      w="full"
      bg="white"
      py={2}
    >
      <VStack
        maxW="450px"
        mx="auto"
        px={4}
        gap={6}
        align="stretch"
      >
        {/* Header Section */}
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between" align="center">
            <Button
              size="sm"
              variant="subtle"
              colorScheme="orange"
              borderRadius="full"
              px={3}
              onClick={() => window.history.back()}
            >
              ← Back
            </Button>
            <VStack align="flex-end" gap={0}>
              <Text fontSize="sm" fontWeight="900" letterSpacing="tight" color="gray.800">
                COURT {court}
              </Text>
              <Text fontSize="xs" fontWeight="bold" color="orange.500" letterSpacing="widest">
                REFEREE PANEL
              </Text>
            </VStack>
          </HStack>

          <Box
            bg="white"
            p={1.5}
            borderRadius="2xl"
            border="2px solid"
            borderColor="gray.100"
            textAlign="center"
          >
            {category && (
              <Text
                fontSize="10px"
                fontWeight="black"
                color="blue.500"
                textTransform="uppercase"
                letterSpacing="widest"
                mb={1}
              >
                {formatCategory(category)}
              </Text>
            )}
            <Text
              fontSize="sm"
              fontWeight="800"
              color="gray.800"
              lineHeight="1.2"
            >
              {team1.team_name}
              <Text as="span" mx={3} color="gray.300" fontSize={"md"} fontWeight="400">vs</Text>
              {team2.team_name}
            </Text>
          </Box>
        </VStack>

        {/* Actions Section */}
        <HStack justify="space-between" align="center">
          <Text fontWeight="800" fontSize="lg" color="gray.700">Match Sets</Text>
          <Button
            size="md"
            bg="orange.500"
            color="white"
            borderRadius="xl"
            _hover={{ bg: "orange.600" }}
            _active={{ transform: "translateY(1px)" }}
            transition="all 0.1s"
            onClick={addSet}
            loading={addingSet}

          >
            <MdAdd size={20} />    Add Set
          </Button>
        </HStack>

        {/* Sets List */}
        <VStack gap={5} align="stretch">
          {sets.length === 0 ? (
            <Box py={10} textAlign="center" border="2px dashed" borderColor="gray.100" borderRadius="3xl">
              <Text color="gray.400" fontWeight="500">No sets added yet.</Text>
            </Box>
          ) : (
            sets.map((s, idx) => (
              <Box
                key={idx}
                border="2px solid"
                borderColor={idx === activeSetIndex ? "orange.400" : "gray.100"}
                borderRadius="2xl"
                onClick={() => setActiveSetIndex(idx)}
                transition="all 0.2s"
              >
                <SetEditor
                  matchId={matchId}
                  key={idx}
                  set={s}
                  team1={team1}
                  team2={team2}
                  onChange={(updated) => {
                    setSets((prev) => {
                      const next = prev.map((p, i) => (i === idx ? updated : p));
                      pushScoreboard(next);
                      return next;
                    });
                  }}
                  onRemove={() =>
                    setSets((prev) => prev.filter((_, i) => i !== idx))
                  }
                />
              </Box>
            ))
          )}
        </VStack>
      </VStack>
    </Box>
  );
}