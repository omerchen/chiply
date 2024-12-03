import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  CircularProgress
} from '@mui/material';
import { readData } from '../services/database';
import ClubBreadcrumbs from '../components/ClubBreadcrumbs';

interface SessionDetails {
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
}

function ClubSessionDetails() {
  const { clubId, sessionId } = useParams<{ clubId: string; sessionId: string }>();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [clubName, setClubName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionData, clubData] = await Promise.all([
          readData(`sessions/${sessionId}`),
          readData(`clubs/${clubId}`)
        ]);
        
        setSession(sessionData);
        setClubName(clubData.name || '');
      } catch (error) {
        console.error('Error fetching session details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clubId, sessionId]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!session) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
        <Typography color="error">Session not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
      <ClubBreadcrumbs 
        clubId={clubId!} 
        clubName={clubName}
        currentPage="Session Details"
        parentPage={{
          name: "Sessions",
          path: "sessions"
        }}
      />
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Session Details
        </Typography>
        <Typography color="text.secondary">
          Started: {new Date(Number(session.details.startTime)).toLocaleString()}
        </Typography>
        <Typography color="text.secondary">
          Stakes: {session.details.stakes.smallBlind}/{session.details.stakes.bigBlind}
          {session.details.stakes.ante && ` (${session.details.stakes.ante} ante)`}
        </Typography>
      </Paper>
    </Container>
  );
}

export default ClubSessionDetails; 