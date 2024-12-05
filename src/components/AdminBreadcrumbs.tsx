import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { styled } from '@mui/material/styles';

const BreadcrumbLink = styled(RouterLink)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textDecoration: 'none',
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeightRegular,
  fontSize: 14,
  lineHeight: '20px',
  '&:hover': {
    color: '#673ab7',
    textDecoration: 'underline'
  }
}));

const BreadcrumbText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeightRegular,
  fontSize: 14,
  lineHeight: '20px'
}));

interface AdminBreadcrumbsProps {
  currentPage: string;
  intermediateLinks?: Array<{
    label: string;
    to: string;
  }>;
}

function AdminBreadcrumbs({ currentPage, intermediateLinks = [] }: AdminBreadcrumbsProps) {
  return (
    <Box sx={{ mb: 3, mt: 1 }}>
      <Stack 
        direction="row" 
        spacing={1} 
        alignItems="center"
      >
        <BreadcrumbLink to="/admin">
          Admin Panel
        </BreadcrumbLink>

        <NavigateNextIcon 
          sx={{ 
            color: 'text.secondary',
            fontSize: 18
          }} 
        />

        {intermediateLinks.map((link, index) => (
          <React.Fragment key={link.to}>
            <BreadcrumbLink to={link.to}>
              {link.label}
            </BreadcrumbLink>

            <NavigateNextIcon 
              sx={{ 
                color: 'text.secondary',
                fontSize: 18
              }} 
            />
          </React.Fragment>
        ))}

        <BreadcrumbText variant="body2">
          {currentPage}
        </BreadcrumbText>
      </Stack>
    </Box>
  );
}

export default AdminBreadcrumbs; 