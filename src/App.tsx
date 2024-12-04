import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
import Login from "./pages/Login";
import ErrorPage from "./pages/ErrorPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ClubProtectedRoute from "./components/ClubProtectedRoute";
import SessionSummary from "./pages/SessionSummary";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
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
        </Route>
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Router>
  );
}

export default App;
