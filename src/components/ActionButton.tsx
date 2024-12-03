import React from 'react';
import { Fab, Tooltip } from '@mui/material';

interface ActionButtonProps {
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
  placement?: "left" | "right" | "top" | "bottom";
}

function ActionButton({ title, onClick, icon, placement = "left" }: ActionButtonProps) {
  return (
    <Tooltip title={title} placement={placement}>
      <Fab
        onClick={onClick}
        aria-label={title.toLowerCase()}
        sx={{ 
          bgcolor: '#673ab7',
          '&:hover': { bgcolor: '#563098' },
          '& .MuiSvgIcon-root': {
            color: '#fff'
          }
        }}
      >
        {icon}
      </Fab>
    </Tooltip>
  );
}

export default ActionButton; 