import React from "react";
import { Typography, List, ListItem, ListItemText } from "@mui/material";
import { Player, Transaction } from "../types/types";
import { formatMoney } from "../utils/formatters";

interface TransactionListProps {
  players: Player[];
}

function TransactionList({ players }: TransactionListProps) {
  const calculateTransactions = (players: Player[]): Transaction[] => {
    const playersWithResults = players
      .filter((player) => player.cashout !== null)
      .map((player) => ({
        id: player.id,
        name: player.name,
        balance:
          player.cashout! -
          player.buyins.reduce((sum, buyin) => sum + buyin.amount, 0),
      }));

    const transactions: Transaction[] = [];

    const winners = playersWithResults
      .filter((player) => player.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    const losers = playersWithResults
      .filter((player) => player.balance < 0)
      .sort((a, b) => a.balance - b.balance);

    losers.forEach((loser) => {
      let remainingDebt = Math.abs(loser.balance);

      winners.forEach((winner) => {
        if (remainingDebt > 0 && winner.balance > 0) {
          const amount = Math.min(remainingDebt, winner.balance);
          if (amount > 0) {
            transactions.push({
              from: loser.name,
              to: winner.name,
              amount: +amount.toFixed(2),
            });
            remainingDebt = +(remainingDebt - amount).toFixed(2);
            winner.balance = +(winner.balance - amount).toFixed(2);
          }
        }
      });
    });

    return transactions;
  };

  const calculatePayBoxTransactions = (players: Player[]): Transaction[] => {
    const transactions: Transaction[] = [];
    
    players
      .filter((player) => player.cashout !== null)
      .forEach((player) => {
        const payBoxAmount = player.buyins
          .filter((buyin) => buyin.isPayBox)
          .reduce((sum, buyin) => sum + buyin.amount, 0);
          
        if (payBoxAmount > 0) {
          transactions.push({
            from: "PayBox",
            to: player.name,
            amount: payBoxAmount,
          });
        }
      });
      
    return transactions;
  };

  const allCashedOut = players
    .filter((player) => player.buyins.length > 0)
    .every((player) => player.cashout !== null);

  const transactions = [
    ...calculateTransactions(players),
    ...calculatePayBoxTransactions(players),
  ];

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
              secondary={`${formatMoney(transaction.amount)}`}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
}

export default TransactionList;
