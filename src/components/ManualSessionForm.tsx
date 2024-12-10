import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  InputAdornment,
  Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { ref, push, remove, update } from 'firebase/database';
import { db } from '../config/firebase';
import { getCurrentUser } from '../services/auth';

interface ManualSessionFormProps {
  open: boolean;
  onClose: () => void;
  initialData?: ManualSession;
  onSubmit: () => void;
  playerId: string;
  sessionNumber?: number;
}

export interface ManualSession {
  id?: string;
  userId: string;
  dateTime: number;
  duration: number;
  stakes: {
    smallBlind: number;
    bigBlind: number;
    ante?: number;
  };
  buyinCount: number;
  buyinTotal: number;
  finalStack: number;
  numberOfPlayers: number;
  location?: string;
}

export function ManualSessionForm({ open, onClose, initialData, onSubmit, playerId, sessionNumber }: ManualSessionFormProps) {
  const [error, setError] = useState<string | null>(null);
  
  const initialFormState = {
    dateTime: Date.now(),
    duration: 0,
    stakes: { smallBlind: 0, bigBlind: 0 },
    buyinCount: 1,
    buyinTotal: 0,
    finalStack: 0,
    numberOfPlayers: 0,
  };

  const [formData, setFormData] = useState<Partial<ManualSession>>(
    initialData || initialFormState
  );

  // Reset form when opening a new session form
  useEffect(() => {
    if (open) {
      setFormData(initialData || initialFormState);
      setError(null);
    }
  }, [open, initialData]);

  const validateForm = () => {
    if (!formData.dateTime) return "Date and time is required";
    if (!formData.duration || formData.duration <= 0) return "Duration must be greater than 0";
    if (!formData.stakes?.smallBlind || !formData.stakes?.bigBlind) return "Small blind and big blind are required";
    if (!formData.buyinCount || formData.buyinCount < 1) return "At least one buy-in is required";
    if (formData.buyinTotal === undefined || formData.buyinTotal <= 0) return "Total buy-in amount must be greater than 0";
    if (formData.finalStack === undefined) return "Final stack is required";
    if (!formData.numberOfPlayers || formData.numberOfPlayers < 2) return "At least 2 players are required";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      const currentUser = await getCurrentUser();
      if (!currentUser?.id) {
        setError("User not authenticated");
        return;
      }

      // Clean up the session data
      const cleanStakes = {
        smallBlind: formData.stakes?.smallBlind || 0,
        bigBlind: formData.stakes?.bigBlind || 0,
      };
      
      // Only add ante if it exists and is not empty
      if (formData.stakes?.ante !== undefined && formData.stakes.ante !== null) {
        (cleanStakes as any).ante = formData.stakes.ante;
      }

      const sessionData = {
        ...formData,
        userId: currentUser.id,
        dateTime: formData.dateTime || Date.now(),
        stakes: cleanStakes
      };

      console.log('Saving session for player:', playerId);
      console.log('Session data:', sessionData);

      if (initialData?.id) {
        await update(ref(db, `players/${playerId}/manualPlayerSessions/${initialData.id}`), sessionData);
      } else {
        await push(ref(db, `players/${playerId}/manualPlayerSessions`), sessionData);
      }

      onSubmit();
      // Reset form data before closing
      setFormData(initialFormState);
      onClose();
    } catch (err) {
      console.error('Error saving session:', err);
      setError(err instanceof Error ? err.message : 'Failed to save session');
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    try {
      await remove(ref(db, `players/${playerId}/manualPlayerSessions/${initialData.id}`));
      onSubmit();
      setFormData(initialFormState);
      onClose();
    } catch (err) {
      console.error('Error deleting session:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? `Edit Session #${sessionNumber}` : "Add Manual Session"}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            
            <DateTimePicker
              label="Date & Time"
              value={formData.dateTime ? new Date(formData.dateTime) : null}
              onChange={(newValue: Date | null) => {
                console.log('New date value:', newValue);
                setFormData(prev => ({
                  ...prev,
                  dateTime: newValue ? newValue.getTime() : Date.now()
                }));
              }}
              ampm={false}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />
            
            <TextField
              label="Duration (hours)"
              type="number"
              required
              inputProps={{ step: "0.5", min: "0" }}
              value={formData.duration || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                duration: parseFloat(e.target.value)
              }))}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Small Blind"
                type="number"
                required
                inputProps={{ step: "0.5", min: "0" }}
                InputProps={{ startAdornment: <InputAdornment position="start">₪</InputAdornment> }}
                value={formData.stakes?.smallBlind || ''}
                onChange={(e) => {
                  const smallBlind = parseFloat(e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    stakes: { 
                      smallBlind,
                      bigBlind: prev.stakes?.bigBlind || 0,
                      ante: prev.stakes?.ante
                    }
                  }));
                }}
              />
              <TextField
                label="Big Blind"
                type="number"
                required
                inputProps={{ step: "0.5", min: "0" }}
                InputProps={{ startAdornment: <InputAdornment position="start">₪</InputAdornment> }}
                value={formData.stakes?.bigBlind || ''}
                onChange={(e) => {
                  const bigBlind = parseFloat(e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    stakes: { 
                      smallBlind: prev.stakes?.smallBlind || 0,
                      bigBlind,
                      ante: prev.stakes?.ante
                    }
                  }));
                }}
              />
              <TextField
                label="Ante (optional)"
                type="number"
                inputProps={{ step: "0.5", min: "0" }}
                InputProps={{ startAdornment: <InputAdornment position="start">₪</InputAdornment> }}
                value={formData.stakes?.ante ?? ''}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  setFormData(prev => ({
                    ...prev,
                    stakes: { 
                      smallBlind: prev.stakes?.smallBlind || 0,
                      bigBlind: prev.stakes?.bigBlind || 0,
                      ...(value !== '' ? { ante: parseFloat(value) } : {})
                    }
                  }));
                }}
              />
            </Stack>

            <TextField
              label="Number of Buy-ins"
              type="number"
              required
              inputProps={{ min: "1" }}
              value={formData.buyinCount || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                buyinCount: parseInt(e.target.value)
              }))}
            />

            <TextField
              label="Total Buy-in Amount"
              type="number"
              required
              inputProps={{ step: "0.5", min: "0" }}
              InputProps={{ startAdornment: <InputAdornment position="start">₪</InputAdornment> }}
              value={formData.buyinTotal || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                buyinTotal: parseFloat(e.target.value)
              }))}
            />

            <TextField
              label="Final Stack"
              type="number"
              required
              inputProps={{ step: "0.5", min: "0" }}
              InputProps={{ startAdornment: <InputAdornment position="start">₪</InputAdornment> }}
              value={formData.finalStack !== undefined ? formData.finalStack : ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                finalStack: parseFloat(e.target.value)
              }))}
            />

            <TextField
              label="Number of Players"
              type="number"
              required
              inputProps={{ min: "2" }}
              value={formData.numberOfPlayers || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                numberOfPlayers: parseInt(e.target.value)
              }))}
            />

            <TextField
              label="Location (optional)"
              value={formData.location || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                location: e.target.value
              }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          {initialData && (
            <Button onClick={handleDelete} color="error">
              Delete
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {initialData ? 'Save Changes' : 'Add Session'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 