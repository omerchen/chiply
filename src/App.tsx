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
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import SessionSummary from "./pages/SessionSummary";
import AdminPanel from "./pages/AdminPanel/index";
import AdminClubs from "./pages/AdminPanel/AdminClubs";
import AdminUsers from "./pages/AdminPanel/AdminUsers";

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
          <Route
            path="admin/*"
            element={
              <AdminProtectedRoute>
                <Routes>
                  <Route index element={<AdminPanel />} />
                  <Route path="clubs" element={<AdminClubs />} />
                  <Route path="users" element={<AdminUsers />} />
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
