import React from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Paper,
  Stack,
} from "@mui/material";
import { MonetizationOn, AccountBalance, Savings } from "@mui/icons-material";
import { Player, Buyin } from "../../../types/types";
import { formatMoney } from "../../../utils/formatters";

interface GameSummaryProps {
  players: Player[];
}

function GameSummary({ players }: GameSummaryProps) {
  const allBuyins = players.reduce(
    (sum: number, player) =>
      sum +
      player.buyins.reduce(
        (playerSum: number, buyin: Buyin) => playerSum + buyin.amount,
        0
      ),
    0
  );

  const totalCashouts = players
    .filter((player) => player.cashout !== null)
    .reduce((sum: number, player) => sum + player.cashout!, 0);

  const moneyInPlay = allBuyins - totalCashouts;

  const totalPayBox = players.reduce(
    (sum: number, player) =>
      sum +
      player.buyins
        .filter((buyin: Buyin) => buyin.isPayBox)
        .reduce(
          (playerSum: number, buyin: Buyin) => playerSum + buyin.amount,
          0
        ),
    0
  );

  return (
    <div>
      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 3 }}>
        <Paper elevation={3} sx={{ p: 2, minWidth: 200 }}>
          <Stack spacing={1} alignItems="center">
            <MonetizationOn sx={{ color: '#673ab7' }} />
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="overline" color="text.secondary">
                Total Buyins
              </Typography>
              <Typography variant="h6" sx={{ color: '#673ab7', fontWeight: 700 }}>
                ₪{formatMoney(allBuyins)}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper elevation={3} sx={{ p: 2, minWidth: 200 }}>
          <Stack spacing={1} alignItems="center">
            <AccountBalance sx={{ color: '#673ab7' }} />
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="overline" color="text.secondary">
                Money in Play
              </Typography>
              <Typography variant="h6" sx={{ color: '#673ab7', fontWeight: 700 }}>
                ₪{formatMoney(moneyInPlay)}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {totalPayBox > 0 && (
          <Paper elevation={3} sx={{ p: 2, minWidth: 200 }}>
            <Stack spacing={1} alignItems="center">
              <Savings sx={{ color: '#673ab7' }} />
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="overline" color="text.secondary">
                  PayBox Total
                </Typography>
                <Typography variant="h6" sx={{ color: '#673ab7', fontWeight: 700 }}>
                  ₪{formatMoney(totalPayBox)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}
      </Box>

      <List>
        {players.map((player) => {
          const playerTotal = player.buyins.reduce(
            (sum: number, buyin: Buyin) => sum + buyin.amount,
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
