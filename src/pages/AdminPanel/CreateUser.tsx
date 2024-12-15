import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  SelectChangeEvent,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AdminBreadcrumbs from "../../components/AdminBreadcrumbs";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import { createUserData } from "../../services/auth";
import { useNavigate } from "react-router-dom";
import { readData } from "../../services/database";

interface Club {
  id: string;
  name: string;
}

interface SelectedClub {
  id: string;
  name: string;
  role: "admin" | "member";
}

const CreateUser: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    systemRole: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubs, setSelectedClubs] = useState<SelectedClub[]>([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [selectedClubRole, setSelectedClubRole] = useState<"admin" | "member">(
    "member"
  );

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const clubsData = await readData("clubs");
        if (clubsData) {
          const clubsList = Object.entries(clubsData).map(
            ([id, club]: [string, any]) => ({
              id,
              name: club.name,
            })
          );
          setClubs(clubsList);
        }
      } catch (error) {
        console.error("Error fetching clubs:", error);
      }
    };

    fetchClubs();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    if (name === "systemRole") {
      setFormData((prev) => ({
        ...prev,
        systemRole: value,
      }));
    } else if (name === "clubId") {
      setSelectedClubId(value);
    } else if (name === "clubRole") {
      setSelectedClubRole(value as "admin" | "member");
    }
  };

  const handleAddClub = () => {
    if (!selectedClubId) return;

    const club = clubs.find((c) => c.id === selectedClubId);
    if (!club) return;

    const isAlreadySelected = selectedClubs.some(
      (sc) => sc.id === selectedClubId
    );
    if (isAlreadySelected) return;

    setSelectedClubs((prev) => [
      ...prev,
      {
        id: club.id,
        name: club.name,
        role: selectedClubRole,
      },
    ]);

    setSelectedClubId("");
    setSelectedClubRole("member");
  };

  const handleRemoveClub = (clubId: string) => {
    setSelectedClubs((prev) => prev.filter((club) => club.id !== clubId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const clubsData = selectedClubs.reduce(
        (acc, club) => ({
          ...acc,
          [club.id]: { role: club.role },
        }),
        {}
      );

      await createUserData(userCredential.user.uid, {
        email: formData.email.toLowerCase().trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        systemRole: formData.systemRole as "admin" | "member",
        clubs: clubsData,
      });

      navigate("/admin/users");
    } catch (err) {
      console.error("Error creating user:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <AdminBreadcrumbs
          currentPage="Create User"
          intermediateLinks={[{ label: "User Management", to: "/admin/users" }]}
        />
        <Box display="flex" alignItems="center" mb={3}>
          <PersonAddIcon sx={{ fontSize: 40, mr: 2, color: "#673ab7" }} />
          <Typography variant="h4" component="h1">
            Create User
          </Typography>
        </Box>

        <Paper sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />

            <TextField
              name="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />

            <TextField
              name="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />

            <TextField
              name="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth required sx={{ mb: 3 }}>
              <InputLabel>System Role</InputLabel>
              <Select
                name="systemRole"
                value={formData.systemRole}
                onChange={handleSelectChange}
                label="System Role"
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Club</InputLabel>
              <Select
                name="clubId"
                value={selectedClubId}
                onChange={handleSelectChange}
                label="Club"
              >
                <MenuItem value="">Select Club</MenuItem>
                {clubs
                  .filter(
                    (club) => !selectedClubs.some((sc) => sc.id === club.id)
                  )
                  .map((club) => (
                    <MenuItem key={club.id} value={club.id}>
                      {club.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Club Role</InputLabel>
              <Select
                name="clubRole"
                value={selectedClubRole}
                onChange={handleSelectChange}
                label="Club Role"
                disabled={!selectedClubId}
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              fullWidth
              onClick={handleAddClub}
              disabled={!selectedClubId}
              sx={{ mb: 3 }}
            >
              Add Club
            </Button>

            {selectedClubs.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Selected Clubs:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {selectedClubs.map((club) => (
                    <Chip
                      key={club.id}
                      label={`${club.name} (${club.role})`}
                      onDelete={() => handleRemoveClub(club.id)}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                bgcolor: "#673ab7",
                "&:hover": { bgcolor: "#563098" },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Create User"
              )}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateUser;
