import React, { useEffect, useState, useRef } from 'react';
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
  TableSortLabel,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import DownloadIcon from "@mui/icons-material/Download";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
  const tableRef = useRef<HTMLDivElement>(null);

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
            const playerBuyins = Object.values(buyins).filter((b: typeof buyins[string]) => b.playerId === playerId);
            const buyinsCount = playerBuyins.length;
            
            // Only add players who have at least one buyin
            if (buyinsCount > 0) {
              const buyinsTotal = playerBuyins.reduce((sum, b: typeof buyins[string]) => sum + b.amount, 0) as number;
              const playerCashout = Object.values(cashouts).find((c: typeof cashouts[string]) => c.playerId === playerId) as typeof cashouts[string] | undefined;
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

  const handleDownloadPDF = async () => {
    if (!tableRef.current) return;

    try {
      // Set temporary styles for better PDF rendering
      const originalStyle = tableRef.current.style.width;
      const originalPosition = tableRef.current.style.position;
      const originalOverflow = tableRef.current.style.overflow;

      // Set styles for capture
      tableRef.current.style.width = "1200px";
      tableRef.current.style.position = "relative";
      tableRef.current.style.left = "50%";
      tableRef.current.style.transform = "translateX(-50%)";
      tableRef.current.style.overflow = "visible";

      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1200,
        width: 1200,
      });

      // Restore original styles
      tableRef.current.style.width = originalStyle;
      tableRef.current.style.position = originalPosition;
      tableRef.current.style.left = "";
      tableRef.current.style.transform = "";
      tableRef.current.style.overflow = originalOverflow;

      // Use landscape by default for better table fit
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate dimensions to fit the page with margins
      const margins = 10;
      const maxWidth = pageWidth - (2 * margins);
      const maxHeight = pageHeight - (2 * margins);

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
      const currentDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
      pdf.save(`${clubName}-session-summary-${currentDate}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
            Session Summary
          </Typography>
          <Tooltip title="Download Summary">
            <IconButton
              onClick={handleDownloadPDF}
              sx={{
                backgroundColor: '#673ab7',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#563098',
                },
                '@media print': {
                  display: 'none'
                },
                boxShadow: 2,
                '&:active': {
                  boxShadow: 1,
                }
              }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <TableContainer ref={tableRef}>
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