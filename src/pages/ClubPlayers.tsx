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
  Box
} from '@mui/material';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { readData } from '../services/database';
import ClubBreadcrumbs from '../components/ClubBreadcrumbs';
import ActionButton from '../components/ActionButton';
import { getCurrentUser } from '../services/auth';

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
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clubData, currentUser] = await Promise.all([
          readData(`clubs/${clubId}`),
          getCurrentUser()
        ]);
        
        setClubName(clubData.name || '');
        
        if (currentUser) {
          setUserRole(currentUser.clubs[clubId!]?.role);
        }

        if (!clubData?.players) {
          setPlayers([]);
          setLoading(false);
          return;
        }

        // Rest of the existing player fetching logic...
        const playerIds = Object.keys(clubData.players);
        const playersData = await readData('players');

        const clubPlayers = playerIds
          .map(playerId => {
            const playerData = playersData[playerId];
            if (!playerData) {
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
            return hasRequiredFields;
          });

        setPlayers(clubPlayers);
      } catch (error) {
        console.error('Error fetching players:', error);
        setError('Failed to load players');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clubId]);

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

      {userRole === 'admin' && (
        <Box sx={{ position: 'fixed', bottom: 32, right: 32 }}>
          <ActionButton
            title="Invite Player"
            onClick={() => navigate(`/clubs/${clubId}/newPlayer`)}
            icon={<PersonAddIcon />}
          />
        </Box>
      )}
    </Container>
  );
}

export default ClubPlayers; 