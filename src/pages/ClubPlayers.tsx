import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  Fab,
  Tooltip
} from '@mui/material';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { readData } from '../services/database';
import ClubBreadcrumbs from '../components/ClubBreadcrumbs';

interface Player {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface ClubPlayer {
  id: string;
}

function ClubPlayers() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [clubName, setClubName] = useState<string>('');

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        console.log('Fetching players for club:', clubId);
        
        // First get club's data
        const clubData = await readData(`clubs/${clubId}`);
        setClubName(clubData.name || '');
        console.log('Club data:', clubData);

        if (!clubData?.players) {
          console.log('No players found in club data');
          setPlayers([]);
          setLoading(false);
          return;
        }

        // Get player IDs from the club's players object
        const playerIds = Object.keys(clubData.players);
        console.log('Player IDs:', playerIds);

        // Then fetch each player's details
        const playersData = await readData('players');
        console.log('All players data:', playersData);

        // Map player IDs to their full data
        const clubPlayers = playerIds
          .map(playerId => {
            const playerData = playersData[playerId];
            if (!playerData) {
              console.log('No data found for player:', playerId);
              return null;
            }
            return {
              id: playerId,
              ...playerData
            };
          })
          .filter((player): player is Player => {
            if (!player) {
              return false;
            }
            const hasRequiredFields = 
              player.email && 
              player.firstName && 
              player.lastName;
            if (!hasRequiredFields) {
              console.log('Player missing required fields:', player);
            }
            return hasRequiredFields;
          });

        console.log('Processed club players:', clubPlayers);
        setPlayers(clubPlayers);
      } catch (error) {
        console.error('Error fetching players:', error);
        setError('Failed to load players');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [clubId]);

  const handleInvitePlayer = () => {
    navigate(`/clubs/${clubId}/newPlayer`);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 3, mb: 3 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2
          }}
        >
          <Typography color="error">{error}</Typography>
        </Paper>
      </Container>
    );
  }

  const fabStyle = {
    position: 'fixed',
    bottom: 32,
    right: 32,
    bgcolor: '#673ab7',
    '&:hover': {
      bgcolor: '#563098'
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
      <ClubBreadcrumbs clubId={clubId!} clubName={clubName} currentPage="Players" />
      
      {players.length === 0 ? (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            borderRadius: 2,
            background: 'linear-gradient(to bottom right, #ffffff, #f5f5f5)'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <PeopleOutlineIcon 
              sx={{ 
                fontSize: 80, 
                color: '#673ab7',
                opacity: 0.7,
                mb: 2
              }} 
            />
          </Box>
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              color: '#673ab7'
            }}
          >
            No Players Yet
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ maxWidth: 400, mx: 'auto' }}
          >
            This club doesn't have any players yet. Use the invite button to add players to your club.
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {players.map((player) => (
                  <TableRow 
                    key={player.id}
                    onClick={() => navigate(`/clubs/${clubId}/players/${player.id}`)}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'rgba(103, 58, 183, 0.04)',
                        cursor: 'pointer'
                      }
                    }}
                  >
                    <TableCell>
                      {player.firstName} {player.lastName}
                    </TableCell>
                    <TableCell>{player.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Tooltip title="Invite Player" placement="left">
        <Fab
          aria-label="invite player"
          onClick={handleInvitePlayer}
          sx={fabStyle}
        >
          <PersonAddIcon sx={{ color: '#fff' }} />
        </Fab>
      </Tooltip>
    </Container>
  );
}

export default ClubPlayers; 