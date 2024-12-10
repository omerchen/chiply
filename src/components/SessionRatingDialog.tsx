import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { SessionRating, RatingValue, RATING_EMOJIS, RATING_LABELS } from '../types/rating';

interface SessionRatingDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (rating: Omit<SessionRating, 'createdAt' | 'updatedAt'>) => void;
  onDelete?: () => void;
  initialRating?: SessionRating;
  sessionNumber?: number;
}

export default function SessionRatingDialog({
  open,
  onClose,
  onSave,
  onDelete,
  initialRating,
  sessionNumber,
}: SessionRatingDialogProps) {
  const [rate, setRate] = useState<RatingValue | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (initialRating) {
      setRate(initialRating.rate);
      setComment(initialRating.comment || '');
    } else {
      setRate(null);
      setComment('');
    }
  }, [initialRating, open]);

  const handleSave = () => {
    if (!rate) return;
    onSave({
      rate,
      comment: comment.trim() || null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {initialRating 
          ? `Edit Session ${sessionNumber} Rating` 
          : `Rate Session ${sessionNumber}`}
        {initialRating && onDelete && (
          <IconButton onClick={onDelete} color="error" size="small">
            <DeleteIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <div>
            <Typography variant="subtitle2" gutterBottom>
              Rating
            </Typography>
            <ToggleButtonGroup
              value={rate}
              exclusive
              onChange={(_, value) => setRate(value)}
              fullWidth
            >
              {Object.entries(RATING_EMOJIS).map(([value, emoji]) => (
                <ToggleButton key={value} value={Number(value)}>
                  <Stack alignItems="center" spacing={1}>
                    <Typography variant="h6">{emoji}</Typography>
                    <Typography variant="caption">
                      {RATING_LABELS[Number(value) as RatingValue]}
                    </Typography>
                  </Stack>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>
          
          <TextField
            label="Comment"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!rate}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
} 