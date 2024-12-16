import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Switch,
  FormControlLabel,
  Fab,
  ListSubheader,
  OutlinedInput,
  Checkbox,
  SelectChangeEvent,
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
import DownloadIcon from "@mui/icons-material/Download";
import MetricCard from "../components/MetricCard";
import { ResponsivePie } from "@nivo/pie";
import PieChartCard from "./PieChartCard";
import TimelineCard from "./TimelineCard";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ResponsiveBar } from "@nivo/bar";
import RatingDistributionChart from "./RatingDistributionChart";

type DashboardUnit = "cash" | "bb";

interface PlayerDashboardProps {
  playerId: string;
  clubIds: string[];
  defaultClubId?: string;
  isClubFilterReadOnly?: boolean;
  showManualSessionsToggle?: boolean;
  includeManualSessions?: boolean;
  isManualSessionsEnabled?: boolean;
  showRatingMetrics?: boolean;
  isRatingMetricsEnabled?: boolean;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  ratings?: {
    [sessionId: string]: {
      rate: number;
    };
  };
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

interface PieChartData {
  id: string;
  label: string;
  value: number;
  color?: string;
}

interface ExtendedPlayerSessionData extends PlayerSessionData {
  clubId: string;
  sessionId: string;
}

interface FilterLocation {
  id: string;
  name: string;
  type: "club" | "location";
}

export default function PlayerDashboard({
  playerId,
  clubIds,
  defaultClubId,
  isClubFilterReadOnly = false,
  showManualSessionsToggle = true,
  includeManualSessions: initialIncludeManualSessions = true,
  isManualSessionsEnabled = true,
  showRatingMetrics = true,
  isRatingMetricsEnabled = true,
}: PlayerDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<Player | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string>(
    defaultClubId || ""
  );
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
    ExtendedPlayerSessionData[]
  >([]);
  const [dashboardUnit, setDashboardUnit] = useState<DashboardUnit>("cash");
  const [selectedStakes, setSelectedStakes] = useState<string>("");
  const [availableStakes, setAvailableStakes] = useState<Stakes[]>([]);
  const [includeManualSessions, setIncludeManualSessions] = useState<boolean>(
    isManualSessionsEnabled && initialIncludeManualSessions
  );
  const [manualSessionsData, setManualSessionsData] = useState<any>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [filterLocations, setFilterLocations] = useState<FilterLocation[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>(
    defaultClubId ? [defaultClubId] : []
  );
  const [showRatingMetricsState, setShowRatingMetricsState] = useState<boolean>(
    isRatingMetricsEnabled && showRatingMetrics
  );

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

        // Fetch all sessions
        const [sessionsData, fetchedManualSessionsData] = await Promise.all([
          readData("sessions"),
          readData(`players/${playerId}/manualPlayerSessions`),
        ]);

        setManualSessionsData(fetchedManualSessionsData);

        const regularSessions = sessionsData
          ? Object.entries(sessionsData)
              .map(([id, data]) => ({
                id,
                ...(data as Omit<SessionDetails, "id">),
              }))
              .filter((session) => clubIds.includes(session.clubId))
          : [];

        const manualSessions = fetchedManualSessionsData
          ? Object.entries(fetchedManualSessionsData).map(
              ([id, data]: [string, any]) => {
                const durationMinutes = data.duration * 60; // Convert hours to minutes
                return {
                  id,
                  clubId: "",
                  details: {
                    type: "manual",
                    startTime: data.dateTime,
                    stakes: data.stakes,
                  },
                  status: "close" as const,
                  data: {
                    buyins: {
                      "1": {
                        playerId,
                        time: data.dateTime,
                        amount: data.buyinTotal,
                        isPaybox: false,
                      },
                    },
                    cashouts: {
                      "1": {
                        playerId,
                        time: data.dateTime + durationMinutes * 60 * 1000, // Convert minutes to milliseconds
                        cashout: data.finalStack,
                        stackValue: data.finalStack,
                      },
                    },
                    players: {
                      [playerId]: true,
                    },
                  },
                };
              }
            )
          : [];

        setAllSessions([...regularSessions, ...manualSessions]);
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

  // Update filtered sessions when filters change
  useEffect(() => {
    const filterSessions = () => {
      const filteredSessions = allSessions
        .map((session) => {
          // Process session data for the player
          const playerSessionData =
            session.details.type === "manual" && manualSessionsData
              ? {
                  time: session.details.startTime,
                  endTime: session.data.cashouts["1"].time,
                  buyinsCount: 1,
                  buyinsTotal: session.data.buyins["1"].amount,
                  stackValue: session.data.cashouts["1"].stackValue,
                  profit:
                    session.data.cashouts["1"].stackValue -
                    session.data.buyins["1"].amount,
                  profitBB:
                    (session.data.cashouts["1"].stackValue -
                      session.data.buyins["1"].amount) /
                    session.details.stakes.bigBlind,
                  durationMinutes: Math.floor(
                    (session.data.cashouts["1"].time -
                      session.details.startTime) /
                      (1000 * 60)
                  ),
                  approximateHands: getApproximateHands(
                    manualSessionsData[session.id].numberOfPlayers,
                    manualSessionsData[session.id].duration * 60
                  ),
                  bb: session.details.stakes.bigBlind,
                }
              : (() => {
                  const data = processPlayerSessionData(session, playerId);
                  if (!data) return null;
                  return {
                    ...data,
                    profit: data.stackValue - data.buyinsTotal,
                    profitBB: (data.stackValue - data.buyinsTotal) / data.bb,
                  };
                })();

          if (!playerSessionData) {
            return null;
          }

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

            // Get the full session data
            const session = allSessions.find(
              (s) => s.id === sessionData.sessionId
            );
            if (!session) return false;

            // Manual sessions filter
            const isManualSession = session.details.type === "manual";
            if (!includeManualSessions && isManualSession) {
              return false;
            }

            // If defaultClubId is provided and isClubFilterReadOnly is true,
            // only show sessions from that club
            if (defaultClubId && isClubFilterReadOnly) {
              if (session.clubId !== defaultClubId) {
                return false;
              }
            }
            // Otherwise use the selected locations filter
            else if (selectedLocationIds.length > 0) {
              if (isManualSession) {
                // For manual sessions, check if any selected location matches
                const manualSession = manualSessionsData?.[session.id];
                const locationMatches = selectedLocationIds.some(locId => {
                  const selectedLocation = filterLocations.find(loc => loc.id === locId);
                  return selectedLocation?.type === 'location' && 
                         manualSession?.location === selectedLocation.name;
                });
                if (!locationMatches) return false;
              } else {
                // For club sessions, check if the club is selected
                if (!selectedLocationIds.includes(session.clubId)) return false;
              }
            }

            // Stakes filter
            if (selectedStakes) {
              const stakesStr = formatStakes(session.details.stakes);
              if (stakesStr !== selectedStakes) {
                return false;
              }
            }

            // Date range filter
            const sessionDate = new Date(session.details.startTime);

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
                  return false;
                }
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
    selectedLocationIds,
    selectedStakes,
    dateRangeOption,
    customDateRange,
    playerId,
    includeManualSessions,
    manualSessionsData,
    filterLocations,
    defaultClubId,
    isClubFilterReadOnly,
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
      value:
        dashboardUnit === "cash"
          ? `₪${totalProfit}`
          : `${totalProfit.toFixed(1)} BB`,
      color:
        totalProfit > 0
          ? "success.main"
          : totalProfit < 0
          ? "error.main"
          : "text.primary",
    };
  };

  const getSessionsByClub = useMemo((): PieChartData[] => {
    const sessionsByLocation = (
      filteredPlayerSessions as ExtendedPlayerSessionData[]
    ).reduce((acc: { [key: string]: number }, session) => {
      // Find the full session data
      const fullSession = allSessions.find((s) => s.id === session.sessionId);
      if (!fullSession) return acc;

      let locationName: string;

      if (fullSession.details.type === "manual") {
        // For manual sessions, use the location from manualSessionsData
        locationName =
          manualSessionsData?.[session.sessionId]?.location ||
          "Unknown Location";
      } else {
        // For club sessions, use the club name
        locationName =
          clubs.find((club) => club.id === session.clubId)?.name ||
          "Unknown Club";
      }

      acc[locationName] = (acc[locationName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(sessionsByLocation).map(([locationName, count]) => ({
      id: locationName,
      label: locationName,
      value: count,
    }));
  }, [filteredPlayerSessions, clubs, allSessions, manualSessionsData]);

  const getSessionsByStakes = useMemo((): PieChartData[] => {
    const sessionsByStakes = (
      filteredPlayerSessions as ExtendedPlayerSessionData[]
    ).reduce((acc: { [key: string]: number }, session) => {
      const stakes = allSessions.find((s) => s.id === session.sessionId)
        ?.details.stakes;
      if (!stakes) return acc;

      const stakesStr = `${stakes.smallBlind}/${stakes.bigBlind}${
        stakes.ante ? ` (${stakes.ante})` : ""
      }`;
      acc[stakesStr] = (acc[stakesStr] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(sessionsByStakes).map(([stakes, count]) => ({
      id: stakes,
      label: stakes,
      value: count,
    }));
  }, [filteredPlayerSessions, allSessions]);

  const commonPieProps = {
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    innerRadius: 0.5,
    padAngle: 0.7,
    cornerRadius: 3,
    activeOuterRadiusOffset: 8,
    borderWidth: 1,
    borderColor: {
      from: "color",
      modifiers: [["darker", 0.2]],
    },
    arcLinkLabelsSkipAngle: 10,
    arcLinkLabelsTextColor: "#333333",
    arcLinkLabelsThickness: 2,
    arcLinkLabelsColor: { from: "color" },
    arcLabelsSkipAngle: 10,
    arcLabelsTextColor: {
      from: "color",
      modifiers: [["darker", 2]],
    },
    theme: {
      fontSize: 14,
      fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
    },
  };

  const getTimelineData = useMemo(() => {
    // If there are no sessions, return empty data with current date range
    if (filteredPlayerSessions.length === 0) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return [
        {
          id: "Total P&L",
          data: [
            {
              x: thirtyDaysAgo.getTime(),
              y: 0,
            },
            {
              x: now.getTime(),
              y: 0,
            },
          ],
        },
      ];
    }

    // Sort sessions by date
    const sortedSessions = [...filteredPlayerSessions].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    // Calculate cumulative profit
    let cumulativeProfit = 0;
    const timelineData = sortedSessions.map((session) => {
      cumulativeProfit +=
        dashboardUnit === "cash" ? session.profit : session.profitBB;
      return {
        x: new Date(session.time).getTime(),
        y: cumulativeProfit,
      };
    });

    // Add a "Break Even" point at the start
    timelineData.unshift({
      x: new Date(
        new Date(timelineData[0].x).getTime() - 24 * 60 * 60 * 1000
      ).getTime(),
      y: 0,
    });

    return [
      {
        id: "Total P&L",
        data: timelineData,
      },
    ];
  }, [filteredPlayerSessions, dashboardUnit]);

  // Update includeManualSessions when showManualSessionsToggle changes
  useEffect(() => {
    setIncludeManualSessions(
      isManualSessionsEnabled && showManualSessionsToggle
    );
  }, [isManualSessionsEnabled, showManualSessionsToggle]);

  const handleDownloadPDF = async () => {
    if (!dashboardRef.current || !player) return;

    try {
      // Store original styles
      const originalStyle = dashboardRef.current.style.width;
      const originalPosition = dashboardRef.current.style.position;
      const originalOverflow = dashboardRef.current.style.overflow;

      // Find and store the title element's original style
      const titleElement = dashboardRef.current.querySelector(
        "[data-dashboard-title]"
      );
      let originalTitleStyle = "";
      if (titleElement) {
        originalTitleStyle = (titleElement as HTMLElement).style.cssText;
        // Set solid color for PDF
        (titleElement as HTMLElement).style.background = "none";
        (titleElement as HTMLElement).style.webkitBackgroundClip = "unset";
        (titleElement as HTMLElement).style.webkitTextFillColor = "#673ab7";
      }

      // Set styles for capture
      dashboardRef.current.style.width = "1200px";
      dashboardRef.current.style.position = "relative";
      dashboardRef.current.style.left = "50%";
      dashboardRef.current.style.transform = "translateX(-50%)";
      dashboardRef.current.style.overflow = "visible";

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1200,
        width: 1200,
      });

      // Restore original styles
      dashboardRef.current.style.width = originalStyle;
      dashboardRef.current.style.position = originalPosition;
      dashboardRef.current.style.left = "";
      dashboardRef.current.style.transform = "";
      dashboardRef.current.style.overflow = originalOverflow;

      // Restore title's original style
      if (titleElement) {
        (titleElement as HTMLElement).style.cssText = originalTitleStyle;
      }

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate dimensions to fit the page with margins
      const margins = 10;
      const maxWidth = pageWidth - 2 * margins;
      const maxHeight = pageHeight - 2 * margins;

      // Calculate scaling to fit within margins while maintaining aspect ratio
      const imgAspectRatio = canvas.width / canvas.height;
      const pageAspectRatio = maxWidth / maxHeight;

      let imgWidth, imgHeight;

      if (imgAspectRatio > pageAspectRatio) {
        imgWidth = maxWidth;
        imgHeight = maxWidth / imgAspectRatio;
      } else {
        imgHeight = maxHeight;
        imgWidth = maxHeight * imgAspectRatio;
      }

      // Center the image on the page
      const xOffset = (pageWidth - imgWidth) / 2;
      const yOffset = (pageHeight - imgHeight) / 2;

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", xOffset, yOffset, imgWidth, imgHeight);

      // Format current date for filename
      const currentDate = new Date()
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-");
      pdf.save(
        `${player.firstName}-${player.lastName}-dashboard-${currentDate}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  // Update the useEffect that sets filter locations to depend on manualSessionsData
  useEffect(() => {
    const updateFilterLocations = async () => {
      try {
        // Fetch club names for the provided club IDs
        const clubsData = await readData("clubs");
        if (clubsData) {
          const playerClubs = clubIds
            .map((id) => ({
              id,
              name: clubsData[id]?.name || "Unknown Club",
              type: "club" as const,
            }))
            .filter((club) => club.name !== "Unknown Club");

          // Get unique locations from manual sessions
          const manualLocations = manualSessionsData
            ? Object.values(manualSessionsData)
                .filter((session: any) => session.location)
                .map((session: any) => session.location)
                .filter(
                  (location, index, self) => self.indexOf(location) === index
                )
                .map((location) => ({
                  id: `location-${location}`,
                  name: location,
                  type: "location" as const,
                }))
            : [];

          setFilterLocations([...playerClubs, ...manualLocations]);
        }
      } catch (error) {
        console.error("Error updating filter locations:", error);
      }
    };

    updateFilterLocations();
  }, [clubIds, manualSessionsData]); // Add manualSessionsData as a dependency

  // Move the clubs data fetching logic to a separate useEffect
  useEffect(() => {
    const fetchClubs = async () => {
      try {
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
      } catch (error) {
        console.error("Error fetching clubs:", error);
      }
    };

    fetchClubs();
  }, [clubIds]);

  const handleLocationChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    // On autofill we get a stringified value.
    setSelectedLocationIds(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSelectAllLocations = () => {
    setSelectedLocationIds(filterLocations.map(loc => loc.id));
  };

  const handleClearAllLocations = () => {
    setSelectedLocationIds([]);
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
      <Box ref={dashboardRef}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 2,
            mb: 3,
            background: "linear-gradient(45deg, #673ab7 30%, #9c27b0 90%)",
            color: "white",
          }}
        >
          <Stack spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: "medium" }}>
              Welcome back, {player?.firstName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {player?.email}
            </Typography>
          </Stack>
        </Paper>

        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
            sx={{ mb: 4 }}
          >
            <Box>
              <Typography
                variant="h4"
                data-dashboard-title
                sx={{
                  fontWeight: "bold",
                  background:
                    "linear-gradient(45deg, #673ab7 30%, #9c27b0 90%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontSize: { xs: "1.5rem", sm: "2.125rem" },
                  lineHeight: 1.2,
                  mb: { xs: 0.5, sm: 0 },
                }}
              >
                Player Dashboard
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "medium",
                  color: "text.secondary",
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                  lineHeight: 1.2,
                }}
              >
                {player.firstName} {player.lastName}
              </Typography>
            </Box>

            <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
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
            </Box>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mb: 4 }}
          >
            <Box sx={{ minWidth: 200, flex: 1 }}>
              <FormControl fullWidth>
                <InputLabel id="location-select-label">
                  Filter by Club/Location
                </InputLabel>
                <Select
                  labelId="location-select-label"
                  id="location-select"
                  multiple
                  value={selectedLocationIds}
                  onChange={handleLocationChange}
                  input={<OutlinedInput label="Filter by Club/Location" />}
                  renderValue={(selected) => {
                    if (selected.length === 0) {
                      return <em>All Clubs/Locations</em>;
                    }
                    return selected
                      .map(id => filterLocations.find(loc => loc.id === id)?.name)
                      .filter(Boolean)
                      .join(', ');
                  }}
                  disabled={isClubFilterReadOnly}
                >
                  <Box sx={{ 
                    position: 'sticky', 
                    top: 0, 
                    bgcolor: 'background.paper',
                    zIndex: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    p: 1
                  }}>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedLocationIds(filterLocations.map(loc => loc.id));
                        }}
                        disabled={selectedLocationIds.length === filterLocations.length}
                        sx={{ 
                          flex: 1,
                          textTransform: 'none',
                          fontSize: '0.8125rem'
                        }}
                      >
                        Select All
                      </Button>
                      <Button
                        size="small"
                        onClick={handleClearAllLocations}
                        disabled={selectedLocationIds.length === 0}
                        sx={{ 
                          flex: 1,
                          textTransform: 'none',
                          fontSize: '0.8125rem'
                        }}
                      >
                        Clear All
                      </Button>
                    </Stack>
                  </Box>
                  {filterLocations.length > 0 && [
                    // Club group
                    filterLocations.some((loc) => loc.type === "club") && (
                      <ListSubheader key="clubs-header">Clubs</ListSubheader>
                    ),
                    ...filterLocations
                      .filter((loc) => loc.type === "club")
                      .map((club) => (
                        <MenuItem key={club.id} value={club.id}>
                          <Checkbox checked={selectedLocationIds.indexOf(club.id) > -1} />
                          {club.name}
                        </MenuItem>
                      )),
                    // Location group
                    filterLocations.some((loc) => loc.type === "location") && (
                      <ListSubheader key="locations-header">
                        Manual Session Locations
                      </ListSubheader>
                    ),
                    ...filterLocations
                      .filter((loc) => loc.type === "location")
                      .map((location) => (
                        <MenuItem key={location.id} value={location.id}>
                          <Checkbox checked={selectedLocationIds.indexOf(location.id) > -1} />
                          {location.name}
                        </MenuItem>
                      )),
                  ]}
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

            <Box
              sx={{
                minWidth: 200,
                flex: 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={includeManualSessions}
                    onChange={(e) => setIncludeManualSessions(e.target.checked)}
                    color="primary"
                    disabled={!isManualSessionsEnabled}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Include Manual Sessions
                  </Typography>
                }
              />
            </Box>

            <Box
              sx={{
                minWidth: 200,
                flex: 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={showRatingMetricsState}
                    onChange={(e) =>
                      setShowRatingMetricsState(e.target.checked)
                    }
                    color="primary"
                    disabled={!isRatingMetricsEnabled}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Show Rating Metrics
                  </Typography>
                }
              />
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

          {showRatingMetricsState && (
            <Box sx={{ mb: 4 }}>
              <RatingDistributionChart
                sessions={filteredPlayerSessions as { sessionId: string }[]}
                allSessions={allSessions}
                player={player}
              />
            </Box>
          )}

          {/* Metrics Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="Total Sessions"
                value={filteredPlayerSessions.length}
                tooltip="Total number of poker sessions played during the selected time period"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="Total Profit"
                value={(() => {
                  const totalProfit = filteredPlayerSessions.reduce(
                    (sum, session) =>
                      dashboardUnit === "cash"
                        ? sum + session.profit
                        : sum + session.profitBB,
                    0
                  );
                  const formattedNumber = new Intl.NumberFormat("en-US").format(
                    dashboardUnit === "cash"
                      ? totalProfit
                      : parseFloat(totalProfit.toFixed(1))
                  );
                  return dashboardUnit === "cash"
                    ? `₪${formattedNumber}`
                    : `${formattedNumber} BB`;
                })()}
                valueColor={(() => {
                  const totalProfit = filteredPlayerSessions.reduce(
                    (sum, session) =>
                      dashboardUnit === "cash"
                        ? sum + session.profit
                        : sum + session.profitBB,
                    0
                  );
                  return totalProfit > 0
                    ? "success.main"
                    : totalProfit < 0
                    ? "error.main"
                    : "text.primary";
                })()}
                tooltip={`Total profit/loss in ${
                  dashboardUnit === "cash" ? "Israeli Shekels" : "Big Blinds"
                } across all sessions in the selected time period`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="Total Hands"
                value={(() => {
                  const totalHands = filteredPlayerSessions.reduce(
                    (sum, session) => sum + (session.approximateHands || 0),
                    0
                  );
                  return `~${new Intl.NumberFormat("en-US").format(
                    totalHands
                  )}`;
                })()}
                tooltip="Approximate number of poker hands played during the selected time period (~ indicates an estimate)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="Profit / 100 Hands"
                value={(() => {
                  const totalProfit = filteredPlayerSessions.reduce(
                    (sum, session) =>
                      dashboardUnit === "cash"
                        ? sum + session.profit
                        : sum + session.profitBB,
                    0
                  );
                  const totalHands = filteredPlayerSessions.reduce(
                    (sum, session) => sum + (session.approximateHands || 0),
                    0
                  );

                  if (totalHands === 0) return "-";

                  const profitPer100Hands = (totalProfit / totalHands) * 100;
                  const formattedNumber = new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }).format(
                    dashboardUnit === "cash"
                      ? profitPer100Hands
                      : parseFloat(profitPer100Hands.toFixed(1))
                  );

                  return dashboardUnit === "cash"
                    ? `₪${formattedNumber}`
                    : `${formattedNumber} BB`;
                })()}
                valueColor={(() => {
                  const totalProfit = filteredPlayerSessions.reduce(
                    (sum, session) =>
                      dashboardUnit === "cash"
                        ? sum + session.profit
                        : sum + session.profitBB,
                    0
                  );
                  return totalProfit > 0
                    ? "success.main"
                    : totalProfit < 0
                    ? "error.main"
                    : "text.primary";
                })()}
                tooltip="Average profit/loss per 100 hands played - a key metric for measuring win rate"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="Playtime"
                value={(() => {
                  const totalMinutes = filteredPlayerSessions.reduce(
                    (sum, session) => {
                      // For manual sessions, use the durationMinutes directly
                      if (session.durationMinutes) {
                        return sum + session.durationMinutes;
                      }

                      // For regular sessions, find the session in allSessions
                      const fullSession = allSessions.find(
                        (s) => s.id === session.sessionId
                      );
                      if (!fullSession) return sum;

                      // Get first buyin time
                      const firstBuyinTime = Object.values(
                        fullSession.data.buyins
                      )
                        .filter((buyin) => buyin.playerId === playerId)
                        .reduce(
                          (earliest, buyin) => Math.min(earliest, buyin.time),
                          Infinity
                        );

                      // Get last cashout time
                      const lastCashoutTime = Object.values(
                        fullSession.data.cashouts
                      )
                        .filter((cashout) => cashout.playerId === playerId)
                        .reduce(
                          (latest, cashout) => Math.max(latest, cashout.time),
                          0
                        );

                      // Calculate duration in minutes
                      const durationMinutes = Math.floor(
                        (lastCashoutTime - firstBuyinTime) / (1000 * 60)
                      );
                      return sum + (durationMinutes > 0 ? durationMinutes : 0);
                    },
                    0
                  );

                  // Convert to hours and format
                  const hours = totalMinutes / 60;
                  return `${hours.toFixed(1)}h`;
                })()}
                tooltip="Total time spent playing poker during the selected time period"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="Profit / Hour"
                value={(() => {
                  const totalProfit = filteredPlayerSessions.reduce(
                    (sum, session) =>
                      dashboardUnit === "cash"
                        ? sum + session.profit
                        : sum + session.profitBB,
                    0
                  );

                  const totalMinutes = filteredPlayerSessions.reduce(
                    (sum, session) => {
                      if (session.durationMinutes) {
                        return sum + session.durationMinutes;
                      }

                      const fullSession = allSessions.find(
                        (s) => s.id === session.sessionId
                      );
                      if (!fullSession) return sum;

                      const firstBuyinTime = Object.values(
                        fullSession.data.buyins
                      )
                        .filter((buyin) => buyin.playerId === playerId)
                        .reduce(
                          (earliest, buyin) => Math.min(earliest, buyin.time),
                          Infinity
                        );

                      const lastCashoutTime = Object.values(
                        fullSession.data.cashouts
                      )
                        .filter((cashout) => cashout.playerId === playerId)
                        .reduce(
                          (latest, cashout) => Math.max(latest, cashout.time),
                          0
                        );

                      const durationMinutes = Math.floor(
                        (lastCashoutTime - firstBuyinTime) / (1000 * 60)
                      );
                      return sum + (durationMinutes > 0 ? durationMinutes : 0);
                    },
                    0
                  );

                  const hours = totalMinutes / 60;
                  if (hours === 0) return "-";

                  const profitPerHour = totalProfit / hours;
                  const formattedNumber = new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }).format(
                    dashboardUnit === "cash"
                      ? profitPerHour
                      : parseFloat(profitPerHour.toFixed(1))
                  );

                  return dashboardUnit === "cash"
                    ? `₪${formattedNumber}`
                    : `${formattedNumber} BB`;
                })()}
                valueColor={(() => {
                  const totalProfit = filteredPlayerSessions.reduce(
                    (sum, session) =>
                      dashboardUnit === "cash"
                        ? sum + session.profit
                        : sum + session.profitBB,
                    0
                  );
                  return totalProfit > 0
                    ? "success.main"
                    : totalProfit < 0
                    ? "error.main"
                    : "text.primary";
                })()}
                tooltip="Average profit/loss per hour played - shows your hourly rate"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="ROI"
                value={(() => {
                  if (dashboardUnit === "cash") {
                    const totalBuyins = filteredPlayerSessions.reduce(
                      (sum, session) => sum + session.buyinsTotal,
                      0
                    );
                    const totalStackValue = filteredPlayerSessions.reduce(
                      (sum, session) => sum + (session.stackValue || 0),
                      0
                    );

                    if (totalBuyins === 0) return "0%";

                    const roi =
                      ((totalStackValue - totalBuyins) / totalBuyins) * 100;
                    const formattedNumber = new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                      signDisplay: "exceptZero",
                    }).format(roi);

                    return `${formattedNumber}%`;
                  } else {
                    // For BB mode, use profitBB and convert buyins to BB
                    const totalBuyinsBB = filteredPlayerSessions.reduce(
                      (sum, session) => sum + session.buyinsTotal / session.bb,
                      0
                    );
                    const totalProfitBB = filteredPlayerSessions.reduce(
                      (sum, session) => sum + session.profitBB,
                      0
                    );

                    if (totalBuyinsBB === 0) return "0%";

                    const roiBB = (totalProfitBB / totalBuyinsBB) * 100;
                    const formattedNumber = new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                      signDisplay: "exceptZero",
                    }).format(roiBB);

                    return `${formattedNumber}%`;
                  }
                })()}
                valueColor={(() => {
                  let roi;
                  if (dashboardUnit === "cash") {
                    const totalBuyins = filteredPlayerSessions.reduce(
                      (sum, session) => sum + session.buyinsTotal,
                      0
                    );
                    const totalStackValue = filteredPlayerSessions.reduce(
                      (sum, session) => sum + (session.stackValue || 0),
                      0
                    );

                    if (totalBuyins === 0) return "text.primary";
                    roi = ((totalStackValue - totalBuyins) / totalBuyins) * 100;
                  } else {
                    const totalBuyinsBB = filteredPlayerSessions.reduce(
                      (sum, session) => sum + session.buyinsTotal / session.bb,
                      0
                    );
                    const totalProfitBB = filteredPlayerSessions.reduce(
                      (sum, session) => sum + session.profitBB,
                      0
                    );

                    if (totalBuyinsBB === 0) return "text.primary";
                    roi = (totalProfitBB / totalBuyinsBB) * 100;
                  }

                  return roi > 0
                    ? "success.main"
                    : roi < 0
                    ? "error.main"
                    : "text.primary";
                })()}
                tooltip={`Return on Investment - Percentage of profit/loss relative to total buy-ins in ${
                  dashboardUnit === "cash" ? "cash" : "Big Blinds"
                }. Shows how efficiently your money is working.`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="Win Rate"
                value={(() => {
                  const totalSessions = filteredPlayerSessions.length;
                  if (totalSessions === 0) return "0%";

                  const winningSessions = filteredPlayerSessions.filter(
                    (session) =>
                      dashboardUnit === "cash"
                        ? session.profit > 0
                        : session.profitBB > 0
                  ).length;

                  const winRate = (winningSessions / totalSessions) * 100;
                  const formattedNumber = new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }).format(winRate);

                  return `${formattedNumber}%`;
                })()}
                valueColor={(() => {
                  const totalSessions = filteredPlayerSessions.length;
                  if (totalSessions === 0) return "text.primary";

                  const winningSessions = filteredPlayerSessions.filter(
                    (session) =>
                      dashboardUnit === "cash"
                        ? session.profit > 0
                        : session.profitBB > 0
                  ).length;

                  const winRate = (winningSessions / totalSessions) * 100;
                  return winRate >= 50
                    ? "success.main"
                    : winRate < 50
                    ? "error.main"
                    : "text.primary";
                })()}
                tooltip="Percentage of sessions that ended with a profit (break-even sessions are not counted)"
              />
            </Grid>
          </Grid>

          {/* Timeline Chart */}
          <Box sx={{ mb: 4 }}>
            <TimelineCard
              title={`Total P&L (${dashboardUnit === "cash" ? "₪" : "BB"})`}
              data={getTimelineData}
              yAxisLabel={
                dashboardUnit === "cash" ? "Profit (₪)" : "Profit (BB)"
              }
              xAxisLabel="Date"
              tooltip="Cumulative profit/loss over time, showing your bankroll progression"
              formatTooltip={(value) =>
                dashboardUnit === "cash"
                  ? `₪${new Intl.NumberFormat("en-US").format(value)}`
                  : `${value.toFixed(1)} BB`
              }
            />
          </Box>

          {/* Charts Grid */}
          <Grid container spacing={3} sx={{ mt: 2, mb: 4 }}>
            <Grid item xs={12} md={6}>
              <PieChartCard
                title="Sessions by Club/Location"
                data={getSessionsByClub}
                tooltip="Distribution of poker sessions across different clubs and locations"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <PieChartCard
                title="Sessions by Stakes"
                data={getSessionsByStakes}
                tooltip="Distribution of poker sessions across different stake levels"
              />
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Download Button */}
      <Fab
        color="primary"
        aria-label="download"
        onClick={handleDownloadPDF}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          bgcolor: "#673ab7",
          "&:hover": {
            bgcolor: "#563098",
          },
        }}
      >
        <DownloadIcon />
      </Fab>

      {/* Custom Date Range Dialog */}
      <Dialog 
        open={isCustomDatePickerOpen} 
        onClose={() => setIsCustomDatePickerOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Select Custom Date Range</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <DatePicker
                label="Start Date"
                value={customDateRange.start}
                onChange={(newValue) => {
                  setCustomDateRange(prev => ({
                    ...prev,
                    start: newValue
                  }));
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined"
                  }
                }}
              />
              <DatePicker
                label="End Date"
                value={customDateRange.end}
                onChange={(newValue) => {
                  setCustomDateRange(prev => ({
                    ...prev,
                    end: newValue
                  }));
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined"
                  }
                }}
                minDate={customDateRange.start || undefined}
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
            variant="contained"
            disabled={!customDateRange.start || !customDateRange.end}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
