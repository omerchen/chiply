import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Clubs from "./pages/Clubs";
import ClubDetails from "./pages/ClubDetails";
import ClubPlayers from "./pages/ClubPlayers";
import ClubSessions from "./pages/ClubSessions";
import ClubSessionDetails from "./pages/ClubSessionDetails";
import NewClubSession from "./pages/NewClubSession";
import NewClubPlayer from "./pages/NewClubPlayer";
import ClubPlayerDetails from "./pages/ClubPlayerDetails";
import ClubDashboard from "./pages/ClubDashboard";
import Login from "./pages/Login";
import ErrorPage from "./pages/ErrorPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ClubProtectedRoute from "./components/ClubProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import SessionSummary from "./pages/SessionSummary";
import AdminPanel from "./pages/AdminPanel/index";
import AdminClubs from "./pages/AdminPanel/AdminClubs";
import AdminUsers from "./pages/AdminPanel/AdminUsers";
import CreateUser from "./pages/AdminPanel/CreateUser";
import EditUser from "./pages/AdminPanel/EditUser";
import CreateClub from "./pages/AdminPanel/CreateClub";
import SignUp from './pages/SignUp';
import SignUpVerify from './pages/SignUpVerify';
import MySessions from "./pages/MySessions";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';

function App() {
  return (
    <Router>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signup/verify" element={<SignUpVerify />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route
              path="admin/*"
              element={
                <AdminProtectedRoute>
                  <Routes>
                    <Route index element={<AdminPanel />} />
                    <Route path="clubs" element={<AdminClubs />} />
                    <Route path="clubs/create" element={<CreateClub />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="users/create" element={<CreateUser />} />
                    <Route path="users/:userId" element={<EditUser />} />
                  </Routes>
                </AdminProtectedRoute>
              }
            />
            <Route path="clubs">
              <Route
                index
                element={
                  <ClubProtectedRoute>
                    <Clubs />
                  </ClubProtectedRoute>
                }
              />
              <Route
                path=":clubId"
                element={
                  <ClubProtectedRoute>
                    <ClubDetails />
                  </ClubProtectedRoute>
                }
              />
              <Route
                path=":clubId/dashboard"
                element={
                  <ClubProtectedRoute>
                    <ClubDashboard />
                  </ClubProtectedRoute>
                }
              />
              <Route
                path=":clubId/players"
                element={
                  <ClubProtectedRoute>
                    <ClubPlayers />
                  </ClubProtectedRoute>
                }
              />
              <Route
                path=":clubId/players/new"
                element={
                  <ClubProtectedRoute>
                    <NewClubPlayer />
                  </ClubProtectedRoute>
                }
              />
              <Route
                path=":clubId/newPlayer"
                element={
                  <ClubProtectedRoute>
                    <NewClubPlayer />
                  </ClubProtectedRoute>
                }
              />
              <Route
                path=":clubId/players/:playerId"
                element={
                  <ClubProtectedRoute>
                    <ClubPlayerDetails />
                  </ClubProtectedRoute>
                }
              />
              <Route
                path=":clubId/sessions"
                element={
                  <ClubProtectedRoute>
                    <ClubSessions />
                  </ClubProtectedRoute>
                }
              />
              <Route
                path=":clubId/sessions/new"
                element={
                  <ClubProtectedRoute>
                    <NewClubSession />
                  </ClubProtectedRoute>
                }
              />
              <Route
                path=":clubId/newSession"
                element={
                  <ClubProtectedRoute>
                    <NewClubSession />
                  </ClubProtectedRoute>
                }
              />
              <Route
                path=":clubId/sessions/:sessionId"
                element={
                  <ClubProtectedRoute>
                    <ClubSessionDetails />
                  </ClubProtectedRoute>
                }
              />
              <Route
                path=":clubId/sessions/:sessionId/summary"
                element={
                  <ClubProtectedRoute>
                    <SessionSummary />
                  </ClubProtectedRoute>
                }
              />
            </Route>
            <Route path="/sessions" element={<MySessions />} />
          </Route>
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </LocalizationProvider>
    </Router>
  );
}

export default App;
