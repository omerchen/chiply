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

interface ClubBreadcrumbsProps {
  clubId: string;
  clubName: string;
  currentPage?: string;
}

function ClubBreadcrumbs({ clubId, clubName, currentPage }: ClubBreadcrumbsProps) {
  return (
    <Box sx={{ mb: 3, mt: 1 }}>
      <Stack 
        direction="row" 
        spacing={1} 
        alignItems="center"
      >
        <BreadcrumbLink to="/clubs">
          Clubs
        </BreadcrumbLink>

        <NavigateNextIcon 
          sx={{ 
            color: 'text.secondary',
            fontSize: 18
          }} 
        />

        {currentPage ? (
          <>
            <BreadcrumbLink to={`/clubs/${clubId}`}>
              {clubName}
            </BreadcrumbLink>

            <NavigateNextIcon 
              sx={{ 
                color: 'text.secondary',
                fontSize: 18
              }} 
            />

            <BreadcrumbText variant="body2">
              {currentPage}
            </BreadcrumbText>
          </>
        ) : (
          <BreadcrumbText variant="body2">
            {clubName}
          </BreadcrumbText>
        )}
      </Stack>
    </Box>
  );
}

export default ClubBreadcrumbs; 