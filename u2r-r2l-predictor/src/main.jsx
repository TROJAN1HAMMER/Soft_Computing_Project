// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useMemo, useState } from 'react';
import getTheme from './theme';

function ThemedApp() {
  const [mode, setMode] = useState('dark');
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App setMode={setMode} mode={mode} />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ThemedApp />);
