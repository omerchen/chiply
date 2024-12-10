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
  Stack,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Popover,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  TablePagination,
  Tooltip,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import EventIcon from "@mui/icons-material/Event";
import AddIcon from "@mui/icons-material/Add";
import { ref, get, set, remove } from "firebase/database";
import { db } from "../config/firebase";
import { getCurrentUser } from "../services/auth";
import EmptyState from "../components/EmptyState";
import {
  getApproximateHands,
  formatHands,
  convertPlayTimeToMinutes,
} from "../utils/gameUtils";
import { format } from "date-fns";
import { ManualSessionForm } from "../components/ManualSessionForm";
import SessionRatingDialog from "../components/SessionRatingDialog";
import {
  SessionRating,
  RatingValue,
  RATING_EMOJIS,
  RATING_LABELS,
} from "../types/rating";

interface SessionDetails {
  stakes: {
    bigBlind: number;
  };
}

interface Session {
  details: SessionDetails;
}

interface ProcessedSession {
  number: number;
  id: string;
  date: number;
  status: "Scheduled" | "Playing" | "Completed";
  playTime: string | null;
  buyinCount: number;
  buyinTotal: number;
  finalStack: number | null;
  profitLoss: number | null;
  clubName: string;
  playerCount: number | string;
  hands: number | null;
  stakes: {
    smallBlind: number;
    bigBlind: number;
    ante?: number;
  };
  profitLossBB: number | null;
  isManual?: boolean;
  location?: string;
  rating?: SessionRating;
}

interface CashoutData {
  time: number;
  stackValue: number;
}

interface ManualSession {
  id: string;
  userId: string;
  dateTime: number;
  duration: number;
  stakes: {
    smallBlind: number;
    bigBlind: number;
    ante?: number;
  };
  buyinCount: number;
  buyinTotal: number;
  finalStack: number;
  numberOfPlayers: number;
  location?: string;
}

interface ManualSessionFormProps {
  open: boolean;
  onClose: () => void;
  initialData?: ManualSession;
  onSubmit: () => void;
  playerId: string;
}

interface PlayerCashout {
  playerId: string;
  cashout: number;
  time: number;
  stackValue: number;
}

type DateFilterType =
  | "before"
  | "after"
  | "between"
  | "last7"
  | "last30"
  | "last90"
  | null;
type NumericFilterOperator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual";

interface DateFilter {
  type: DateFilterType;
  startDate?: Date;
  endDate?: Date;
}

interface NumericFilter {
  operator: NumericFilterOperator;
  value: number;
}

interface DropdownFilter {
  selectedValues: string[];
}

// Add this type for the rating filter
type RatingFilterOperator =
  | "equals"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "isEmpty"
  | "isNotEmpty";

interface Filters {
  date: DateFilter;
  club: DropdownFilter;
  stakes: DropdownFilter;
  type: DropdownFilter;
  status: DropdownFilter;
  players: NumericFilter | null;
  playTime: NumericFilter | null;
  hands: NumericFilter | null;
  buyins: NumericFilter | null;
  totalBuyins: NumericFilter | null;
  finalStack: NumericFilter | null;
  profitLoss: NumericFilter | null;
  bbProfitLoss: NumericFilter | null;
  rating: { operator: RatingFilterOperator; value?: number } | null;
}

function MySessions() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ProcessedSession[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [selectedManualSession, setSelectedManualSession] = useState<
    ManualSession | undefined
  >(undefined);
  const [manualSessions, setManualSessions] = useState<ProcessedSession[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter states
  const [filters, setFilters] = useState<Filters>({
    date: { type: null },
    club: { selectedValues: [] },
    stakes: { selectedValues: [] },
    type: { selectedValues: [] },
    status: { selectedValues: [] },
    players: null,
    playTime: null,
    hands: null,
    buyins: null,
    totalBuyins: null,
    finalStack: null,
    profitLoss: null,
    bbProfitLoss: null,
    rating: null,
  });

  // Filter anchor elements
  const [filterAnchors, setFilterAnchors] = useState<{
    [key: string]: HTMLElement | null;
  }>({});

  // Available options for dropdown filters
  const [availableClubs, setAvailableClubs] = useState<string[]>([]);
  const [availableStakes, setAvailableStakes] = useState<string[]>([]);
  const [availableTypes] = useState(["Manual", "In-app"]);
  const [availableStatuses] = useState(["Playing", "Completed"]);

  // Add sorting state
  type SortDirection = "asc" | "desc";
  type SortField =
    | "number"
    | "date"
    | "club"
    | "stakes"
    | "type"
    | "status"
    | "players"
    | "playTime"
    | "hands"
    | "buyins"
    | "totalBuyins"
    | "finalStack"
    | "profitLoss"
    | "bbProfitLoss"
    | "rating";

  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: "number",
    direction: "desc",
  });

  // Handle sort
  const handleSort = (field: SortField) => {
    setSortConfig((prevConfig) => ({
      field,
      direction:
        prevConfig.field === field && prevConfig.direction === "desc"
          ? "asc"
          : "desc",
    }));
  };

  // Apply filters to sessions
  const filteredSessions = sessions.filter((session) => {
    // Date filter
    if (filters.date.type) {
      const sessionDate = new Date(session.date);

      switch (filters.date.type) {
        case "before":
          if (!filters.date.endDate) return true;
          return sessionDate <= filters.date.endDate;
        case "after":
          if (!filters.date.startDate) return true;
          return sessionDate >= filters.date.startDate;
        case "between":
          if (!filters.date.startDate || !filters.date.endDate) return true;
          // Set start date to beginning of day (00:00:00)
          const startDate = new Date(filters.date.startDate);
          startDate.setHours(0, 0, 0, 0);
          // Set end date to end of day (23:59:59)
          const endDate = new Date(filters.date.endDate);
          endDate.setHours(23, 59, 59, 999);
          return sessionDate >= startDate && sessionDate <= endDate;
        case "last7":
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return sessionDate >= sevenDaysAgo;
        case "last30":
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return sessionDate >= thirtyDaysAgo;
        case "last90":
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          return sessionDate >= ninetyDaysAgo;
        default:
          return true;
      }
    }

    // Dropdown filters
    if (
      filters.club.selectedValues.length &&
      !filters.club.selectedValues.includes(session.clubName)
    )
      return false;
    if (
      filters.stakes.selectedValues.length &&
      !filters.stakes.selectedValues.includes(
        `${session.stakes.smallBlind}/${session.stakes.bigBlind}${
          session.stakes.ante ? ` (${session.stakes.ante})` : ""
        }`
      )
    )
      return false;
    if (
      filters.type.selectedValues.length &&
      !filters.type.selectedValues.includes(
        session.isManual ? "Manual" : "In-app"
      )
    )
      return false;
    if (
      filters.status.selectedValues.length &&
      !filters.status.selectedValues.includes(session.status)
    )
      return false;

    // Numeric filters
    const numericFields: [keyof Filters, number | null][] = [
      [
        "players",
        typeof session.playerCount === "number" ? session.playerCount : null,
      ],
      [
        "playTime",
        session.playTime ? parseFloat(session.playTime.replace("h", "")) : null,
      ],
      ["hands", session.hands],
      ["buyins", session.buyinCount],
      ["totalBuyins", session.buyinTotal],
      ["finalStack", session.finalStack],
      ["profitLoss", session.profitLoss],
      ["bbProfitLoss", session.profitLossBB],
    ];

    for (const [field, value] of numericFields) {
      const filter = filters[field] as NumericFilter | null;
      if (filter && value !== null) {
        switch (filter.operator) {
          case "equals":
            if (value !== filter.value) return false;
            break;
          case "notEquals":
            if (value === filter.value) return false;
            break;
          case "greaterThan":
            if (value <= filter.value) return false;
            break;
          case "greaterThanOrEqual":
            if (value < filter.value) return false;
            break;
          case "lessThan":
            if (value >= filter.value) return false;
            break;
          case "lessThanOrEqual":
            if (value > filter.value) return false;
            break;
        }
      }
    }

    // Rating filter
    if (filters.rating) {
      switch (filters.rating.operator) {
        case "equals":
          if (!session.rating) return false;
          return session.rating.rate === filters.rating.value;
        case "greaterThan":
          if (!session.rating) return false;
          return session.rating.rate > (filters.rating.value || 0);
        case "greaterThanOrEqual":
          if (!session.rating) return false;
          return session.rating.rate >= (filters.rating.value || 0);
        case "lessThan":
          if (!session.rating) return false;
          return session.rating.rate < (filters.rating.value || 0);
        case "lessThanOrEqual":
          if (!session.rating) return false;
          return session.rating.rate <= (filters.rating.value || 0);
        case "isEmpty":
          return !session.rating;
        case "isNotEmpty":
          return !!session.rating;
        default:
          return true;
      }
    }

    return true;
  });

  // Sort filtered sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    const direction = sortConfig.direction === "asc" ? 1 : -1;

    switch (sortConfig.field) {
      case "number":
        return (a.number - b.number) * direction;
      case "date":
        return (a.date - b.date) * direction;
      case "club":
        return (a.clubName || "").localeCompare(b.clubName || "") * direction;
      case "stakes":
        return (a.stakes.bigBlind - b.stakes.bigBlind) * direction;
      case "type":
        return (
          (a.isManual ? "Manual" : "In-app").localeCompare(
            b.isManual ? "Manual" : "In-app"
          ) * direction
        );
      case "status":
        return a.status.localeCompare(b.status) * direction;
      case "players":
        return (
          ((Number(a.playerCount) || 0) - (Number(b.playerCount) || 0)) *
          direction
        );
      case "playTime":
        const getMinutes = (time: string | null) => {
          if (!time) return 0;
          const match = time.match(/(\d+)h\s*(?:(\d+)m)?/);
          if (!match) return 0;
          return parseInt(match[1]) * 60 + (parseInt(match[2]) || 0);
        };
        return (getMinutes(a.playTime) - getMinutes(b.playTime)) * direction;
      case "hands":
        return ((a.hands || 0) - (b.hands || 0)) * direction;
      case "buyins":
        return (a.buyinCount - b.buyinCount) * direction;
      case "totalBuyins":
        return (a.buyinTotal - b.buyinTotal) * direction;
      case "finalStack":
        return ((a.finalStack || 0) - (b.finalStack || 0)) * direction;
      case "profitLoss":
        return ((a.profitLoss || 0) - (b.profitLoss || 0)) * direction;
      case "bbProfitLoss":
        return ((a.profitLossBB || 0) - (b.profitLossBB || 0)) * direction;
      case "rating":
        const getRatingValue = (s: ProcessedSession) => s.rating?.rate || 0;
        return (getRatingValue(a) - getRatingValue(b)) * direction;
      default:
        return 0;
    }
  });

  // Helper function to render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortConfig.field !== field) return null;
    return (
      <Box component="span" sx={{ ml: 0.5 }}>
        {sortConfig.direction === "asc" ? "↑" : "↓"}
      </Box>
    );
  };

  // Helper function to format relative time
  const formatRelativeTime = (date: number): string => {
    const now = new Date();
    const sessionDate = new Date(date);
    const diffInDays = Math.floor(
      (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let relativeText;
    if (diffInDays >= 14) {
      const weeks = Math.floor(diffInDays / 7);
      relativeText = `${weeks}w ago`;
    } else {
      relativeText = `${diffInDays}d ago`;
    }

    return `${relativeText} (${format(sessionDate, "dd/MM")})`;
  };

  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedSessionForRating, setSelectedSessionForRating] =
    useState<ProcessedSession | null>(null);

  const handleRatingClick = (
    session: ProcessedSession,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    setSelectedSessionForRating(session);
    setRatingDialogOpen(true);
  };

  const handleRatingSave = async (
    sessionId: string,
    ratingData: Omit<SessionRating, "createdAt" | "updatedAt">
  ) => {
    if (!playerId) return;

    const rating: SessionRating = {
      ...ratingData,
      createdAt: selectedSessionForRating?.rating?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await set(ref(db, `players/${playerId}/ratings/${sessionId}`), rating);
    setRatingDialogOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleRatingDelete = async () => {
    if (!playerId || !selectedSessionForRating) return;

    await remove(
      ref(db, `players/${playerId}/ratings/${selectedSessionForRating.id}`)
    );
    setRatingDialogOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.email) {
          setLoading(false);
          return;
        }

        // Get all players with matching email
        const playersRef = ref(db, "players");
        const playersSnapshot = await get(playersRef);
        const playersData = playersSnapshot.val();

        const userPlayerIds = Object.entries(playersData || {})
          .filter(
            ([_, player]: [string, any]) => player.email === currentUser.email
          )
          .map(([id]) => id);

        if (userPlayerIds.length === 0) {
          setLoading(false);
          return;
        }

        // Store the player ID
        setPlayerId(userPlayerIds[0]);

        // Fetch ratings
        const ratingsRef = ref(db, `players/${userPlayerIds[0]}/ratings`);
        const ratingsSnapshot = await get(ratingsRef);
        const ratingsData = ratingsSnapshot.val();

        let processedSessions: ProcessedSession[] = [];

        // Get all sessions
        const sessionsRef = ref(db, "sessions");
        const sessionsSnapshot = await get(sessionsRef);
        const sessionsData = sessionsSnapshot.val();

        // Get all clubs
        const clubsRef = ref(db, "clubs");
        const clubsSnapshot = await get(clubsRef);
        const clubsData = clubsSnapshot.val();

        if (sessionsData) {
          // Process in-game sessions
          processedSessions = Object.entries(sessionsData)
            .map(([sessionId, session]: [string, any]) => {
              if (!session) return null;

              // Check if the player is a participant in this session
              const isPlayerParticipant =
                session.data?.players &&
                userPlayerIds[0] in session.data.players;

              if (!isPlayerParticipant) return null;

              // Filter buy-ins and cashouts for this player
              const playerBuyins = Object.values(
                session.data?.buyins || {}
              ).filter((buyin: any) => buyin.playerId === userPlayerIds[0]);
              const playerCashouts = Object.values(
                session.data?.cashouts || {}
              ).filter((cashout: any) => cashout.playerId === userPlayerIds[0]);

              // Calculate play time
              let playTime = null;
              if (playerBuyins.length > 0) {
                const firstBuyinTime = Math.min(
                  ...playerBuyins.map((b: any) => b.time)
                );
                let lastTime: number;

                if (playerCashouts.length > 0) {
                  lastTime = Math.max(
                    ...playerCashouts.map((c: any) => c.time)
                  );
                } else if (session.status === "open") {
                  lastTime = Date.now();
                } else {
                  lastTime = firstBuyinTime;
                }

                const durationMinutes =
                  (lastTime - firstBuyinTime) / (1000 * 60);
                const hours = Math.floor(durationMinutes / 60);
                const minutes = Math.floor(durationMinutes % 60);

                if (hours > 0 && minutes > 0) {
                  playTime = `${hours}h ${minutes}m`;
                } else if (hours > 0) {
                  playTime = `${hours}h`;
                } else {
                  playTime = `${minutes}m`;
                }
              }

              // Get number of players directly from the players object
              const playerCount = session.data?.players
                ? Object.keys(session.data.players).length
                : 0;

              const totalBuyins = playerBuyins.reduce(
                (sum: number, buyin: any) => sum + buyin.amount,
                0
              );
              const buyinCount = playerBuyins.length;
              const finalStack =
                playerCashouts.length > 0
                  ? (playerCashouts[playerCashouts.length - 1] as PlayerCashout)
                      .stackValue
                  : null;
              const profitLoss =
                finalStack !== null ? finalStack - totalBuyins : null;
              const profitLossBB =
                profitLoss !== null
                  ? profitLoss / session.details.stakes.bigBlind
                  : null;

              // Calculate hands based on play time
              const hands =
                playTime && playerCount > 0
                  ? getApproximateHands(
                      playerCount,
                      convertPlayTimeToMinutes(playTime)
                    )
                  : null;

              return {
                id: sessionId,
                number: 0,
                date: session.details.startTime,
                club: session.details.type,
                stakes: session.details.stakes,
                status: session.status === "open" ? "Playing" : "Completed",
                playerCount,
                playTime,
                hands,
                buyinCount,
                buyinTotal: totalBuyins,
                finalStack,
                profitLoss,
                profitLossBB,
                isManual: false,
                clubName: clubsData[session.clubId]?.name || "Unknown Club",
                rating: ratingsData?.[sessionId],
              } as ProcessedSession;
            })
            .filter((session): session is ProcessedSession => session !== null);
        }

        // Fetch manual sessions
        if (userPlayerIds[0]) {
          const manualSessionsRef = ref(
            db,
            `players/${userPlayerIds[0]}/manualPlayerSessions`
          );
          const manualSessionsSnapshot = await get(manualSessionsRef);
          const manualSessionsData = manualSessionsSnapshot.val();

          if (manualSessionsData) {
            const processedManualSessions: ProcessedSession[] = Object.entries(
              manualSessionsData
            ).map(([id, session]: [string, any]) => {
              // Calculate hands for manual sessions
              const durationMinutes = session.duration * 60; // Convert hours to minutes
              const hands = getApproximateHands(
                session.numberOfPlayers,
                durationMinutes
              );

              return {
                id,
                number: 0,
                date: session.dateTime,
                status: "Completed",
                playTime: `${Math.floor(session.duration)}h ${Math.floor(
                  (session.duration % 1) * 60
                )}m`,
                buyinCount: session.buyinCount,
                buyinTotal: session.buyinTotal,
                finalStack: session.finalStack,
                profitLoss: session.finalStack - session.buyinTotal,
                clubName: "",
                playerCount: session.numberOfPlayers,
                hands,
                stakes: session.stakes,
                profitLossBB:
                  (session.finalStack - session.buyinTotal) /
                  session.stakes.bigBlind,
                isManual: true,
                location: session.location,
                rating: ratingsData?.[id],
              };
            });

            // Combine all sessions, ensuring no duplicates by ID
            const allSessions = [...processedSessions];
            processedManualSessions.forEach((manualSession) => {
              if (
                !allSessions.some((session) => session.id === manualSession.id)
              ) {
                allSessions.push(manualSession);
              }
            });

            setSessions(
              allSessions
                .sort((a, b) => b.date - a.date)
                .map((session, index) => ({
                  ...session,
                  number: index + 1,
                }))
            );
          } else {
            setSessions(processedSessions.sort((a, b) => b.date - a.date));
          }
        } else {
          setSessions(processedSessions.sort((a, b) => b.date - a.date));
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [refreshTrigger]);

  // Update available filter options when sessions change
  useEffect(() => {
    const clubs = [...new Set(sessions.map((s) => s.clubName))];
    setAvailableClubs(clubs);

    const stakes = [
      ...new Set(
        sessions.map(
          (s) =>
            `${s.stakes.smallBlind}/${s.stakes.bigBlind}${
              s.stakes.ante ? ` (${s.stakes.ante})` : ""
            }`
        )
      ),
    ];
    setAvailableStakes(stakes);
  }, [sessions]);

  // Handle filter menu open
  const handleFilterClick =
    (columnId: string) => (event: React.MouseEvent<HTMLElement>) => {
      setFilterAnchors((prev) => ({
        ...prev,
        [columnId]: event.currentTarget,
      }));
    };

  // Handle filter menu close
  const handleFilterClose = (columnId: string) => {
    setFilterAnchors((prev) => ({
      ...prev,
      [columnId]: null,
    }));
  };

  // Handle dropdown filter change
  const handleDropdownFilterChange =
    (columnId: keyof Filters) => (event: any) => {
      const value = event.target.value;
      setFilters((prev) => ({
        ...prev,
        [columnId]: {
          ...prev[columnId],
          selectedValues: value,
        },
      }));
    };

  // Handle numeric filter change
  const handleNumericFilterChange =
    (columnId: keyof Filters) =>
    (operator: NumericFilterOperator, value: number) => {
      setFilters((prev) => ({
        ...prev,
        [columnId]: {
          operator,
          value,
        },
      }));
    };

  // Handle date filter change
  const handleDateFilterChange = (
    type: DateFilterType,
    startDate?: Date,
    endDate?: Date
  ) => {
    setFilters((prev) => ({
      ...prev,
      date: {
        type,
        startDate,
        endDate,
      },
    }));
  };

  const handleRowClick = (session: ProcessedSession) => {
    if (session.isManual) {
      setSelectedManualSession({
        id: session.id,
        userId: "", // Will be set on save
        dateTime: session.date,
        duration: parseFloat(session.playTime?.replace("h", "") || "0"),
        stakes: session.stakes,
        buyinCount: session.buyinCount,
        buyinTotal: session.buyinTotal,
        finalStack: session.finalStack || 0,
        numberOfPlayers:
          typeof session.playerCount === "number"
            ? session.playerCount
            : parseInt(session.playerCount),
        location: session.location,
      });
      setShowManualForm(true);
    }
  };

  const handleManualFormClose = () => {
    setShowManualForm(false);
    setSelectedManualSession(undefined);
  };

  const getFilterIcon = (columnId: string) => {
    return (
      <IconButton
        size="small"
        onClick={(event) => {
          event.stopPropagation();
          handleFilterClick(columnId)(event);
        }}
      >
        <FilterListIcon
          fontSize="small"
          color={
            columnId === "date"
              ? filters.date.type
                ? "primary"
                : "inherit"
              : ["club", "stakes", "type", "status"].includes(columnId)
              ? (filters[columnId as keyof Filters] as DropdownFilter)
                  .selectedValues.length > 0
                ? "primary"
                : "inherit"
              : filters[columnId as keyof Filters] &&
                (filters[columnId as keyof Filters] as NumericFilter).operator
              ? "primary"
              : "inherit"
          }
        />
      </IconButton>
    );
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Add this function to handle rating filter
  const handleRatingFilterChange = (
    operator: RatingFilterOperator,
    value?: number
  ) => {
    setFilters((prev) => ({
      ...prev,
      rating: { operator, value },
    }));
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

  if (sessions.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
        <EmptyState
          icon={<EventIcon sx={{ fontSize: 48, color: "primary.main" }} />}
          title="No Sessions Found"
          description="You haven't participated in any poker sessions yet."
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mb: 3 }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <EventIcon sx={{ color: "#673ab7" }} />
            <Typography variant="h5">My Sessions</Typography>
          </Stack>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowManualForm(true)}
            sx={{
              "& .MuiButton-startIcon": {
                margin: { xs: "0", sm: "-4px 8px -4px -4px" },
              },
            }}
          >
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              Add Manual Session
            </Box>
          </Button>
        </Stack>

        <TableContainer
          sx={{
            position: "relative",
            "& th:first-of-type, & td:first-of-type": {
              position: "sticky",
              left: 0,
              background: "white",
              zIndex: 1,
              borderRight: "1px solid rgba(224, 224, 224, 1)",
              boxShadow: (theme) =>
                `2px 0 4px -2px ${
                  theme.palette.mode === "light"
                    ? "rgba(0,0,0,0.1)"
                    : "rgba(255,255,255,0.1)"
                }`,
            },
            "& th:first-of-type": {
              zIndex: 2,
              background: "#f5f5f5",
            },
            overflowX: "auto",
            "&::-webkit-scrollbar": {
              height: "8px",
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#888",
              borderRadius: "4px",
              "&:hover": {
                background: "#666",
              },
            },
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ minWidth: 80, cursor: "pointer" }}
                  onClick={() => handleSort("number")}
                >
                  <Stack direction="row" alignItems="center">
                    # {renderSortIndicator("number")}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ minWidth: 200, cursor: "pointer" }}
                  onClick={() => handleSort("date")}
                >
                  <Stack direction="row" alignItems="center">
                    Date {renderSortIndicator("date")}
                    {getFilterIcon("date")}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ minWidth: 200, cursor: "pointer" }}
                  onClick={() => handleSort("club")}
                >
                  <Stack direction="row" alignItems="center">
                    Club {renderSortIndicator("club")}
                    {getFilterIcon("club")}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ minWidth: 200, cursor: "pointer" }}
                  onClick={() => handleSort("stakes")}
                >
                  <Stack direction="row" alignItems="center">
                    Stakes {renderSortIndicator("stakes")}
                    {getFilterIcon("stakes")}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ minWidth: 200, cursor: "pointer" }}
                  onClick={() => handleSort("type")}
                >
                  <Stack direction="row" alignItems="center">
                    Type {renderSortIndicator("type")}
                    {getFilterIcon("type")}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ minWidth: 200, cursor: "pointer" }}
                  onClick={() => handleSort("status")}
                >
                  <Stack direction="row" alignItems="center">
                    Status {renderSortIndicator("status")}
                    {getFilterIcon("status")}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ minWidth: 200, cursor: "pointer" }}
                  onClick={() => handleSort("players")}
                >
                  <Stack direction="row" alignItems="center">
                    Players {renderSortIndicator("players")}
                    {getFilterIcon("players")}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ minWidth: 200, cursor: "pointer" }}
                  onClick={() => handleSort("playTime")}
                >
                  <Stack direction="row" alignItems="center">
                    Play Time {renderSortIndicator("playTime")}
                    {getFilterIcon("playTime")}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ minWidth: 200, cursor: "pointer" }}
                  onClick={() => handleSort("hands")}
                >
                  <Stack direction="row" alignItems="center">
                    Hands {renderSortIndicator("hands")}
                    {getFilterIcon("hands")}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ minWidth: 200, cursor: "pointer" }}
                  onClick={() => handleSort("buyins")}
                >
                  <Stack direction="row" alignItems="center">
                    Buy-ins {renderSortIndicator("buyins")}
                    {getFilterIcon("buyins")}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ minWidth: 200, cursor: "pointer" }}
                  onClick={() => handleSort("totalBuyins")}
                >
                  <Stack direction="row" alignItems="center">
                    Total Buy-in {renderSortIndicator("totalBuyins")}
                    {getFilterIcon("totalBuyins")}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ minWidth: 200, cursor: "pointer" }}
                  onClick={() => handleSort("finalStack")}
                >
                  <Stack direction="row" alignItems="center">
                    Final Stack {renderSortIndicator("finalStack")}
                    {getFilterIcon("finalStack")}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ minWidth: 200, cursor: "pointer" }}
                  onClick={() => handleSort("profitLoss")}
                >
                  <Stack direction="row" alignItems="center">
                    P&L {renderSortIndicator("profitLoss")}
                    {getFilterIcon("profitLoss")}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ minWidth: 200, cursor: "pointer" }}
                  onClick={() => handleSort("bbProfitLoss")}
                >
                  <Stack direction="row" alignItems="center">
                    BB P&L {renderSortIndicator("bbProfitLoss")}
                    {getFilterIcon("bbProfitLoss")}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{ minWidth: 200, cursor: "pointer" }}
                  onClick={() => handleSort("rating")}
                >
                  <Stack direction="row" alignItems="center">
                    Rating {renderSortIndicator("rating")}
                    {getFilterIcon("rating")}
                  </Stack>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedSessions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((session) => (
                  <TableRow
                    key={session.id}
                    onClick={() => handleRowClick(session)}
                    sx={{
                      cursor: session.isManual ? "pointer" : "default",
                      "&:hover": session.isManual
                        ? { bgcolor: "action.hover" }
                        : {},
                    }}
                  >
                    <TableCell sx={{ minWidth: 80 }}>
                      #{session.number}
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      {formatRelativeTime(session.date)}
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      {session.clubName}
                      {session.location && ` (${session.location})`}
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      {`${session.stakes.smallBlind}/${
                        session.stakes.bigBlind
                      }${
                        session.stakes.ante ? ` (${session.stakes.ante})` : ""
                      }`}
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      <Box
                        component="span"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: "0.875rem",
                          ...(session.isManual
                            ? {
                                bgcolor: "info.main",
                                color: "info.contrastText",
                              }
                            : {
                                bgcolor: "#673ab7",
                                color: "white",
                              }),
                        }}
                      >
                        {session.isManual ? "Manual" : "In-app"}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      <Box
                        component="span"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: "0.875rem",
                          ...(session.status === "Completed" && {
                            bgcolor: "success.main",
                            color: "success.contrastText",
                          }),
                          ...(session.status === "Playing" && {
                            bgcolor: "warning.main",
                            color: "warning.contrastText",
                          }),
                          ...(session.status === "Scheduled" && {
                            bgcolor: "info.main",
                            color: "info.contrastText",
                          }),
                        }}
                      >
                        {session.status}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      {session.playerCount}
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      {session.playTime || "-"}
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      {formatHands(session.hands)}
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      {session.buyinCount}
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      ₪{session.buyinTotal}
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      {session.finalStack !== null
                        ? `₪${session.finalStack}`
                        : "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        minWidth: 200,
                        color:
                          session.profitLoss === null
                            ? "inherit"
                            : session.profitLoss > 0
                            ? "success.main"
                            : session.profitLoss < 0
                            ? "error.main"
                            : "inherit",
                        fontWeight: "bold",
                      }}
                    >
                      {session.profitLoss !== null
                        ? `${session.profitLoss > 0 ? "+" : ""}₪${
                            session.profitLoss
                          }`
                        : "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        minWidth: 200,
                        color:
                          session.profitLossBB === null
                            ? "inherit"
                            : session.profitLossBB > 0
                            ? "success.main"
                            : session.profitLossBB < 0
                            ? "error.main"
                            : "inherit",
                        fontWeight: "bold",
                      }}
                    >
                      {session.profitLossBB !== null
                        ? `${
                            session.profitLossBB > 0 ? "+" : ""
                          }${session.profitLossBB.toFixed(1)}`
                        : "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        minWidth: 200,
                        verticalAlign: "middle",
                      }}
                    >
                      <Button
                        onClick={(e) => handleRatingClick(session, e)}
                        variant={session.rating ? "text" : "outlined"}
                        size="small"
                        sx={{
                          height: "32px",
                          minHeight: "32px",
                        }}
                      >
                        {session.rating ? (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            sx={{ height: "100%" }}
                          >
                            <Typography
                              component="span"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {RATING_EMOJIS[session.rating.rate]}
                            </Typography>
                            {session.rating.comment && (
                              <Tooltip
                                title={
                                  <div style={{ whiteSpace: "pre-line" }}>
                                    {session.rating.comment}
                                  </div>
                                }
                                arrow
                              >
                                <Typography
                                  component="span"
                                  sx={{
                                    color: "text.secondary",
                                    maxWidth: "150px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    alignItems: "center",
                                    height: "100%",
                                  }}
                                >
                                  {session.rating.comment}
                                </Typography>
                              </Tooltip>
                            )}
                          </Stack>
                        ) : (
                          "Rate Session"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={sortedSessions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            ".MuiTablePagination-select": {
              paddingTop: "6px", // Align the rows per page dropdown
            },
          }}
        />

        {/* Filter Popovers */}
        {/* Date Filter */}
        <Popover
          open={Boolean(filterAnchors["date"])}
          anchorEl={filterAnchors["date"]}
          onClose={() => handleFilterClose("date")}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
        >
          <Box sx={{ p: 2, minWidth: 200 }}>
            <FormControl fullWidth>
              <InputLabel>Filter Type</InputLabel>
              <Select
                value={filters.date.type || ""}
                onChange={(e) =>
                  handleDateFilterChange(e.target.value as DateFilterType)
                }
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="before">Before</MenuItem>
                <MenuItem value="after">After</MenuItem>
                <MenuItem value="between">Between</MenuItem>
                <MenuItem value="last7">Last 7 days</MenuItem>
                <MenuItem value="last30">Last 30 days</MenuItem>
                <MenuItem value="last90">Last 90 days</MenuItem>
              </Select>
            </FormControl>
            {filters.date.type === "before" && (
              <TextField
                type="date"
                fullWidth
                margin="normal"
                value={filters.date.endDate?.toISOString().split("T")[0] || ""}
                onChange={(e) =>
                  handleDateFilterChange(
                    "before",
                    undefined,
                    new Date(e.target.value)
                  )
                }
              />
            )}
            {filters.date.type === "after" && (
              <TextField
                type="date"
                fullWidth
                margin="normal"
                value={
                  filters.date.startDate?.toISOString().split("T")[0] || ""
                }
                onChange={(e) =>
                  handleDateFilterChange("after", new Date(e.target.value))
                }
              />
            )}
            {filters.date.type === "between" && (
              <>
                <TextField
                  type="date"
                  fullWidth
                  margin="normal"
                  label="Start Date"
                  value={
                    filters.date.startDate?.toISOString().split("T")[0] || ""
                  }
                  onChange={(e) =>
                    handleDateFilterChange(
                      "between",
                      new Date(e.target.value),
                      filters.date.endDate
                    )
                  }
                />
                <TextField
                  type="date"
                  fullWidth
                  margin="normal"
                  label="End Date"
                  value={
                    filters.date.endDate?.toISOString().split("T")[0] || ""
                  }
                  onChange={(e) =>
                    handleDateFilterChange(
                      "between",
                      filters.date.startDate,
                      new Date(e.target.value)
                    )
                  }
                />
              </>
            )}
          </Box>
        </Popover>

        {/* Dropdown Filters */}
        {["club", "stakes", "type", "status"].map((columnId) => (
          <Popover
            key={columnId}
            open={Boolean(filterAnchors[columnId])}
            anchorEl={filterAnchors[columnId]}
            onClose={() => handleFilterClose(columnId)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
          >
            <Box sx={{ p: 2, minWidth: 200 }}>
              <FormControl fullWidth>
                <InputLabel>
                  {columnId.charAt(0).toUpperCase() + columnId.slice(1)}
                </InputLabel>
                <Select
                  multiple
                  value={
                    (filters[columnId as keyof Filters] as DropdownFilter)
                      ?.selectedValues
                  }
                  onChange={handleDropdownFilterChange(
                    columnId as keyof Filters
                  )}
                  input={
                    <OutlinedInput
                      label={
                        columnId.charAt(0).toUpperCase() + columnId.slice(1)
                      }
                    />
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value: string) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {(columnId === "club"
                    ? availableClubs
                    : columnId === "stakes"
                    ? availableStakes
                    : columnId === "type"
                    ? availableTypes
                    : availableStatuses
                  ).map((option) => (
                    <MenuItem key={option} value={option}>
                      <Checkbox
                        checked={
                          (
                            filters[columnId as keyof Filters] as DropdownFilter
                          )?.selectedValues.indexOf(option) > -1
                        }
                      />
                      <ListItemText primary={option} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Popover>
        ))}

        {/* Numeric Filters */}
        {[
          "players",
          "playTime",
          "hands",
          "buyins",
          "totalBuyins",
          "finalStack",
          "profitLoss",
          "bbProfitLoss",
        ].map((columnId) => (
          <Popover
            key={columnId}
            open={Boolean(filterAnchors[columnId])}
            anchorEl={filterAnchors[columnId]}
            onClose={() => handleFilterClose(columnId)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
          >
            <Box sx={{ p: 2, minWidth: 200 }}>
              <FormControl fullWidth>
                <InputLabel>Operator</InputLabel>
                <Select
                  value={
                    (filters[columnId as keyof Filters] as NumericFilter)
                      ?.operator || ""
                  }
                  onChange={(e) =>
                    handleNumericFilterChange(columnId as keyof Filters)(
                      e.target.value as NumericFilterOperator,
                      (filters[columnId as keyof Filters] as NumericFilter)
                        ?.value || 0
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
              {(filters[columnId as keyof Filters] as NumericFilter)
                ?.operator && (
                <TextField
                  type="number"
                  fullWidth
                  margin="normal"
                  value={
                    (filters[columnId as keyof Filters] as NumericFilter)
                      ?.value || ""
                  }
                  onChange={(e) =>
                    handleNumericFilterChange(columnId as keyof Filters)(
                      (filters[columnId as keyof Filters] as NumericFilter)
                        ?.operator as NumericFilterOperator,
                      parseFloat(e.target.value)
                    )
                  }
                />
              )}
            </Box>
          </Popover>
        ))}

        {/* Rating Filter */}
        {["rating"].map((columnId) => (
          <Popover
            key={columnId}
            open={Boolean(filterAnchors[columnId])}
            anchorEl={filterAnchors[columnId]}
            onClose={() => handleFilterClose(columnId)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
          >
            <Box sx={{ p: 2, minWidth: 200 }}>
              <FormControl fullWidth>
                <InputLabel>Filter Type</InputLabel>
                <Select
                  value={filters.rating?.operator || ""}
                  onChange={(e) => {
                    const operator = e.target.value as RatingFilterOperator;
                    if (operator === "isEmpty" || operator === "isNotEmpty") {
                      handleRatingFilterChange(operator);
                    } else {
                      handleRatingFilterChange(
                        operator,
                        filters.rating?.value || 5
                      );
                    }
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="equals">==</MenuItem>
                  <MenuItem value="greaterThan">&gt;</MenuItem>
                  <MenuItem value="greaterThanOrEqual">≥</MenuItem>
                  <MenuItem value="lessThan">&lt;</MenuItem>
                  <MenuItem value="lessThanOrEqual">≤</MenuItem>
                  <MenuItem value="isEmpty">is empty (no rating)</MenuItem>
                  <MenuItem value="isNotEmpty">is not empty (rated)</MenuItem>
                </Select>
              </FormControl>

              {filters.rating?.operator &&
                !["isEmpty", "isNotEmpty"].includes(
                  filters.rating.operator
                ) && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Rating Value</InputLabel>
                    <Select
                      value={filters.rating.value || 5}
                      onChange={(e) =>
                        handleRatingFilterChange(
                          filters.rating!.operator as RatingFilterOperator,
                          e.target.value as number
                        )
                      }
                    >
                      {Object.entries(RATING_EMOJIS).map(([value, emoji]) => (
                        <MenuItem key={value} value={Number(value)}>
                          {emoji} {RATING_LABELS[Number(value) as RatingValue]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
            </Box>
          </Popover>
        ))}

        <ManualSessionForm
          open={showManualForm}
          onClose={handleManualFormClose}
          initialData={selectedManualSession}
          onSubmit={() => {
            setRefreshTrigger((prev) => prev + 1);
          }}
          playerId={playerId!}
        />

        <SessionRatingDialog
          open={ratingDialogOpen}
          onClose={() => setRatingDialogOpen(false)}
          onSave={(rating) =>
            handleRatingSave(selectedSessionForRating?.id || "", rating)
          }
          onDelete={handleRatingDelete}
          initialRating={selectedSessionForRating?.rating}
        />
      </Paper>
    </Container>
  );
}

export default MySessions;
