import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Popover,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { ResponsiveLine, Point } from "@nivo/line";

interface TimelineData {
  id: string;
  data: Array<{
    x: number;
    y: number;
  }>;
}

interface TimelineCardProps {
  title: string;
  data: TimelineData[];
  tooltip?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  formatTooltip?: (value: number) => string;
}

export default function TimelineCard({
  title,
  data,
  tooltip,
  yAxisLabel,
  xAxisLabel,
  formatTooltip = (value: number) => value.toString(),
}: TimelineCardProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const commonLineProps = {
    margin: { top: 20, right: 20, bottom: 50, left: 70 },
    enablePoints: true,
    pointSize: 6,
    pointColor: { theme: "background" },
    pointBorderWidth: 2,
    pointBorderColor: { from: "serieColor" },
    enableGridX: false,
    enableGridY: true,
    enableArea: true,
    areaOpacity: 0.1,
    useMesh: true,
    crosshairType: "cross" as const,
    curve: "monotoneX" as const,
    theme: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      crosshair: {
        line: {
          stroke: theme.palette.text.secondary,
          strokeWidth: 1,
          strokeOpacity: 0.35,
        },
      },
      grid: {
        line: {
          stroke: theme.palette.divider,
          strokeWidth: 1,
        },
      },
      axis: {
        ticks: {
          text: {
            fill: theme.palette.text.secondary,
          },
        },
      },
      tooltip: {
        container: {
          background: "rgba(0, 0, 0, 0.8)",
          color: "white",
          fontSize: "12px",
          borderRadius: "4px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        },
      },
      markers: {
        lineColor: theme.palette.divider,
        lineStrokeWidth: 2,
        textColor: theme.palette.text.secondary,
      },
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: yAxisLabel,
      legendOffset: -50,
      legendPosition: "middle" as const,
      tickValues: 5,
      format: (value: number) => {
        if (isMobile) {
          return value.toString();
        }
        return Number.isInteger(value) ? value.toString() : value.toFixed(1);
      },
    },
    axisBottom: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: -45,
      legend: xAxisLabel,
      legendOffset: 45,
      legendPosition: "middle" as const,
      format: (value: number) => {
        // Format the date to be more readable
        const date = new Date(value);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      },
    },
    tooltip: ({ point }: { point: Point }) => {
      const date = new Date(point.data.x as number);
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return (
        <div
          style={{
            background: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "9px 12px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          <div style={{ marginBottom: "4px" }}>{formattedDate}</div>
          <div style={{ color: point.serieColor }}>
            {formatTooltip(point.data.y as number)}
          </div>
        </div>
      );
    },
    yScale: {
      type: "linear" as const,
      min: "auto" as const,
      max: "auto" as const,
      stacked: false,
      reverse: false,
    },
    markers: [
      {
        axis: "y" as const,
        value: 0,
        lineStyle: {
          stroke: theme.palette.divider,
          strokeWidth: 2,
        },
      },
    ],
  };

  const content = (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        background: "#fff",
        border: "1px solid",
        borderColor: "rgba(0, 0, 0, 0.08)",
        height: 400,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "text.secondary",
            fontSize: "1rem",
            fontWeight: 500,
          }}
        >
          {title}
        </Typography>
        {tooltip && (
          <>
            <IconButton
              size="small"
              onClick={handleClick}
              sx={{
                color: "text.secondary",
                opacity: 0.7,
                "&:hover": {
                  opacity: 1,
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
            <Popover
              open={open}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              sx={{
                "& .MuiPopover-paper": {
                  maxWidth: "80vw",
                  p: 2,
                  bgcolor: "rgba(0, 0, 0, 0.8)",
                  color: "white",
                  borderRadius: 2,
                  fontSize: "0.875rem",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                },
              }}
            >
              <Typography sx={{ fontSize: "inherit" }}>{tooltip}</Typography>
            </Popover>
          </>
        )}
      </Box>

      <Box sx={{ height: 300 }}>
        <ResponsiveLine data={data} {...commonLineProps} />
      </Box>
    </Paper>
  );

  return content;
}
