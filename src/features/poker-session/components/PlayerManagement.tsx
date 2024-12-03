import React from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Player } from "../../../types/types";
import { formatMoney } from "../../../utils/formatters";

interface PlayerListProps {
  players: Player[];
  onRemovePlayer: (id: string) => void;
  onAddPlayer?: (name: string) => void;
}

function PlayerList({ players, onRemovePlayer, onAddPlayer }: PlayerListProps) {
  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Players
      </Typography>

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
                player.buyins.reduce((sum, buyin) => sum + buyin.amount, 0)
              )}`}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
}

export default PlayerList;
