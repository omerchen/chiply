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
  onBuyin: (playerId: string, amount: number, isPayBox: boolean) => void;
  onRemoveBuyin: (playerId: string, buyinId: string) => void;
  onEditBuyin: (
    playerId: string,
    buyinId: string,
    amount: number,
    timestamp: number,
    isPayBox: boolean
  ) => void;
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

function BuyinForm({ players, onBuyin, onRemoveBuyin, onEditBuyin }: BuyinFormProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [amount, setAmount] = useState("");
  const [isPayBox, setIsPayBox] = useState(false);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof BuyinData>('timestamp');
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>('all');
  const [payboxFilter, setPayboxFilter] = useState<'all' | 'paybox' | 'regular'>('all');
  
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

  const handleEditClick = (buyin: BuyinData) => {
    setEditingBuyin(buyin);
    setEditAmount(buyin.amount.toString());
    setEditDateTime(dayjs(buyin.timestamp));
    setEditIsPayBox(buyin.isPayBox);
    setEditDialogOpen(true);
  };

  const handleEditConfirm = () => {
    if (editingBuyin && editAmount && editDateTime) {
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
    if (selectedPlayerId && !isNaN(buyinAmount)) {
      onBuyin(selectedPlayerId, buyinAmount, isPayBox);
      setAmount("");
      setIsPayBox(false);
    }
  };

  // Prepare data for the table
  const buyinData: BuyinData[] = useMemo(() => {
    return players.flatMap(player =>
      player.buyins.map(buyin => ({
        id: buyin.id,
        playerId: player.id,
        playerName: player.name,
        amount: buyin.amount,
        timestamp: buyin.timestamp,
        isPayBox: buyin.isPayBox
      }))
    );
  }, [players]);

  // Sorting function
  const sortedData = useMemo(() => {
    const comparator = (a: BuyinData, b: BuyinData) => {
      if (orderBy === 'timestamp') {
        return order === 'desc' 
          ? b.timestamp - a.timestamp
          : a.timestamp - b.timestamp;
      }
      return 0;
    };

    return [...buyinData]
      .sort(comparator)
      .filter(buyin => 
        (selectedPlayerFilter === 'all' || buyin.playerId === selectedPlayerFilter) &&
        (payboxFilter === 'all' || 
         (payboxFilter === 'paybox' && buyin.isPayBox) ||
         (payboxFilter === 'regular' && !buyin.isPayBox))
      );
  }, [buyinData, order, orderBy, selectedPlayerFilter, payboxFilter]);

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

  const [playerFilterAnchor, setPlayerFilterAnchor] = useState<null | HTMLElement>(null);
  const [typeFilterAnchor, setTypeFilterAnchor] = useState<null | HTMLElement>(null);

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Buy-ins
      </Typography>

      <form onSubmit={handleSubmit} className="form-row">
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Player</InputLabel>
            <Select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
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
            label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            size="small"
            inputProps={{ step: "0.5" }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isPayBox}
                onChange={(e) => setIsPayBox(e.target.checked)}
              />
            }
            label="PayBox"
          />

          <Button
            type="submit"
            variant="contained"
            disabled={!selectedPlayerId || !amount}
            sx={{
              bgcolor: '#673ab7',
              '&:hover': { bgcolor: '#563098' }
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
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Name
                  <IconButton 
                    size="small" 
                    onClick={(e) => setPlayerFilterAnchor(e.currentTarget)}
                    sx={{ ml: 1 }}
                  >
                    <FilterListIcon fontSize="small" color={selectedPlayerFilter !== 'all' ? 'primary' : 'inherit'} />
                  </IconButton>
                </Box>
                <Menu
                  anchorEl={playerFilterAnchor}
                  open={Boolean(playerFilterAnchor)}
                  onClose={() => setPlayerFilterAnchor(null)}
                >
                  <MenuItem 
                    onClick={() => {
                      setSelectedPlayerFilter('all');
                      setPlayerFilterAnchor(null);
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox 
                        checked={selectedPlayerFilter === 'all'} 
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText>All Players</ListItemText>
                  </MenuItem>
                  {players.map((player) => (
                    <MenuItem
                      key={player.id}
                      onClick={() => {
                        setSelectedPlayerFilter(player.id);
                        setPlayerFilterAnchor(null);
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox 
                          checked={selectedPlayerFilter === player.id} 
                          size="small"
                        />
                      </ListItemIcon>
                      <ListItemText>{player.name}</ListItemText>
                    </MenuItem>
                  ))}
                </Menu>
              </TableCell>
              <TableCell>Buyin</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Type
                  <IconButton 
                    size="small" 
                    onClick={(e) => setTypeFilterAnchor(e.currentTarget)}
                    sx={{ ml: 1 }}
                  >
                    <FilterListIcon fontSize="small" color={payboxFilter !== 'all' ? 'primary' : 'inherit'} />
                  </IconButton>
                </Box>
                <Menu
                  anchorEl={typeFilterAnchor}
                  open={Boolean(typeFilterAnchor)}
                  onClose={() => setTypeFilterAnchor(null)}
                >
                  <MenuItem 
                    onClick={() => {
                      setPayboxFilter('all');
                      setTypeFilterAnchor(null);
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox 
                        checked={payboxFilter === 'all'} 
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText>All Types</ListItemText>
                  </MenuItem>
                  <MenuItem 
                    onClick={() => {
                      setPayboxFilter('paybox');
                      setTypeFilterAnchor(null);
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox 
                        checked={payboxFilter === 'paybox'} 
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText>PayBox Only</ListItemText>
                  </MenuItem>
                  <MenuItem 
                    onClick={() => {
                      setPayboxFilter('regular');
                      setTypeFilterAnchor(null);
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox 
                        checked={payboxFilter === 'regular'} 
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText>Regular Only</ListItemText>
                  </MenuItem>
                </Menu>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((buyin) => (
              <TableRow key={buyin.id}>
                <TableCell>{formatTimeAgo(buyin.timestamp)}</TableCell>
                <TableCell>{buyin.playerName}</TableCell>
                <TableCell>₪{formatMoney(buyin.amount)}</TableCell>
                <TableCell>
                  {buyin.isPayBox && (
                    <Tooltip title="PayBox">
                      <PaymentsIcon color="primary" fontSize="small" />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleEditClick(buyin)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onRemoveBuyin(buyin.playerId, buyin.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <ThemeProvider theme={theme}>
                <DateTimePicker
                  label="Date and Time"
                  value={editDateTime}
                  onChange={(newValue) => setEditDateTime(newValue)}
                  format="DD/MM/YYYY HH:mm"
                  ampm={false}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true
                    },
                    day: {
                      sx: {
                        '&.Mui-selected': {
                          backgroundColor: '#673ab7 !important',
                          '&:hover': {
                            backgroundColor: '#563098 !important'
                          }
                        }
                      }
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
