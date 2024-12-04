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
  onRemovePlayer?: (id: string) => void;
  isSessionClosed?: boolean;
}

function PlayerList({ players, onRemovePlayer, isSessionClosed }: PlayerListProps) {
  return (
    <div>
      <List>
        {players.map((player) => (
          <ListItem
            key={player.id}
            secondaryAction={
              <IconButton
                edge="end"
                onClick={() => onRemovePlayer && onRemovePlayer(player.id)}
                disabled={isSessionClosed || !onRemovePlayer}
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
