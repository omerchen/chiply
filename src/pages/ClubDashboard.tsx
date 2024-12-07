import React, { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  TableSortLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Popover,
  TextField,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { db } from "../config/firebase";
import ClubBreadcrumbs from "../components/ClubBreadcrumbs";
import { formatMoney } from "../utils/formatters";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  subDays,
  isValid,
  format,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import EditIcon from "@mui/icons-material/Edit";
import FilterListIcon from "@mui/icons-material/FilterList";

interface PlayerStats {
  id: string;
  name: string;
  sessionsCount: number;
  totalBuyins: number;
  totalStackValue: number;
  profitLoss: number;
  roi: number;
  rank: number;
}

type Order = "asc" | "desc";
type OrderBy = keyof PlayerStats;
type DateRangeOption = "all" | "7days" | "30days" | "90days" | "custom";
type NumericFilterOperator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual";

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface NumericFilter {
  operator: NumericFilterOperator;
  value: number;
}

function ClubDashboard() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clubName, setClubName] = useState("");
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<OrderBy>("rank");
  const [dateRangeOption, setDateRangeOption] =
    useState<DateRangeOption>("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [isCustomDatePickerOpen, setIsCustomDatePickerOpen] = useState(false);
  const [filterAnchors, setFilterAnchors] = useState<{
    [key: string]: HTMLElement | null;
  }>({});
  const [sessionsFilter, setSessionsFilter] = useState<NumericFilter | null>(
    null
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!clubId) return;

      try {
        // Fetch club data
        const clubSnapshot = await get(ref(db, `clubs/${clubId}`));
        const clubData = clubSnapshot.val();
        setClubName(clubData?.name || "");

        // Fetch sessions data
        const sessionsSnapshot = await get(ref(db, `sessions`));
        const sessionsData = sessionsSnapshot.val() || {};

        // Fetch players data
        const playersSnapshot = await get(ref(db, `players`));
        const playersData = playersSnapshot.val() || {};

        // Process data to calculate player statistics
        const playerStatsMap = new Map<string, Set<string>>();
        const playerTotalsMap = new Map<
          string,
          {
            totalBuyins: number;
            totalStackValue: number;
            name: string;
          }
        >();

        // Filter sessions for this club and process them
        Object.entries(sessionsData).forEach(
          ([sessionId, sessionData]: [string, any]) => {
            if (
              sessionData.clubId !== clubId ||
              sessionData.status !== "close"
            ) {
              return;
            }

            // Apply date filter
            const sessionDate = new Date(sessionData.details.startTime);
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
                if (!isInRange) {
                  return;
                }
              }
            }

            const sessionPlayers = new Set<string>();

            // Process buyins
            const buyins = sessionData.data?.buyins || {};
            Object.entries(buyins).forEach(
              ([buyinId, buyin]: [string, any]) => {
                const playerId = buyin.playerId;
                if (!playerId) return;

                sessionPlayers.add(playerId);

                // Initialize or update player totals
                const playerTotals = playerTotalsMap.get(playerId) || {
                  totalBuyins: 0,
                  totalStackValue: 0,
                  name:
                    `${playersData[playerId]?.firstName || ""} ${
                      playersData[playerId]?.lastName || ""
                    }`.trim() || "Unknown Player",
                };
                playerTotals.totalBuyins += buyin.amount;
                playerTotalsMap.set(playerId, playerTotals);
              }
            );

            // Process cashouts
            const cashouts = sessionData.data?.cashouts || {};
            Object.entries(cashouts).forEach(
              ([cashoutId, cashout]: [string, any]) => {
                const playerId = cashout.playerId;
                if (!playerId) return;

                sessionPlayers.add(playerId);

                // Update player totals
                const playerTotals = playerTotalsMap.get(playerId) || {
                  totalBuyins: 0,
                  totalStackValue: 0,
                  name:
                    `${playersData[playerId]?.firstName || ""} ${
                      playersData[playerId]?.lastName || ""
                    }`.trim() || "Unknown Player",
                };
                playerTotals.totalStackValue += cashout.stackValue;
                playerTotalsMap.set(playerId, playerTotals);
              }
            );

            // Update sessions count for each player
            sessionPlayers.forEach((playerId) => {
              const sessions = playerStatsMap.get(playerId) || new Set();
              sessions.add(sessionId);
              playerStatsMap.set(playerId, sessions);
            });
          }
        );

        // Calculate final statistics
        const statsArray: PlayerStats[] = [];
        playerTotalsMap.forEach((totals, playerId) => {
          const sessions = playerStatsMap.get(playerId) || new Set();
          const profitLoss = totals.totalStackValue - totals.totalBuyins;
          const roi =
            totals.totalBuyins > 0
              ? (totals.totalStackValue / totals.totalBuyins) * 100 - 100
              : 0;

          statsArray.push({
            id: playerId,
            name: totals.name,
            sessionsCount: sessions.size,
            totalBuyins: totals.totalBuyins,
            totalStackValue: totals.totalStackValue,
            profitLoss,
            roi,
            rank: 0, // Will be set after sorting
          });
        });

        // Sort by profit/loss to assign ranks
        statsArray.sort((a, b) => b.profitLoss - a.profitLoss);
        statsArray.forEach((stats, index) => {
          stats.rank = index + 1;
        });

        setPlayerStats(statsArray);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [clubId, dateRangeOption, customDateRange]);

  const handleSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handlePlayerClick = (playerId: string) => {
    navigate(`/clubs/${clubId}/players/${playerId}`);
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

  const handleFilterClick =
    (columnId: string) => (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      setFilterAnchors((prev) => ({
        ...prev,
        [columnId]: event.currentTarget,
      }));
    };

  const handleFilterClose = (columnId: string) => {
    setFilterAnchors((prev) => ({
      ...prev,
      [columnId]: null,
    }));
  };

  const handleNumericFilterChange = (
    operator: NumericFilterOperator,
    value: number
  ) => {
    setSessionsFilter({
      operator,
      value,
    });
  };

  const getFilterIcon = (columnId: string) => {
    return (
      <IconButton size="small" onClick={handleFilterClick(columnId)}>
        <FilterListIcon
          fontSize="small"
          color={
            columnId === "sessions" && sessionsFilter?.operator
              ? "primary"
              : "inherit"
          }
        />
      </IconButton>
    );
  };

  const filteredPlayers = React.useMemo(() => {
    if (!sessionsFilter) return playerStats;

    return playerStats.filter((player) => {
      const value = player.sessionsCount;
      switch (sessionsFilter.operator) {
        case "equals":
          return value === sessionsFilter.value;
        case "notEquals":
          return value !== sessionsFilter.value;
        case "greaterThan":
          return value > sessionsFilter.value;
        case "greaterThanOrEqual":
          return value >= sessionsFilter.value;
        case "lessThan":
          return value < sessionsFilter.value;
        case "lessThanOrEqual":
          return value <= sessionsFilter.value;
        default:
          return true;
      }
    });
  }, [playerStats, sessionsFilter]);

  const sortedPlayers = React.useMemo(() => {
    const comparator = (a: PlayerStats, b: PlayerStats) => {
      let comparison = 0;
      if (b[orderBy] < a[orderBy]) {
        comparison = -1;
      }
      if (b[orderBy] > a[orderBy]) {
        comparison = 1;
      }
      return order === "asc" ? comparison * -1 : comparison;
    };

    return [...filteredPlayers].sort(comparator);
  }, [filteredPlayers, order, orderBy]);

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

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
      <ClubBreadcrumbs
        clubId={clubId!}
        clubName={clubName}
        currentPage="Dashboard"
      />

      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Club Dashboard
        </Typography>

        <Box sx={{ my: 3 }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mb: 4 }}
        >
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

        {playerStats.length === 0 ? (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: "center", py: 4 }}
          >
            No completed sessions found in this club.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "rank"}
                      direction={orderBy === "rank" ? order : "asc"}
                      onClick={() => handleSort("rank")}
                    >
                      Rank
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "name"}
                      direction={orderBy === "name" ? order : "asc"}
                      onClick={() => handleSort("name")}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TableSortLabel
                        active={orderBy === "sessionsCount"}
                        direction={orderBy === "sessionsCount" ? order : "asc"}
                        onClick={() => handleSort("sessionsCount")}
                      >
                        Sessions
                      </TableSortLabel>
                      {getFilterIcon("sessions")}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "totalBuyins"}
                      direction={orderBy === "totalBuyins" ? order : "asc"}
                      onClick={() => handleSort("totalBuyins")}
                    >
                      Total Buy-ins
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "totalStackValue"}
                      direction={orderBy === "totalStackValue" ? order : "asc"}
                      onClick={() => handleSort("totalStackValue")}
                    >
                      Total Stack Value
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "profitLoss"}
                      direction={orderBy === "profitLoss" ? order : "asc"}
                      onClick={() => handleSort("profitLoss")}
                    >
                      P&L
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "roi"}
                      direction={orderBy === "roi" ? order : "asc"}
                      onClick={() => handleSort("roi")}
                    >
                      ROI %
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPlayers.map((player) => (
                  <TableRow
                    key={player.id}
                    onClick={() => handlePlayerClick(player.id)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    }}
                  >
                    <TableCell>
                      {player.rank}
                      {player.rank === 1 && " 👑"}
                    </TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{player.sessionsCount}</TableCell>
                    <TableCell>₪{formatMoney(player.totalBuyins)}</TableCell>
                    <TableCell>
                      ₪{formatMoney(player.totalStackValue)}
                    </TableCell>
                    <TableCell
                      sx={{
                        color:
                          player.profitLoss > 0
                            ? "success.main"
                            : player.profitLoss < 0
                            ? "error.main"
                            : "text.secondary",
                        fontWeight: "bold",
                      }}
                    >
                      {player.profitLoss > 0 ? "+" : ""}₪
                      {formatMoney(Math.abs(player.profitLoss))}
                    </TableCell>
                    <TableCell
                      sx={{
                        color:
                          player.roi > 0
                            ? "success.main"
                            : player.roi < 0
                            ? "error.main"
                            : "text.secondary",
                        fontWeight: "bold",
                      }}
                    >
                      {player.roi > 0 ? "+" : ""}
                      {player.roi.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Custom Date Range Dialog */}
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

        {/* Numeric Filter Popover */}
        <Popover
          open={Boolean(filterAnchors["sessions"])}
          anchorEl={filterAnchors["sessions"]}
          onClose={() => handleFilterClose("sessions")}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
        >
          <Box sx={{ p: 2, minWidth: 200 }}>
            <FormControl fullWidth>
              <InputLabel>Operator</InputLabel>
              <Select
                value={sessionsFilter?.operator || ""}
                onChange={(e) =>
                  handleNumericFilterChange(
                    e.target.value as NumericFilterOperator,
                    sessionsFilter?.value || 0
                  )
                }
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="equals">=</MenuItem>
                <MenuItem value="notEquals">≠</MenuItem>
                <MenuItem value="greaterThan">&gt;</MenuItem>
                <MenuItem value="greaterThanOrEqual">≥</MenuItem>
                <MenuItem value="lessThan">&lt;</MenuItem>
                <MenuItem value="lessThanOrEqual">≤</MenuItem>
              </Select>
            </FormControl>
            {sessionsFilter?.operator && (
              <TextField
                type="number"
                fullWidth
                margin="normal"
                value={sessionsFilter.value || ""}
                onChange={(e) =>
                  handleNumericFilterChange(
                    sessionsFilter.operator,
                    parseInt(e.target.value)
                  )
                }
              />
            )}
          </Box>
        </Popover>
      </Paper>
    </Container>
  );
}

export default ClubDashboard;
