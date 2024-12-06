import React, { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { CircularProgress, Container } from "@mui/material";
import { getCurrentUser } from "../services/auth";
import { readData } from "../services/database";
import ErrorPage from "../pages/ErrorPage";

interface ClubProtectedRouteProps {
  children: React.ReactNode;
}

function ClubProtectedRoute({ children }: ClubProtectedRouteProps) {
  const { clubId } = useParams<{ clubId: string }>();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = await getCurrentUser();

        if (!user) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        if (!clubId) {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // Check if club exists and is not disabled
        const clubData = await readData(`clubs/${clubId}`);
        if (!clubData) {
          setError("Club not found");
          setLoading(false);
          return;
        }

        // If club is disabled and user is not an admin, deny access
        if (clubData.disabledAt && user.systemRole !== "admin") {
          setError("This club is currently disabled");
          setLoading(false);
          return;
        }

        // Admin always has access
        if (user.systemRole === "admin") {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        const hasClubAccess = !!(user.clubs && user.clubs[clubId]?.role);
        setHasAccess(hasClubAccess);
      } catch (err) {
        console.error("Error checking club access:", err);
        setError("Failed to verify access");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [clubId]);

  if (loading) {
    return (
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (error === "Authentication required") {
    return <Navigate to="/login" />;
  }

  if (!hasAccess || error) {
    return (
      <ErrorPage customMessage={error || "You don't have permission to access this club"} />
    );
  }

  return <>{children}</>;
}

export default ClubProtectedRoute;
