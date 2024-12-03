import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
  Box,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { getUserClubs, Club } from '../services/clubs';

function Clubs() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const userClubs = await getUserClubs();
        setClubs(userClubs);
      } catch (err) {
        setError('Failed to load clubs');
        console.error('Error fetching clubs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  const handleClubClick = (clubId: string) => {
    navigate(`/clubs/${clubId}`);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 3, mb: 3 }}>
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#673ab7' }} />
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 3, mb: 3 }}>
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            color: '#673ab7',
            fontWeight: 500
          }}
        >
          My Clubs
        </Typography>
        
        {clubs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              You are not a member of any clubs yet.
            </Typography>
          </Box>
        ) : (
          <List>
            {clubs.map((club) => (
              <ListItem
                key={club.id}
                onClick={() => handleClubClick(club.id)}
                sx={{
                  mb: 2,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: '#673ab7',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(103, 58, 183, 0.04)',
                  },
                }}
              >
                <ListItemIcon>
                  {club.role === 'admin' ? (
                    <AdminPanelSettingsIcon sx={{ color: '#673ab7' }} />
                  ) : (
                    <GroupIcon sx={{ color: '#673ab7' }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ color: '#673ab7', fontWeight: 500 }}>
                      {club.name}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={club.role === 'admin' ? 'Admin' : 'Member'}
                    sx={{
                      backgroundColor: club.role === 'admin' ? '#673ab7' : 'transparent',
                      color: club.role === 'admin' ? 'white' : '#673ab7',
                      borderColor: '#673ab7',
                      border: '1px solid',
                      fontWeight: 500,
                    }}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the ListItem click
                    }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
}

export default Clubs; 