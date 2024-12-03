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

interface PlayerData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

function ClubPlayerDetails() {
  const { clubId, playerId } = useParams<{ clubId: string; playerId: string }>();
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [clubName, setClubName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playerData, clubData] = await Promise.all([
          readData(`players/${playerId}`),
          readData(`clubs/${clubId}`)
        ]);
        
        setPlayer(playerData);
        setClubName(clubData.name || '');
      } catch (error) {
        console.error('Error fetching player details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clubId, playerId]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!player) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
        <Typography color="error">Player not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
      <ClubBreadcrumbs 
        clubId={clubId!} 
        clubName={clubName}
        currentPage={`${player.firstName} ${player.lastName}`}
        parentPage={{
          name: "Players",
          path: `players`
        }}
      />
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          {player.firstName} {player.lastName}
        </Typography>
        <Typography color="text.secondary">
          {player.email}
        </Typography>
      </Paper>
    </Container>
  );
}

export default ClubPlayerDetails; 