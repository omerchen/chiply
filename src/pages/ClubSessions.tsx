import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import StyleIcon from "@mui/icons-material/Style";
import AddIcon from "@mui/icons-material/Add";
import { readData } from "../services/database";
import ClubBreadcrumbs from "../components/ClubBreadcrumbs";
import ActionButton from "../components/ActionButton";
import { getCurrentUser } from "../services/auth";
import { Player } from "../types/types";

interface SessionDetails {
  id: string;
  clubId: string;
  details: {
    type: string;
    startTime: number;
    stakes: {
      bigBlind: number;
      smallBlind: number;
      ante?: number;
    };
  };
  status: string;
  data: {
    buyins: {
      [key: string]: {
        playerId: string;
        time: number;
        amount: number;
        isPaybox: boolean;
      };
    };
    cashouts: {
      [key: string]: {
        playerId: string;
        time: number;
        cashout: number;
      };
    };
  };
}

function calculateSessionDuration(session: SessionDetails): string | null {
  if (!session?.data?.buyins || !session?.data?.cashouts) return null;

  // Find first buyin time
  const buyinTimes = Object.values(session.data.buyins).map(
    (buyin) => buyin.time
  );
  if (buyinTimes.length === 0) return null;
  const firstBuyinTime = Math.min(...buyinTimes);

  // Find last cashout time
  const cashoutTimes = Object.values(session.data.cashouts).map(
    (cashout) => cashout.time
  );
  if (cashoutTimes.length === 0) return null;
  const lastCashoutTime = Math.max(...cashoutTimes);

  // Calculate duration in milliseconds
  const durationMs = lastCashoutTime - firstBuyinTime;

  // Convert to hours and minutes
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours} hours${minutes > 0 ? ` and ${minutes} minutes` : ""}`;
}

function ClubSessions() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clubName, setClubName] = useState("");
  const [sessions, setSessions] = useState<SessionDetails[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clubData, sessionsData, currentUser] = await Promise.all([
          readData(`clubs/${clubId}`),
          readData("sessions"),
          getCurrentUser()
        ]);

        setClubName(clubData.name || "");
        
        if (currentUser) {
          setUserRole(currentUser.clubs[clubId!]?.role);
        }

        // Filter sessions for this club and add IDs
        const clubSessions = Object.entries(
          (sessionsData as Record<string, SessionDetails>) || {}
        )
          .filter(([_, session]) => session.clubId === clubId)
          .map(([id, session]) => ({
            ...session,
            id,
          }))
          .sort(
            (a, b) =>
              new Date(b.details.startTime).getTime() -
              new Date(a.details.startTime).getTime()
          );

        setSessions(clubSessions);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clubId]);

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

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
      <ClubBreadcrumbs
        clubId={clubId!}
        clubName={clubName}
        currentPage="Sessions"
      />

      {sessions.length === 0 ? (
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 2,
            background: "linear-gradient(to bottom right, #ffffff, #f5f5f5)",
          }}
        >
          <Box sx={{ mb: 3 }}>
            <StyleIcon
              sx={{
                fontSize: 80,
                color: "#673ab7",
                opacity: 0.7,
                mb: 2,
              }}
            />
          </Box>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "#673ab7",
            }}
          >
            No Sessions Yet
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 400, mx: "auto" }}
          >
            This club doesn't have any poker sessions yet. Use the new session
            button to start tracking your games.
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Stakes</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow
                    key={session.id}
                    onClick={() =>
                      navigate(`/clubs/${clubId}/sessions/${session.id}`)
                    }
                    sx={{
                      "&:hover": {
                        backgroundColor: "rgba(103, 58, 183, 0.04)",
                        cursor: "pointer",
                      },
                    }}
                  >
                    <TableCell>
                      {new Date(session.details.startTime).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {session.details.stakes.smallBlind}/
                      {session.details.stakes.bigBlind}
                      {session.details.stakes.ante &&
                        ` (${session.details.stakes.ante} ante)`}
                    </TableCell>
                    <TableCell>
                      {session.status === "close" &&
                        calculateSessionDuration(session)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={session.status.toUpperCase()}
                        color={
                          session.status === "open" ? "success" : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {userRole === 'admin' && (
        <Box sx={{ position: "fixed", bottom: 32, right: 32 }}>
          <ActionButton
            title="New Session"
            onClick={() => navigate(`/clubs/${clubId}/newSession`)}
            icon={<AddIcon />}
          />
        </Box>
      )}
    </Container>
  );
}

export default ClubSessions;
