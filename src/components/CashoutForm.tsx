import React, { useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Player } from "../types/types";
import { formatMoney } from "../utils/formatters";

interface CashoutFormProps {
  players: Player[];
  onCashout: (playerId: string, amount: number) => void;
  onResetPlayerCashout: (playerId: string) => void;
  onResetAllCashouts: () => void;
  isSessionClosed?: boolean;
}

function CashoutForm({ players, onCashout, onResetPlayerCashout, onResetAllCashouts, isSessionClosed }: CashoutFormProps) {
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayer && amount) {
      onCashout(selectedPlayer, Number(amount));
      setAmount("");
      setSelectedPlayer("");
    }
  };

  // Get players who have at least one buyin
  const playersWithBuyins = players.filter(player => player.buyins && player.buyins.length > 0);
  
  // From those players, get only the ones who haven't cashed out yet
  const eligibleForCashout = playersWithBuyins.filter(player => player.cashout === null);

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Cash Out
      </Typography>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <FormControl fullWidth size="small">
            <InputLabel>Player</InputLabel>
            <Select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              label="Player"
              disabled={isSessionClosed}
            >
              {eligibleForCashout.map((player) => (
                <MenuItem key={player.id} value={player.id}>
                  {player.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            label="Final Amount"
            variant="outlined"
            size="small"
            fullWidth
            inputProps={{ min: "0" }}
            disabled={isSessionClosed}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={!selectedPlayer || !amount || isSessionClosed}
          >
            Record Cashout
          </Button>
        </div>
      </form>

      <List>
        {playersWithBuyins.map((player) => {
          const totalBuyins = player.buyins.reduce(
            (sum, buyin) => sum + buyin.amount,
            0
          );
          const profit =
            player.cashout !== null ? player.cashout - totalBuyins : null;

          return (
            <ListItem key={player.id}>
              <ListItemText
                primary={player.name}
                secondary={
                  player.cashout !== null
                    ? `Buyins: ${formatMoney(totalBuyins)} | Cashout: ${formatMoney(
                        player.cashout
                      )} | ${profit! >= 0 ? "Profit" : "Loss"}: ${formatMoney(Math.abs(
                        profit!
                      ))}`
                    : `Buyins: ${formatMoney(totalBuyins)} | Not cashed out`
                }
              />
              {player.cashout !== null && !isSessionClosed && (
                <Button
                  size="small"
                  onClick={() => onResetPlayerCashout(player.id)}
                  style={{ marginLeft: '8px' }}
                >
                  Reset Cashout
                </Button>
              )}
            </ListItem>
          );
        })}
      </List>
      
      {playersWithBuyins.some(player => player.cashout !== null) && !isSessionClosed && (
        <Button
          variant="outlined"
          color="secondary"
          onClick={onResetAllCashouts}
          style={{ marginTop: '16px' }}
        >
          Reset All Cashouts
        </Button>
      )}
    </div>
  );
}

export default CashoutForm;
