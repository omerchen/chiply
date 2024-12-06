import React, { useState, useMemo } from "react";
import {
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  createTheme,
  ThemeProvider,
  Menu,
  Checkbox,
  ListItemIcon,
  ListItemText,
  Popover,
} from "@mui/material";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PaymentsIcon from "@mui/icons-material/Payments";
import { Player } from "../../../types/types";
import { formatMoney } from "../../../utils/formatters";
import FilterListIcon from '@mui/icons-material/FilterList';

interface BuyinFormProps {
  players: Player[];
  onBuyin?: (playerId: string, amount: number, isPayBox: boolean) => void;
  onRemoveBuyin?: (playerId: string, buyinId: string) => void;
  onEditBuyin?: (
    playerId: string,
    buyinId: string,
    amount: number,
    timestamp: number,
    isPayBox: boolean
  ) => void;
  isSessionClosed?: boolean;
  cashedOutPlayerIds?: string[];
}

type Order = 'asc' | 'desc';

interface BuyinData {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  timestamp: number;
  isPayBox: boolean;
}

function BuyinForm({ players, onBuyin, onRemoveBuyin, onEditBuyin, isSessionClosed, cashedOutPlayerIds = [] }: BuyinFormProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [amount, setAmount] = useState("");
  const [isPayBox, setIsPayBox] = useState(false);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<'timestamp'>('timestamp');
  const [playerFilterAnchor, setPlayerFilterAnchor] = useState<null | HTMLElement>(null);
  const [typeFilterAnchor, setTypeFilterAnchor] = useState<null | HTMLElement>(null);
  const [selectedPlayerNames, setSelectedPlayerNames] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBuyin, setEditingBuyin] = useState<BuyinData | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDateTime, setEditDateTime] = useState<dayjs.Dayjs | null>(null);
  const [editIsPayBox, setEditIsPayBox] = useState(false);

  const theme = createTheme({
    palette: {
      primary: {
        main: '#673ab7'
      }
    }
  });

  // Add a helper to check if user has edit permissions
  const hasEditPermissions = Boolean(onBuyin && onRemoveBuyin && onEditBuyin);

  const handleEditClick = (buyin: BuyinData) => {
    setEditingBuyin(buyin);
    setEditAmount(buyin.amount.toString());
    setEditDateTime(dayjs(buyin.timestamp));
    setEditIsPayBox(buyin.isPayBox);
    setEditDialogOpen(true);
  };

  const handleEditConfirm = () => {
    if (editingBuyin && editAmount && editDateTime && onEditBuyin) {
      onEditBuyin(
        editingBuyin.playerId,
        editingBuyin.id,
        Number(editAmount),
        editDateTime.valueOf(),
        editIsPayBox
      );
      handleEditCancel();
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingBuyin(null);
    setEditAmount("");
    setEditDateTime(null);
    setEditIsPayBox(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const buyinAmount = parseFloat(amount);
    if (selectedPlayerId && !isNaN(buyinAmount) && onBuyin) {
      onBuyin(selectedPlayerId, buyinAmount, isPayBox);
      setAmount("");
      setIsPayBox(false);
      setSelectedPlayerId("");
    }
  };

  // Convert buyins data to array and sort
  const buyinsData: BuyinData[] = players.flatMap(player => 
    player.buyins.map(buyin => ({
      id: buyin.id,
      playerId: player.id,
      playerName: player.name,
      amount: buyin.amount,
      timestamp: buyin.timestamp,
      isPayBox: buyin.isPayBox
    }))
  );

  // Sort buyins by timestamp
  const sortedData = [...buyinsData].sort((a, b) => {
    if (orderBy === 'timestamp') {
      return order === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
    }
    return 0;
  });

  // Get unique player names for filter
  const uniquePlayerNames = Array.from(new Set(buyinsData.map(buyin => buyin.playerName)));

  // Get filtered data
  const filteredData = sortedData.filter(buyin => {
    if (selectedPlayerNames.length > 0 && !selectedPlayerNames.includes(buyin.playerName)) {
      return false;
    }
    if (selectedTypes.length > 0) {
      if (selectedTypes.includes('Regular') && !buyin.isPayBox) return true;
      if (selectedTypes.includes('PayBox') && buyin.isPayBox) return true;
      return false;
    }
    return true;
  });

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const timeString = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    if (hours > 0) {
      return `${hours}h ago (${timeString})`;
    } else if (minutes > 0) {
      return `${minutes}m ago (${timeString})`;
    } else {
      return `${seconds}s ago (${timeString})`;
    }
  };

  const handlePlayerFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setPlayerFilterAnchor(event.currentTarget);
  };

  const handleTypeFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setTypeFilterAnchor(event.currentTarget);
  };

  const handlePlayerFilterClose = () => {
    setPlayerFilterAnchor(null);
  };

  const handleTypeFilterClose = () => {
    setTypeFilterAnchor(null);
  };

  const handlePlayerFilterChange = (playerName: string) => {
    setSelectedPlayerNames(prev => {
      if (prev.includes(playerName)) {
        return prev.filter(name => name !== playerName);
      } else {
        return [...prev, playerName];
      }
    });
  };

  const handleTypeFilterChange = (type: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const clearPlayerFilter = () => {
    setSelectedPlayerNames([]);
    handlePlayerFilterClose();
  };

  const clearTypeFilter = () => {
    setSelectedTypes([]);
    handleTypeFilterClose();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="form-row">
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 1.5, sm: 2 }} 
          sx={{ 
            mb: 3,
            width: '100%',
            px: { xs: 0.5, sm: 0 }
          }}
        >
          <FormControl sx={{ minWidth: { sm: 200 }, width: { xs: '100%', sm: 'auto' } }} size="small">
            <InputLabel>Player</InputLabel>
            <Select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              label="Player"
              disabled={isSessionClosed || !hasEditPermissions}
            >
              {players.map((player) => (
                <MenuItem 
                  key={player.id} 
                  value={player.id}
                  disabled={cashedOutPlayerIds.includes(player.id)}
                >
                  {player.name}{cashedOutPlayerIds.includes(player.id) ? " (Cashed Out)" : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="number"
            label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            size="small"
            inputProps={{ step: "0.5" }}
            disabled={isSessionClosed || !hasEditPermissions}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isPayBox}
                onChange={(e) => setIsPayBox(e.target.checked)}
                disabled={isSessionClosed || !hasEditPermissions}
              />
            }
            label="PayBox"
            sx={{ 
              mx: { xs: 0, sm: 1 },
              width: { xs: '100%', sm: 'auto' }
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={!selectedPlayerId || !amount || isSessionClosed || !hasEditPermissions}
            fullWidth
            sx={{
              bgcolor: '#673ab7',
              '&:hover': { bgcolor: '#563098' },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Add Buyin
          </Button>
        </Stack>
      </form>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TableSortLabel
                    active={orderBy === 'timestamp'}
                    direction={order}
                    onClick={() => {
                      setOrder(order === 'asc' ? 'desc' : 'asc');
                      setOrderBy('timestamp');
                    }}
                  >
                    Time
                  </TableSortLabel>
                </Stack>
              </TableCell>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1}>
                  Name
                  <IconButton 
                    size="small"
                    onClick={(e) => setPlayerFilterAnchor(e.currentTarget)}
                  >
                    <FilterListIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1}>
                  Type
                  <IconButton 
                    size="small"
                    onClick={(e) => setTypeFilterAnchor(e.currentTarget)}
                  >
                    <FilterListIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((buyin) => (
              <TableRow key={buyin.id}>
                <TableCell>{formatTimeAgo(buyin.timestamp)}</TableCell>
                <TableCell>{buyin.playerName}</TableCell>
                <TableCell>₪{formatMoney(buyin.amount)}</TableCell>
                <TableCell>
                  {buyin.isPayBox ? (
                    <Chip 
                      label="PayBox" 
                      size="small" 
                      color="secondary"
                    />
                  ) : (
                    <Chip 
                      label="Regular" 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title={cashedOutPlayerIds.includes(buyin.playerId) ? "Cannot edit buy-in for cashed out player" : ""}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(buyin)}
                          disabled={isSessionClosed || !hasEditPermissions || cashedOutPlayerIds.includes(buyin.playerId)}
                          sx={{
                            '&.Mui-disabled': {
                              color: 'rgba(0, 0, 0, 0.26) !important'
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={cashedOutPlayerIds.includes(buyin.playerId) ? "Cannot delete buy-in for cashed out player" : ""}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onRemoveBuyin && onRemoveBuyin(buyin.playerId, buyin.id)}
                          disabled={isSessionClosed || !hasEditPermissions || cashedOutPlayerIds.includes(buyin.playerId)}
                          sx={{
                            '&.Mui-disabled': {
                              color: 'rgba(0, 0, 0, 0.26) !important'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Player Filter Menu */}
      <Menu
        anchorEl={playerFilterAnchor}
        open={Boolean(playerFilterAnchor)}
        onClose={handlePlayerFilterClose}
      >
        <MenuItem onClick={clearPlayerFilter}>
          <ListItemIcon>
            <Checkbox checked={selectedPlayerNames.length === 0} />
          </ListItemIcon>
          <ListItemText>All Players</ListItemText>
        </MenuItem>
        {uniquePlayerNames.map((playerName) => (
          <MenuItem 
            key={playerName}
            onClick={() => handlePlayerFilterChange(playerName)}
          >
            <ListItemIcon>
              <Checkbox checked={selectedPlayerNames.includes(playerName)} />
            </ListItemIcon>
            <ListItemText>{playerName}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Type Filter Menu */}
      <Menu
        anchorEl={typeFilterAnchor}
        open={Boolean(typeFilterAnchor)}
        onClose={handleTypeFilterClose}
      >
        <MenuItem onClick={clearTypeFilter}>
          <ListItemIcon>
            <Checkbox checked={selectedTypes.length === 0} />
          </ListItemIcon>
          <ListItemText>All Types</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleTypeFilterChange('Regular')}>
          <ListItemIcon>
            <Checkbox checked={selectedTypes.includes('Regular')} />
          </ListItemIcon>
          <ListItemText>Regular</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleTypeFilterChange('PayBox')}>
          <ListItemIcon>
            <Checkbox checked={selectedTypes.includes('PayBox')} />
          </ListItemIcon>
          <ListItemText>PayBox</ListItemText>
        </MenuItem>
      </Menu>

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
              inputProps={{ step: "0.5" }}
              disabled={isSessionClosed || !hasEditPermissions}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <ThemeProvider theme={theme}>
                <DateTimePicker
                  label="Date and Time"
                  value={editDateTime}
                  onChange={(newValue) => setEditDateTime(newValue)}
                  format="DD/MM/YYYY HH:mm"
                  ampm={false}
                  disabled={isSessionClosed || !hasEditPermissions}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true
                    }
                  }}
                />
              </ThemeProvider>
            </LocalizationProvider>
            <FormControlLabel
              control={
                <Switch
                  checked={editIsPayBox}
                  onChange={(e) => setEditIsPayBox(e.target.checked)}
                  disabled={isSessionClosed || !hasEditPermissions}
                />
              }
              label="PayBox"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>Cancel</Button>
          <Button 
            onClick={handleEditConfirm} 
            variant="contained"
            disabled={isSessionClosed || !hasEditPermissions}
            sx={{
              bgcolor: '#673ab7',
              '&:hover': { bgcolor: '#563098' }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default BuyinForm;
