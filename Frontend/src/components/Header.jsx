// src/components/Header.jsx

import React from 'react';
import { motion } from 'framer-motion';
import {
  AppBar,
  Box,
  Container,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import TerminalIcon from '@mui/icons-material/Terminal';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';

// A custom styled Switch for a nicer look
const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  '& .MuiSwitch-switchBase': {
    margin: 1,
    padding: 0,
    transform: 'translateX(6px)',
    '&.Mui-checked': {
      color: '#fff',
      transform: 'translateX(22px)',
      '& .MuiSwitch-thumb:before': {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          '#fff',
        )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: theme.palette.primary.main,
    width: 32,
    height: 32,
    '&::before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
        '#fff',
      )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm11.314 0l-1.473 1.473.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 100 9.743 4.872 4.872 0 000-9.743zM1.667 9.305v1.389h2.083v-1.39H1.667zm14.583 0v1.389h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
    },
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
    borderRadius: 20 / 2,
  },
}));

const Header = ({ onNavigate, page, mode, toggleColorMode }) => {
  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{ position: 'sticky', top: 0, zIndex: 1100 }}
    >
      <AppBar position="static" color="default" elevation={1} sx={{ bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Navigation Tabs */}
            <Tabs
              value={page}
              onChange={(e, newPage) => onNavigate(newPage)}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab
                value="predictor"
                label="Predictor"
                icon={<AutoAwesomeIcon />}
                iconPosition="start"
              />
              <Tab
                value="statistics"
                label="Statistics"
                icon={<BarChartIcon />}
                iconPosition="start"
              />
              <Tab
                value="architecture"
                label="Architecture"
                icon={<AccountTreeIcon />}
                iconPosition="start"
              />
              <Tab
                value="soc-dashboard"
                label="Live SOC"
                icon={<GraphicEqIcon />}
                iconPosition="start"
              />
              <Tab
                value="os-simulation"
                label="OS Simulation"
                icon={<TerminalIcon />}
                iconPosition="start"
              />
            </Tabs>
            
            {/* Dark Mode Toggle */}
            <FormControlLabel
              control={<MaterialUISwitch sx={{ m: 1 }} checked={mode === 'dark'} onChange={toggleColorMode} />}
              label={mode === 'dark' ? <DarkModeIcon sx={{color: 'primary.main'}} /> : <LightModeIcon sx={{color: 'secondary.main'}} />}
            />
          </Box>
        </Container>
      </AppBar>
    </motion.div>
  );
};

export default Header;