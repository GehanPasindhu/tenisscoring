"use client";

import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { MdClose } from "react-icons/md";
import { mockRosterByMatch, type MockPlayerStat } from "@/utils/mockData";

interface TeamRef {
  id: string;
  team_name: string;
}

export default function ServerSelectModal({
  matchId,
  team1,
  team2,
  title = "Who's serving?",
  onSelect,
  onClose,
}: {
  matchId: string;
  team1: TeamRef;
  team2: TeamRef;
  title?: string;
  onSelect: (player: MockPlayerStat) => void;
  onClose: () => void;
}) {
  const roster = mockRosterByMatch[matchId] ?? [];
  const groups = [
    { team: team1, players: roster.filter((p) => p.team_id === team1.id), color: "blue.500" },
    { team: team2, players: roster.filter((p) => p.team_id === team2.id), color: "orange.500" },
  ];

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
      <Box
        bg="white"
        borderRadius="2xl"
        p={5}
        w="full"
        maxW="360px"
        onClick={(e) => e.stopPropagation()}
      >
        <HStack justify="space-between" mb={4}>
          <Text fontWeight="900" fontSize="md" color="gray.800">
            {title}
          </Text>
          <Button size="xs" variant="ghost" color="gray.400" onClick={onClose} borderRadius="full">
            <MdClose size={16} />
          </Button>
        </HStack>

        <VStack align="stretch" gap={5}>
          {groups.map(({ team, players, color }) => (
            <VStack key={team.id} align="stretch" gap={2}>
              <Text fontSize="xs" fontWeight="800" color="gray.500">
                {team.team_name}
              </Text>
              {players.length === 0 ? (
                <Text fontSize="xs" color="gray.300">No players available</Text>
              ) : (
                players.map((p) => (
                  <Button
                    key={p.player_id}
                    justifyContent="flex-start"
                    variant="outline"
                    borderColor="gray.100"
                    borderRadius="xl"
                    fontWeight="700"
                    color="gray.700"
                    _hover={{ borderColor: color, bg: `${color.split(".")[0]}.50`, color }}
                    onClick={() => onSelect(p)}
                  >
                    {p.first_name} {p.last_name}
                  </Button>
                ))
              )}
            </VStack>
          ))}
        </VStack>
      </Box>
    </Box>
  );
}
