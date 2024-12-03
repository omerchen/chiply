import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Container, Paper, Typography, Button } from "@mui/material";
import PlayerList from "./components/PlayerList";
import BuyinForm from "./components/BuyinForm";
import CashoutForm from "./components/CashoutForm";
import GameSummary from "./components/GameSummary";
import TransactionList from "./components/TransactionList";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { clearUserFromStorage } from "./services/auth";
import { useNavigate } from "react-router-dom";
import "./styles/main.scss";

function Home() {
  const navigate = useNavigate();
  const [players, setPlayers] = React.useState<Player[]>([]);

  const handleLogout = () => {
    clearUserFromStorage();
    navigate('/login');
  };

  const addPlayer = (name: string) => {
    setPlayers([
      ...players,
      {
        id: crypto.randomUUID(),
        name,
        buyins: [],
        cashout: null,
      },
    ]);
  };

  const addBuyin = (playerId: string, amount: number, isPayBox: boolean) => {
    setPlayers(
      players.map((player) => {
        if (player.id === playerId) {
          return {
            ...player,
            buyins: [
              ...player.buyins,
              {
                id: crypto.randomUUID(),
                amount,
                timestamp: Date.now(),
                isPayBox,
              },
            ],
          };
        }
        return player;
      })
    );
  };

  const setCashout = (playerId: string, amount: number) => {
    setPlayers(
      players.map((player) => {
        if (player.id === playerId) {
          return { ...player, cashout: amount };
        }
        return player;
      })
    );
  };

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter((player) => player.id !== playerId));
  };

  const removeBuyin = (playerId: string, buyinId: string) => {
    setPlayers(
      players.map((player) => {
        if (player.id === playerId) {
          return {
            ...player,
            buyins: player.buyins.filter((buyin) => buyin.id !== buyinId),
          };
        }
        return player;
      })
    );
  };

  const editBuyin = (
    playerId: string,
    buyinId: string,
    amount: number,
    timestamp: number,
    isPayBox: boolean
  ) => {
    setPlayers(
      players.map((player) => {
        if (player.id === playerId) {
          return {
            ...player,
            buyins: player.buyins.map((buyin) =>
              buyin.id === buyinId
                ? { ...buyin, amount, timestamp, isPayBox }
                : buyin
            ),
          };
        }
        return player;
      })
    );
  };

  const resetPlayerCashout = (playerId: string) => {
    setPlayers(
      players.map((player) => {
        if (player.id === playerId) {
          return { ...player, cashout: null };
        }
        return player;
      })
    );
  };

  const resetAllCashouts = () => {
    setPlayers(
      players.map((player) => ({
        ...player,
        cashout: null,
      }))
    );
  };

  return (
    <Container maxWidth="md" className="app-container">
      <Typography variant="h3" component="h1" gutterBottom>
        Chiply
      </Typography>

      <Paper elevation={3} className="section">
        <PlayerList
          players={players}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
        />
      </Paper>

      <Paper elevation={3} className="section">
        <BuyinForm
          players={players}
          onBuyin={addBuyin}
          onRemoveBuyin={removeBuyin}
          onEditBuyin={editBuyin}
        />
      </Paper>

      <Paper elevation={3} className="section">
        <GameSummary players={players} />
      </Paper>

      <Paper elevation={3} className="section">
        <CashoutForm
          players={players}
          onCashout={setCashout}
          onResetPlayerCashout={resetPlayerCashout}
          onResetAllCashouts={resetAllCashouts}
        />
      </Paper>

      <Paper elevation={3} className="section">
        <TransactionList players={players} />
      </Paper>

      <Button
        variant="outlined"
        color="secondary"
        onClick={handleLogout}
        fullWidth
        sx={{ mt: 2 }}
      >
        Logout
      </Button>
    </Container>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
