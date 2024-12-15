import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  CircularProgress,
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import { readData, writeData } from "../services/database";
import ClubBreadcrumbs from "../components/ClubBreadcrumbs";
import { auth } from "../config/firebase";
import { getCurrentUser } from "../services/auth";

interface PlayerData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

function NewClubPlayer() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [foundPlayer, setFoundPlayer] = useState<PlayerData | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [clubName, setClubName] = useState("");
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);
      try {
        const [clubData, currentUser] = await Promise.all([
          readData(`clubs/${clubId}`),
          getCurrentUser(),
        ]);

        setClubName(clubData.name || "");

        if (!currentUser) {
          navigate("/");
          return;
        }

        // Check user's role in the club from user data
        const userRole =
          currentUser.systemRole === "admin"
            ? "admin"
            : currentUser.clubs[clubId!]?.role;
        setUserRole(userRole);

        // Redirect if user is not an admin
        if (userRole !== "admin") {
          navigate(`/clubs/${clubId}`);
        }
      } catch (error) {
        console.error("Error checking access:", error);
        navigate(`/clubs/${clubId}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [clubId, navigate]);

  if (isLoading) {
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

  // Only render the main content if user is admin
  if (userRole !== "admin") {
    return null;
  }

  const handleSearch = async () => {
    if (!email.trim()) return;

    setLoading(true);
    try {
      console.log("Searching for player with email:", email);
      const playersData = await readData("players");
      console.log("All players:", playersData);

      // Find player by email and include their ID from the key
      const [playerId, playerData] =
        Object.entries(playersData || {}).find(
          ([_, player]) =>
            (player as PlayerData).email.toLowerCase() === email.toLowerCase()
        ) || [];

      console.log("Found player:", playerId, playerData);

      if (playerId && playerData) {
        setFoundPlayer({
          ...(playerData as PlayerData),
          id: playerId,
        });
        setShowConfirmDialog(true);
      } else {
        setShowNewPlayerForm(true);
      }
    } catch (error) {
      console.error("Error searching for player:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlayer = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;

    setLoading(true);
    try {
      const newPlayerId = uuidv4();

      // Create player document with ID as key
      await writeData(`players/${newPlayerId}`, {
        email: email.toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      // Add player to club's players list
      await writeData(`clubs/${clubId}/players/${newPlayerId}`, {
        type: "regular",
      });

      navigate(`/clubs/${clubId}/players/${newPlayerId}`);
    } catch (error) {
      console.error("Error creating player:", error);
    }
  };

  const handleInviteExistingPlayer = async () => {
    if (!foundPlayer) return;

    setLoading(true);
    try {
      console.log("Inviting player:", foundPlayer);

      // First check if player is already in the club
      const clubData = await readData(`clubs/${clubId}`);
      console.log("Club data:", clubData);

      if (clubData?.players && clubData.players[foundPlayer.id]) {
        setError("This player is already a member of the club.");
        return;
      }

      // Add player to club's players list using player ID as key
      await writeData(`clubs/${clubId}/players/${foundPlayer.id}`, {
        type: "regular",
      });

      console.log("Successfully added player to club");

      // Close dialog and navigate to player details
      setShowConfirmDialog(false);
      navigate(`/clubs/${clubId}/players/${foundPlayer.id}`);
    } catch (error) {
      console.error("Error inviting player. Full error:", error);
      setError("Failed to invite player. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 3, mb: 3 }}>
      <ClubBreadcrumbs
        clubId={clubId!}
        clubName={clubName}
        currentPage="Invite Player"
      />
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Invite a Player
        </Typography>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || showNewPlayerForm}
            sx={{ mb: 2 }}
          />
          {!showNewPlayerForm && (
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !email.trim()}
              sx={{
                bgcolor: "#673ab7",
                "&:hover": { bgcolor: "#563098" },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Search"
              )}
            </Button>
          )}
        </Box>

        {showNewPlayerForm && (
          <Box>
            <Typography variant="body1" sx={{ mb: 2, color: "text.secondary" }}>
              Player not found. Create a new player:
            </Typography>
            <TextField
              fullWidth
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              variant="contained"
              onClick={handleCreatePlayer}
              disabled={loading || !firstName.trim() || !lastName.trim()}
              sx={{
                bgcolor: "#673ab7",
                "&:hover": { bgcolor: "#563098" },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Add Player"
              )}
            </Button>
          </Box>
        )}

        <Dialog
          open={showConfirmDialog}
          onClose={() => !loading && setShowConfirmDialog(false)}
        >
          <DialogTitle>Player Found</DialogTitle>
          <DialogContent>
            {foundPlayer && (
              <Typography>
                {foundPlayer.firstName} {foundPlayer.lastName} (
                {foundPlayer.email})
              </Typography>
            )}
            <Typography sx={{ mt: 2 }}>
              Would you like to invite this player to the club?
            </Typography>
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowConfirmDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteExistingPlayer}
              disabled={loading}
              sx={{
                color: "#673ab7",
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#673ab7" }} />
              ) : (
                "Invite"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}

export default NewClubPlayer;
