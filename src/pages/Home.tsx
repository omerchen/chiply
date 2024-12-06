import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, CircularProgress } from '@mui/material';
import { getCurrentUser, User } from '../services/auth';
import { readData } from '../services/database';
import PlayerDashboard from '../components/PlayerDashboard';

function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerData, setPlayerData] = useState<{ id: string; clubIds: string[] } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);

        if (userData?.email) {
          // Get all players with matching email
          const playersData = await readData('players');
          if (playersData) {
            const matchingPlayer = Object.entries(playersData as Record<string, { email: string }>)
              .find(([_, player]) => player.email === userData.email);

            if (matchingPlayer) {
              const [playerId] = matchingPlayer;

              // Get all clubs where this player is a member
              const clubsData = await readData('clubs');
              if (clubsData) {
                const playerClubIds = Object.entries(clubsData as Record<string, { players?: Record<string, boolean> }>)
                  .filter(([_, club]) => club.players && club.players[playerId])
                  .map(([clubId]) => clubId);

                setPlayerData({
                  id: playerId,
                  clubIds: playerClubIds
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  // If user is a player, show the player dashboard
  if (playerData) {
    return <PlayerDashboard playerId={playerData.id} clubIds={playerData.clubIds} />;
  }

  // Otherwise show the default welcome screen
  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 3 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4,
          background: 'linear-gradient(to bottom right, #ffffff, #f5f5f5)',
          borderRadius: 2
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #673ab7, #9c27b0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            {user ? `Welcome back, ${user.firstName}!` : 'Welcome to Chiply'}
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary"
            sx={{ maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}
          >
            Your personal poker management platform
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default Home; 