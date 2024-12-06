import React, { ReactNode } from "react";
import { Box, Typography, Stack } from "@mui/material";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
      }}
    >
      <Stack spacing={2} alignItems="center">
        {icon}
        <Typography variant="h6" color="text.primary">
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          {description}
        </Typography>
      </Stack>
    </Box>
  );
}

export default EmptyState; 