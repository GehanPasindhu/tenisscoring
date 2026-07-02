"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Box, HStack, Text, Spinner, VStack, Button } from "@chakra-ui/react";
import SetEditor from "@/components/setEditor";
import ServerSelectModal from "@/components/ServerSelectModal";
import { formatCategory } from "@/utils/enums";
import { MdAdd } from "react-icons/md";
import { addSet as apiAddSet, fetchLiveMatch } from "@/utils/api";
import type { PlayerStat, SetRow, TeamRef } from "@/utils/types";

export default function RefCourtPage() {
  const params = useParams();
  const court = Number(params.court);
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  const [matchId, setMatchId] = useState<string>("");
  const [team1, setTeam1] = useState<TeamRef | null>(null);
  const [team2, setTeam2] = useState<TeamRef | null>(null);
  const [roster, setRoster] = useState<PlayerStat[]>([]);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSet, setAddingSet] = useState(false);

  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [showServerModal, setShowServerModal] = useState(false);

  // Fetch live match + scores
  useEffect(() => {
    if (!court) return;

    const load = async () => {
      setLoading(true);
      const match = await fetchLiveMatch(court);
      if (!match) {
        setTeam1(null);
        setTeam2(null);
        setRoster([]);
        setSets([]);
        setLoading(false);
        return;
      }

      setMatchId(match.id);
      setTeam1(match.team1);
      setTeam2(match.team2);
      setRoster(match.roster);

      // Sort existing sets newest first (highest set_number at top)
      const sorted = match.sets.slice().sort((a, b) => b.set_number - a.set_number);
      setSets(sorted);
      setLoading(false);
    };

    load();
  }, [court]);

  // Creates the set on the server, then adds it to local state.
  const addSet = async (server: PlayerStat) => {
    if (!matchId) return;
    setAddingSet(true);
    try {
      const newSet = await apiAddSet(matchId, `${server.first_name} ${server.last_name}`.trim());
      setSets((prev) => [newSet, ...prev]);
      setActiveSetIndex(0);
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
            onClick={() => setShowServerModal(true)}
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
                  roster={roster}
                  onChange={(updated) => {
                    setSets((prev) => prev.map((p, i) => (i === idx ? updated : p)));
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

      {showServerModal && (
        <ServerSelectModal
          roster={roster}
          team1={team1}
          team2={team2}
          onClose={() => setShowServerModal(false)}
          onSelect={(player) => {
            addSet(player);
            setShowServerModal(false);
          }}
        />
      )}
    </Box>
  );
}
