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
  isSessionClosed?: boolean;
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

function BuyinForm({ players, onBuyin, onRemoveBuyin, onEditBuyin, isSessionClosed }: BuyinFormProps) {
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
              disabled={isSessionClosed}
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
            disabled={isSessionClosed}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isPayBox}
                onChange={(e) => setIsPayBox(e.target.checked)}
                disabled={isSessionClosed}
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
            disabled={!selectedPlayerId || !amount || isSessionClosed}
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

      <TableContainer 
        component={Paper} 
        sx={{ 
          mb: 3,
          width: { xs: 'calc(100% + 24px)', sm: '100%' },
          mx: { xs: -1.5, sm: 0 }
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  display: { xs: 'none', sm: 'table-cell' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                Time
              </TableCell>
              <TableCell sx={{ px: { xs: 1, sm: 2 } }}>Name</TableCell>
              <TableCell align="right" sx={{ px: { xs: 1, sm: 2 } }}>Type</TableCell>
              <TableCell align="right" sx={{ px: { xs: 1, sm: 2 } }}>Amount</TableCell>
              <TableCell 
                align="right" 
                sx={{ 
                  width: { xs: 80, sm: 100 },
                  px: { xs: 1, sm: 2 }
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((buyin) => {
              const player = players.find(p => p.id === buyin.playerId);
              if (!player) return null;

              return (
                <TableRow key={buyin.id}>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {formatTimeAgo(buyin.timestamp)}
                  </TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell align="right">
                    {buyin.isPayBox ? (
                      <Chip 
                        icon={<PaymentsIcon />} 
                        label="PayBox" 
                        size="small"
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }} 
                      />
                    ) : 'Cash'}
                  </TableCell>
                  <TableCell align="right">₪{formatMoney(buyin.amount)}</TableCell>
                  <TableCell align="right">
                    <Stack 
                      direction="row" 
                      spacing={1} 
                      justifyContent="flex-end"
                      sx={{ 
                        '& .MuiIconButton-root': {
                          padding: { xs: '4px', sm: '8px' }
                        }
                      }}
                    >
                      <Tooltip title="Edit">
                        <span>
                          <IconButton
                            onClick={() => handleEditClick(buyin)}
                            disabled={isSessionClosed}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            onClick={() => onRemoveBuyin(buyin.playerId, buyin.id)}
                            disabled={isSessionClosed}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
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
              disabled={isSessionClosed}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <ThemeProvider theme={theme}>
                <DateTimePicker
                  label="Date and Time"
                  value={editDateTime}
                  onChange={(newValue) => setEditDateTime(newValue)}
                  format="DD/MM/YYYY HH:mm"
                  ampm={false}
                  disabled={isSessionClosed}
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
                  disabled={isSessionClosed}
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
            disabled={isSessionClosed}
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
