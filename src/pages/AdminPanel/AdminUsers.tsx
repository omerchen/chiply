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
  Chip,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BlockIcon from '@mui/icons-material/Block';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import ActionButton from '../../components/ActionButton';
import { readData, updateData } from '../../services/database';
import { User } from '../../types/User';
import { getCurrentUser } from '../../services/auth';
import { useNavigate } from 'react-router-dom';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setCurrentUserId(currentUser.id);
        }

        // Get all users
        const usersData = await readData('users');
        if (usersData) {
          const usersArray = Object.entries(usersData).map(([id, data]: [string, any]) => ({
            id,
            ...data,
            systemRole: data.systemRole || 'member',
            disabledAt: data.disabledAt || null
          }));
          setUsers(usersArray);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddUser = () => {
    navigate('/admin/users/create');
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
  };

  const handleToggleDisabled = async (e: React.MouseEvent, user: User) => {
    // Stop event propagation to prevent row click
    e.stopPropagation();
    
    // Prevent disabling yourself
    if (user.id === currentUserId) {
      console.error("You cannot disable your own account");
      return;
    }

    try {
      const newDisabledAtValue = user.disabledAt ? null : Date.now();
      
      // Update both the disabledAt property and the systemRole
      const updates = {
        [`users/${user.id}/disabledAt`]: newDisabledAtValue,
        [`users/${user.id}/systemRole`]: newDisabledAtValue ? 'member' : user.systemRole
      };
      
      await updateData('/', updates);
      
      // Update local state
      setUsers(users.map(u => 
        u.id === user.id 
          ? { 
              ...u, 
              disabledAt: newDisabledAtValue,
              systemRole: newDisabledAtValue ? 'member' : u.systemRole
            }
          : u
      ));
    } catch (error) {
      console.error('Error toggling user disabled state:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <AdminBreadcrumbs currentPage="Users Management" />
        <Box display="flex" alignItems="center" mb={3}>
          <GroupIcon sx={{ fontSize: 40, mr: 2, color: '#673ab7' }} />
          <Typography variant="h4" component="h1">
            Users Management
          </Typography>
        </Box>

        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>System Role</TableCell>
                <TableCell>Clubs Count</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow 
                  key={user.id}
                  sx={{
                    ...user.disabledAt ? { 
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                      '& > *': { color: 'text.disabled' }
                    } : {},
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                  onClick={() => navigate(`/admin/users/${user.id}`)}
                >
                  <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {user.id}
                      </Typography>
                      <Tooltip title="Copy ID">
                        <IconButton 
                          size="small" 
                          onClick={() => handleCopyId(user.id)}
                          sx={{ color: '#673ab7' }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.systemRole}
                      color={user.systemRole === 'admin' ? 'primary' : 'default'}
                      sx={{
                        bgcolor: user.systemRole === 'admin' ? '#673ab7' : 'transparent',
                        color: user.systemRole === 'admin' ? 'white' : '#673ab7',
                        borderColor: '#673ab7',
                        border: '1px solid',
                        fontWeight: 500,
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{Object.keys(user.clubs || {}).length}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={
                      user.id === currentUserId 
                        ? "You cannot disable your own account" 
                        : user.disabledAt 
                          ? "Enable User" 
                          : "Disable User"
                    }>
                      <span>
                        <IconButton
                          onClick={(e) => handleToggleDisabled(e, user)}
                          disabled={user.id === currentUserId}
                          sx={{ 
                            color: user.disabledAt ? 'success.main' : 'error.main',
                            '&.Mui-disabled': {
                              color: 'rgba(0, 0, 0, 0.26)'
                            }
                          }}
                        >
                          <BlockIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ position: "fixed", bottom: 32, right: 32 }}>
          <ActionButton
            title="Add New User"
            onClick={handleAddUser}
            icon={<PersonAddIcon />}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default AdminUsers; 