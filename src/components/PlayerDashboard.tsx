import React, { useState, useEffect } from "react";
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
  Tooltip,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { readData } from "../services/database";
import {
  subDays,
  isValid,
  startOfDay,
  endOfDay,
  isWithinInterval,
  format,
} from "date-fns";
import { SessionDetails, PlayerSessionData } from "../types/session";
import { processPlayerSessionData } from "../utils/sessionUtils";
import { getApproximateHands } from "../utils/gameUtils";
import EditIcon from "@mui/icons-material/Edit";
import MetricCard from "../components/MetricCard";

type DashboardUnit = "cash" | "bb";

interface PlayerDashboardProps {
  playerId: string;
  clubIds: string[];
  defaultClubId?: string;
  isClubFilterReadOnly?: boolean;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

type DateRangeOption = "all" | "7days" | "30days" | "90days" | "custom";

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface Stakes {
  smallBlind: number;
  bigBlind: number;
  ante?: number;
}

export default function PlayerDashboard({
  playerId,
  clubIds,
  defaultClubId,
  isClubFilterReadOnly = false
}: PlayerDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<Player | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string>(defaultClubId || "");
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);
  const [dateRangeOption, setDateRangeOption] =
    useState<DateRangeOption>("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [isCustomDatePickerOpen, setIsCustomDatePickerOpen] = useState(false);
  const [allSessions, setAllSessions] = useState<SessionDetails[]>([]);
  const [filteredPlayerSessions, setFilteredPlayerSessions] = useState<
    PlayerSessionData[]
  >([]);
  const [dashboardUnit, setDashboardUnit] = useState<DashboardUnit>("cash");
  const [selectedStakes, setSelectedStakes] = useState<string>("");
  const [availableStakes, setAvailableStakes] = useState<Stakes[]>([]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch player data
        const playerData = await readData(`players/${playerId}`);
        if (playerData) {
          setPlayer({
            id: playerId,
            ...playerData,
          });
        }

        // Fetch club names for the provided club IDs
        const clubsData = await readData("clubs");
        if (clubsData) {
          const playerClubs = clubIds
            .map((id) => ({
              id,
              name: clubsData[id]?.name || "Unknown Club",
            }))
            .filter((club) => club.name !== "Unknown Club");

          setClubs(playerClubs);
        }

        // Fetch all sessions
        const sessionsData = await readData("sessions");
        if (sessionsData) {
          const sessions = Object.entries(sessionsData)
            .map(([id, data]) => ({
              id,
              ...(data as Omit<SessionDetails, "id">),
            }))
            .filter((session) => clubIds.includes(session.clubId));

          setAllSessions(sessions);
        }
      } catch (error) {
        console.error("Error fetching player dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [playerId, clubIds]);

  // Extract unique stakes from sessions
  useEffect(() => {
    const uniqueStakes = allSessions.reduce<Stakes[]>((acc, session) => {
      const { smallBlind, bigBlind, ante } = session.details.stakes;
      const stakesExists = acc.some(
        (s) =>
          s.smallBlind === smallBlind &&
          s.bigBlind === bigBlind &&
          s.ante === ante
      );

      if (!stakesExists) {
        acc.push({ smallBlind, bigBlind, ante });
      }

      return acc;
    }, []);

    // Sort stakes by BB size
    uniqueStakes.sort((a, b) => a.bigBlind - b.bigBlind);
    setAvailableStakes(uniqueStakes);
  }, [allSessions]);

  // Update filtered sessions when stakes filter changes
  useEffect(() => {
    const filterSessions = () => {
      const filteredSessions = allSessions
        .map((session) => {
          // Process session data for the player
          const playerSessionData = processPlayerSessionData(session, playerId);
          if (!playerSessionData) return null;

          // Add session details to the player session data for reference
          return {
            ...playerSessionData,
            sessionId: session.id,
            clubId: session.clubId,
          };
        })
        .filter(
          (
            sessionData
          ): sessionData is PlayerSessionData & {
            sessionId: string;
            clubId: string;
          } => {
            if (!sessionData) return false;

            // Club filter
            if (selectedClubId && sessionData.clubId !== selectedClubId) {
              return false;
            }

            // Stakes filter
            if (selectedStakes) {
              const session = allSessions.find(
                (s) => s.id === sessionData.sessionId
              );
              if (!session) return false;

              const stakesStr = formatStakes(session.details.stakes);
              if (stakesStr !== selectedStakes) {
                return false;
              }
            }

            // Date range filter
            const sessionDate = new Date(sessionData.time);

            if (dateRangeOption !== "all") {
              let startDate: Date | null = null;
              let endDate: Date | null = customDateRange.end;

              if (dateRangeOption === "custom") {
                startDate = customDateRange.start;
                endDate = customDateRange.end;
              } else {
                endDate = new Date();
                switch (dateRangeOption) {
                  case "7days":
                    startDate = subDays(endDate, 7);
                    break;
                  case "30days":
                    startDate = subDays(endDate, 30);
                    break;
                  case "90days":
                    startDate = subDays(endDate, 90);
                    break;
                }
              }

              if (startDate && endDate) {
                const isInRange = isWithinInterval(sessionDate, {
                  start: startOfDay(startDate),
                  end: endOfDay(endDate),
                });
                if (!isInRange) return false;
              }
            }

            return true;
          }
        );

      setFilteredPlayerSessions(filteredSessions);
    };

    filterSessions();
  }, [
    allSessions,
    selectedClubId,
    selectedStakes,
    dateRangeOption,
    customDateRange,
    playerId,
  ]);

  const formatStakes = (stakes: Stakes): string => {
    const { smallBlind, bigBlind, ante } = stakes;
    return ante
      ? `${smallBlind}/${bigBlind}(${ante})`
      : `${smallBlind}/${bigBlind}`;
  };

  const handleDateRangeChange = (option: DateRangeOption) => {
    setDateRangeOption(option);
    if (option === "custom") {
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
        case "7days":
          start = subDays(end, 7);
          break;
        case "30days":
          start = subDays(end, 30);
          break;
        case "90days":
          start = subDays(end, 90);
          break;
        case "all":
        default:
          start = null;
          break;
      }

      setCustomDateRange({ start, end: option === "all" ? null : end });
    }
  };

  const handleCustomDateRangeConfirm = () => {
    if (isValid(customDateRange.start) && isValid(customDateRange.end)) {
      setIsCustomDatePickerOpen(false);
    }
  };

  const getDateRangeText = () => {
    if (dateRangeOption === "all") return "All Time";
    if (dateRangeOption === "7days") return "Last 7 Days";
    if (dateRangeOption === "30days") return "Last 30 Days";
    if (dateRangeOption === "90days") return "Last 90 Days";
    if (
      dateRangeOption === "custom" &&
      customDateRange.start &&
      customDateRange.end
    ) {
      return `${format(customDateRange.start, "dd/MM/yyyy")} - ${format(
        customDateRange.end,
        "dd/MM/yyyy"
      )}`;
    }
    return "Custom Range";
  };

  const handleUnitChange = (
    _: React.MouseEvent<HTMLElement>,
    newUnit: DashboardUnit | null
  ) => {
    if (newUnit !== null) {
      setDashboardUnit(newUnit);
    }
  };

  const calculateTotalProfit = () => {
    const totalProfit = filteredPlayerSessions.reduce((sum, session) => {
      return dashboardUnit === "cash"
        ? sum + session.profit
        : sum + session.profitBB;
    }, 0);

    return {
      value: dashboardUnit === "cash"
        ? `₪${totalProfit}`
        : `${totalProfit.toFixed(1)} BB`,
      color: totalProfit > 0
        ? 'success.main'
        : totalProfit < 0
        ? 'error.main'
        : 'text.primary'
    };
  };

  if (loading) {
    return (
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
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
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 4 }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              background: "linear-gradient(45deg, #673ab7, #9c27b0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Player Dashboard: {player.firstName} {player.lastName}
          </Typography>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Dashboard Unit
            </Typography>
            <ToggleButtonGroup
              value={dashboardUnit}
              exclusive
              onChange={handleUnitChange}
              aria-label="dashboard unit"
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  px: 3,
                  "&.Mui-selected": {
                    backgroundColor: "#673ab7",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "#563098",
                    },
                  },
                },
              }}
            >
              <ToggleButton value="cash">Cash</ToggleButton>
              <ToggleButton value="bb">BB</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Box sx={{ minWidth: 200, flex: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="club-select-label">Filter by Club</InputLabel>
              <Select
                labelId="club-select-label"
                id="club-select"
                value={selectedClubId}
                label="Filter by Club"
                onChange={(e) => setSelectedClubId(e.target.value)}
                disabled={isClubFilterReadOnly}
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
              <InputLabel id="stakes-select-label">Stakes</InputLabel>
              <Select
                labelId="stakes-select-label"
                id="stakes-select"
                value={selectedStakes}
                label="Stakes"
                onChange={(e) => setSelectedStakes(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Stakes</em>
                </MenuItem>
                {availableStakes.map((stakes) => {
                  const stakesStr = formatStakes(stakes);
                  return (
                    <MenuItem key={stakesStr} value={stakesStr}>
                      {stakesStr}
                    </MenuItem>
                  );
                })}
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
                onChange={(e) =>
                  handleDateRangeChange(e.target.value as DateRangeOption)
                }
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

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Showing data for: {getDateRangeText()}
          </Typography>
          {dateRangeOption === "custom" && (
            <Tooltip title="Edit Date Range">
              <IconButton
                size="small"
                onClick={() => setIsCustomDatePickerOpen(true)}
                sx={{ color: "text.secondary" }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Metrics Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <MetricCard 
              title="Total Sessions" 
              value={filteredPlayerSessions.length} 
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MetricCard 
              title="Total Hands"
              value={(() => {
                const totalHands = filteredPlayerSessions.reduce((sum, session) => 
                  sum + (session.approximateHands || 0), 0
                );
                return `~${new Intl.NumberFormat('en-US').format(totalHands)}`;
              })()}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MetricCard 
              title="Total Profit"
              value={(() => {
                const totalProfit = filteredPlayerSessions.reduce((sum, session) => 
                  dashboardUnit === "cash" ? sum + session.profit : sum + session.profitBB, 0
                );
                const formattedNumber = new Intl.NumberFormat('en-US').format(
                  dashboardUnit === "cash" ? totalProfit : parseFloat(totalProfit.toFixed(1))
                );
                return dashboardUnit === "cash" ? `₪${formattedNumber}` : `${formattedNumber} BB`;
              })()}
              valueColor={(() => {
                const totalProfit = filteredPlayerSessions.reduce((sum, session) => 
                  dashboardUnit === "cash" ? sum + session.profit : sum + session.profitBB, 0
                );
                return totalProfit > 0 ? 'success.main' : totalProfit < 0 ? 'error.main' : 'text.primary';
              })()}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MetricCard 
              title="Profit / 100 Hands"
              value={(() => {
                const totalProfit = filteredPlayerSessions.reduce((sum, session) => 
                  dashboardUnit === "cash" ? sum + session.profit : sum + session.profitBB, 0
                );
                const totalHands = filteredPlayerSessions.reduce((sum, session) => 
                  sum + (session.approximateHands || 0), 0
                );
                
                if (totalHands === 0) return "-";
                
                const profitPer100Hands = (totalProfit / totalHands) * 100;
                const formattedNumber = new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1
                }).format(dashboardUnit === "cash" ? profitPer100Hands : parseFloat(profitPer100Hands.toFixed(1)));
                
                return dashboardUnit === "cash" ? `₪${formattedNumber}` : `${formattedNumber} BB`;
              })()}
              valueColor={(() => {
                const totalProfit = filteredPlayerSessions.reduce((sum, session) => 
                  dashboardUnit === "cash" ? sum + session.profit : sum + session.profitBB, 0
                );
                return totalProfit > 0 ? 'success.main' : totalProfit < 0 ? 'error.main' : 'text.primary';
              })()}
            />
          </Grid>
          <Grid item xs={12}>
            <MetricCard 
              title="ROI"
              value={(() => {
                if (dashboardUnit === "cash") {
                  const totalBuyins = filteredPlayerSessions.reduce((sum, session) => 
                    sum + session.buyinsTotal, 0
                  );
                  const totalStackValue = filteredPlayerSessions.reduce((sum, session) => 
                    sum + (session.stackValue || 0), 0
                  );
                  
                  if (totalBuyins === 0) return "0%";
                  
                  const roi = ((totalStackValue - totalBuyins) / totalBuyins) * 100;
                  const formattedNumber = new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                    signDisplay: 'exceptZero'
                  }).format(roi);
                  
                  return `${formattedNumber}%`;
                } else {
                  // For BB mode, use profitBB and convert buyins to BB
                  const totalBuyinsBB = filteredPlayerSessions.reduce((sum, session) => 
                    sum + (session.buyinsTotal / session.bb), 0
                  );
                  const totalProfitBB = filteredPlayerSessions.reduce((sum, session) => 
                    sum + session.profitBB, 0
                  );
                  
                  if (totalBuyinsBB === 0) return "0%";
                  
                  const roiBB = (totalProfitBB / totalBuyinsBB) * 100;
                  const formattedNumber = new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                    signDisplay: 'exceptZero'
                  }).format(roiBB);
                  
                  return `${formattedNumber}%`;
                }
              })()}
              valueColor={(() => {
                let roi;
                if (dashboardUnit === "cash") {
                  const totalBuyins = filteredPlayerSessions.reduce((sum, session) => 
                    sum + session.buyinsTotal, 0
                  );
                  const totalStackValue = filteredPlayerSessions.reduce((sum, session) => 
                    sum + (session.stackValue || 0), 0
                  );
                  
                  if (totalBuyins === 0) return 'text.primary';
                  roi = ((totalStackValue - totalBuyins) / totalBuyins) * 100;
                } else {
                  const totalBuyinsBB = filteredPlayerSessions.reduce((sum, session) => 
                    sum + (session.buyinsTotal / session.bb), 0
                  );
                  const totalProfitBB = filteredPlayerSessions.reduce((sum, session) => 
                    sum + session.profitBB, 0
                  );
                  
                  if (totalBuyinsBB === 0) return 'text.primary';
                  roi = (totalProfitBB / totalBuyinsBB) * 100;
                }
                
                return roi > 0 ? 'success.main' : roi < 0 ? 'error.main' : 'text.primary';
              })()}
            />
          </Grid>
        </Grid>

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
                  onChange={(date) =>
                    setCustomDateRange((prev) => ({ ...prev, start: date }))
                  }
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
                  onChange={(date) =>
                    setCustomDateRange((prev) => ({ ...prev, end: date }))
                  }
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
            <Button onClick={() => setIsCustomDatePickerOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCustomDateRangeConfirm}
              disabled={!customDateRange.start || !customDateRange.end}
              sx={{ color: "#673ab7" }}
            >
              Apply
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}
