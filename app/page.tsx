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
import { useEffect, useState } from "react";
import { MdChevronLeft, MdLock, MdLogout, MdSportsTennis } from "react-icons/md";
import { formatCategory } from "@/utils/enums";
import { getLiveMatchForCourt, mockCredentials, type MockRole } from "@/utils/mockData";
import RefereeDashboard from "@/components/RefereeDashboard";

type Match = {
  id: string;
  team1: { team_name: string; logo: string; color: string } | null;
  team2: { team_name: string; logo: string; color: string } | null;
  court: number;
  match_category: string;
};

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (role: MockRole, name: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const cred = mockCredentials.find(
        (c) => c.username === username && c.password === password,
      );
      if (!cred) {
        setError("Incorrect username or password");
        return;
      }
      onLogin(cred.role, cred.full_name);
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
            Gamescore
          </Text>
          <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="widest">
            UMPIRE / REFEREE PORTAL
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

// ─── Court Selector ───────────────────────────────────────────────────────────

function CourtSelector({
  userName,
  onLogout,
}: {
  userName: string | null;
  onLogout: () => void;
}) {
  const router = useRouter();
  // undefined = loading, null = no match, Match = has match
  const [courtMatches, setCourtMatches] = useState<Record<number, Match | null | undefined>>({ 1: undefined, 2: undefined });
  const [courtsLoading, setCourtsLoading] = useState(false);

  const fetchBothCourts = () => {
    setCourtsLoading(true);
    setCourtMatches({ 1: undefined, 2: undefined });
    setTimeout(() => {
      const results = [1, 2].map((c) => [c, getLiveMatchForCourt(c) ?? null] as const);
      setCourtMatches(Object.fromEntries(results));
      setCourtsLoading(false);
    }, 300);
  };

  useEffect(() => {
    fetchBothCourts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box minH="100vh" w="full" bg="white" display="flex" alignItems="flex-start" justifyContent="center" p={6}>
      <VStack gap={8} w="full" maxW="400px" align="stretch">

        {/* Brand + user */}
        <HStack justify="space-between" align="start">
          <VStack gap={1} align="start">
            <Text fontSize="3xl" fontWeight="900" letterSpacing="tighter" color="gray.900" lineHeight="1">
              Gamescore
            </Text>
            <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="widest">
              REFEREE MANAGEMENT
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

        <VStack gap={6} w="full">
          <Text fontSize="10px" fontWeight="black" color="gray.400" letterSpacing="widest" alignSelf="flex-start">
            SELECT COURT
          </Text>

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
                    router.push(`/ref/court/${c}${m?.match_category ? `?category=${m.match_category}` : ""}`);
                  } : undefined}
                  bg={!isLoading && !hasMatch ? "gray.50" : "white"}
                  borderRadius="2xl"
                  border="2px solid"
                  borderColor={hasMatch ? "orange.200" : "gray.100"}
                  overflow="hidden"
                  transition="all 0.2s"
                  opacity={!isLoading && !hasMatch ? 0.5 : 1}
                  cursor={hasMatch ? "pointer" : "not-allowed"}
                  pointerEvents={!isLoading && !hasMatch ? "none" : "auto"}
                  _hover={hasMatch ? { borderColor: "orange.400", bg: "orange.50" } : {}}
                >
                  {/* Court header */}
                  <HStack
                    px={4}
                    py={2}
                    bg={hasMatch ? "orange.50" : "gray.50"}
                    justify="space-between"
                  >
                    <Text
                      fontSize="10px"
                      fontWeight="black"
                      letterSpacing="widest"
                      color={hasMatch ? "orange.500" : "gray.400"}
                    >
                      COURT {c}
                    </Text>
                    {isLoading ? (
                      <Spinner size="xs" color="gray.300" />
                    ) : hasMatch ? (
                      <Box
                        px={2}
                        py={0.5}
                        bg="orange.100"
                        borderRadius="full"
                      >
                        <Text fontSize="8px" fontWeight="black" color="orange.600" letterSpacing={1}>
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
                          bg="orange.500"
                          borderRadius="xl"
                          flexShrink={0}
                        >
                          <Text fontSize="10px" fontWeight="black" color="white" letterSpacing={1}>
                            OPEN →
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

      </VStack>
    </Box>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────

const SESSION_KEY = "gamescore.session";

export default function RootPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<MockRole | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // No backend session — restore the mock session from this tab only.
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setLoggedIn(true);
      setRole(parsed.role ?? null);
      setUserName(parsed.userName ?? null);
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = (r: MockRole, name: string) => {
    setUserName(name);
    setRole(r);
    setLoggedIn(true);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role: r, userName: name }));
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setRole(null);
    setUserName(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  if (!authChecked) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="orange.500" />
      </Box>
    );
  }

  if (!loggedIn || !role) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (role === "referee") {
    return <RefereeDashboard userName={userName} onLogout={handleLogout} />;
  }

  return <CourtSelector userName={userName} onLogout={handleLogout} />;
}
