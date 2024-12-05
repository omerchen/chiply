import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { clearUserFromStorage, getCurrentUser } from "../services/auth";
import { User } from "../types/User";
import { CircularProgress, Box } from "@mui/material";

function Layout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData) {
          navigate("/login");
          return;
        }
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    clearUserFromStorage();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar onLogout={handleLogout} user={user} />
      <Outlet />
    </>
  );
}

export default Layout;
