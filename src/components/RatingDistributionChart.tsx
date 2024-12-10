import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { SessionDetails } from "../types/session";

interface RatingDistributionChartProps {
  sessions: {
    sessionId: string;
  }[];
  allSessions: SessionDetails[];
  player: {
    ratings?: {
      [sessionId: string]: {
        rate: number;
      };
    };
  } | null;
}

const getRatingEmoji = (rating: number) => {
  switch (rating) {
    case 5:
      return "🤩";
    case 4:
      return "🙂";
    case 3:
      return "😐";
    case 2:
      return "🫤";
    case 1:
      return "😡";
    default:
      return "";
  }
};

export default function RatingDistributionChart({
  sessions,
  allSessions,
  player,
}: RatingDistributionChartProps) {
  const getRatingData = () => {
    if (!player?.ratings) return [];

    return [1, 2, 3, 4, 5].map((rating) => ({
      rating: getRatingEmoji(rating),
      count: sessions.filter((session) => {
        return player.ratings?.[session.sessionId]?.rate === rating;
      }).length,
    }));
  };

  const getAverageRating = () => {
    if (!player?.ratings) return 0;

    const ratedSessions = sessions.filter(
      (session) => player.ratings?.[session.sessionId]?.rate
    );

    if (ratedSessions.length === 0) return 0;

    const totalRating = ratedSessions.reduce(
      (sum, session) => sum + (player.ratings?.[session.sessionId]?.rate || 0),
      0
    );

    return totalRating / ratedSessions.length;
  };

  // Don't show the chart if there are no ratings
  const data = getRatingData();
  const hasRatings = data.some((item) => item.count > 0);
  const avgRating = getAverageRating();

  if (!hasRatings) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Session Ratings Distribution
        </Typography>
        <Typography color="text.secondary">
          No session ratings available for the selected time period.
        </Typography>
      </Paper>
    );
  }

  // Add this useMediaQuery hook at the top of the component
  const isMobile = window.innerWidth <= 600;

  return (
    <Paper
      elevation={3}
      sx={{ p: { xs: 2, sm: 3 }, mb: 4, height: { xs: 370, sm: 400 } }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">Session Ratings Distribution</Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: "rgba(103, 58, 183, 0.1)",
            px: 2,
            py: 1,
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Avg. Rate:
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: "#673ab7", display: "flex", alignItems: "center" }}
          >
            {avgRating.toFixed(1)} {getRatingEmoji(Math.round(avgRating))}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ height: { xs: 250, sm: 300 } }}>
        <ResponsiveBar
          data={data}
          keys={["count"]}
          indexBy="rating"
          margin={{
            top: 20,
            right: 20,
            bottom: 40,
            left: isMobile ? 32 : 40,
          }}
          padding={0.3}
          valueScale={{ type: "linear" }}
          colors={"#673ab7"}
          borderRadius={4}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Rating",
            legendPosition: "middle",
            legendOffset: 32,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: isMobile ? undefined : "Number of Sessions",
            legendPosition: "middle",
            legendOffset: -32,
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={"#ffffff"}
          role="application"
          ariaLabel="Session ratings distribution"
          barAriaLabel={(e) => `Rating ${e.indexValue}: ${e.value} sessions`}
          theme={{
            text: {
              fontFamily: "'Nunito', sans-serif",
            },
            axis: {
              ticks: {
                text: {
                  fontSize: isMobile ? 14 : 16,
                  fontFamily: "'Nunito', sans-serif",
                },
              },
              legend: {
                text: {
                  fontSize: 12,
                  fontFamily: "'Nunito', sans-serif",
                },
              },
            },
            labels: {
              text: {
                fontFamily: "'Nunito', sans-serif",
              },
            },
          }}
        />
      </Box>
    </Paper>
  );
}
