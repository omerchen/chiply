import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, CircularProgress } from '@mui/material';
import { readData } from '../services/database';
import ClubBreadcrumbs from '../components/ClubBreadcrumbs';

interface SessionData {
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
}

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
  data: SessionData;
}

function SessionSummary() {
  const { clubId, sessionId } = useParams<{ clubId: string; sessionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clubName, setClubName] = useState("");
  const [session, setSession] = useState<SessionDetails | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!clubId || !sessionId) {
        setError("Invalid club or session ID");
        setLoading(false);
        return;
      }

      try {
        const [clubData, sessionData] = await Promise.all([
          readData(`clubs/${clubId}`),
          readData(`sessions/${sessionId}`),
        ]);

        if (!clubData || !sessionData) {
          setError("Session or club not found");
          setLoading(false);
          return;
        }

        setClubName(clubData.name || "");
        setSession(sessionData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error loading session data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clubId, sessionId]);

  const getSessionName = () => {
    return "Session";
  };

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

  if (error || !session) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
        <Typography color="error" variant="h6">
          {error || "Session not found"}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
      <ClubBreadcrumbs
        clubId={clubId!}
        clubName={clubName}
        currentPage="Summary"
        parentPages={[
          {
            name: "All Sessions",
            path: "sessions"
          },
          {
            name: getSessionName(),
            path: `sessions/${sessionId}`
          }
        ]}
      />
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Session Summary
        </Typography>
        {/* Summary content will be added in the next iteration */}
      </Paper>
    </Container>
  );
}

export default SessionSummary; 