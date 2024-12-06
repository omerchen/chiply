import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { writeData } from '../../services/database';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const CreateClub: React.FC = () => {
  const navigate = useNavigate();
  const [clubName, setClubName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const clubId = uuidv4();
      await writeData(`clubs/${clubId}`, {
        name: clubName.trim(),
        createdAt: Date.now(),
        disabledAt: null
      });

      navigate('/admin/clubs');
    } catch (err) {
      console.error('Error creating club:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <AdminBreadcrumbs 
          currentPage="Create Club" 
          intermediateLinks={[
            { label: 'Club Management', to: '/admin/clubs' }
          ]} 
        />
        <Box display="flex" alignItems="center" mb={3}>
          <AddIcon sx={{ fontSize: 40, mr: 2, color: '#673ab7' }} />
          <Typography variant="h4" component="h1">
            Create Club
          </Typography>
        </Box>

        <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              name="name"
              label="Club Name"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              fullWidth
              required
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                bgcolor: '#673ab7',
                '&:hover': { bgcolor: '#563098' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Club'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateClub; 