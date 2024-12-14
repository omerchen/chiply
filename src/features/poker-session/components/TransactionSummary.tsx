import React from "react";
import { Typography, List, ListItem, ListItemText } from "@mui/material";
import { Player, Transaction, Buyin } from "../../../types/types";
import { formatMoney } from "../../../utils/formatters";

interface TransactionListProps {
  players: Player[];
}

function TransactionList({ players }: TransactionListProps) {
  const calculateTransactions = (players: Player[]): Transaction[] => {
    const transactions: Transaction[] = [];
    let totalPayboxAmount = players.reduce((sum, player) => {
      return (
        sum +
        player.buyins
          .filter((buyin) => buyin.isPayBox)
          .reduce((sum, buyin) => sum + buyin.amount, 0)
      );
    }, 0);

    let playersProfitAndLoss: { name: string; amount: number }[] = [];
    players.forEach((player) => {
      // Each player will receive his cashout minus any non-paybox transaction he had
      const playerCashout = player.cashout ?? 0;
      const playerNonPayboxTransactions = player.buyins.filter(
        (buyin) => !buyin.isPayBox
      );
      const playerNonPayboxTransactionsAmount =
        playerNonPayboxTransactions.reduce(
          (sum, buyin) => sum + buyin.amount,
          0
        );
      const playerReceiving = playerCashout - playerNonPayboxTransactionsAmount;
      playersProfitAndLoss.push({
        name: player.name,
        amount: playerReceiving,
      });
    });

    let remainingPlusPlayers: { name: string; amount: number }[] = [
      ...playersProfitAndLoss.filter((player) => player.amount > 0),
    ];

    let remainingMinusPlayers: { name: string; amount: number }[] = [
      ...playersProfitAndLoss
        .filter((player) => player.amount < 0)
        .map((player) => ({
          name: player.name,
          amount: -1 * player.amount,
        })),
    ];

    console.log(playersProfitAndLoss);
    console.log(remainingMinusPlayers);
    console.log(remainingPlusPlayers);
    console.log(totalPayboxAmount);

    while (
      remainingMinusPlayers.length > 0 &&
      remainingPlusPlayers.length > 0
    ) {
      // Find the player with the largest amount
      const currentBiggestMinusPlayer = remainingMinusPlayers.reduce(
        (biggest, player) =>
          player.amount > biggest.amount ? player : biggest,
        remainingMinusPlayers[0]
      );

      const currentBiggestPlusPlayer = remainingPlusPlayers.reduce(
        (biggest, player) =>
          player.amount > biggest.amount ? player : biggest,
        remainingPlusPlayers[0]
      );

      const transactionAmount = Math.min(
        currentBiggestMinusPlayer.amount,
        currentBiggestPlusPlayer.amount
      );

      // Create a transaction
      transactions.push({
        from: currentBiggestMinusPlayer.name,
        to: currentBiggestPlusPlayer.name,
        amount: transactionAmount,
      });

      // Update the remaining players
      currentBiggestMinusPlayer.amount -= transactionAmount;
      currentBiggestPlusPlayer.amount -= transactionAmount;

      // Filter out the players that have been fully processed
      remainingMinusPlayers = remainingMinusPlayers.filter(
        (player) => player.amount > 0
      );
      remainingPlusPlayers = remainingPlusPlayers.filter(
        (player) => player.amount > 0
      );
    }

    while (remainingPlusPlayers.length > 0 && totalPayboxAmount > 0) {
      const currentBiggestPlusPlayer = remainingPlusPlayers.reduce(
        (biggest, player) =>
          player.amount > biggest.amount ? player : biggest,
        remainingPlusPlayers[0]
      );

      const transactionAmount = currentBiggestPlusPlayer.amount;

      transactions.push({
        from: "PayBox",
        to: currentBiggestPlusPlayer.name,
        amount: transactionAmount,
      });

      // Update the remaining players
      remainingPlusPlayers = remainingPlusPlayers.map((player) => ({
        ...player,
        amount:
          player.name === currentBiggestPlusPlayer.name ? 0 : player.amount,
      }));
      totalPayboxAmount -= transactionAmount;

      console.log("before", remainingPlusPlayers);

      remainingPlusPlayers = remainingPlusPlayers.filter(
        (player) => player.amount > 0
      );

      console.log("after", remainingPlusPlayers);
    }

    return transactions;
  };

  const allCashedOut = players
    .filter((player) => player.buyins.length > 0)
    .every((player) => player.cashout !== null);

  const transactions = [...calculateTransactions(players)];

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Required Transactions
      </Typography>

      {!allCashedOut && (
        <Typography color="text.secondary">
          Waiting for all players to cash out...
        </Typography>
      )}

      {allCashedOut && transactions.length === 0 && (
        <Typography color="text.secondary">No transactions needed</Typography>
      )}

      <List>
        {transactions.map((transaction, index) => (
          <ListItem key={index} className="transaction-item">
            <ListItemText
              primary={`${transaction.from} → ${transaction.to}`}
              secondary={`₪${formatMoney(transaction.amount)}`}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
}

export default TransactionList;
