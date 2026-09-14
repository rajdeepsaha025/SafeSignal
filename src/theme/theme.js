import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1565C0',
      light: '#A9C7FF',
      dark: '#00468C',
      container: '#1565C0',
      onContainer: '#DAE5FF',
    },
    secondary: {
      main: '#2E7D32',
      light: '#A3F69C',
      dark: '#005312',
    },
    error: {
      main: '#BA1A1A',
      light: '#FFDAD6',
      dark: '#93000A',
    },
    warning: {
      main: '#F9A825',
      light: '#FFDDB5',
      dark: '#643F00',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
      surfaceDim: '#FFFFFF',
      surfaceBright: '#FFFFFF',
      surfaceContainer: '#FFFFFF',
      surfaceContainerHigh: '#FFFFFF',
      surfaceContainerLowest: '#FFFFFF',
    },
    text: {
      primary: '#141B2B',
      secondary: '#424752',
    },
    outline: {
      main: '#727783',
      variant: '#C2C6D4',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.25,
    },
    h3: {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.35,
    },
    h5: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.4,
    },
    body1: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
    button: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      textTransform: 'none',
    },
    caption: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '0.75rem',
      lineHeight: 1.33,
    },
  },
  shape: {
    borderRadius: 8, // Standard small components (buttons, textfields)
    containerRadius: 20, // Large panels, cards
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          border: '1px solid #C2C6D4',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

export default theme;
