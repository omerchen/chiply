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
import { ResponsivePie } from "@nivo/pie";

interface PieChartData {
  id: string;
  label: string;
  value: number;
  color?: string;
}

interface PieChartCardProps {
  title: string;
  data: PieChartData[];
  tooltip?: string;
}

export default function PieChartCard({
  title,
  data,
  tooltip,
}: PieChartCardProps) {
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

  const commonPieProps = {
    margin: isMobile
      ? { top: 40, right: 20, bottom: 20, left: 20 } // Extra top margin for legend on mobile
      : { top: 20, right: 80, bottom: 20, left: 80 },
    innerRadius: 0.5,
    padAngle: 0.7,
    cornerRadius: 3,
    activeOuterRadiusOffset: 8,
    borderWidth: 1,
    borderColor: {
      from: "color",
      modifiers: [["darker", 0.2]] as Array<["darker", number]>,
    },
    enableArcLinkLabels: !isMobile, // Disable link labels on mobile
    arcLinkLabelsSkipAngle: 10,
    arcLinkLabelsTextColor: "#333333",
    arcLinkLabelsThickness: 2,
    arcLinkLabelsColor: { from: "color" },
    arcLabelsSkipAngle: 10,
    arcLabelsTextColor: {
      from: "color",
      modifiers: [["darker", 2]] as Array<["darker", number]>,
    },
    legends: isMobile
      ? [
          {
            anchor: "top" as const,
            direction: "row" as const,
            itemDirection: "left-to-right" as const,
            translateX: 0,
            translateY: -20,
            itemsSpacing: 0,
            itemWidth: 100,
            itemHeight: 18,
            itemTextColor: "#999",
            symbolSize: 12,
            symbolShape: "circle" as const,
          },
        ]
      : [],
    theme: {
      text: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamily,
      },
    },
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
        <ResponsivePie data={data} {...commonPieProps} />
      </Box>
    </Paper>
  );

  return content;
}
