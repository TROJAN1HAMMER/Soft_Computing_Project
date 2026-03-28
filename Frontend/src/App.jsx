// src/App.jsx

import React, { useState, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import getTheme from './theme.js'; // Import the new theme file
import Header from './components/Header'; // Import the new Header component
import PredictorPage from './pages/PredictorPage'; // Import the Predictor page
import StatisticsPage from './pages/StatisticsPage.jsx'; // Import the Statistics page
import OSSimulationPage from './pages/OSSimulationPage.jsx'; // New OS Simulation portal
import ArchitecturePage from './pages/ArchitecturePage.jsx'; // New Architecture deep-dive layer
import LiveSOCPage from './pages/LiveSOCPage.jsx'; // New Phase 8 SOC Dashboard
import { Box } from '@mui/material';

export default function App() {
  const [page, setPage] = useState('predictor');
  
  // --- NEW: Dark Mode State ---
  const [mode, setMode] = useState('dark'); // 'light' or 'dark'

  // --- NEW: Toggle Function ---
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // --- NEW: Theme Creation ---
  // This re-creates the theme whenever the 'mode' changes
  const theme = useMemo(() => getTheme(mode), [mode]);

  const renderPage = () => {
    switch (page) {
      case 'predictor':
        return <PredictorPage />;
      case 'statistics':
        return <StatisticsPage />;
      case 'architecture':
        return <ArchitecturePage />;
      case 'soc-dashboard':
        return <LiveSOCPage />;
      case 'os-simulation':
        return <OSSimulationPage />;
      default:
        return <StatisticsPage />;
    }
  };

  return (
    // ThemeProvider applies the dark/light theme
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* This normalizes styles and applies the background color */}
      
      {/* The Header now receives the mode state and the function to change it */}
      <Header 
        onNavigate={setPage} 
        page={page} 
        mode={mode}
        toggleColorMode={toggleColorMode}
      />
      
      <main>
        {renderPage()}
      </main>
      
      <Box component="footer" sx={{ textAlign: 'center', p: 2, mt: 4, color: 'text.secondary', fontSize: '0.8rem' }}>
        Hybrid Neuro-Fuzzy Intrusion Detection System | Built with React + FastAPI
      </Box>
    </ThemeProvider>
  );
}