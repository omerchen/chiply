import React, { useState } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Player, Buyin } from "../../../types/types";
import { formatMoney } from "../../../utils/formatters";

interface PlayerListProps {
  players: Player[];
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (id: string) => void;
}

function PlayerList({ players, onAddPlayer, onRemovePlayer }: PlayerListProps) {
  const [newPlayerName, setNewPlayerName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName("");
    }
  };

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Players
      </Typography>

      <form onSubmit={handleSubmit} className="form-row">
        <TextField
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          label="Player Name"
          variant="outlined"
          size="small"
          fullWidth
        />
        <Button
          type="submit"
          variant="contained"
          disabled={!newPlayerName.trim()}
        >
          Add Player
        </Button>
      </form>

      <List>
        {players.map((player) => (
          <ListItem
            key={player.id}
            secondaryAction={
              <IconButton
                edge="end"
                onClick={() => onRemovePlayer(player.id)}
                disabled={player.buyins.length > 0}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={player.name}
              secondary={`Total Buyins: ₪${formatMoney(
                player.buyins.reduce((sum: number, buyin: Buyin) => sum + buyin.amount, 0)
              )}`}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
}

export default PlayerList;
