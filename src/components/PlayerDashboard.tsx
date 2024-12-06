import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { readData } from '../services/database';
import { subDays, isValid, startOfDay, endOfDay, isWithinInterval, format } from 'date-fns';
import { SessionDetails, PlayerSessionData } from '../types/session';
import { processPlayerSessionData } from '../utils/sessionUtils';
import EditIcon from '@mui/icons-material/Edit';

interface PlayerDashboardProps {
  playerId: string;
  clubIds: string[];
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

type DateRangeOption = 'all' | '7days' | '30days' | '90days' | 'custom';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

export default function PlayerDashboard({ playerId, clubIds }: PlayerDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<Player | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [clubs, setClubs] = useState<{ id: string; name: string; }[]>([]);
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: null,
    end: null
  });
  const [isCustomDatePickerOpen, setIsCustomDatePickerOpen] = useState(false);
  const [allSessions, setAllSessions] = useState<SessionDetails[]>([]);
  const [filteredPlayerSessions, setFilteredPlayerSessions] = useState<PlayerSessionData[]>([]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch player data
        const playerData = await readData(`players/${playerId}`);
        if (playerData) {
          setPlayer({
            id: playerId,
            ...playerData
          });
        }

        // Fetch club names for the provided club IDs
        const clubsData = await readData('clubs');
        if (clubsData) {
          const playerClubs = clubIds
            .map(id => ({
              id,
              name: clubsData[id]?.name || 'Unknown Club'
            }))
            .filter(club => club.name !== 'Unknown Club');
          
          setClubs(playerClubs);
        }

        // Fetch all sessions
        const sessionsData = await readData('sessions');
        if (sessionsData) {
          const sessions = Object.entries(sessionsData)
            .map(([id, data]) => ({
              id,
              ...(data as Omit<SessionDetails, 'id'>)
            }))
            .filter(session => clubIds.includes(session.clubId));
          
          setAllSessions(sessions);
        }
      } catch (error) {
        console.error('Error fetching player dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [playerId, clubIds]);

  // Filter sessions based on current filters
  useEffect(() => {
    const filterSessions = () => {
      const filteredSessions = allSessions
        .map(session => {
          // Process session data for the player
          const playerSessionData = processPlayerSessionData(session, playerId);
          if (!playerSessionData) return null;

          // Add session details to the player session data for reference
          return {
            ...playerSessionData,
            sessionId: session.id,
            clubId: session.clubId
          };
        })
        .filter((sessionData): sessionData is (PlayerSessionData & { sessionId: string; clubId: string; }) => {
          if (!sessionData) return false;

          // Club filter
          if (selectedClubId && sessionData.clubId !== selectedClubId) {
            return false;
          }

          // Date range filter
          const sessionDate = new Date(sessionData.time);
          
          if (dateRangeOption !== 'all') {
            let startDate: Date | null = null;
            let endDate: Date | null = customDateRange.end;

            if (dateRangeOption === 'custom') {
              startDate = customDateRange.start;
              endDate = customDateRange.end;
            } else {
              endDate = new Date();
              switch (dateRangeOption) {
                case '7days':
                  startDate = subDays(endDate, 7);
                  break;
                case '30days':
                  startDate = subDays(endDate, 30);
                  break;
                case '90days':
                  startDate = subDays(endDate, 90);
                  break;
              }
            }

            if (startDate && endDate) {
              const isInRange = isWithinInterval(sessionDate, {
                start: startOfDay(startDate),
                end: endOfDay(endDate)
              });
              if (!isInRange) return false;
            }
          }

          return true;
        });

      setFilteredPlayerSessions(filteredSessions);
    };

    filterSessions();
  }, [allSessions, selectedClubId, dateRangeOption, customDateRange, playerId]);

  const handleDateRangeChange = (option: DateRangeOption) => {
    setDateRangeOption(option);
    if (option === 'custom') {
      // If we already have a custom range, keep it
      if (!customDateRange.start || !customDateRange.end) {
        // Set default range to last 30 days if no custom range exists
        const end = new Date();
        const start = subDays(end, 30);
        setCustomDateRange({ start, end });
      }
      setIsCustomDatePickerOpen(true);
    } else {
      // Set predefined date ranges
      const end = new Date();
      let start: Date | null = null;

      switch (option) {
        case '7days':
          start = subDays(end, 7);
          break;
        case '30days':
          start = subDays(end, 30);
          break;
        case '90days':
          start = subDays(end, 90);
          break;
        case 'all':
        default:
          start = null;
          break;
      }

      setCustomDateRange({ start, end: option === 'all' ? null : end });
    }
  };

  const handleCustomDateRangeConfirm = () => {
    if (isValid(customDateRange.start) && isValid(customDateRange.end)) {
      setIsCustomDatePickerOpen(false);
    }
  };

  const getDateRangeText = () => {
    if (dateRangeOption === 'all') return 'All Time';
    if (dateRangeOption === '7days') return 'Last 7 Days';
    if (dateRangeOption === '30days') return 'Last 30 Days';
    if (dateRangeOption === '90days') return 'Last 90 Days';
    if (dateRangeOption === 'custom' && customDateRange.start && customDateRange.end) {
      return `${format(customDateRange.start, 'dd/MM/yyyy')} - ${format(customDateRange.end, 'dd/MM/yyyy')}`;
    }
    return 'Custom Range';
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!player) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
        <Typography color="error">Player not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #673ab7, #9c27b0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 4
          }}
        >
          Player Dashboard: {player.firstName} {player.lastName}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
          <Box sx={{ minWidth: 200, flex: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="club-select-label">Filter by Club</InputLabel>
              <Select
                labelId="club-select-label"
                id="club-select"
                value={selectedClubId}
                label="Filter by Club"
                onChange={(e) => setSelectedClubId(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Clubs</em>
                </MenuItem>
                {clubs.map((club) => (
                  <MenuItem key={club.id} value={club.id}>
                    {club.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ minWidth: 200, flex: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="date-range-select-label">Date Range</InputLabel>
              <Select
                labelId="date-range-select-label"
                id="date-range-select"
                value={dateRangeOption}
                label="Date Range"
                onChange={(e) => handleDateRangeChange(e.target.value as DateRangeOption)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="7days">Last 7 Days</MenuItem>
                <MenuItem value="30days">Last 30 Days</MenuItem>
                <MenuItem value="90days">Last 90 Days</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Stack>

        <Stack 
          direction="row" 
          spacing={1} 
          alignItems="center" 
          sx={{ mb: 4 }}
        >
          <Typography variant="body2" color="text.secondary">
            Showing data for: {getDateRangeText()}
          </Typography>
          {dateRangeOption === 'custom' && (
            <Tooltip title="Edit Date Range">
              <IconButton 
                size="small" 
                onClick={() => setIsCustomDatePickerOpen(true)}
                sx={{ color: 'text.secondary' }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Future metrics and data will go here */}
        <Typography variant="body2" color="text.secondary">
          Found {filteredPlayerSessions.length} sessions matching the current filters
        </Typography>

        <Dialog 
          open={isCustomDatePickerOpen} 
          onClose={() => setIsCustomDatePickerOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Select Date Range</DialogTitle>
          <DialogContent>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Stack spacing={3} sx={{ mt: 2 }}>
                <DatePicker
                  label="Start Date"
                  value={customDateRange.start}
                  onChange={(date) => setCustomDateRange(prev => ({ ...prev, start: date }))}
                  maxDate={customDateRange.end || undefined}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={customDateRange.end}
                  onChange={(date) => setCustomDateRange(prev => ({ ...prev, end: date }))}
                  minDate={customDateRange.start || undefined}
                  maxDate={new Date()}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Stack>
            </LocalizationProvider>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsCustomDatePickerOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCustomDateRangeConfirm}
              disabled={!customDateRange.start || !customDateRange.end}
              sx={{ color: '#673ab7' }}
            >
              Apply
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
} 