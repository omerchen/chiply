import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  CircularProgress,
  TextField,
  Button,
  Box,
  Grid
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { readData, writeData } from '../services/database';
import ClubBreadcrumbs from '../components/ClubBreadcrumbs';
import { createTheme, ThemeProvider } from '@mui/material';

interface SessionForm {
  startTime: dayjs.Dayjs | null;
  smallBlind: string;
  bigBlind: string;
  ante: string;
}

function NewClubSession() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clubName, setClubName] = useState('');
  const [error, setError] = useState<{ [key: string]: string }>({});

  const theme = createTheme({
    palette: {
      primary: {
        main: '#673ab7'
      }
    }
  });

  const [form, setForm] = useState<SessionForm>({
    startTime: dayjs(),
    smallBlind: '',
    bigBlind: '',
    ante: ''
  });

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

  const handleChange = (field: keyof SessionForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user types
    if (error[field]) {
      setError(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!form.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    if (!form.smallBlind || isNaN(Number(form.smallBlind)) || Number(form.smallBlind) <= 0) {
      newErrors.smallBlind = 'Valid small blind is required';
    }
    if (!form.bigBlind || isNaN(Number(form.bigBlind)) || Number(form.bigBlind) <= 0) {
      newErrors.bigBlind = 'Valid big blind is required';
    }
    if (form.ante && (isNaN(Number(form.ante)) || Number(form.ante) < 0)) {
      newErrors.ante = 'Ante must be a valid number';
    }

    setError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const sessionId = uuidv4();
      const sessionData = {
        clubId,
        details: {
          type: "cash",
          startTime: form.startTime?.valueOf(), // Convert to timestamp
          stakes: {
            bigBlind: Number(form.bigBlind),
            smallBlind: Number(form.smallBlind),
            ...(form.ante ? { ante: Number(form.ante) } : {})
          }
        },
        status: "open" as "open" | "close"
      };

      await writeData(`sessions/${sessionId}`, sessionData);
      navigate(`/clubs/${clubId}/sessions/${sessionId}`);
    } catch (err) {
      console.error('Error creating session:', err);
      setError({ submit: 'Failed to create session' });
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
    <Container maxWidth="sm" sx={{ mt: 3, mb: 3 }}>
      <ClubBreadcrumbs 
        clubId={clubId!} 
        clubName={clubName}
        currentPage="New Session" 
      />
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          New Session
        </Typography>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <ThemeProvider theme={theme}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <DateTimePicker
                    label="Start Time"
                    value={form.startTime}
                    onChange={(newValue) => {
                      setForm(prev => ({ ...prev, startTime: newValue }));
                      if (error.startTime) {
                        setError(prev => ({ ...prev, startTime: '' }));
                      }
                    }}
                    format="DD/MM/YYYY HH:mm"
                    ampm={false}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!error.startTime,
                        helperText: error.startTime
                      },
                      day: {
                        sx: {
                          '&.Mui-selected': {
                            backgroundColor: '#673ab7 !important',
                            '&:hover': {
                              backgroundColor: '#563098 !important'
                            }
                          }
                        }
                      }
                    }}
                    sx={{
                      '& .MuiPickersDay-root.Mui-selected': {
                        backgroundColor: '#673ab7'
                      },
                      '& .MuiClock-pin': {
                        backgroundColor: '#673ab7'
                      },
                      '& .MuiClockPointer-root': {
                        backgroundColor: '#673ab7'
                      },
                      '& .MuiClockPointer-thumb': {
                        backgroundColor: '#673ab7',
                        border: '16px solid #673ab7'
                      },
                      '& .MuiClockNumber-root.Mui-selected': {
                        backgroundColor: '#673ab7 !important'
                      },
                      '& .MuiPickersYear-yearButton.Mui-selected': {
                        backgroundColor: '#673ab7'
                      },
                      '& .MuiPickersMonth-monthButton.Mui-selected': {
                        backgroundColor: '#673ab7'
                      },
                      '& .MuiPickersDay-root.Mui-selected:hover': {
                        backgroundColor: '#563098'
                      },
                      '& .MuiDigitalClock-item.Mui-selected': {
                        backgroundColor: '#673ab7 !important'
                      },
                      '& .MuiMultiSectionDigitalClock-item.Mui-selected': {
                        backgroundColor: '#673ab7 !important'
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Small Blind"
                    type="number"
                    value={form.smallBlind}
                    onChange={handleChange('smallBlind')}
                    error={!!error.smallBlind}
                    helperText={error.smallBlind}
                    inputProps={{ min: 0, step: "0.5" }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Big Blind"
                    type="number"
                    value={form.bigBlind}
                    onChange={handleChange('bigBlind')}
                    error={!!error.bigBlind}
                    helperText={error.bigBlind}
                    inputProps={{ min: 0, step: "0.5" }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ante (Optional)"
                    type="number"
                    value={form.ante}
                    onChange={handleChange('ante')}
                    error={!!error.ante}
                    helperText={error.ante}
                    inputProps={{ min: 0, step: "0.5" }}
                  />
                </Grid>

                {error.submit && (
                  <Grid item xs={12}>
                    <Typography color="error">{error.submit}</Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="contained"
                      type="submit"
                      sx={{
                        bgcolor: '#673ab7',
                        '&:hover': { bgcolor: '#563098' }
                      }}
                    >
                      Create Session
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </ThemeProvider>
        </LocalizationProvider>
      </Paper>
    </Container>
  );
}

export default NewClubSession; 