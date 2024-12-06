import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton,
  Tooltip,
  Stack,
  CircularProgress
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import ActionButton from '../../components/ActionButton';
import { readData } from '../../services/database';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Club {
  id: string;
  name: string;
  players?: { [key: string]: any };
  sessions: Array<{
    id: string;
    clubId: string;
    closedAt?: number;
  }>;
}

const AdminClubs: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clubsData, sessionsData] = await Promise.all([
          readData('clubs'),
          readData('sessions')
        ]);

        if (clubsData) {
          const clubsArray = Object.entries(clubsData).map(([id, data]: [string, any]) => {
            // Count sessions for this club and transform session data
            const clubSessions = sessionsData ? 
              Object.entries(sessionsData)
                .filter(([_, session]: [string, any]) => session.clubId === id)
                .map(([sessionId, session]: [string, any]) => ({
                  id: sessionId,
                  clubId: session.clubId,
                  closedAt: session.details?.closedAt || null
                }))
                .sort((a, b) => ((b.closedAt || 0) - (a.closedAt || 0))) : 
              [];

            return {
              id,
              ...data,
              players: data.players || {},
              sessions: clubSessions
            };
          });
          setClubs(clubsArray);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
  };

  const handleCreateClub = () => {
    navigate('/admin/clubs/create');
  };

  const getLastSessionDate = (sessions: Club['sessions']) => {
    if (!sessions || sessions.length === 0) return '-';
    
    const lastSession = sessions[0]; // Already sorted in useEffect
    
    if (!lastSession?.closedAt) return '-';
    
    try {
      return formatDistanceToNow(new Date(lastSession.closedAt), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <AdminBreadcrumbs currentPage="Club Management" />
        <Box display="flex" alignItems="center" mb={3}>
          <GroupsIcon sx={{ fontSize: 40, mr: 2, color: '#673ab7' }} />
          <Typography variant="h4" component="h1">
            Club Management
          </Typography>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Club Name</TableCell>
                <TableCell>Club ID</TableCell>
                <TableCell align="center">Players</TableCell>
                <TableCell align="center">Sessions</TableCell>
                <TableCell align="center">Last Session</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clubs.map((club) => (
                <TableRow 
                  key={club.id}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                  onClick={() => navigate(`/clubs/${club.id}`)}
                >
                  <TableCell>{club.name}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {club.id}
                      </Typography>
                      <Tooltip title="Copy ID">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyId(club.id);
                          }}
                          sx={{ color: '#673ab7' }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    {Object.keys(club.players || {}).length}
                  </TableCell>
                  <TableCell align="center">
                    {club.sessions.length}
                  </TableCell>
                  <TableCell align="center">
                    {getLastSessionDate(club.sessions)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ position: "fixed", bottom: 32, right: 32 }}>
          <ActionButton
            title="Create Club"
            onClick={handleCreateClub}
            icon={<AddIcon />}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default AdminClubs; 