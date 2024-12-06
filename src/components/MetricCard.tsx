import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface MetricCardProps {
  title: string;
  value: string | number;
  valueColor?: string;
}

export default function MetricCard({ title, value, valueColor }: MetricCardProps) {
  // Split the value into number and unit (₪, BB, or ~)
  const valueStr = value.toString();
  const match = valueStr.match(/^([₪~])?(-?\d+(?:,\d{3})*(?:\.\d+)?)(?: (BB))?$/);
  
  let prefix = '';
  let number = valueStr;
  let suffix = '';
  
  if (match) {
    prefix = match[1] || '';
    number = match[2];
    suffix = match[3] || '';
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3,
        borderRadius: 4,
        background: '#fff',
        border: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          color: 'text.secondary',
          fontSize: '1rem',
          fontWeight: 500
        }}
      >
        {title}
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'baseline',
        color: valueColor || 'text.primary'
      }}>
        {prefix && (
          <Typography 
            component="span"
            sx={{ 
              fontSize: '2rem',
              lineHeight: 1,
              mr: 0.5,
              opacity: prefix === '~' ? 0.7 : 1 // slightly dim the approximate sign
            }}
          >
            {prefix}
          </Typography>
        )}
        <Typography 
          variant="h2" 
          component="span"
          sx={{ 
            fontWeight: 500,
            fontSize: '3.5rem',
            lineHeight: 1
          }}
        >
          {number}
        </Typography>
        {suffix && (
          <Typography 
            component="span"
            sx={{ 
              fontSize: '2rem',
              lineHeight: 1,
              ml: 0.5
            }}
          >
            {suffix}
          </Typography>
        )}
      </Box>
    </Paper>
  );
} 