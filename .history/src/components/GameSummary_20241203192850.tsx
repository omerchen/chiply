import React from "react";
import { Typography, List, ListItem, ListItemText } from "@mui/material";
import { Player } from "../types/types";
import { formatMoney } from "../utils/formatters";

interface GameSummaryProps {
  players: Player[];
}

function GameSummary({ players }: GameSummaryProps) {
  const allBuyins = players.reduce(
    (sum, player) =>
      sum +
      player.buyins.reduce((playerSum, buyin) => playerSum + buyin.amount, 0),
    0
  );

  const totalCashouts = players
    .filter((player) => player.cashout !== null)
    .reduce((sum, player) => sum + player.cashout!, 0);

  const moneyInPlay = allBuyins - totalCashouts;

  const totalPayBox = players.reduce(
    (sum, player) =>
      sum +
      player.buyins
        .filter((buyin) => buyin.isPayBox)
        .reduce((playerSum, buyin) => playerSum + buyin.amount, 0),
    0
  );

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Game Summary
      </Typography>

      <Typography variant="h6" color="primary" gutterBottom>
        Total Buyins: {formatMoney(allBuyins)}
      </Typography>

      <Typography variant="h6" color="primary">
        Total Money in Play: {formatMoney(moneyInPlay)}
      </Typography>

      {totalPayBox > 0 && (
        <Typography variant="h6" color="primary">
          Total Money in PayBox: {formatMoney(totalPayBox)}
        </Typography>
      )}

      <List>
        {players.map((player) => {
          const playerTotal = player.buyins.reduce(
            (sum, buyin) => sum + buyin.amount,
            0
          );
          return (
            <ListItem key={player.id}>
              <ListItemText
                primary={player.name}
                secondary={`Total Buyins: ₪${formatMoney(playerTotal)}`}
              />
            </ListItem>
          );
        })}
      </List>
    </div>
  );
}

export default GameSummary;
