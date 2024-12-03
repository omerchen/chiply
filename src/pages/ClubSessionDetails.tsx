import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  Container,
  Paper,
  Typography,
  CircularProgress,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { readData, updateData } from '../services/database';
import ClubBreadcrumbs from '../components/ClubBreadcrumbs';
import PlayerList from '../features/poker-session/components/PlayerManagement';
import BuyinForm from '../features/poker-session/components/BuyinManagement';
import CashoutForm from '../features/poker-session/components/CashoutManagement';
import GameSummary from '../features/poker-session/components/SessionSummary';
import TransactionList from '../features/poker-session/components/TransactionSummary';
import { Player } from '../types/types';

interface SessionData {
  players: {
    [key: string]: {
      addedAt: number;
    };
  };
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
      stackValue: number;
      cashout: number;
      time: number;
    };
  };
  transactions: {
    [key: string]: {
      from: string;
      to: string;
      amount: number;
      status: 'waiting' | 'done';
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
  status: "open" | "close";
  data: SessionData;
}

interface ClubPlayer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

function ClubSessionDetails() {
  const { clubId, sessionId } = useParams<{ clubId: string; sessionId: string }>();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [clubName, setClubName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [clubPlayers, setClubPlayers] = useState<ClubPlayer[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetAllDialogOpen, setResetAllDialogOpen] = useState(false);
  const [playerToReset, setPlayerToReset] = useState<{ id: string, name: string } | null>(null);
  const [deletePlayerDialogOpen, setDeletePlayerDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<{ id: string, name: string } | null>(null);
  const [deleteBuyinDialogOpen, setDeleteBuyinDialogOpen] = useState(false);
  const [buyinToDelete, setBuyinToDelete] = useState<{ 
    playerId: string, 
    buyinId: string, 
    playerName: string,
    amount: number 
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data for club:', clubId, 'session:', sessionId);
        const [sessionData, clubData, clubPlayersData] = await Promise.all([
          readData(`sessions/${sessionId}`),
          readData(`clubs/${clubId}`),
          readData('players')
        ]);
        
        // Initialize session data structure if it doesn't exist
        const initializedSessionData = {
          ...sessionData,
          data: sessionData.data || {
            players: {},
            buyins: {},
            cashouts: {},
            transactions: {}
          }
        };
        
        setSession(initializedSessionData);
        setClubName(clubData.name || '');
        
        // Get the club's player IDs
        const clubPlayerIds = clubData.players ? Object.keys(clubData.players) : [];
        console.log('Club player IDs:', clubPlayerIds);
        
        // Filter and map players that belong to the club
        const playersArray = clubPlayersData ? 
          Object.entries(clubPlayersData)
            .filter(([id]) => clubPlayerIds.includes(id))
            .map(([id, data]: [string, any]) => ({
              id,
              ...data
            })) : [];
        console.log('Processed club players:', playersArray);
        setClubPlayers(playersArray);
      } catch (error) {
        console.error('Error fetching session details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clubId, sessionId]);

  // Sync session data with players state
  useEffect(() => {
    if (!session?.data) return;

    const syncedPlayers: Player[] = [];
    const { players: sessionPlayers = {}, buyins = {}, cashouts = {} } = session.data;

    // Create player objects from session data
    Object.entries(sessionPlayers).forEach(([playerId, playerData]) => {
      const clubPlayer = clubPlayers.find(p => p.id === playerId);
      if (!clubPlayer) return;

      const playerBuyins = Object.entries(buyins)
        .filter(([_, buyin]) => buyin.playerId === playerId)
        .map(([buyinId, buyin]) => ({
          id: buyinId,
          amount: buyin.amount,
          timestamp: buyin.time,
          isPayBox: buyin.isPaybox
        }));

      const playerCashout = Object.values(cashouts)
        .find(cashout => cashout.playerId === playerId);
      
      syncedPlayers.push({
        id: playerId,
        name: `${clubPlayer.firstName} ${clubPlayer.lastName}`,
        buyins: playerBuyins,
        cashout: playerCashout ? playerCashout.cashout : null
      });
    });

    setPlayers(syncedPlayers);
  }, [session?.data, clubPlayers]);

  const addPlayer = async () => {
    if (!selectedPlayerId || !session) return;
    
    const clubPlayer = clubPlayers.find(p => p.id === selectedPlayerId);
    if (!clubPlayer) return;

    const playerExists = players.some(p => p.id === selectedPlayerId);
    if (playerExists) return;

    try {
      const playerData = {
        addedAt: Date.now()
      };

      await updateData(`sessions/${sessionId}/data/players/${selectedPlayerId}`, playerData);
      
      // Update local state only after successful DB update
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            players: {
              ...prev.data.players,
              [selectedPlayerId]: playerData
            }
          }
        };
      });
      
      setSelectedPlayerId('');
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    setPlayerToDelete({ id: playerId, name: player.name });
    setDeletePlayerDialogOpen(true);
  };

  const handleConfirmDeletePlayer = async () => {
    if (!playerToDelete || !session) return;

    try {
      // Create an update object to remove the player
      const updates: { [key: string]: null } = {
        [`sessions/${sessionId}/data/players/${playerToDelete.id}`]: null
      };

      // Also remove any buyins associated with this player
      Object.entries(session.data.buyins || {}).forEach(([buyinId, buyin]) => {
        if (buyin.playerId === playerToDelete.id) {
          updates[`sessions/${sessionId}/data/buyins/${buyinId}`] = null;
        }
      });

      // Also remove any cashouts associated with this player
      Object.entries(session.data.cashouts || {}).forEach(([cashoutId, cashout]) => {
        if (cashout.playerId === playerToDelete.id) {
          updates[`sessions/${sessionId}/data/cashouts/${cashoutId}`] = null;
        }
      });

      // Delete all in one batch
      await updateData('/', updates);
      
      // Update local state only after successful DB update
      setSession(prev => {
        if (!prev) return prev;
        
        // Remove player and their associated data
        const { [playerToDelete.id]: _, ...remainingPlayers } = prev.data.players;
        const remainingBuyins = Object.fromEntries(
          Object.entries(prev.data.buyins || {})
            .filter(([_, buyin]) => buyin.playerId !== playerToDelete.id)
        );
        const remainingCashouts = Object.fromEntries(
          Object.entries(prev.data.cashouts || {})
            .filter(([_, cashout]) => cashout.playerId !== playerToDelete.id)
        );

        return {
          ...prev,
          data: {
            ...prev.data,
            players: remainingPlayers,
            buyins: remainingBuyins,
            cashouts: remainingCashouts
          }
        };
      });

      setDeletePlayerDialogOpen(false);
      setPlayerToDelete(null);
    } catch (error) {
      console.error('Error removing player:', error);
    }
  };

  const addBuyin = async (playerId: string, amount: number, isPayBox: boolean) => {
    if (!session) return;

    try {
      const buyinId = uuidv4();
      const buyinData = {
        playerId,
        time: Date.now(),
        amount,
        isPaybox: isPayBox
      };

      await updateData(`sessions/${sessionId}/data/buyins/${buyinId}`, buyinData);
      
      // Update local state only after successful DB update
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            buyins: {
              ...prev.data.buyins,
              [buyinId]: buyinData
            }
          }
        };
      });
    } catch (error) {
      console.error('Error adding buyin:', error);
    }
  };

  const handleRemoveBuyin = (playerId: string, buyinId: string) => {
    if (!session) return;

    const player = players.find(p => p.id === playerId);
    const buyin = session.data.buyins[buyinId];
    if (!player || !buyin) return;

    setBuyinToDelete({ 
      playerId, 
      buyinId, 
      playerName: player.name,
      amount: buyin.amount
    });
    setDeleteBuyinDialogOpen(true);
  };

  const handleConfirmDeleteBuyin = async () => {
    if (!buyinToDelete || !session) return;

    try {
      // Create an update object to remove the buyin
      const updates = {
        [`sessions/${sessionId}/data/buyins/${buyinToDelete.buyinId}`]: null
      };

      // Delete the buyin
      await updateData('/', updates);
      
      // Update local state only after successful DB update
      setSession(prev => {
        if (!prev) return prev;
        const { [buyinToDelete.buyinId]: _, ...remainingBuyins } = prev.data.buyins;
        return {
          ...prev,
          data: {
            ...prev.data,
            buyins: remainingBuyins
          }
        };
      });

      setDeleteBuyinDialogOpen(false);
      setBuyinToDelete(null);
    } catch (error) {
      console.error('Error removing buyin:', error);
    }
  };

  const editBuyin = async (
    playerId: string,
    buyinId: string,
    amount: number,
    timestamp: number,
    isPayBox: boolean
  ) => {
    if (!session) return;

    try {
      const buyinData = {
        playerId,
        time: timestamp,
        amount,
        isPaybox: isPayBox
      };

      await updateData(`sessions/${sessionId}/data/buyins/${buyinId}`, buyinData);
      
      // Update local state only after successful DB update
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            buyins: {
              ...prev.data.buyins,
              [buyinId]: buyinData
            }
          }
        };
      });
    } catch (error) {
      console.error('Error editing buyin:', error);
    }
  };

  const setCashout = async (playerId: string, amount: number, stackValue?: number) => {
    if (!session) return;

    try {
      const cashoutId = uuidv4();
      const cashoutData = {
        playerId,
        stackValue: stackValue ?? amount,
        cashout: amount,
        time: Date.now()
      };

      await updateData(`sessions/${sessionId}/data/cashouts/${cashoutId}`, cashoutData);
      
      // Update local state only after successful DB update
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            cashouts: {
              ...prev.data.cashouts,
              [cashoutId]: cashoutData
            }
          }
        };
      });
    } catch (error) {
      console.error('Error setting cashout:', error);
    }
  };

  const resetPlayerCashout = async (playerId: string) => {
    if (!session) return;

    try {
      // Find the cashout entry for this player
      const cashoutEntry = Object.entries(session.data.cashouts || {})
        .find(([_, cashout]) => cashout.playerId === playerId);

      if (cashoutEntry) {
        const [cashoutId] = cashoutEntry;
        console.log('Resetting cashout for player:', playerId, 'cashoutId:', cashoutId);
        
        // Create an update object with null value
        const updates = {
          [`sessions/${sessionId}/data/cashouts/${cashoutId}`]: null
        };

        // Delete the specific cashout from the database
        await updateData('/', updates);
        
        // Update local state only after successful DB update
        setSession(prev => {
          if (!prev) return prev;
          const { [cashoutId]: _, ...remainingCashouts } = prev.data.cashouts;
          return {
            ...prev,
            data: {
              ...prev.data,
              cashouts: remainingCashouts
            }
          };
        });
      }
    } catch (error) {
      console.error('Error resetting player cashout:', error);
    }
  };

  const resetAllCashouts = async () => {
    if (!session) return;

    try {
      // Delete all cashouts by setting each cashout to null
      const updates: { [key: string]: null } = {};
      Object.keys(session.data.cashouts || {}).forEach(cashoutId => {
        updates[`sessions/${sessionId}/data/cashouts/${cashoutId}`] = null;
      });

      // Update all cashouts to null in one batch
      await updateData('/', updates);
      
      // Update local state only after successful DB update
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            cashouts: {}
          }
        };
      });
    } catch (error) {
      console.error('Error resetting all cashouts:', error);
    }
  };

  const calculateTransactions = async () => {
    if (!session) return;

    // Calculate optimal transactions
    const transactions: { [key: string]: SessionData['transactions'][string] } = {};
    
    // TODO: Implement transaction calculation logic
    // This will need to:
    // 1. Calculate net amounts for each player
    // 2. Generate optimal transactions to settle all debts
    // 3. Create transaction objects with status "waiting"

    try {
      await updateData(`sessions/${sessionId}/data/transactions`, transactions);
      
      // Update local state only after successful DB update
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            transactions
          }
        };
      });
    } catch (error) {
      console.error('Error calculating transactions:', error);
    }
  };

  const updateTransactionStatus = async (transactionId: string, status: 'waiting' | 'done') => {
    if (!session) return;

    try {
      await updateData(`sessions/${sessionId}/data/transactions/${transactionId}/status`, status);
      
      // Update local state only after successful DB update
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            transactions: {
              ...prev.data.transactions,
              [transactionId]: {
                ...prev.data.transactions[transactionId],
                status
              }
            }
          }
        };
      });
    } catch (error) {
      console.error('Error updating transaction status:', error);
    }
  };

  const handleResetPlayerCashout = async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    setPlayerToReset({ id: playerId, name: player.name });
    setResetDialogOpen(true);
  };

  const handleResetAllCashouts = () => {
    setResetAllDialogOpen(true);
  };

  const handleConfirmResetPlayer = async () => {
    if (!playerToReset) return;
    
    await resetPlayerCashout(playerToReset.id);
    setResetDialogOpen(false);
    setPlayerToReset(null);
  };

  const handleConfirmResetAll = async () => {
    await resetAllCashouts();
    setResetAllDialogOpen(false);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!session) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
        <Typography color="error">Session not found</Typography>
      </Container>
    );
  }

  const availablePlayers = clubPlayers.filter(
    clubPlayer => !Object.keys(session?.data?.players || {}).includes(clubPlayer.id)
  );

  const moneyInPlay = Object.values(session?.data?.buyins || {}).reduce((sum, buyin) => sum + buyin.amount, 0) -
    Object.values(session?.data?.cashouts || {}).reduce((sum, cashout) => sum + cashout.cashout, 0);

  const allPlayersCashedOut = players.every(player => 
    Object.values(session?.data?.cashouts || {})
      .some(cashout => cashout.playerId === player.id && cashout.cashout !== null)
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
      <ClubBreadcrumbs 
        clubId={clubId!} 
        clubName={clubName}
        currentPage="Session Details"
        parentPage={{
          name: "Sessions",
          path: "sessions"
        }}
      />
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Session Details
        </Typography>
        <Typography color="text.secondary">
          Started: {new Date(session.details.startTime).toLocaleString()}
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          Stakes: {session.details.stakes.smallBlind}/{session.details.stakes.bigBlind}
          {session.details.stakes.ante && ` (${session.details.stakes.ante} ante)`}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <FormControl fullWidth size="small">
                    <InputLabel>Add Player</InputLabel>
                    <Select
                      value={selectedPlayerId}
                      onChange={(e) => setSelectedPlayerId(e.target.value)}
                      label="Add Player"
                    >
                      {availablePlayers.map((player) => (
                        <MenuItem key={player.id} value={player.id}>
                          {player.firstName} {player.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    onClick={addPlayer}
                    disabled={!selectedPlayerId}
                    sx={{
                      bgcolor: '#673ab7',
                      '&:hover': { bgcolor: '#563098' }
                    }}
                  >
                    Add Player
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <PlayerList
              players={players}
              onRemovePlayer={handleRemovePlayer}
            />
          </Grid>

          <Grid item xs={12}>
            <BuyinForm
              players={players}
              onBuyin={addBuyin}
              onRemoveBuyin={handleRemoveBuyin}
              onEditBuyin={editBuyin}
            />
          </Grid>

          <Grid item xs={12}>
            <CashoutForm
              players={players}
              session={session}
              onCashout={setCashout}
              onResetPlayerCashout={resetPlayerCashout}
              onResetAllCashouts={resetAllCashouts}
            />
          </Grid>

          <Grid item xs={12}>
            <GameSummary players={players} />
          </Grid>

          {moneyInPlay === 0 && (
            <Grid item xs={12}>
              <TransactionList players={players} />
            </Grid>
          )}

          {moneyInPlay !== 0 && allPlayersCashedOut && (
            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'error.main',
                  color: 'error.contrastText',
                  borderRadius: 1
                }}
              >
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  ⚠️ Money mismatch detected: {moneyInPlay > 0 ? 'Missing' : 'Excess'} ₪{Math.abs(moneyInPlay)}
                </Typography>
                {moneyInPlay > 0 ? (
                  <>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Don't leave money on the table! 🎲 Looks like some chips are still in play.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      The total cashouts are less than the total buyins. Please check if all stacks were counted correctly.
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Whoa there, money printer! 💸 We've got more money than we started with.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      The total cashouts exceed the total buyins. Double-check those stack counts!
                    </Typography>
                  </>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
      >
        <DialogTitle>Confirm Reset Cashout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset the cashout for {playerToReset?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmResetPlayer} 
            color="error"
            variant="contained"
            sx={{
              bgcolor: 'error.main',
              '&:hover': { bgcolor: 'error.dark' },
            }}
          >
            Reset Cashout
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={resetAllDialogOpen}
        onClose={() => setResetAllDialogOpen(false)}
      >
        <DialogTitle>Confirm Reset All Cashouts</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset all cashouts? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetAllDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmResetAll} 
            color="error"
            variant="contained"
            sx={{
              bgcolor: 'error.main',
              '&:hover': { bgcolor: 'error.dark' },
            }}
          >
            Reset All Cashouts
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deletePlayerDialogOpen}
        onClose={() => setDeletePlayerDialogOpen(false)}
      >
        <DialogTitle>Confirm Remove Player</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {playerToDelete?.name} from the session? 
            This will also remove all their buyins and cashouts. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePlayerDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDeletePlayer} 
            color="error"
            variant="contained"
            sx={{
              bgcolor: 'error.main',
              '&:hover': {
                bgcolor: 'error.dark',
              },
            }}
          >
            Remove Player
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteBuyinDialogOpen}
        onClose={() => setDeleteBuyinDialogOpen(false)}
      >
        <DialogTitle>Confirm Remove Buyin</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove the buyin of ₪{buyinToDelete?.amount} from {buyinToDelete?.playerName}? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteBuyinDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDeleteBuyin} 
            color="error"
            variant="contained"
            sx={{
              bgcolor: 'error.main',
              '&:hover': {
                bgcolor: 'error.dark',
              },
            }}
          >
            Remove Buyin
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ClubSessionDetails; 