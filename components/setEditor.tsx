import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  Input,
} from "@chakra-ui/react";
import { MdAdd, MdDelete, MdClose } from "react-icons/md";
import { useRef, useState } from "react";
import ServerSelectModal from "@/components/ServerSelectModal";
import { updateSet as apiUpdateSet, deleteSet as apiDeleteSet } from "@/utils/api";
import type { GameRow, PlayerStat, SetRow, TiebreakRow } from "@/utils/types";

export type { SetRow };

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamRef {
  id: string;
  team_name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SCORE_BTNS = ["0", "15", "30", "40", "A"] as const;

function emptyGame(num: number, serverName: string | null = null): GameRow {
  return {
    game_number: num,
    winner_team_id: "",
    team1_points: null,
    team2_points: null,
    is_golden_point: false,
    server_name: serverName,
  };
}

// ─── GameEditor ───────────────────────────────────────────────────────────────

function GameEditor({
  game,
  team1,
  team2,
  onChange,
  onRemove,
}: {
  game: GameRow;
  team1: TeamRef;
  team2: TeamRef;
  onChange: (g: GameRow) => void;
  onRemove: () => void;
  index: number;
}) {
  const rows = [
    {
      team: team1,
      pts: game.team1_points,
      ptKey: "team1_points" as const,
      color: "blue.500",
      bg: "blue.50",
    },
    {
      team: team2,
      pts: game.team2_points,
      ptKey: "team2_points" as const,
      color: "orange.500",
      bg: "orange.50",
    },
  ];

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      p={4}
      border="2px solid"
      borderColor="gray.100"
    >
      <HStack justify="space-between" mb={4}>
        <VStack gap={0.5} align="flex-start">
          <HStack gap={2}>
            <Box w={1.5} h={4} bg="gray.100" borderRadius="full" />
            <Text
              fontSize="xs"
              fontWeight="900"
              color="gray.400"
              letterSpacing="widest"
              textTransform="uppercase"
            >
              Game {game.game_number}
            </Text>
          </HStack>
          {game.server_name && (
            <Text fontSize="10px" fontWeight="700" color="gray.400" ml={3.5}>
              Serving: {game.server_name}
            </Text>
          )}
        </VStack>
        <Button
          size="xs"
          variant="ghost"
          color="gray.300"
          _hover={{ color: "red.500", bg: "gray.50" }}
          onClick={() => {
            if (window.confirm(`Delete Game ${game.game_number}?`)) onRemove();
          }}
          borderRadius="full"
        >
          <MdClose size={14} />
        </Button>
      </HStack>

      <VStack gap={5} align="stretch">
        {rows.map(({ team, pts, ptKey, color, bg }) => {
          const isWinner = game.winner_team_id === team.id;
          return (
            <VStack key={team.id} gap={2} align="stretch">
              <Text fontSize="xs" fontWeight="800" color="gray.600">
                {team.team_name}
              </Text>
              <HStack gap={2} px={1}>
                {SCORE_BTNS.map((p) => {
                  const isActive = pts === p && !isWinner;
                  return (
                    <Button
                      key={p}
                      onClick={() =>
                        onChange({
                          ...game,
                          // Only clear the win if it belonged to this same row —
                          // editing the other team's points shouldn't unset it.
                          winner_team_id: isWinner ? "" : game.winner_team_id,
                          [ptKey]: isWinner ? p : pts === p ? null : p,
                        })
                      }
                      flex={1}
                      h="42px"
                      bg={isActive ? color : "white"}
                      borderWidth="2px"
                      borderColor={isActive ? color : "gray.100"}
                      color={isActive ? "white" : "gray.500"}
                      fontSize="sm"
                      borderRadius="xl"
                      _hover={{
                        borderColor: color,
                        color: isActive ? "white" : color,
                      }}
                      _active={{ transform: "scale(0.95)" }}
                      transition="all 0.1s"
                    >
                      {p}
                    </Button>
                  );
                })}
                <Button
                  onClick={() =>
                    onChange({
                      ...game,
                      winner_team_id: isWinner ? "" : team.id,
                      [ptKey]: isWinner ? null : "Game",
                    })
                  }
                  aria-label="Win"
                  flex={1.5}
                  h="42px"
                  bg={isWinner ? color : "white"}
                  borderWidth="2px"
                  borderColor={isWinner ? color : "gray.100"}
                  color={isWinner ? "white" : "gray.400"}
                  fontSize="xs"
                  borderRadius="xl"
                  _hover={{
                    borderColor: color,
                    color: isWinner ? "white" : color,
                    bg: isWinner ? color : bg,
                  }}
                  _active={{ transform: "scale(0.95)" }}
                >
                  W
                </Button>
              </HStack>
            </VStack>
          );
        })}
      </VStack>
    </Box>
  );
}

// ─── SetEditor ────────────────────────────────────────────────────────────────

export default function SetEditor({
  set,
  team1,
  team2,
  roster,
  onChange,
  onRemove,
  matchId,
}: {
  set: SetRow;
  team1: TeamRef;
  team2: TeamRef;
  roster: PlayerStat[];
  matchId: string;
  onChange: (s: SetRow) => void;
  onRemove: () => void;
}) {
  const t1Wins = set.games.filter((g) => g.winner_team_id === team1.id).length;
  const t2Wins = set.games.filter((g) => g.winner_team_id === team2.id).length;
  const [showServerModal, setShowServerModal] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = (updatedSet: SetRow) => {
    onChange(updatedSet);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      apiUpdateSet(matchId, updatedSet.id, updatedSet).catch((e) => console.error("Auto-save failed", e));
    }, 400);
  };

  const addGame = (server: PlayerStat) => {
    const newGames = [emptyGame(0, `${server.first_name} ${server.last_name}`.trim()), ...set.games]; // prepend

    const updatedGames = newGames.map((g, idx, arr) => ({
      ...g,
      game_number: arr.length - idx, // reverse numbering
    }));

    commit({ ...set, games: updatedGames });
  };

  const removeGame = (idx: number) => {
    const newGames = set.games.filter((_, i) => i !== idx);

    const updatedGames = newGames.map((g, idx, arr) => ({
      ...g,
      game_number: arr.length - idx, // maintain reverse order
    }));

    commit({ ...set, games: updatedGames });
  };

  const updateGame = (idx: number, g: GameRow) => {
    // Golden point: both teams at 40 when a winner is declared
    const isGolden = !!(
      g.winner_team_id &&
      g.team1_points === "40" &&
      g.team2_points === "40"
    );
    const updatedGame: GameRow = { ...g, is_golden_point: isGolden };

    const games = set.games.map((old, i) => (i === idx ? updatedGame : old));

    // Auto-calculate set winner from game counts
    const t1W = games.filter((g) => g.winner_team_id === team1.id).length;
    const t2W = games.filter((g) => g.winner_team_id === team2.id).length;
    let setWinner = "";
    if (t1W > t2W) setWinner = team1.id;
    if (t2W > t1W) setWinner = team2.id;

    commit({ ...set, winner_team_id: setWinner, games });
  };

  // ── Tiebreak mutations (stored in slpl_tie_breaks via API) ─────────────────

  const addTiebreak = () => {
    commit({ ...set, tiebreak: { team1_tie_points: 0, team2_tie_points: 0 } });
  };

  const removeTiebreak = () => {
    commit({ ...set, tiebreak: null });
  };

  const updateTiebreak = (patch: Partial<TiebreakRow>) => {
    const current = set.tiebreak ?? {
      team1_tie_points: 0,
      team2_tie_points: 0,
    };
    const updated: TiebreakRow = { ...current, ...patch };

    // Auto-determine tiebreak winner → update set winner if tiebreak decides the set
    let setWinner = set.winner_team_id;
    if (
      updated.team1_tie_points !== null &&
      updated.team2_tie_points !== null
    ) {
      if (updated.team1_tie_points > updated.team2_tie_points)
        setWinner = team1.id;
      else if (updated.team2_tie_points > updated.team1_tie_points)
        setWinner = team2.id;
      else setWinner = "";
    }

    commit({ ...set, winner_team_id: setWinner, tiebreak: updated });
  };

  // ── Set delete ────────────────────────────────────────────────────────────

  const handleDeleteSet = () => {
    if (!window.confirm(`Delete Set ${set.set_number}?`)) return;
    onRemove();
    apiDeleteSet(matchId, set.id).catch((e) => console.error("Delete set failed", e));
  };

  return (
    <Box
      bg="white"
      borderRadius="xl"
      overflow="hidden"
      border="2px solid"
      borderColor="gray.100"
    >
      {/* Set header */}
      <HStack
        px={5}
        py={2}
        bg="gray.50"
        justify="space-between"
        borderBottom="1px solid"
        borderColor="gray.100"
        alignItems={"center"}
      >
        <HStack textAlign="center">
          <Text color="gray.400" mb={1}>
            SET
          </Text>
          <Box
            bg="orange.500"
            color="white"
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontWeight="900"
            fontSize="sm"
            px={3}
            py={1}
          >
            {set.set_number}
          </Box>
        </HStack>

        <HStack gap={0} align="center">
          <HStack gap={2} align="center">
            <Badge fontSize="sm" fontWeight="900" px={3} py={1}>
              {t1Wins}
            </Badge>
            <Text fontSize="xs" color="gray.300" fontWeight="bold">
              VS
            </Text>
            <Badge fontSize="sm" fontWeight="900" px={3} py={1}>
              {t2Wins}
            </Badge>
          </HStack>
        </HStack>

        <Button
          size="sm"
          _hover={{ color: "red.500", bg: "red.50" }}
          onClick={handleDeleteSet}
        >
          <MdDelete size={18} />
        </Button>
      </HStack>

      {/* Games list */}
      <VStack align="stretch" px={4} py={5} gap={4}>
        {/* Tiebreak section */}
        <Box
          borderRadius="2xl"
          border="2px solid"
          borderColor="blue.100"
          bg="blue.50/30"
          overflow="hidden"
        >
          <HStack px={4} py={3} justify="space-between" bg="blue.50">
            <HStack gap={2}>
              <Text
                fontSize="10px"
                fontWeight="900"
                color="blue.600"
                letterSpacing="widest"
              >
                TIEBREAK (6 – 6)
              </Text>
              {set.tiebreak && set.winner_team_id && (
                <Badge
                  bg="white"
                  color="blue.700"
                  fontSize="10px"
                  fontWeight="black"
                  px={2}
                  borderRadius="md"
                  shadow="sm"
                >
                  {set.winner_team_id === team1.id ? "T1 WINS" : "T2 WINS"}
                </Badge>
              )}
            </HStack>
            {set.tiebreak ? (
              <Button
                size="xs"
                variant="subtle"
                colorScheme="blue"
                onClick={removeTiebreak}
                borderRadius="full"
              >
                <MdClose size={12} />
              </Button>
            ) : (
              <Button
                size="xs"
                variant="solid"
                bg="blue.500"
                color="white"
                fontWeight="bold"
                px={3}
                onClick={addTiebreak}
                borderRadius="full"
              >
                Activate
              </Button>
            )}
          </HStack>

          {set.tiebreak && (
            <VStack px={4} py={4} gap={4} align="stretch">
              {[
                {
                  team: team1,
                  ptKey: "team1_tie_points" as const,
                  color: "blue.500",
                },
                {
                  team: team2,
                  ptKey: "team2_tie_points" as const,
                  color: "orange.500",
                },
              ].map(({ team, ptKey, color }) => {
                const pts = set.tiebreak![ptKey] ?? 0;
                return (
                  <HStack
                    key={team.id}
                    gap={4}
                    align="center"
                    justify="space-between"
                  >
                    <Text
                      fontSize="sm"
                      fontWeight="700"
                      color="gray.700"
                      flex={1}
                    >
                      {team.team_name}
                    </Text>
                    <HStack gap={3}>
                      <Button
                        size="md"
                        h="40px"
                        w="40px"
                        variant="surface"
                        colorScheme="gray"
                        borderRadius="xl"
                        fontWeight="900"
                        fontSize="xl"
                        onClick={() =>
                          updateTiebreak({ [ptKey]: Math.max(0, pts - 1) })
                        }
                      >
                        –
                      </Button>
                      <Input
                        type="number"
                        min={0}
                        value={pts}
                        onChange={(e) =>
                          updateTiebreak({
                            [ptKey]: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        w="60px"
                        h="40px"
                        textAlign="center"
                        fontWeight="900"
                        fontSize="xl"
                        color={color}
                        bg="white"
                        borderColor="gray.100"
                        borderWidth="2px"
                        borderRadius="xl"
                        _focus={{ borderColor: color, ring: 0 }}
                      />
                      <Button
                        size="md"
                        h="40px"
                        w="40px"
                        variant="surface"
                        colorScheme="gray"
                        borderRadius="xl"
                        fontWeight="900"
                        fontSize="xl"
                        onClick={() => updateTiebreak({ [ptKey]: pts + 1 })}
                      >
                        +
                      </Button>
                    </HStack>
                  </HStack>
                );
              })}
            </VStack>
          )}
        </Box>

        <HStack gap={2} pt={2}>
          <Box h="1px" bg="gray.100" flex={1} />
          <Button
            size="sm"
            variant="ghost"
            color="gray.400"
            _hover={{ color: "orange.500", bg: "orange.50" }}
            onClick={() => setShowServerModal(true)}
            borderRadius="full"
            fontWeight="800"
            fontSize="xs"
            letterSpacing="widest"
          >
            <MdAdd size={16} /> ADD GAME
          </Button>
          <Box h="1px" bg="gray.100" flex={1} />
        </HStack>

        <VStack gap={4} align="stretch">
          {set.games.map((g, idx) => (
            <GameEditor
              key={idx}
              game={g}
              team1={team1}
              team2={team2}
              index={idx}
              onChange={(g) => updateGame(idx, g)}
              onRemove={() => removeGame(idx)}
            />
          ))}
        </VStack>
      </VStack>

      {showServerModal && (
        <ServerSelectModal
          roster={roster}
          team1={team1}
          team2={team2}
          onClose={() => setShowServerModal(false)}
          onSelect={(player) => {
            addGame(player);
            setShowServerModal(false);
          }}
        />
      )}
    </Box>
  );
}
