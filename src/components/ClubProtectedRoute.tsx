import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { CircularProgress, Container } from '@mui/material';
import { getCurrentUser } from '../services/auth';
import ErrorPage from '../pages/ErrorPage';

interface ClubProtectedRouteProps {
  children: React.ReactNode;
}

function ClubProtectedRoute({ children }: ClubProtectedRouteProps) {
  const { clubId } = useParams<{ clubId: string }>();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        console.log('Checking access for club:', clubId);
        const user = await getCurrentUser();
        console.log('Current user:', user);
        
        if (!user) {
          console.log('No user found');
          setError('Authentication required');
          setLoading(false);
          return;
        }

        console.log('User clubs:', user.clubs);
        console.log('Looking for club:', clubId);
        
        const hasClubAccess = !!(user.clubs && clubId && user.clubs[clubId]?.role);
        console.log('Has access:', hasClubAccess);
        
        setHasAccess(hasClubAccess);
      } catch (err) {
        console.error('Error checking club access:', err);
        setError('Failed to verify access');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [clubId]);

  console.log('Component state:', { loading, hasAccess, error, clubId });

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error === 'Authentication required') {
    return <Navigate to="/login" />;
  }

  if (!hasAccess) {
    return <ErrorPage customMessage="You don't have permission to access this club" />;
  }

  return <>{children}</>;
}

export default ClubProtectedRoute; 