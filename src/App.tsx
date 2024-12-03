import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Container, Paper } from "@mui/material";
import { Player, Buyin } from "./types/types";
import "./styles/main.scss";
import Navbar from './components/Navbar';
import { clearUserFromStorage, getUserFromStorage } from "./services/auth";
import Login from "./pages/Login";
import PlayerList from "./features/poker-session/components/PlayerManagement";
import BuyinForm from "./features/poker-session/components/BuyinManagement";
import CashoutForm from "./features/poker-session/components/CashoutManagement";
import GameSummary from "./features/poker-session/components/SessionSummary";
import TransactionList from "./features/poker-session/components/TransactionSummary";

function SessionPage() {
  console.log('Rendering SessionPage');
  const [players, setPlayers] = React.useState<Player[]>([]);

  const addPlayer = (name: string) => {
    setPlayers([...players, { id: crypto.randomUUID(), name, buyins: [], cashout: null }]);
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter((player) => player.id !== id));
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

  const removeBuyin = (playerId: string, buyinId: string) => {
    setPlayers(
      players.map((player) => {
        if (player.id === playerId) {
          return {
            ...player,
            buyins: player.buyins.filter((buyin: Buyin) => buyin.id !== buyinId),
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
            buyins: player.buyins.map((buyin: Buyin) =>
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

  const setCashout = (playerId: string, amount: number) => {
    setPlayers(
      players.map((player) =>
        player.id === playerId ? { ...player, cashout: amount } : player
      )
    );
  };

  const resetPlayerCashout = (playerId: string) => {
    setPlayers(
      players.map((player) =>
        player.id === playerId ? { ...player, cashout: null } : player
      )
    );
  };

  const resetAllCashouts = () => {
    setPlayers(
      players.map((player) => ({ ...player, cashout: null }))
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <PlayerList
          players={players}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
        />
        <BuyinForm
          players={players}
          onBuyin={addBuyin}
          onRemoveBuyin={removeBuyin}
          onEditBuyin={editBuyin}
        />
        <CashoutForm
          players={players}
          onCashout={setCashout}
          onResetPlayerCashout={resetPlayerCashout}
          onResetAllCashouts={resetAllCashouts}
        />
        <GameSummary players={players} />
        <TransactionList players={players} />
      </Paper>
    </Container>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const handleLogout = () => {
    clearUserFromStorage();
    window.location.href = '/login';
  };

  return (
    <>
      <Navbar onLogout={handleLogout} />
      {children}
    </>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const checkAuth = () => {
      const user = getUserFromStorage();
      setIsAuthenticated(!!user);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chiply_user') {
        setIsAuthenticated(!!e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (isAuthenticated === null) {
    return null;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Layout>
                <SessionPage />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
