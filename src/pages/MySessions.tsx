import React, { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  Stack,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import { ref, get } from "firebase/database";
import { db } from "../config/firebase";
import { getCurrentUser } from "../services/auth";
import EmptyState from "../components/EmptyState";
import { getApproximateHands, formatHands } from "../utils/gameUtils";

interface Session {
  id: string;
  details: {
    startTime: number;
    type: string;
    stakes: {
      smallBlind: number;
      bigBlind: number;
    };
  };
  status: "open" | "close";
  data: {
    buyins: {
      [key: string]: {
        playerId: string;
        amount: number;
        time: number;
      };
    };
    cashouts: {
      [key: string]: {
        playerId: string;
        stackValue: number;
        cashout: number;
        time: number;
      };
    };
  };
}

interface ProcessedSession {
  id: string;
  date: number;
  status: "Scheduled" | "Playing" | "Completed";
  playTime: string | null;
  buyinCount: number;
  buyinTotal: number;
  finalStack: number | null;
  profitLoss: number | null;
  clubName: string;
  playerCount: number;
  hands: number | null;
}

function MySessions() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ProcessedSession[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.email) {
          setLoading(false);
          return;
        }

        // Get all players with matching email
        const playersRef = ref(db, "players");
        const playersSnapshot = await get(playersRef);
        const playersData = playersSnapshot.val();
        
        const userPlayerIds = Object.entries(playersData || {})
          .filter(([_, player]: [string, any]) => player.email === currentUser.email)
          .map(([id]) => id);

        if (userPlayerIds.length === 0) {
          setLoading(false);
          return;
        }

        // Get all sessions
        const sessionsRef = ref(db, "sessions");
        const sessionsSnapshot = await get(sessionsRef);
        const sessionsData = sessionsSnapshot.val();

        // Get all clubs
        const clubsRef = ref(db, "clubs");
        const clubsSnapshot = await get(clubsRef);
        const clubsData = clubsSnapshot.val();

        if (!sessionsData) {
          setLoading(false);
          return;
        }

        // Process sessions
        const processedSessions: ProcessedSession[] = Object.entries(sessionsData)
          .map(([sessionId, session]: [string, any]) => {
            const playerBuyins = Object.values(session.data?.buyins || {}).filter(
              (buyin: any) => userPlayerIds.includes(buyin.playerId)
            );
            
            const playerCashout = Object.values(session.data?.cashouts || {}).find(
              (cashout: any) => userPlayerIds.includes(cashout.playerId)
            );

            // Skip sessions where the player isn't involved
            if (!playerBuyins.length && !Object.keys(session.data?.players || {}).some(id => userPlayerIds.includes(id))) {
              return null;
            }

            let status: "Scheduled" | "Playing" | "Completed" = "Scheduled";
            if (playerBuyins.length > 0) {
              status = playerCashout ? "Completed" : "Playing";
            }

            // Calculate play time and hands
            let playTime: string | null = null;
            let hands: number | null = null;
            
            if (playerBuyins.length > 0) {
              const firstBuyinTime = Math.min(...playerBuyins.map((b: any) => b.time));
              const endTime = playerCashout ? playerCashout.time : Date.now();
              const playTimeMs = endTime - firstBuyinTime;
              const hours = Math.floor(playTimeMs / (1000 * 60 * 60));
              const minutes = Math.floor((playTimeMs % (1000 * 60 * 60)) / (1000 * 60));
              playTime = `${hours}h ${minutes}m`;
              
              // Calculate hands for both Playing and Completed sessions
              const durationMinutes = Math.floor(playTimeMs / (1000 * 60));
              const playerCount = Object.keys(session.data?.players || {}).length;
              if (playerCount > 0) {
                hands = getApproximateHands(playerCount, durationMinutes);
              }
            }

            const buyinTotal = playerBuyins.reduce((sum: number, buyin: any) => sum + buyin.amount, 0);
            const playerCount = Object.keys(session.data?.players || {}).length;
            const clubName = clubsData[session.clubId]?.name || "Unknown Club";

            return {
              id: sessionId,
              date: session.details.startTime,
              status,
              playTime,
              buyinCount: playerBuyins.length,
              buyinTotal,
              finalStack: playerCashout?.stackValue || null,
              profitLoss: playerCashout ? playerCashout.stackValue - buyinTotal : null,
              clubName,
              playerCount,
              hands,
            };
          })
          .filter((session): session is ProcessedSession => session !== null)
          .sort((a, b) => b.date - a.date); // Sort by date descending

        setSessions(processedSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  if (loading) {
    return (
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (sessions.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
        <EmptyState
          icon={<EventIcon sx={{ fontSize: 48, color: "primary.main" }} />}
          title="No Sessions Found"
          description="You haven't participated in any poker sessions yet."
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <EventIcon sx={{ color: "#673ab7" }} />
          <Typography variant="h5">My Sessions</Typography>
        </Stack>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Club</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Players</TableCell>
                <TableCell>Play Time</TableCell>
                <TableCell align="right">Hands</TableCell>
                <TableCell align="right">Buy-ins</TableCell>
                <TableCell align="right">Total Buy-in</TableCell>
                <TableCell align="right">Final Stack</TableCell>
                <TableCell align="right">P&L</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    {new Date(session.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{session.clubName}</TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: "0.875rem",
                        ...(session.status === "Completed" && {
                          bgcolor: "success.main",
                          color: "success.contrastText",
                        }),
                        ...(session.status === "Playing" && {
                          bgcolor: "warning.main",
                          color: "warning.contrastText",
                        }),
                        ...(session.status === "Scheduled" && {
                          bgcolor: "info.main",
                          color: "info.contrastText",
                        }),
                      }}
                    >
                      {session.status}
                    </Box>
                  </TableCell>
                  <TableCell>{session.playerCount}</TableCell>
                  <TableCell>{session.playTime || "-"}</TableCell>
                  <TableCell align="right">{formatHands(session.hands)}</TableCell>
                  <TableCell align="right">{session.buyinCount}</TableCell>
                  <TableCell align="right">₪{session.buyinTotal}</TableCell>
                  <TableCell align="right">
                    {session.finalStack !== null ? `₪${session.finalStack}` : "-"}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color:
                        session.profitLoss === null
                          ? "inherit"
                          : session.profitLoss > 0
                          ? "success.main"
                          : session.profitLoss < 0
                          ? "error.main"
                          : "inherit",
                      fontWeight: "bold",
                    }}
                  >
                    {session.profitLoss !== null
                      ? `${session.profitLoss > 0 ? "+" : ""}₪${session.profitLoss}`
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}

export default MySessions; 