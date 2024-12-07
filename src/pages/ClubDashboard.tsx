import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { subDays, isValid, format } from 'date-fns';
import EditIcon from '@mui/icons-material/Edit';
import ClubBreadcrumbs from '../components/ClubBreadcrumbs';

type DateRangeOption = "all" | "7days" | "30days" | "90days" | "custom";

interface DateRange {
  start: Date | null;
  end: Date | null;
}

function ClubDashboard() {
  const { clubId } = useParams<{ clubId: string }>();
  const [clubName, setClubName] = useState('');
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [isCustomDatePickerOpen, setIsCustomDatePickerOpen] = useState(false);

  const handleDateRangeChange = (option: DateRangeOption) => {
    setDateRangeOption(option);
    if (option === "custom") {
      // If we already have a custom range, keep it
      if (!customDateRange.start || !customDateRange.end) {
        // Set default range to last 30 days if no custom range exists
        const end = new Date();
        const start = subDays(end, 30);
        setCustomDateRange({ start, end });
      }
      setIsCustomDatePickerOpen(true);
    } else {
      // Set predefined date ranges
      const end = new Date();
      let start: Date | null = null;

      switch (option) {
        case "7days":
          start = subDays(end, 7);
          break;
        case "30days":
          start = subDays(end, 30);
          break;
        case "90days":
          start = subDays(end, 90);
          break;
        case "all":
        default:
          start = null;
          break;
      }

      setCustomDateRange({ start, end: option === "all" ? null : end });
    }
  };

  const handleCustomDateRangeConfirm = () => {
    if (isValid(customDateRange.start) && isValid(customDateRange.end)) {
      setIsCustomDatePickerOpen(false);
    }
  };

  const getDateRangeText = () => {
    if (dateRangeOption === "all") return "All Time";
    if (dateRangeOption === "7days") return "Last 7 Days";
    if (dateRangeOption === "30days") return "Last 30 Days";
    if (dateRangeOption === "90days") return "Last 90 Days";
    if (
      dateRangeOption === "custom" &&
      customDateRange.start &&
      customDateRange.end
    ) {
      return `${format(customDateRange.start, "dd/MM/yyyy")} - ${format(
        customDateRange.end,
        "dd/MM/yyyy"
      )}`;
    }
    return "Custom Range";
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
      <ClubBreadcrumbs 
        clubId={clubId!} 
        clubName={clubName}
        currentPage="Dashboard"
      />
      
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{
            fontWeight: "bold",
            background: "linear-gradient(45deg, #673ab7, #9c27b0)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 4
          }}
        >
          Club Dashboard
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
          <Box sx={{ minWidth: 200, flex: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="date-range-select-label">Date Range</InputLabel>
              <Select
                labelId="date-range-select-label"
                id="date-range-select"
                value={dateRangeOption}
                label="Date Range"
                onChange={(e) =>
                  handleDateRangeChange(e.target.value as DateRangeOption)
                }
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="7days">Last 7 Days</MenuItem>
                <MenuItem value="30days">Last 30 Days</MenuItem>
                <MenuItem value="90days">Last 90 Days</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Showing data for: {getDateRangeText()}
          </Typography>
          {dateRangeOption === "custom" && (
            <Tooltip title="Edit Date Range">
              <IconButton
                size="small"
                onClick={() => setIsCustomDatePickerOpen(true)}
                sx={{ color: "text.secondary" }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Custom Date Range Dialog */}
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          {isCustomDatePickerOpen && (
            <Paper
              elevation={3}
              sx={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                p: 3,
                zIndex: 1000,
                minWidth: 300,
                backgroundColor: "background.paper",
              }}
            >
              <Stack spacing={3}>
                <Typography variant="h6">Select Date Range</Typography>
                <DatePicker
                  label="Start Date"
                  value={customDateRange.start}
                  onChange={(date) =>
                    setCustomDateRange((prev) => ({ ...prev, start: date }))
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={customDateRange.end}
                  onChange={(date) =>
                    setCustomDateRange((prev) => ({ ...prev, end: date }))
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Tooltip title="Cancel">
                    <IconButton
                      onClick={() => setIsCustomDatePickerOpen(false)}
                      sx={{ color: "text.secondary" }}
                    >
                      Cancel
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Apply">
                    <IconButton
                      onClick={handleCustomDateRangeConfirm}
                      sx={{ color: "primary.main" }}
                      disabled={!customDateRange.start || !customDateRange.end}
                    >
                      Apply
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>
          )}
        </LocalizationProvider>
      </Paper>
    </Container>
  );
}

export default ClubDashboard; 