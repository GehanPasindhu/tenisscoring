"use client";

import {
  Box,
  Button,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import type { ElementType } from "react";
import { useEffect, useState } from "react";
import { MdSports, MdAnalytics, MdChevronLeft, MdLock, MdLogout, MdSportsTennis } from "react-icons/md";
import { formatCategory } from "@/utils/enums";
import { mockLiveMatches, mockUser } from "@/utils/mockData";

type GSRole = "match_ref" | "scoring_ref";
type PanelRole = "ref" | "stats";

type Match = {
  id: string;
  team1: { team_name: string; logo: string; color: string } | null;
  team2: { team_name: string; logo: string; color: string } | null;
  court: number;
  match_category: string;
};

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (role: GSRole, name: string | null) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Mock login: any non-empty username/password succeeds.
    setTimeout(() => {
      setLoading(false);
      onLogin(mockUser.role, mockUser.full_name);
    }, 300);
  };

  return (
    <Box minH="100vh" w="full" bg="white" display="flex" alignItems="center" justifyContent="center" p={6}>
      <VStack gap={8} w="full" maxW="360px" align="stretch">
        {/* Brand */}
        <VStack gap={2} align="center">
          <Box p={4} bg="orange.50" borderRadius="2xl" mb={1}>
            <MdSportsTennis size={36} color="#f97316" />
          </Box>
          <Text fontSize="2xl" fontWeight="900" letterSpacing="tighter" color="gray.900" lineHeight="1">
            SLPL <Text as="span" color="orange.500">2026</Text>
          </Text>
          <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="widest">
            GAMESCORE · REFEREE PORTAL
          </Text>
        </VStack>

        {/* Form */}
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.100"
          borderRadius="3xl"
          p={6}
          shadow="sm"
        >
          <form onSubmit={handleSubmit}>
            <VStack gap={4} align="stretch">
              <Box
                w={10} h={10} bg="orange.50" borderRadius="xl"
                display="flex" alignItems="center" justifyContent="center" mx="auto" mb={1}
              >
                <MdLock size={20} color="#f97316" />
              </Box>

              <Box>
                <Text fontSize="xs" fontWeight="700" color="gray.500" mb={1} textTransform="uppercase">
                  Username
                </Text>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  size="sm"
                  color="gray.800"
                  autoComplete="username"
                  required
                />
              </Box>

              <Box>
                <Text fontSize="xs" fontWeight="700" color="gray.500" mb={1} textTransform="uppercase">
                  Password
                </Text>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  size="sm"
                  color="gray.800"
                  autoComplete="current-password"
                  required
                />
              </Box>

              {error && (
                <Box bg="red.50" border="1px solid" borderColor="red.200" borderRadius="lg" px={3} py={2}>
                  <Text fontSize="sm" color="red.600" fontWeight="600">{error}</Text>
                </Box>
              )}

              <Button
                type="submit"
                bg="orange.500"
                color="white"
                size="sm"
                w="full"
                mt={1}
                loading={loading}
                disabled={!username || !password}
                _hover={{ bg: "orange.600" }}
                borderRadius="xl"
                fontWeight="black"
                letterSpacing="wide"
              >
                SIGN IN
              </Button>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Box>
  );
}

// ─── Panel Selector ───────────────────────────────────────────────────────────

function SelectionCard({
  title,
  subtitle,
  icon: Icon,
  onClick,
  colorScheme = "orange",
}: {
  title: string;
  subtitle: string;
  icon: ElementType;
  onClick: () => void;
  colorScheme?: string;
}) {
  return (
    <Box
      as="button"
      w="full"
      onClick={onClick}
      bg="white"
      p={6}
      borderRadius="3xl"
      border="2px solid"
      borderColor="gray.100"
      transition="all 0.2s"
      _hover={{ borderColor: `${colorScheme}.500`, bg: `${colorScheme}.50` }}
      _active={{ transform: "translateY(1px)" }}
      textAlign="left"
    >
      <HStack gap={5}>
        <Box p={4} bg={`${colorScheme}.50`} color={`${colorScheme}.500`} borderRadius="2xl">
          <Icon size={32} />
        </Box>
        <VStack align="flex-start" gap={0}>
          <Text fontSize="xl" fontWeight="900" color="gray.800">{title}</Text>
          <Text fontSize="sm" fontWeight="600" color="gray.400">{subtitle}</Text>
        </VStack>
      </HStack>
    </Box>
  );
}

function PanelSelector({
  userName,
  onLogout,
}: {
  userName: string | null;
  onLogout: () => void;
}) {
  const router = useRouter();
  const [role, setRole] = useState<PanelRole | null>(null);
  // undefined = loading, null = no match, Match = has match
  const [courtMatches, setCourtMatches] = useState<Record<number, Match | null | undefined>>({});
  const [courtsLoading, setCourtsLoading] = useState(false);

  const fetchBothCourts = () => {
    setCourtsLoading(true);
    setCourtMatches({ 1: undefined, 2: undefined });
    setTimeout(() => {
      const results = [1, 2].map((c) => [c, mockLiveMatches[c] ?? null] as const);
      setCourtMatches(Object.fromEntries(results));
      setCourtsLoading(false);
    }, 300);
  };

  const handleSelectRole = (r: PanelRole) => {
    setRole(r);
    fetchBothCourts();
  };

  const accentColor = role === "ref" ? "orange" : "blue";

  return (
    <Box minH="100vh" w="full" bg="white" display="flex" alignItems="flex-start" justifyContent="center" p={6}>
      <VStack gap={8} w="full" maxW="400px" align="stretch">

        {/* Brand + user */}
        <HStack justify="space-between" align="start">
          <VStack gap={1} align="start">
            <Text fontSize="3xl" fontWeight="900" letterSpacing="tighter" color="gray.900" lineHeight="1">
              SLPL <Text as="span" color="orange.500">2026</Text>
            </Text>
            <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="widest">
              GAMESCORE MANAGEMENT
            </Text>
            {userName && (
              <Text fontSize="xs" color="gray.500" fontWeight="600" mt={0.5}>
                👋 {userName}
              </Text>
            )}
          </VStack>
          <Button
            size="xs"
            variant="ghost"
            color="gray.400"
            onClick={onLogout}
            _hover={{ color: "red.500", bg: "red.50" }}
            borderRadius="xl"
          >
            <MdLogout size={16} />
            <Text ml={1} fontSize="xs" fontWeight="700">Sign out</Text>
          </Button>
        </HStack>

        {/* Role selection */}
        {!role && (
          <VStack gap={4} w="full">
            <Text fontSize="xs" fontWeight="800" color="gray.500" mb={1}>CHOOSE YOUR PANEL</Text>
            <SelectionCard
              title="Referee"
              subtitle="Manage live match scoring"
              icon={MdSports}
              onClick={() => handleSelectRole("ref")}
              colorScheme="orange"
            />
            <SelectionCard
              title="Player Stats"
              subtitle="Track individual performance"
              icon={MdAnalytics}
              onClick={() => handleSelectRole("stats")}
              colorScheme="blue"
            />
          </VStack>
        )}

        {/* Court cards — shown after role is chosen */}
        {role && (
          <VStack gap={6} w="full">
            <HStack w="full" justify="space-between" align="center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setRole(null); setCourtMatches({}); }}
                borderRadius="full"
                color="gray.400"
                _hover={{ color: "orange.500", bg: "gray.50" }}
              >
                <MdChevronLeft size={20} /> Back
              </Button>
              <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="widest">
                SELECT COURT
              </Text>
            </HStack>

            <VStack w="full" gap={4}>
              {[1, 2].map((c) => {
                const m = courtMatches[c];
                const isLoading = courtsLoading || m === undefined;
                const hasMatch = !isLoading && m !== null;

                return (
                  <Box
                    key={c}
                    as={hasMatch ? "button" : "div"}
                    w="full"
                    onClick={hasMatch ? () => {
                      const base = role === "ref"
                        ? `/ref/court/${c}?role=${role}${m?.match_category ? `&category=${m.match_category}` : ""}`
                        : `/stats/court/${c}`;
                      router.push(base);
                    } : undefined}
                    bg={!isLoading && !hasMatch ? "gray.50" : "white"}
                    borderRadius="2xl"
                    border="2px solid"
                    borderColor={hasMatch ? `${accentColor}.200` : "gray.100"}
                    overflow="hidden"
                    transition="all 0.2s"
                    opacity={!isLoading && !hasMatch ? 0.5 : 1}
                    cursor={hasMatch ? "pointer" : "not-allowed"}
                    pointerEvents={!isLoading && !hasMatch ? "none" : "auto"}
                    _hover={hasMatch ? { borderColor: `${accentColor}.400`, bg: `${accentColor}.50` } : {}}
                  >
                    {/* Court header */}
                    <HStack
                      px={4}
                      py={2}
                      bg={hasMatch ? `${accentColor}.50` : "gray.50"}
                      justify="space-between"
                    >
                      <Text
                        fontSize="10px"
                        fontWeight="black"
                        letterSpacing="widest"
                        color={hasMatch ? `${accentColor}.500` : "gray.400"}
                      >
                        COURT {c}
                      </Text>
                      {isLoading ? (
                        <Spinner size="xs" color="gray.300" />
                      ) : hasMatch ? (
                        <Box
                          px={2}
                          py={0.5}
                          bg={`${accentColor}.100`}
                          borderRadius="full"
                        >
                          <Text fontSize="8px" fontWeight="black" color={`${accentColor}.600`} letterSpacing={1}>
                            LIVE
                          </Text>
                        </Box>
                      ) : (
                        <Text fontSize="8px" fontWeight="black" color="gray.300" letterSpacing={1}>
                          NO MATCH
                        </Text>
                      )}
                    </HStack>

                    {/* Court body */}
                    <Box px={4} py={3}>
                      {isLoading ? (
                        <Text fontSize="xs" color="gray.300" fontWeight="600">Checking for live match...</Text>
                      ) : hasMatch ? (
                        <HStack justify="space-between" align="center">
                          <VStack align="start" gap={0} flex={1} minW={0}>
                            <Text fontSize="sm" fontWeight="900" color="gray.800">
                              {m?.team1?.team_name ?? "TBD"}
                            </Text>
                            <Text fontSize="xs" color="gray.400" fontWeight="700">vs {m?.team2?.team_name ?? "TBD"}</Text>
                            {m?.match_category && (
                              <Text fontSize="8px" fontWeight="black" color="gray.300" letterSpacing={1} mt={0.5}>
                                {formatCategory(m.match_category).toUpperCase()}
                              </Text>
                            )}
                          </VStack>
                          <Box
                            px={3}
                            py={1.5}
                            bg={`${accentColor}.500`}
                            borderRadius="xl"
                            flexShrink={0}
                          >
                            <Text fontSize="10px" fontWeight="black" color="white" letterSpacing={1}>
                              {role === "ref" ? "OPEN →" : "STATS →"}
                            </Text>
                          </Box>
                        </HStack>
                      ) : (
                        <Text fontSize="xs" color="gray.400" fontWeight="600">No matches available</Text>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </VStack>

            <Button
              variant="ghost"
              w="full"
              onClick={fetchBothCourts}
              color="gray.400"
              fontSize="xs"
              fontWeight="black"
              letterSpacing="widest"
              loading={courtsLoading}
            >
              REFRESH
            </Button>
          </VStack>
        )}

      </VStack>
    </Box>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────

export default function RootPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // No backend session to check — start logged out.
    setLoggedIn(false);
    setUserName(null);
    setAuthChecked(true);
  }, []);

  const handleLogin = (_role: GSRole, name: string | null) => {
    setUserName(name);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUserName(null);
  };

  if (!authChecked) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="orange.500" />
      </Box>
    );
  }

  if (!loggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <PanelSelector userName={userName} onLogout={handleLogout} />;
}
