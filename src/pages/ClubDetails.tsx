import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Container, Typography, Paper, Box, CircularProgress } from '@mui/material';
import { getCurrentUser } from '../services/auth';
import { getClubDetails } from '../services/clubs';
import ErrorPage from './ErrorPage';

interface ClubDetails {
  id: string;
  name: string;
  description?: string;
  // Add more club details as needed
}

function ClubDetails() {
  const { clubId } = useParams<{ clubId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [club, setClub] = useState<ClubDetails | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        if (!clubId) {
          setError('Club ID is required');
          setLoading(false);
          return;
        }

        const user = await getCurrentUser();
        if (!user) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        // Check if user has access to this club
        const userClubs = user.clubs || {};
        const hasClubAccess = Object.values(userClubs).some(club => club.id === clubId);
        setHasAccess(hasClubAccess);

        if (!hasClubAccess) {
          setError('You do not have permission to view this club');
          setLoading(false);
          return;
        }

        const clubData = await getClubDetails(clubId);
        setClub(clubData);
      } catch (err) {
        console.error('Error fetching club details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load club details');
      } finally {
        setLoading(false);
      }
    };

    fetchClubDetails();
  }, [clubId]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    if (error === 'Authentication required') {
      return <Navigate to="/login" />;
    }
    if (!hasAccess) {
      return <ErrorPage customMessage="You don't have permission to access this club" />;
    }
    return <ErrorPage customMessage={error} />;
  }

  if (!club) {
    return <ErrorPage customMessage="Club not found" />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4,
          background: 'linear-gradient(to bottom right, #ffffff, #f5f5f5)',
          borderRadius: 2
        }}
      >
        <Box>
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
            {club.name}
          </Typography>
          {club.description && (
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              {club.description}
            </Typography>
          )}
          {/* Add more club details here */}
        </Box>
      </Paper>
    </Container>
  );
}

export default ClubDetails; 