import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  SelectChangeEvent
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { useNavigate, useParams } from 'react-router-dom';
import { readData, updateData } from '../../services/database';
import { getCurrentUser } from '../../services/auth';

interface Club {
  id: string;
  name: string;
}

interface SelectedClub {
  id: string;
  name: string;
  role: 'admin' | 'member';
}

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  systemRole: 'admin' | 'member';
  clubs: {
    [key: string]: {
      role: 'admin' | 'member';
    };
  };
}

const EditUser: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [formData, setFormData] = useState<UserData>({
    firstName: '',
    lastName: '',
    email: '',
    systemRole: 'member',
    clubs: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubs, setSelectedClubs] = useState<SelectedClub[]>([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [selectedClubRole, setSelectedClubRole] = useState<'admin' | 'member'>('member');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, clubsData, currentUser] = await Promise.all([
          readData(`users/${userId}`),
          readData('clubs'),
          getCurrentUser()
        ]);

        if (!userData) {
          throw new Error('User not found');
        }

        setFormData(userData);
        setCurrentUserId(currentUser?.id || null);

        // Transform clubs data
        if (clubsData) {
          const clubsList = Object.entries(clubsData).map(([id, club]: [string, any]) => ({
            id,
            name: club.name
          }));
          setClubs(clubsList);

          // Set selected clubs
          const selectedClubsList = Object.entries(userData.clubs || {}).map(([clubId, clubData]) => ({
            id: clubId,
            name: clubsList.find(c => c.id === clubId)?.name || '',
            role: clubData.role
          }));
          setSelectedClubs(selectedClubsList);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error loading user data');
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    if (name === 'systemRole') {
      setFormData(prev => ({
        ...prev,
        systemRole: value as 'admin' | 'member'
      }));
    } else if (name === 'clubId') {
      setSelectedClubId(value);
    } else if (name === 'clubRole') {
      setSelectedClubRole(value as 'admin' | 'member');
    }
  };

  const handleAddClub = () => {
    if (!selectedClubId) return;
    
    const club = clubs.find(c => c.id === selectedClubId);
    if (!club) return;

    const isAlreadySelected = selectedClubs.some(sc => sc.id === selectedClubId);
    if (isAlreadySelected) return;

    setSelectedClubs(prev => [...prev, {
      id: club.id,
      name: club.name,
      role: selectedClubRole
    }]);

    setSelectedClubId('');
    setSelectedClubRole('member');
  };

  const handleRemoveClub = (clubId: string) => {
    setSelectedClubs(prev => prev.filter(club => club.id !== clubId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const clubsData = selectedClubs.reduce((acc, club) => ({
        ...acc,
        [club.id]: { role: club.role }
      }), {});

      const updates = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        systemRole: userId === currentUserId ? formData.systemRole : formData.systemRole,
        clubs: clubsData
      };

      await updateData(`users/${userId}`, updates);
      navigate('/admin/users');
    } catch (err) {
      console.error('Error updating user:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      setSaving(false);
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
        <AdminBreadcrumbs 
          currentPage="Edit User" 
          intermediateLinks={[
            { label: 'User Management', to: '/admin/users' }
          ]} 
        />
        <Box display="flex" alignItems="center" mb={3}>
          <EditIcon sx={{ fontSize: 40, mr: 2, color: '#673ab7' }} />
          <Typography variant="h4" component="h1">
            Edit User
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
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              fullWidth
              disabled
              sx={{ mb: 2 }}
            />

            <TextField
              name="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />

            <TextField
              name="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth required sx={{ mb: 3 }}>
              <InputLabel>System Role</InputLabel>
              <Select
                name="systemRole"
                value={formData.systemRole}
                onChange={handleSelectChange}
                label="System Role"
                disabled={userId === currentUserId}
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Club</InputLabel>
              <Select
                name="clubId"
                value={selectedClubId}
                onChange={handleSelectChange}
                label="Club"
              >
                <MenuItem value="">Select Club</MenuItem>
                {clubs
                  .filter(club => !selectedClubs.some(sc => sc.id === club.id))
                  .map(club => (
                    <MenuItem key={club.id} value={club.id}>{club.name}</MenuItem>
                  ))
                }
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Club Role</InputLabel>
              <Select
                name="clubRole"
                value={selectedClubRole}
                onChange={handleSelectChange}
                label="Club Role"
                disabled={!selectedClubId}
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              fullWidth
              onClick={handleAddClub}
              disabled={!selectedClubId}
              sx={{ mb: 3 }}
            >
              Add Club
            </Button>

            {selectedClubs.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Selected Clubs:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {selectedClubs.map(club => (
                    <Chip
                      key={club.id}
                      label={`${club.name} (${club.role})`}
                      onDelete={() => handleRemoveClub(club.id)}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={saving}
              sx={{
                bgcolor: '#673ab7',
                '&:hover': { bgcolor: '#563098' }
              }}
            >
              {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default EditUser; 