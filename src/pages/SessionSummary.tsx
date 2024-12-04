import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel
} from '@mui/material';
import { readData } from '../services/database';
import ClubBreadcrumbs from '../components/ClubBreadcrumbs';
import { formatMoney } from '../utils/formatters';

interface SessionData {
  buyins: {
    [key: string]: {
      playerId: string;
      time: number;
      amount: number;
      isPaybox: boolean;
    };
  };
  cashouts: {
    [key: string]: {
      playerId: string;
      time: number;
      cashout: number;
      stackValue: number;
    };
  };
}

interface SessionDetails {
  id: string;
  clubId: string;
  details: {
    type: string;
    startTime: number;
    stakes: {
      bigBlind: number;
      smallBlind: number;
      ante?: number;
    };
  };
  status: string;
  data: SessionData;
}

interface PlayerSummary {
  id: string;
  name: string;
  buyinsCount: number;
  buyinsTotal: number;
  stackValue: number;
  profit: number;
  rank: number;
}

type Order = 'asc' | 'desc';

function calculateRank(players: PlayerSummary[]): PlayerSummary[] {
  // Sort by profit in descending order
  const sortedPlayers = [...players].sort((a, b) => b.profit - a.profit);
  
  let currentRank = 1;
  let currentProfit = sortedPlayers[0]?.profit;
  
  return sortedPlayers.map((player, index) => {
    if (player.profit < currentProfit) {
      currentRank = index + 1;
      currentProfit = player.profit;
    }
    return { ...player, rank: currentRank };
  });
}

function SessionSummary() {
  const { clubId, sessionId } = useParams<{ clubId: string; sessionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clubName, setClubName] = useState("");
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof PlayerSummary>('rank');
  const [playerSummaries, setPlayerSummaries] = useState<PlayerSummary[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!clubId || !sessionId) {
        setError("Invalid club or session ID");
        setLoading(false);
        return;
      }

      try {
        const [clubData, sessionData] = await Promise.all([
          readData(`clubs/${clubId}`),
          readData(`sessions/${sessionId}`),
        ]);

        if (!clubData || !sessionData) {
          setError("Session or club not found");
          setLoading(false);
          return;
        }

        setClubName(clubData.name || "");
        setSession(sessionData);

        if (clubData && sessionData) {
          // Fetch all players data at once
          const playersData = await readData('players');
          
          const summaries: PlayerSummary[] = [];
          const players = sessionData.data?.players || {};
          const buyins = sessionData.data?.buyins || {};
          const cashouts = sessionData.data?.cashouts || {};

          // Calculate summaries for each player
          Object.entries(players).forEach(([playerId]) => {
            const playerBuyins = Object.values(buyins).filter(b => b.playerId === playerId);
            const buyinsCount = playerBuyins.length;
            
            // Only add players who have at least one buyin
            if (buyinsCount > 0) {
              const buyinsTotal = playerBuyins.reduce((sum, b) => sum + b.amount, 0);
              const playerCashout = Object.values(cashouts).find(c => c.playerId === playerId);
              const stackValue = playerCashout?.stackValue ?? playerCashout?.cashout ?? 0;
              const profit = stackValue - buyinsTotal;

              const playerData = playersData[playerId];
              const playerName = playerData ? `${playerData.firstName} ${playerData.lastName}` : "Unknown Player";

              summaries.push({
                id: playerId,
                name: playerName,
                buyinsCount,
                buyinsTotal,
                stackValue,
                profit,
                rank: 0
              });
            }
          });

          const rankedSummaries = calculateRank(summaries);
          setPlayerSummaries(rankedSummaries);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error loading session data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clubId, sessionId]);

  const handleSort = (property: keyof PlayerSummary) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedPlayers = React.useMemo(() => {
    const comparator = (a: PlayerSummary, b: PlayerSummary) => {
      if (b[orderBy] < a[orderBy]) return order === 'asc' ? 1 : -1;
      if (b[orderBy] > a[orderBy]) return order === 'asc' ? -1 : 1;
      return 0;
    };

    return [...playerSummaries].sort(comparator);
  }, [playerSummaries, order, orderBy]);

  const getSessionName = () => {
    return "Session";
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

  if (error || !session) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
        <Typography color="error" variant="h6">
          {error || "Session not found"}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
      <ClubBreadcrumbs
        clubId={clubId!}
        clubName={clubName}
        currentPage="Summary"
        parentPages={[
          {
            name: "All Sessions",
            path: "sessions"
          },
          {
            name: getSessionName(),
            path: `sessions/${sessionId}`
          }
        ]}
      />
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Session Summary
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'rank'}
                    direction={orderBy === 'rank' ? order : 'asc'}
                    onClick={() => handleSort('rank')}
                  >
                    Rank
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Player
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'buyinsCount'}
                    direction={orderBy === 'buyinsCount' ? order : 'asc'}
                    onClick={() => handleSort('buyinsCount')}
                  >
                    Buyins (Count)
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'buyinsTotal'}
                    direction={orderBy === 'buyinsTotal' ? order : 'asc'}
                    onClick={() => handleSort('buyinsTotal')}
                  >
                    Buyins (Total)
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'stackValue'}
                    direction={orderBy === 'stackValue' ? order : 'asc'}
                    onClick={() => handleSort('stackValue')}
                  >
                    Final Stack
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'profit'}
                    direction={orderBy === 'profit' ? order : 'asc'}
                    onClick={() => handleSort('profit')}
                  >
                    Profit
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>{player.rank}{player.rank === 1 && " 👑"}</TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell>{player.buyinsCount}</TableCell>
                  <TableCell>₪{formatMoney(player.buyinsTotal)}</TableCell>
                  <TableCell>₪{formatMoney(player.stackValue)}</TableCell>
                  <TableCell
                    sx={{ 
                      color: player.profit > 0 ? 'success.main' : (player.profit < 0 ? 'error.main' : 'text.secondary'),
                      fontWeight: 'bold'
                    }}
                  >
                    ₪{formatMoney(Math.abs(player.profit))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}

export default SessionSummary; 