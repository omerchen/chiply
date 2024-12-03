import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import StyleIcon from '@mui/icons-material/Style';
import AddIcon from '@mui/icons-material/Add';
import { readData } from '../services/database';
import ClubBreadcrumbs from '../components/ClubBreadcrumbs';
import ActionButton from '../components/ActionButton';

function ClubSessions() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clubName, setClubName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clubData = await readData(`clubs/${clubId}`);
        setClubName(clubData.name || '');
      } catch (error) {
        console.error('Error fetching club data:', error);
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

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
      <ClubBreadcrumbs 
        clubId={clubId!} 
        clubName={clubName}
        currentPage="Sessions" 
      />
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
          <StyleIcon 
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
          No Sessions Yet
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ maxWidth: 400, mx: 'auto' }}
        >
          This club doesn't have any poker sessions yet. Use the new session button to start tracking your games.
        </Typography>
      </Paper>

      <Box sx={{ position: 'fixed', bottom: 32, right: 32 }}>
        <ActionButton
          title="New Session"
          onClick={() => navigate(`/clubs/${clubId}/newSession`)}
          icon={<AddIcon />}
        />
      </Box>
    </Container>
  );
}

export default ClubSessions; 