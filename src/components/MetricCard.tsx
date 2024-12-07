import React, { useState } from 'react';
import { Paper, Typography, Box, Popover, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface MetricCardProps {
  title: string;
  value: string | number;
  valueColor?: string;
  tooltip?: string;
}

export default function MetricCard({ title, value, valueColor, tooltip }: MetricCardProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Split the value into number and unit (₪, BB, or ~)
  const valueStr = value.toString();
  const match = valueStr.match(/^([₪~])?(-?\d+(?:,\d{3})*(?:\.\d+)?)(?: (BB|%))?$/);
  
  let prefix = '';
  let number = valueStr;
  let suffix = '';
  
  if (match) {
    prefix = match[1] || '';
    number = match[2];
    suffix = match[3] || '';
  }

  const content = (
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
        gap: 2,
        position: 'relative'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start'
      }}>
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
        {tooltip && (
          <>
            <IconButton 
              size="small" 
              onClick={handleClick}
              sx={{ 
                color: 'text.secondary',
                opacity: 0.7,
                '&:hover': {
                  opacity: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
            <Popover
              open={open}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              sx={{
                '& .MuiPopover-paper': {
                  maxWidth: '80vw',
                  p: 2,
                  bgcolor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }
              }}
            >
              <Typography sx={{ fontSize: 'inherit' }}>
                {tooltip}
              </Typography>
            </Popover>
          </>
        )}
      </Box>
      
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

  return content;
} 