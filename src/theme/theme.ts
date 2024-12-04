import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  typography: {
    fontFamily: ['Nunito', 'sans-serif'].join(','),
    // Optionally configure specific variants
    h1: {
      fontFamily: 'Nunito, sans-serif',
    },
    h2: {
      fontFamily: 'Nunito, sans-serif',
    },
    h3: {
      fontFamily: 'Nunito, sans-serif',
    },
    body1: {
      fontFamily: 'Nunito, sans-serif',
    },
    body2: {
      fontFamily: 'Nunito, sans-serif',
    },
    button: {
      fontFamily: 'Nunito, sans-serif',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'Nunito';
          font-style: normal;
          font-display: swap;
          font-weight: 400;
        }
      `,
    },
  },
}); 