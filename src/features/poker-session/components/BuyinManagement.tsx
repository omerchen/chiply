import React, { useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { Player, Buyin } from "../types/types";
import { formatMoney } from "../utils/formatters";

interface BuyinFormProps {
  players: Player[];
  onBuyin: (playerId: string, amount: number, isPayBox: boolean) => void;
  onRemoveBuyin: (playerId: string, buyinId: string) => void;
  onEditBuyin: (playerId: string, buyinId: string, amount: number, timestamp: number, isPayBox: boolean) => void;
}

function BuyinForm({ players, onBuyin, onRemoveBuyin, onEditBuyin }: BuyinFormProps) {
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [amount, setAmount] = useState("");
  const [isPayBox, setIsPayBox] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [buyinToDelete, setBuyinToDelete] = useState<{ playerId: string; buyinId: string } | null>(null);
  
  // Edit states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBuyin, setEditingBuyin] = useState<{
    playerId: string;
    buyin: Buyin;
  } | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDateTime, setEditDateTime] = useState("");
  const [editIsPayBox, setEditIsPayBox] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayer && amount) {
      onBuyin(selectedPlayer, Number(amount), isPayBox);
      setAmount("");
      setIsPayBox(false);
    }
  };

  const handleDeleteClick = (playerId: string, buyinId: string) => {
    setBuyinToDelete({ playerId, buyinId });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (buyinToDelete) {
      onRemoveBuyin(buyinToDelete.playerId, buyinToDelete.buyinId);
    }
    setDeleteDialogOpen(false);
    setBuyinToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setBuyinToDelete(null);
  };

  const handleEditClick = (playerId: string, buyin: Buyin) => {
    setEditingBuyin({ playerId, buyin });
    setEditAmount(buyin.amount.toString());
    setEditDateTime(format(new Date(buyin.timestamp), "yyyy-MM-dd'T'HH:mm"));
    setEditIsPayBox(buyin.isPayBox);
    setEditDialogOpen(true);
  };

  const handleEditConfirm = () => {
    if (editingBuyin && editAmount && editDateTime) {
      onEditBuyin(
        editingBuyin.playerId,
        editingBuyin.buyin.id,
        Number(editAmount),
        new Date(editDateTime).getTime(),
        editIsPayBox
      );
      handleEditCancel();
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingBuyin(null);
    setEditAmount("");
    setEditDateTime("");
    setEditIsPayBox(false);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const relativeTime = formatDistanceToNow(date, { addSuffix: true });
    const actualTime = format(date, 'HH:mm');
    return `${relativeTime} (${actualTime})`;
  };

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Buy-ins
      </Typography>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <FormControl fullWidth size="small">
            <InputLabel>Player</InputLabel>
            <Select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              label="Player"
            >
              {players.map((player) => (
                <MenuItem key={player.id} value={player.id}>
                  {player.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            label="Amount"
            variant="outlined"
            size="small"
            fullWidth
            inputProps={{ min: "0" }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={isPayBox}
                onChange={(e) => setIsPayBox(e.target.checked)}
              />
            }
            label="PayBox Transaction"
          />

          <Button
            type="submit"
            variant="contained"
            disabled={!selectedPlayer || !amount}
          >
            Add Buyin
          </Button>
        </div>
      </form>

      <div className="buyin-list">
        {players.map(
          (player) =>
            player.buyins.length > 0 && (
              <div key={player.id}>
                <Typography variant="subtitle1">{player.name}</Typography>
                <List dense>
                  {player.buyins.map((buyin) => (
                    <ListItem
                      key={buyin.id}
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            edge="end"
                            onClick={() => handleEditClick(player.id, buyin)}
                            disabled={player.cashout !== null}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteClick(player.id, buyin.id)}
                            disabled={player.cashout !== null}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <ListItemText
                        primary={`₪${formatMoney(buyin.amount)}${
                          buyin.isPayBox ? " (PayBox)" : ""
                        }`}
                        secondary={formatTimestamp(buyin.timestamp)}
                      />
                    </ListItem>
                  ))}
                </List>
              </div>
            )
        )}
      </div>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to remove this buyin?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={handleEditCancel}
      >
        <DialogTitle>Edit Buyin</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1, minWidth: '300px' }}>
            <TextField
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              label="Amount"
              variant="outlined"
              size="small"
              fullWidth
              inputProps={{ min: "0" }}
            />
            <TextField
              type="datetime-local"
              value={editDateTime}
              onChange={(e) => setEditDateTime(e.target.value)}
              label="Date and Time"
              variant="outlined"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editIsPayBox}
                  onChange={(e) => setEditIsPayBox(e.target.checked)}
                />
              }
              label="PayBox Transaction"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>Cancel</Button>
          <Button onClick={handleEditConfirm} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default BuyinForm;
