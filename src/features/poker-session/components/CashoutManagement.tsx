import React, { useState } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  FormControlLabel,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Switch,
} from "@mui/material";
import { Player, SessionDetails } from "../../../types/types";
import { formatMoney } from "../../../utils/formatters";

interface CashoutFormProps {
  players: Player[];
  session?: SessionDetails;
  onCashout: (playerId: string, amount: number) => void;
  onResetPlayerCashout: (playerId: string) => void;
  onResetAllCashouts: () => void;
  isSessionClosed?: boolean;
}

function CashoutForm({
  players,
  session,
  onCashout,
  onResetPlayerCashout,
  onResetAllCashouts,
  isSessionClosed,
}: CashoutFormProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [amount, setAmount] = useState("");
  const [stackValue, setStackValue] = useState("");
  const [isMiscalculation, setIsMiscalculation] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetAllDialogOpen, setResetAllDialogOpen] = useState(false);
  const [playerToReset, setPlayerToReset] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [confirmationName, setConfirmationName] = useState("");
  const [confirmationDeleteAll, setConfirmationDeleteAll] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || !amount) return;

    const cashoutAmount = parseFloat(amount);
    if (isNaN(cashoutAmount)) return;

    if (isMiscalculation) {
      const stackValueNum = parseFloat(stackValue);
      if (isNaN(stackValueNum)) return;
      onCashout(selectedPlayerId, cashoutAmount);
    } else {
      // If not miscalculation, use the same value for both stack and cashout
      onCashout(selectedPlayerId, cashoutAmount);
    }

    setSelectedPlayerId("");
    setAmount("");
    setStackValue("");
    setIsMiscalculation(false);
  };

  const handleResetPlayerCashout = (playerId: string, playerName: string) => {
    setPlayerToReset({ id: playerId, name: playerName });
    setResetDialogOpen(true);
  };

  const handleConfirmResetPlayer = () => {
    if (!playerToReset) return;
    onResetPlayerCashout(playerToReset.id);
    setResetDialogOpen(false);
    setPlayerToReset(null);
  };

  const handleResetAllCashouts = () => {
    setResetAllDialogOpen(true);
  };

  const handleConfirmResetAll = () => {
    onResetAllCashouts();
    handleCloseResetAllDialog();
  };

  const handleCloseResetDialog = () => {
    setResetDialogOpen(false);
    setConfirmationName("");
    setPlayerToReset(null);
  };

  const handleCloseResetAllDialog = () => {
    setResetAllDialogOpen(false);
    setConfirmationDeleteAll("");
  };

  const playersWithBuyins = players.filter(
    (player) => player.buyins.length > 0
  );

  return (
    <div>
      <form onSubmit={handleSubmit} className="form-row">
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 1.5, sm: 2 }} 
          sx={{ 
            mb: 3,
            width: '100%',
            px: { xs: 0.5, sm: 0 }
          }}
        >
          <FormControl sx={{ minWidth: { sm: 200 }, width: { xs: '100%', sm: 'auto' } }} size="small">
            <InputLabel>Player</InputLabel>
            <Select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              label="Player"
              disabled={isSessionClosed}
            >
              {players
                .filter((player) => {
                  const playerCashout = Object.values(session?.data?.cashouts || {})
                    .find((cashout) => cashout.playerId === player.id);
                  return !playerCashout;
                })
                .map((player) => (
                  <MenuItem key={player.id} value={player.id}>
                    {player.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <TextField
            type="number"
            label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            size="small"
            inputProps={{ step: "0.5" }}
            disabled={isSessionClosed}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          />

          {isMiscalculation && (
            <TextField
              type="number"
              label="Stack Value"
              value={stackValue}
              onChange={(e) => setStackValue(e.target.value)}
              size="small"
              inputProps={{ step: "0.5" }}
              disabled={isSessionClosed}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            />
          )}

          <FormControlLabel
            control={
              <Switch
                checked={isMiscalculation}
                onChange={(e) => setIsMiscalculation(e.target.checked)}
                disabled={isSessionClosed}
              />
            }
            label="Miscalculation"
            sx={{ 
              mx: { xs: 0, sm: 1 },
              width: { xs: '100%', sm: 'auto' }
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={!selectedPlayerId || !amount || isSessionClosed}
            fullWidth
            sx={{
              bgcolor: '#673ab7',
              '&:hover': { bgcolor: '#563098' },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Add Cashout
          </Button>
        </Stack>
      </form>

      <List sx={{ 
        width: '100%',
        mx: { xs: -1.5, sm: 0 },
        px: { xs: 1.5, sm: 0 },
        '& .MuiListItem-root': {
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1, sm: 0 },
          py: { xs: 2, sm: 1 },
          px: { xs: 0, sm: 1 }
        },
        '& .MuiListItemText-root': {
          my: { xs: 0, sm: 1 }
        }
      }}>
        {players.map((player) => {
          const totalBuyins = player.buyins.reduce(
            (sum, buyin) => sum + buyin.amount,
            0
          );
          const playerCashout = Object.values(
            session?.data?.cashouts || {}
          ).find((cashout) => cashout.playerId === player.id);
          const profit = playerCashout
            ? playerCashout.cashout - totalBuyins
            : null;

          return (
            <ListItem key={player.id}>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {player.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {playerCashout
                      ? `Buyins: ₪${formatMoney(totalBuyins)} | Cashout: ₪${formatMoney(
                          playerCashout.cashout
                        )}${
                          profit !== null
                            ? ` | ${profit >= 0 ? "Profit" : "Loss"}: ₪${formatMoney(
                                Math.abs(profit)
                              )}`
                            : ""
                        }`
                      : `Buyins: ₪${formatMoney(totalBuyins)} | Not cashed out`}
                  </Typography>
                }
              />
              {playerCashout && (
                <Button
                  size="small"
                  onClick={() => handleResetPlayerCashout(player.id, player.name)}
                  variant="contained"
                  disableElevation
                  disabled={isSessionClosed}
                  sx={{
                    ml: { xs: 0, sm: 1 },
                    width: { xs: '100%', sm: 'auto' },
                    textTransform: "none",
                    backgroundColor: "rgb(211, 47, 47) !important",
                    "&:hover": {
                      backgroundColor: "rgb(154, 0, 7) !important",
                    },
                  }}
                >
                  Reset Cashout
                </Button>
              )}
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ 
        mt: 2,
        px: { xs: 0.5, sm: 0 }
      }}>
        <Button
          onClick={handleResetAllCashouts}
          variant="contained"
          disableElevation
          disabled={isSessionClosed}
          fullWidth
          sx={{
            width: { xs: '100%', sm: 'auto' },
            textTransform: "none",
            backgroundColor: "rgb(211, 47, 47) !important",
            "&:hover": {
              backgroundColor: "rgb(154, 0, 7) !important",
            },
          }}
        >
          Reset All Cashouts
        </Button>
      </Box>

      <Dialog open={resetDialogOpen} onClose={handleCloseResetDialog}>
        <DialogTitle>Confirm Reset Cashout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset the cashout for {playerToReset?.name}
            ? This action cannot be undone. To confirm, please type the player's
            name below:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            value={confirmationName}
            onChange={(e) => setConfirmationName(e.target.value)}
            placeholder={`Type "${playerToReset?.name}" to confirm`}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmResetPlayer}
            variant="contained"
            disableElevation
            disabled={confirmationName !== playerToReset?.name}
            sx={{
              textTransform: "none",
              backgroundColor: "rgb(211, 47, 47) !important",
              "&:hover": {
                backgroundColor: "rgb(154, 0, 7) !important",
              },
              "&.Mui-disabled": {
                backgroundColor: "rgba(211, 47, 47, 0.5) !important",
              },
            }}
          >
            Reset Cashout
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resetAllDialogOpen} onClose={handleCloseResetAllDialog}>
        <DialogTitle>Confirm Reset All Cashouts</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset all cashouts? This action cannot be
            undone. To confirm, please type "DELETE ALL" below:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            value={confirmationDeleteAll}
            onChange={(e) => setConfirmationDeleteAll(e.target.value)}
            placeholder='Type "DELETE ALL" to confirm'
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetAllDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmResetAll}
            variant="contained"
            disableElevation
            disabled={confirmationDeleteAll !== "DELETE ALL"}
            sx={{
              textTransform: "none",
              backgroundColor: "rgb(211, 47, 47) !important",
              "&:hover": {
                backgroundColor: "rgb(154, 0, 7) !important",
              },
              "&.Mui-disabled": {
                backgroundColor: "rgba(211, 47, 47, 0.5) !important",
              },
            }}
          >
            Reset All Cashouts
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default CashoutForm;
