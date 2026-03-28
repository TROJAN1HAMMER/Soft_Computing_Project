// Frontend/src/pages/LiveSOCPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import ShieldIcon from '@mui/icons-material/Shield';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SecurityIcon from '@mui/icons-material/Security';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import NetworkGraph from '../components/NetworkGraph';

// --- SYNCHRONIZED HARDCODED DATA WITH INTEL ---
const NODES = {
  globalA:   { id: 'globalA',   label: 'Global Scient-A', os: 'Cloud-OS', role: 'Global DNS' },
  center:    { id: 'center',    label: 'Central Server',  alert: false },
  iotE:      { id: 'iotE',      label: 'IoT-Device-E',    role: 'Sensor Hub' },
  iotA4:     { id: 'iotA4',     label: 'IoT-Device-A',    role: 'Smart Camera' },
  edge7Bot:  { id: 'edge7Bot',  label: 'Edge-Client-7',   role: 'Workstation' },
  iotA2:     { id: 'iotA2',     label: 'IoT-Device-A',    role: 'Exec Terminal' },
  iotA3:     { id: 'iotA3',     label: 'IoT-Device-A',    role: 'Mobile Client' },
  web1:      { id: 'web1',      label: 'WebServer-Delta', role: 'Edge Web Server' },
  bwe:       { id: 'bwe',       label: 'Bwe-Client-5',    role: 'Workstation' },
  edge7Top:  { id: 'edge7Top',  label: 'Edge-Client-7',   role: 'Analytics Node' },
  edge7Red:  { id: 'edge7Red',  label: 'Edge Client-7',   alert: true, role: 'Compromised Node' },
  core1:     { id: 'core1',     label: 'Core-Router-2',   role: 'Core Routing' },
  core2:     { id: 'core2',     label: 'Core-Router-2',   role: 'Failover Routing' },
  iotA1:     { id: 'iotA1',     label: 'IoT-Device-A',    role: 'Wireless AP' },
  iotB:      { id: 'iotB',      label: 'IoT-Device-B',    role: 'HVAC Sensor' },
  blink1:    { id: 'blink1',    label: 'Blinking Alert',  alert: true, role: 'Rogue Device' },
  edgeR2:    { id: 'edgeR2',    label: 'Edge-Router-2',   role: 'DMZ Gateway' },
  iot3:      { id: 'iot3',      label: 'IoT-Device-3',    role: 'Access Control' }
};

const INITIAL_TRAFFIC = Array.from({ length: 24 }, (_, i) => ({ time: i, traffic: Math.random() * 50 + 100 }));

const PIE_DATA = [
  { name: 'DoS', value: 10.5, color: '#ef4444' },
  { name: 'R2L', value: 13.8, color: '#3b82f6' },
  { name: 'U2R', value: 18.2, color: '#06b6d4' },
  { name: 'Benign', value: 57.1, color: '#22c55e' }
];

const PER_CATEGORY = [
  { name: 'DoS', value: 180, color: '#ef4444' },
  { name: 'R2L', value: 120, color: '#3b82f6' },
  { name: 'U2R', value: 20, color: '#06b6d4' },
  { name: 'DoS', value: 60, color: '#ef4444' },
  { name: 'R2L', value: 20, color: '#3b82f6' },
  { name: 'Benign', value: 5, color: '#22c55e' },
];

export default function LiveSOCPage() {
  const [logs, setLogs] = useState([]);
  const [trafficData, setTrafficData] = useState(INITIAL_TRAFFIC);
  
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const panelStyle = {
    background: isDark ? 'rgba(11, 19, 36, 0.65)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)'}`,
    borderRadius: 3,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.05)'
  };

  const titleStyle = {
    fontSize: '0.8rem',
    fontWeight: '800',
    letterSpacing: 1.2,
    color: isDark ? '#e2e8f0' : '#0f172a',
    textTransform: 'uppercase',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    mb: 2
  };

  // Interval Generator for Real-Time Streaming Logs & Traffic Data
  useEffect(() => {
    // Generate some initial logs
    const seedLogs = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() - i * 1000,
      time: new Date(Date.now() - i * 1000).toLocaleTimeString().split(' ')[0],
      src: Object.values(NODES)[Math.floor(Math.random() * Object.keys(NODES).length)].label,
      msg: Math.random() > 0.8 ? `[CRITICAL] Anomalous packet matched from ${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.x.x` : '[INFO] TCP Handshake Confirmed',
      alert: Math.random() > 0.8
    }));
    setLogs(seedLogs);

    const interval = setInterval(() => {
      // Step Traffic Array Data
      setTrafficData(prev => {
         const next = [...prev.slice(1)];
         next.push({ time: next.length, traffic: Math.random() * 100 + (Math.random() > 0.8 ? 800 : 200) });
         return next;
      });
      
      // Step Live Threat Logs Data
      const isAlert = Math.random() > 0.75;
      const randomNode = Object.values(NODES)[Math.floor(Math.random() * Object.keys(NODES).length)];
      setLogs(prev => {
        const newLog = {
          id: Date.now(),
          time: new Date().toLocaleTimeString().split(' ')[0],
          src: randomNode.label,
          msg: isAlert ? `[CRITICAL DoS] Blocking Source via IDS Neural Engine` : `[TCP Scan] Secure Handshake Initialized`,
          alert: isAlert || randomNode.alert
        };
        return [newLog, ...prev.slice(0, 19)];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ width: '100%', height: 'calc(100vh - 60px)', p: 2, pr:0, display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pl: 1 }}>
        <ShieldIcon sx={{ color: '#3b82f6', fontSize: 32, mr: 1, filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.6))' }} />
        <Typography variant="h5" color={isDark ? "#fff" : "#0f172a"} fontWeight="100" sx={{ letterSpacing: 0.5 }}>Live SOC</Typography>
      </Box>

      {/* Main Grid Extensible Frame */}
      <Grid container spacing={2} sx={{ flexGrow: 1, minHeight: '85vh', height: '100%',width: '100%', m: 0 }}>
        
        {/* COLUMN 1: LIVE STREAMING LOGS (Width 25%) */}
        <Grid item xs={12} lg={2.5} sx={{ height: '100%' }}>
          <Paper sx={{ ...panelStyle, height: '100%', p: 2 }}>
            <Box>
              <Typography sx={titleStyle}>
                LIVE STREAMING LOGS
                <MoreHorizIcon sx={{ color: isDark ? '#64748b' : '#94a3b8' }} fontSize="small" />
              </Typography>
            </Box>
            
            {/* Highly Padded Log Generator List */}
            <Box sx={{ flex: 1, overflowY: 'auto', mt: 2, pr: 1, display: 'flex', flexDirection: 'column', gap: 2, '&::-webkit-scrollbar': {
    display: 'none',
  },
  scrollbarWidth: 'none', // For Firefox
  msOverflowStyle: 'none', // For IE/Edge
  }}>
              <AnimatePresence>
                {logs.map((log) => (
                  <motion.div 
                    key={log.id} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    layout
                    style={{ 
                      padding: '12px 14px', 
                      backgroundColor: log.alert ? (isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)') : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
                      borderLeft: `3px solid ${log.alert ? '#ef4444' : '#3b82f6'}`,
                      borderRadius: '6px'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: 0.8, fontFamily: 'monospace', mb: 0.5 }}>
                      [{log.time}] {log.alert ? <SecurityIcon sx={{ fontSize: 14, color: '#ef4444' }} /> : <GraphicEqIcon sx={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b' }} />} {log.src}
                    </Typography>
                    <Typography variant="body2" sx={{ color: log.alert ? (isDark ? '#e2e8f0' : '#0f172a') : (isDark ? '#64748b' : '#475569'), fontSize: '0.85rem', lineHeight: 1.5 }}>
                      {log.msg}
                    </Typography>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Box>
          </Paper>
        </Grid>

        {/* COLUMN 2: ANALYTICS DASHBOARD (Width 25%) */}
        <Grid item xs={12} lg={2.5} sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {/* AI THREAT DETECTION ENGINE */}
          <Paper sx={{ ...panelStyle, p: 2, flex: '0 0 auto' }}>
            <Typography sx={titleStyle}>
              AI THREAT DETECTION ENGINE
              <MoreHorizIcon sx={{ color: isDark ? '#64748b' : '#94a3b8' }} fontSize="small" />
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', display: 'block', mb: 2 }}>ML model output : real-time metrics</Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1.5 }}>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', width: 30, fontWeight: 'bold' }}>DoS:</Typography>
              <Box sx={{ flex: 1, height: 16, background: 'linear-gradient(90deg, #991b1b 0%, #ef4444 100%)', borderRadius: 4, boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' }} />
              <Typography variant="caption" sx={{ color: '#ef4444', width: 90, fontWeight: 'bold' }}>98.2% <span style={{ fontSize: '0.6rem' }}>(CRIT)</span></Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1.5 }}>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', width: 30, fontWeight: 'bold' }}>R2L:</Typography>
              <Box sx={{ flex: 1, height: 8, bgcolor: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.15)', borderRadius: 4 }}>
                <motion.div animate={{ width: ['1.5%', '2%', '1.5%'] }} transition={{ duration: 3, repeat: Infinity }} style={{ height: '100%', backgroundColor: '#3b82f6', borderRadius: 4 }} />
              </Box>
              <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', width: 90 }}>1.5%</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1.5 }}>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', width: 30, fontWeight: 'bold' }}>U2R:</Typography>
              <Box sx={{ flex: 1, height: 8, bgcolor: isDark ? 'rgba(6,182,212,0.3)' : 'rgba(6,182,212,0.15)', borderRadius: 4 }}>
                <Box sx={{ width: '0.1%', height: '100%', bgcolor: '#06b6d4', borderRadius: 4 }} />
              </Box>
              <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', width: 90 }}>0.1%</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', width: 30, fontWeight: 'bold' }}>Nor:</Typography>
              <Box sx={{ flex: 1, height: 8, bgcolor: isDark ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.15)', borderRadius: 4 }}>
                <Box sx={{ width: '0.2%', height: '100%', bgcolor: '#22c55e', borderRadius: 4 }} />
              </Box>
              <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', width: 90 }}>0.2%</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, pt: 1.5 }}>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Accuracy: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>99.1%</span></Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>False Positives: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>0.05%</span></Typography>
            </Box>
          </Paper>
          
          <Paper sx={{ ...panelStyle, p: 2, flex: 1, overflowY: 'auto' }}>
            <Typography sx={titleStyle}>
              ANALYTICS DASHBOARD
              <MoreHorizIcon sx={{ color: isDark ? '#64748b' : '#94a3b8' }} fontSize="small" />
            </Typography>
            
            <Box sx={{ height: 160, display: 'flex', mt: 1 }}>
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie data={PIE_DATA} innerRadius="60%" outerRadius="80%" stroke="none" dataKey="value">
                     {PIE_DATA.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 0 5px ${entry.color})` }} />
                     ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
                 {PIE_DATA.map(d => (
                   <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: d.color, boxShadow: `0 0 8px ${d.color}` }} />
                     <Typography variant="caption" color={isDark ? "#e2e8f0" : "#0f172a"}>{d.name}</Typography>
                   </Box>
                 ))}
              </Box>
            </Box>

            <Typography variant="caption" sx={{ color: isDark ? '#e2e8f0' : '#0f172a', mt: 2, mb: 1, display: 'block', fontWeight: 'bold' }}>Traffic Over Time</Typography>
            <Box sx={{ height: 100, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData}>
                  <defs>
                     <linearGradient id="colorBlink" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                       <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="traffic" stroke="#ef4444" fill="url(#colorBlink)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>

            <Typography variant="caption" sx={{ color: isDark ? '#e2e8f0' : '#0f172a', mt: 2, mb: 1, display: 'block', fontWeight: 'bold' }}>Detections Per Category</Typography>
            <Box sx={{ height: 100, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PER_CATEGORY} barSize={10} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8' }} />
                  <CartesianGrid vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                     {PER_CATEGORY.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                  </Bar>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* COLUMN 3: MASSIVE SVG NETWORK GRAPH (Width 50%) */}
        <Grid item xs={12} lg={7} sx={{ height: '100%', pr: 0 }}>
          <NetworkGraph />
        </Grid>

      </Grid>
    </Box>
  );
}
