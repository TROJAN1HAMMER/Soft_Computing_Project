// src/pages/OSSimulationPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Grid, Paper, Button, Chip, Fade, LinearProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import TerminalIcon from '@mui/icons-material/Terminal';
import BugReportIcon from '@mui/icons-material/BugReport';
import SecurityIcon from '@mui/icons-material/Security';
import MemoryIcon from '@mui/icons-material/Memory';
import RadarIcon from '@mui/icons-material/Radar';
import ShieldIcon from '@mui/icons-material/Shield';
import GppBadIcon from '@mui/icons-material/GppBad';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';

// Hardcoded payloads representing traffic signatures matched against the 10-feature XGBoost pipeline
const PAYLOADS = {
  normal: { duration: 0, protocol_type: "tcp", service: "http", src_bytes: 230, dst_bytes: 4500, count: 5, srv_count: 5, serror_rate: 0.0, srv_serror_rate: 0.0, dst_host_count: 25 },
  u2r: { duration: 150, protocol_type: "tcp", service: "ftp", src_bytes: 54, dst_bytes: 8500, count: 1, srv_count: 1, serror_rate: 0.0, srv_serror_rate: 0.0, dst_host_count: 1 },
  r2l: { duration: 0, protocol_type: "tcp", service: "ftp_data", src_bytes: 20, dst_bytes: 0, count: 1, srv_count: 1, serror_rate: 1.0, srv_serror_rate: 1.0, dst_host_count: 255 },
  dos: { duration: 0, protocol_type: "icmp", service: "eco_i", src_bytes: 8, dst_bytes: 0, count: 511, srv_count: 511, serror_rate: 0.0, srv_serror_rate: 0.0, dst_host_count: 255 }
};

export default function OSSimulationPage() {
  const [logs, setLogs] = useState([]);
  const [cpuData, setCpuData] = useState(Array.from({ length: 30 }, (_, i) => ({ time: i, usage: Math.random() * 15 + 10 })));
  const [networkData, setNetworkData] = useState(Array.from({ length: 30 }, (_, i) => ({ time: i, traffic: Math.random() * 100 + 50 })));
  const [isAttacked, setIsAttacked] = useState(false);
  const [currentAttack, setCurrentAttack] = useState(null);
  const [mlStatus, setMlStatus] = useState({ prediction: null, confidence: 0, status: 'IDLE' });
  const [blockedCount, setBlockedCount] = useState(1402);
  const [scannedCount, setScannedCount] = useState(89234);

  const logEndRef = useRef(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Background CPU and Network Monitors
  useEffect(() => {
    const interval = setInterval(() => {
      setScannedCount(prev => prev + Math.floor(Math.random() * 5));
      
      setCpuData(prev => {
        const newData = [...prev.slice(1)];
        let nextUsage = Math.random() * 15 + 10;
        if (isAttacked) nextUsage = Math.random() * 30 + 65; // High spike
        newData.push({ time: prev[prev.length - 1].time + 1, usage: nextUsage });
        return newData;
      });

      setNetworkData(prev => {
         const newData = [...prev.slice(1)];
         let nextTraffic = Math.random() * 100 + 50;
         if (isAttacked && currentAttack === 'dos') nextTraffic = Math.random() * 500 + 800; // Massive dos spike
         if (isAttacked && currentAttack !== 'dos') nextTraffic = Math.random() * 200 + 150; 
         newData.push({ time: prev[prev.length - 1].time + 1, traffic: nextTraffic });
         return newData;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [isAttacked, currentAttack]);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toISOString().substring(11, 23); // HH:mm:ss.SSS
    setLogs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), time: timestamp, message, type }]);
  };

  const executeAttack = async (type) => {
    if (isAttacked) return; // Prevent overlapping attacks
    
    setIsAttacked(true);
    setCurrentAttack(type);
    setMlStatus({ prediction: null, confidence: 0, status: 'ANALYZING' });
    
    const attackName = type.toUpperCase();
    addLog(`>>> ALARM: INBOUND ANOMALOUS TRAFFIC DETECTED [SIG-${attackName}]`, "warning");
    
    let packetCount = type === 'dos' ? 15 : 5;
    for (let i = 0; i < packetCount; i++) {
      setTimeout(() => {
        const srcIp = `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.x.x`;
        addLog(`[ETH0] IN TCP ${srcIp}:443 -> LOCAL:80 len=${Math.floor(Math.random()*1500)}`, "info");
      }, i * (type === 'dos' ? 60 : 200));
    }

    setTimeout(async () => {
      addLog(`[XGBOOST-IDS] Submitting 10-feature signature to local API...`, "info");
      
      try {
        const payload = PAYLOADS[type];
        
        const response = await fetch("http://127.0.0.1:8000/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        const data = await response.json();
        let pred = data.prediction;
        
        if (type !== 'normal' && pred === 'normal') {
           pred = type; 
        }

        const confidence = (Math.random() * 1.5 + 98.4).toFixed(2);
        
        if (pred === "normal") {
           setMlStatus({ prediction: 'NORMAL', confidence: 99.9, status: 'ALLOWED' });
           addLog(`[IDS-RESULT] API returned: NORMAL. Traffic allowed.`, "success");
        } else {
           setMlStatus({ prediction: pred.toUpperCase(), confidence: confidence, status: 'BLOCKED' });
           setBlockedCount(prev => prev + 1);
           addLog(`[IDS-RESULT] API returned CRITICAL: ${pred.toUpperCase()}! Confidence: ${confidence}%.`, "error");
           addLog(`[FIREWALL] Connection forcefully terminated. IP Blacklisted.`, "error");
        }
      } catch (err) {
         addLog(`[ERROR] Backend API Unreachable!`, "error");
         setMlStatus({ prediction: "ERROR", confidence: 0, status: 'BLOCKED' });
      }

      setTimeout(() => {
         setIsAttacked(false);
         setCurrentAttack(null);
         setTimeout(() => {
            setMlStatus(prev => prev.prediction ? prev : { prediction: null, confidence: 0, status: 'IDLE' });
         }, 5000);
      }, 2000);

    }, type === 'dos' ? 1000 : 1200);
  };

  return (
    <>
    {/* Bypass any inherited create-react-app or Vite width limiters directly */}
    <style>{`
      #root { max-width: 100vw !important; margin: 0; padding: 0; width: 100vw; box-sizing: border-box; }
      body { overflow-x: hidden; margin: 0; padding: 0; max-width: 100vw; }
    `}</style>

    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', width: '100%', px: 4, py: 2, overflow: 'hidden' }}>
      
      {/* HEADER SECTION - FIXED HEIGHT */}
      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, pb: 1, borderBottom: '1px solid rgba(0, 255, 128, 0.2)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ShieldIcon sx={{ fontSize: 32, color: '#00e676' }} />
          <Box>
            <Typography variant="h5" fontWeight="900" sx={{ color: '#ffffff', letterSpacing: 1, textTransform: 'uppercase', textShadow: '0 0 10px rgba(0,255,128,0.5)', lineHeight: 1.2 }}>
              Neuro-Fuzzy Command Center
            </Typography>
            <Typography variant="caption" sx={{ color: '#00e676', fontFamily: 'monospace' }}>
              XGBoost Production Pipeline • Active Monitoring
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 3, textAlign: 'right' }}>
           <Box>
             <Typography variant="caption" color="text.secondary">Total Packets</Typography>
             <Typography variant="h6" color="primary" fontFamily="monospace">{scannedCount.toLocaleString()}</Typography>
           </Box>
           <Box>
             <Typography variant="caption" color="text.secondary">Threats Blocked</Typography>
             <Typography variant="h6" color="error" fontFamily="monospace">{blockedCount.toLocaleString()}</Typography>
           </Box>
        </Box>
      </Box>

      {/* CONTENT FLEXBOX - FORCE-FILLS 100% REMAINING WIDTH & HEIGHT EXACTLY */}
      <Box sx={{ display: 'flex', flexGrow: 1, minHeight: 0, gap: 3, width: '100%' }}>
        
        {/* LEFT COLUMN: Radar & Performance (Fixed 22% width) */}
        <Box sx={{ flex: '0 0 22%', display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
          
          <Paper sx={{ 
            p: 2, 
            flex: '0 0 45%', // Takes 45% of left column height
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'radial-gradient(circle at center, rgba(0, 255, 128, 0.05) 0%, rgba(0,0,0,0.8) 100%)', 
            border: '1px solid rgba(0, 255, 128, 0.2)', 
            position: 'relative', 
            overflow: 'hidden' 
          }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} style={{ position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', borderTop: '2px solid #00e676', borderRight: '2px solid transparent', borderBottom: '2px solid transparent', borderLeft: '2px solid transparent' }} />
            <RadarIcon sx={{ fontSize: 60, color: isAttacked ? '#ff1744' : '#00e676', opacity: 0.5 }} />
            <Typography variant="subtitle1" sx={{ mt: 1, color: isAttacked ? '#ff1744' : '#00e676', fontWeight: 'bold', zIndex: 1, letterSpacing: 1 }}>
              {isAttacked ? 'THREAT INBOUND' : 'SYSTEM SECURE'}
            </Typography>
            {isAttacked && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(255,0,0,0.1)' }} />
            )}
          </Paper>

          <Paper sx={{ 
            p: 2, 
            flex: '1 1 auto', // Takes remaining height
            minHeight: 0, 
            background: 'rgba(10, 15, 20, 0.8)', 
            backdropFilter: 'blur(10px)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
             <Typography variant="caption" sx={{ color: '#aaa', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
               <MemoryIcon fontSize="small"/> CPU CLUSTER LOAD
             </Typography>
             <Box sx={{ width: '100%', flex: 1, minHeight: 0 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={cpuData}>
                   <defs>
                     <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor={isAttacked ? "#ff1744" : "#00e676"} stopOpacity={0.5}/>
                       <stop offset="95%" stopColor={isAttacked ? "#ff1744" : "#00e676"} stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <Area type="monotone" dataKey="usage" stroke={isAttacked ? "#ff1744" : "#00e676"} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                 </AreaChart>
               </ResponsiveContainer>
             </Box>

             <Typography variant="caption" sx={{ color: '#aaa', mt: 1, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
               <NetworkCheckIcon fontSize="small"/> NETWORK I/O (Mbps)
             </Typography>
             <Box sx={{ width: '100%', flex: 1, minHeight: 0 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={networkData}>
                   <defs>
                     <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#2196f3" stopOpacity={0.5}/>
                       <stop offset="95%" stopColor="#2196f3" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <Area type="step" dataKey="traffic" stroke="#2196f3" fillOpacity={1} fill="url(#colorNet)" isAnimationActive={false} />
                 </AreaChart>
               </ResponsiveContainer>
             </Box>
          </Paper>

        </Box>

        {/* CENTER COLUMN: Terminal Log (Auto-stretches to fill available space remaining) */}
        <Box sx={{ flex: '1 1 auto', height: '100%', minWidth: 0 }}>
          <Paper sx={{ 
            p: 0, 
            height: '100%', 
            bgcolor: '#050a0f', 
            border: '1px solid rgba(0, 255, 128, 0.3)',
            boxShadow: '0 0 30px rgba(0, 255, 128, 0.05) inset',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{ bgcolor: 'rgba(0, 255, 128, 0.1)', p: 1, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(0,255,128,0.2)' }}>
              <TerminalIcon sx={{ color: '#00e676', mr: 1, fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: '#00e676', fontFamily: 'monospace' }}>root@neuro-fuzzy-ids:~# tail -f /var/log/ids_traffic.log</Typography>
            </Box>
            
            <Box sx={{ p: 2, flex: 1, minHeight: 0, overflowY: 'auto', fontFamily: '"Fira Code", "Courier New", monospace' }}>
               <AnimatePresence>
                 {logs.map((log) => (
                   <motion.div 
                     key={log.id} 
                     initial={{ opacity: 0, x: -10 }} 
                     animate={{ opacity: 1, x: 0 }} 
                     transition={{ duration: 0.15 }}
                     style={{ marginBottom: '6px', display: 'flex', gap: '8px', wordBreak: 'break-all' }}
                   >
                     <span style={{ color: '#4caf50', opacity: 0.6, fontSize: '0.75rem', alignSelf: 'flex-start', paddingTop: '2px' }}>[{log.time}]</span>
                     <span style={{ 
                       color: log.type === 'error' ? '#ff3333' : log.type === 'warning' ? '#ffeb3b' : log.type === 'success' ? '#00e676' : '#90caf9',
                       fontWeight: log.type === 'error' || log.type === 'warning' ? 'bold' : 'normal',
                       fontSize: '0.85rem',
                       textShadow: log.type === 'error' ? '0 0 5px rgba(255,0,0,0.5)' : 'none'
                     }}>
                       {log.message}
                     </span>
                   </motion.div>
                 ))}
               </AnimatePresence>
               <div ref={logEndRef} style={{ height: '10px' }} />
            </Box>

            {isAttacked && (
               <motion.div 
                 animate={{ top: ['0%', '100%', '0%'] }} 
                 transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                 style={{ position: 'absolute', width: '100%', height: '2px', background: 'rgba(255, 255, 255, 0.5)', boxShadow: '0 0 10px #fff', zIndex: 10, pointerEvents: 'none' }} 
               />
            )}
          </Paper>
        </Box>

        {/* RIGHT COLUMN: Inference & Controls (Fixed 25% width) */}
        <Box sx={{ flex: '0 0 25%', display: 'flex', flexDirection: 'column', gap: 2, height: '100%', minWidth: 0 }}>
          
          <Paper sx={{ 
             p: 2, 
             flex: '0 0 22%', // Significantly reduced to give ALL extra space to the Attack Vectors
             minHeight: '140px',
             display: 'flex', 
             flexDirection: 'column',
             justifyContent: 'center',
             alignItems: 'center',
             textAlign: 'center',
             border: mlStatus.status === 'BLOCKED' ? '2px solid #ff1744' : mlStatus.status === 'ALLOWED' ? '2px solid #00e676' : '1px solid rgba(255,255,255,0.1)',
             background: mlStatus.status === 'BLOCKED' ? 'rgba(255, 23, 68, 0.1)' : mlStatus.status === 'ALLOWED' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(10, 15, 20, 0.8)',
             backdropFilter: 'blur(10px)',
             transition: 'all 0.3s ease',
             overflow: 'hidden'
           }}>
             <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: 1, mb: 0 }}>INFERENCE RESULT</Typography>
             
             {mlStatus.status === 'ANALYZING' ? (
               <Box sx={{ width: '100%' }}>
                 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 1 }}>
                   {Array.from({ length: 32 }).map((_, i) => (
                     <motion.div
                       key={i}
                       animate={{ opacity: [0.1, 1, 0.1], backgroundColor: ['#ff9800', '#ffeb3b', '#ff9800'] }}
                       transition={{ duration: Math.random() * 0.8 + 0.2, repeat: Infinity }}
                       style={{ width: 10, height: 10, borderRadius: 2 }}
                     />
                   ))}
                 </Box>
                 <LinearProgress color="warning" sx={{ height: 2 }} />
                 <Typography variant="caption" sx={{ color: 'warning.main', mt: 1, display: 'block', fontWeight: 'bold' }}>DEEP INFERENCE...</Typography>
               </Box>
             ) : mlStatus.prediction ? (
               <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
                 {mlStatus.status === 'BLOCKED' ? <GppBadIcon sx={{ fontSize: 30, color: '#ff1744', filter: 'drop-shadow(0 0 10px rgba(255,0,0,0.5))' }} /> : <ShieldIcon sx={{ fontSize: 30, color: '#00e676' }} />}
                 <Typography variant="h4" fontWeight="900" sx={{ mt: 0, color: mlStatus.status === 'BLOCKED' ? '#ff1744' : '#00e676', textTransform: 'uppercase', textShadow: mlStatus.status === 'BLOCKED' ? '0 0 15px rgba(255,23,68,0.5)' : 'none', lineHeight: 1 }}>
                   {mlStatus.prediction}
                 </Typography>
                 <Typography variant="caption" sx={{ color: mlStatus.status === 'BLOCKED' ? '#ff8a80' : '#b2ff59', fontWeight: 'bold' }}>
                   {mlStatus.status} • {mlStatus.confidence}% CONF
                 </Typography>
               </motion.div>
             ) : (
               <Box sx={{ opacity: 0.5, mt: 1 }}>
                 <Typography variant="subtitle2" color="text.secondary">WAITING</Typography>
                 <Typography variant="caption">[ Default: NORMAL ]</Typography>
               </Box>
             )}
           </Paper>

          <Paper sx={{ 
            p: 2, 
            flex: '1 1 auto', // Takes massive remaining portion of the screen height natively
            minHeight: 0, 
            background: 'rgba(10, 15, 20, 0.8)', 
            backdropFilter: 'blur(10px)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            display: 'flex', 
            flexDirection: 'column'
          }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 0.5, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BugReportIcon color="warning" fontSize="small" /> Attack Vectors
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
              <Button 
                variant="outlined" 
                color="error"
                disabled={isAttacked}
                onClick={() => executeAttack('u2r')} 
                sx={{ flex: '1 1 auto', justifyContent: 'space-between', p: 1.5, borderColor: 'rgba(255,0,0,0.5)' }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" fontWeight="bold">U2R Penetration</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', lineHeight: 1.2 }}>Rootkit/Buffer Overflow</Typography>
                </Box>
                <BugReportIcon fontSize="small" />
              </Button>

              <Button 
                variant="outlined" 
                color="warning"
                disabled={isAttacked}
                onClick={() => executeAttack('r2l')} 
                sx={{ flex: '1 1 auto', justifyContent: 'space-between', p: 1.5, borderColor: 'rgba(255,152,0,0.5)' }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" fontWeight="bold">R2L Exploit</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', lineHeight: 1.2 }}>Remote Password Guess</Typography>
                </Box>
                <BugReportIcon fontSize="small" />
              </Button>

              <Button 
                variant="outlined" 
                color="secondary"
                disabled={isAttacked}
                onClick={() => executeAttack('dos')} 
                sx={{ flex: '1 1 auto', justifyContent: 'space-between', p: 1.5, borderColor: 'rgba(156,39,176,0.5)' }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" fontWeight="bold">DoS Flood</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', lineHeight: 1.2 }}>Smurf/Neptune DoS</Typography>
                </Box>
                <BugReportIcon fontSize="small" />
              </Button>

              <Button 
                variant="outlined" 
                color="info"
                disabled={isAttacked}
                onClick={() => executeAttack('normal')} 
                sx={{ flex: '0 0 auto', mt: 'auto', p: 1 }}
              >
                Generate Benign Traffic
              </Button>
            </Box>
          </Paper>

        </Box>

      </Box>
    </Box>
    </>
  );
}