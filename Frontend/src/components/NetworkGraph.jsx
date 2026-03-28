// Frontend/src/components/NetworkGraph.jsx

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';

// Specific Icon Mapping
import StorageIcon from '@mui/icons-material/Storage';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import WifiIcon from '@mui/icons-material/Wifi';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import RouterIcon from '@mui/icons-material/Router';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import StayCurrentPortraitIcon from '@mui/icons-material/StayCurrentPortrait';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import ShieldIcon from '@mui/icons-material/Shield';
import CloudIcon from '@mui/icons-material/Cloud';

const INITIAL_NODES = {
  center:    { id: 'center',    x: 500, y: 500, label: 'Central DB Core',    color: '#3b82f6', size: 1.8, icon: 'server', ip: '10.0.0.1', role: 'Data Warehouse' },
  global:    { id: 'global',    x: 100, y: 200, label: 'Global Extranet',    color: '#3b82f6', size: 1.4, icon: 'wifi', ip: '201.44.2.1', role: 'External Relay' },
  web1:      { id: 'web1',      x: 700, y: 350, label: 'Edge WebServer',     color: '#3b82f6', size: 1.6, icon: 'server', glow: true, innerColor: '#ef4444', ip: '192.168.1.100', role: 'Load Balancer' },
  hacker:    { id: 'hacker',    x: 900, y: 650, label: 'Malicious Breach',   color: '#ef4444', size: 2.0, icon: 'alert', alert: true, ip: 'RED.ACT.ED.X', role: 'Compromised Root' },
  router1:   { id: 'router1',   x: 450, y: 800, label: 'Core Router Alpha',  color: '#22c55e', size: 1.5, icon: 'router', ip: '10.0.0.254', role: 'Gateway Switch' },
  iot1:      { id: 'iot1',      x: 100, y: 700, label: 'Sensor Array-X',     color: '#22c55e', size: 1.2, icon: 'tree', ip: '10.0.1.12', role: 'IoT Mesh' },
  iot2:      { id: 'iot2',      x: 250, y: 900, label: 'Smart Grid',         color: '#22c55e', size: 1.1, icon: 'sensor', ip: '10.0.1.14', role: 'Industrial PLC' },
  client1:   { id: 'client1',   x: 900, y: 200, label: 'Tech Terminal',      color: '#3b82f6', size: 1.3, icon: 'desktop', ip: '192.168.4.4', role: 'Admin Local' },
  client2:   { id: 'client2',   x: 800, y: 950, label: 'Infosec Desk',       color: '#22c55e', size: 1.2, icon: 'desktop', ip: '192.168.4.5', role: 'SOC Analyst' },
  mobileA:   { id: 'mobileA',   x: 400, y: 150, label: 'Exec Mobile',        color: '#22c55e', size: 1.1, icon: 'mobile', ip: '192.168.5.1', role: 'Wireless BYOD' },
  
  // Complexity Additions
  fw1:       { id: 'fw1',       x: 600, y: 550, label: 'WAF Edge Firewall',  color: '#f59e0b', size: 1.5, icon: 'shield', ip: '192.168.1.1', role: 'Firewall Policy' },
  db1:       { id: 'db1',       x: 350, y: 400, label: 'Analytics Cluster',  color: '#3b82f6', size: 1.4, icon: 'server', ip: '10.0.3.1', role: 'Metrics DB' },
  db2:       { id: 'db2',       x: 350, y: 600, label: 'Auth Logs Server',   color: '#3b82f6', size: 1.4, icon: 'server', ip: '10.0.3.2', role: 'Identity DB' },
  vpn1:      { id: 'vpn1',      x: 250, y: 300, label: 'Corporate VPN',      color: '#22c55e', size: 1.3, icon: 'router', ip: '10.0.4.1', role: 'Secure Tunnel' },
  proxy:     { id: 'proxy',     x: 550, y: 700, label: 'Squid Proxy',        color: '#f59e0b', size: 1.3, icon: 'server', ip: '192.168.2.1', role: 'Traffic Proxy' },
  cloud:     { id: 'cloud',     x: 100, y: 50,  label: 'AWS Storage Sync',   color: '#3b82f6', size: 1.6, icon: 'cloud', ip: '13.33.2.1', role: 'S3 Sync' },
  iot4:      { id: 'iot4',      x: 50,  y: 400, label: 'HVAC Thermal',       color: '#22c55e', size: 1.0, icon: 'sensor', ip: '10.0.1.20', role: 'Building Sys' },
  iot5:      { id: 'iot5',      x: 50,  y: 600, label: 'RFID Door Access',   color: '#22c55e', size: 1.0, icon: 'sensor', ip: '10.0.1.21', role: 'Physical Sec' },
  iot6:      { id: 'iot6',      x: 950, y: 350, label: 'CCTV Exterior',      color: '#22c55e', size: 1.0, icon: 'tree', ip: '192.168.6.1', role: 'Camera Array' },
  iot7:      { id: 'iot7',      x: 950, y: 800, label: 'CCTV Interior',      color: '#ef4444', size: 1.0, icon: 'tree', alert: true, ip: '192.168.6.2', role: 'Compromised Cam' }
};

const INITIAL_EDGES = [
  ['global', 'vpn1'], ['global', 'mobileA'], ['global', 'cloud'],
  ['cloud', 'center'],
  ['vpn1', 'center'], ['vpn1', 'db1'],
  ['center', 'fw1'], ['center', 'router1'], ['center', 'db1'], ['center', 'db2'],
  ['fw1', 'web1'], ['fw1', 'proxy'],
  ['web1', 'client1'], ['web1', 'hacker'], ['web1', 'iot6'],
  ['proxy', 'hacker'], ['proxy', 'iot7'],
  ['router1', 'iot2'], ['router1', 'client2'], ['router1', 'proxy'],
  ['hacker', 'client2'], ['hacker', 'iot7'],
  ['mobileA', 'fw1'], 
  ['iot1', 'iot2'], ['iot1', 'iot4'], ['iot1', 'iot5'],
  ['iot4', 'vpn1'], ['iot5', 'router1'],
  ['db1', 'db2']
];

const getIcon = (type, isDark) => {
  const props = { sx: { color: isDark ? '#ffffff' : '#f8fafc', fontSize: 20 } };
  switch(type) {
    case 'server': return <StorageIcon {...props} />;
    case 'tree': return <SettingsInputComponentIcon {...props} />;
    case 'wifi': return <WifiIcon {...props} />;
    case 'router': return <RouterIcon {...props} />;
    case 'desktop': return <DesktopWindowsIcon {...props} />;
    case 'mobile': return <StayCurrentPortraitIcon {...props} />;
    case 'sensor': return <DeviceThermostatIcon {...props} />;
    case 'alert': return <GraphicEqIcon {...props} />;
    case 'shield': return <ShieldIcon {...props} />;
    case 'cloud': return <CloudIcon {...props} />;
    default: return null;
  }
};

const ParticleField = ({ size, isDark }) => {
  const particles = useMemo(() => Array.from({ length: 40 }).map(() => ({
    angle: Math.random() * Math.PI * 2,
    r: Math.random() * (12 * size),
    o: Math.random() * 0.8 + 0.2
  })), [size]);

  return <>{particles.map((p, i) => <circle key={i} cx={Math.cos(p.angle)*p.r} cy={Math.sin(p.angle)*p.r} r={0.7} fill={isDark ? "#fff" : "#1e293b"} opacity={p.o} />)}</>;
};

export default function NetworkGraph() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  // Drag Physics Hook State
  const svgRef = useRef(null);
  const [draggingNode, setDraggingNode] = useState(null);

  // Advanced Ultra-Smooth 60FPS Drag Mechanics
  const handlePointerDown = (id, e) => {
    e.stopPropagation();
    setDraggingNode(id);
    setSelectedNodeId(id);
  };

  const handlePointerMove = (e) => {
    if (!draggingNode) return;
    const svg = svgRef.current;
    if (!svg) return;
    const CTM = svg.getScreenCTM();
    if (!CTM) return;

    // Isolate strict local scaling mappings correctly relative to the view port Matrix
    const cursor = new DOMPoint(e.clientX, e.clientY);
    const converted = cursor.matrixTransform(CTM.inverse());

    setNodes(prev => ({
      ...prev,
      [draggingNode]: { ...prev[draggingNode], x: converted.x, y: converted.y }
    }));
  };

  const handlePointerUp = () => {
    setDraggingNode(null);
  };

  const activeNode = selectedNodeId ? nodes[selectedNodeId] : null;

  return (
    <Box 
      sx={{ flex: 1, width: '100%', height: '100%', minHeight: '80vh', position: 'relative', bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)', borderRadius: '16px 0 0 16px', overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`, borderRight: 'none' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg ref={svgRef} viewBox="0 0 1000 1100" width="100%" height="100%" style={{ display: 'block' }}>
        
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
             <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)"} strokeWidth="1"/>
          </pattern>
          <filter id="neonRed" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="15" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="neonBlue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="neonGreen" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Global Blueprint Grid rendering */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* ELASTIC EDGES */}
        {INITIAL_EDGES.map(([sid, tid], i) => {
          const s = nodes[sid];
          const t = nodes[tid];
          const gradId = `grad-${i}`;
          
          // Organic curved Bezier Tension Lines adapting in real time to drag bounds
          const pathData = `M ${s.x} ${s.y} Q ${(s.x + t.x)/2 + (s.y - t.y) * 0.15} ${(s.y + t.y)/2 + (t.x - s.x) * 0.15} ${t.x} ${t.y}`;
          
          return (
            <g key={i}>
              <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={s.color} stopOpacity={isDark ? "0.8" : "0.5"} />
                  <stop offset="100%" stopColor={t.color} stopOpacity={isDark ? "0.8" : "0.5"} />
                </linearGradient>
              </defs>
              <motion.path 
                d={pathData} 
                stroke={`url(#${gradId})`} 
                strokeWidth="1.5" 
                fill="none" 
                opacity={draggingNode === sid || draggingNode === tid ? 1 : 0.6}
                transition={{ duration: 0.1 }}
              />

              {/* Advanced Simulated packet routing dynamically morphing with the pathData track */}
              <motion.circle 
                r="3" fill={t.color}
                animate={{ offsetDistance: ["0%", "100%"] }}
                transition={{ duration: Math.random() * 1.5 + 1.2, repeat: Infinity, ease: 'linear' }}
                style={{ offsetPath: `path("${pathData}")` }}
              />
            </g>
          );
        })}

        {/* DRAGGABLE PHYSICAL NODES */}
        {Object.values(nodes).map(node => {
          const glowFilter = node.color === '#ef4444' ? "url(#neonRed)" : node.color === '#3b82f6' ? "url(#neonBlue)" : "url(#neonGreen)";
          const isSelected = selectedNodeId === node.id;
          const isDraggingThis = draggingNode === node.id;
          
          return (
            <g 
              key={node.id} 
              transform={`translate(${node.x}, ${node.y})`} 
              onPointerDown={(e) => handlePointerDown(node.id, e)}
              style={{ cursor: isDraggingThis ? 'grabbing' : 'grab', transition: isDraggingThis ? 'none' : 'all 0.1s ease' }}
            >
              
              {/* Massive Select Reticle Scaling dynamically on clicks */}
              {isSelected && (
                <motion.circle 
                  r={35 * node.size} fill="none" stroke={isDark ? "#ffffff" : "#0f172a"} strokeWidth="1.5" strokeDasharray="3,6" opacity={isDark ? "0.6" : "0.4"}
                  animate={{ rotate: 360, scale: [1, 1.05, 1] }} 
                  transition={{ rotate: { duration: 15, repeat: Infinity, ease: 'linear'}, scale: { duration: 2, repeat: Infinity} }}
                />
              )}

              {/* Structural Orbit Rim */}
              <circle 
                r={22 * node.size} fill="none" 
                stroke={isSelected ? (isDark ? '#fff' : '#0f172a') : node.color} 
                strokeWidth={isSelected ? 3 : 1.5} 
                strokeDasharray={node.alert ? "4,4" : "none"} 
                opacity={isDark ? "0.8" : "1"} 
              />
              
              {/* Blur Aura Core */}
              <circle r={14 * node.size} fill={node.innerColor || node.color} opacity={isDark ? "0.3" : "0.15"} filter={glowFilter} />
              
              {/* Opaque Foundation Socket */}
              <circle r={14 * node.size} fill={isDark ? "#040914" : "#cbd5e1"} opacity="0.85" stroke={node.color} strokeWidth="1.5" />

              {/* Dynamic Alert Broadcast Expansions */}
              {node.alert && (
                <motion.circle 
                  r={45 * node.size} fill="none" stroke={node.color} strokeWidth="2"
                  animate={{ r: [22 * node.size, 65 * node.size], opacity: [0.8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                />
              )}

              {/* Master Node Glow Rotation */}
              {node.glow && (
                <motion.circle 
                  r={32 * node.size} fill="none" stroke={node.color} strokeWidth="2" strokeDasharray="4,8"
                  animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                />
              )}

              {/* Pure Component Icon OR Starry Particle Generative Algorithm */}
              {node.icon ? (
                <foreignObject x="-12" y="-12" width="24" height="24" style={{ pointerEvents: 'none' }}>
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getIcon(node.icon, isDark)}
                  </div>
                </foreignObject>
              ) : (
                <ParticleField size={node.size} isDark={isDark} />
              )}

              {/* Floating Typography Labels constrained above cursor mappings */}
              <text y={(28 * node.size) + 12} textAnchor="middle" fill={isSelected ? (isDark ? "#ffffff" : "#0f172a") : (isDark ? "#cbd5e1" : "#475569")} fontWeight={isSelected ? "bold" : "600"} fontSize="12px" letterSpacing="0.5" style={{ pointerEvents: 'none' }}>
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* REACT STATE LIVE HOVER / CLICK DISPLAY ENGINE */}
      <AnimatePresence>
        {activeNode && (
          <motion.div
            key={activeNode.id}
            initial={{ opacity: 0, scale: 0.95, y: -20, x: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }} 
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'absolute', top: '5%', right: '5%', zIndex: 10,
              background: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: '16px',
              padding: '24px', width: '320px', 
              boxShadow: isDark ? '0 10px 50px rgba(0,0,0,0.9)' : '0 10px 50px rgba(0,0,0,0.1)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, pb: 1.5 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: isDark ? '#fff' : '#0f172a', fontWeight: 'bold', fontSize: '1rem', letterSpacing: 0.5 }}>{activeNode.label}</Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', letterSpacing: 0.5, display: 'flex', alignItems: 'center' }}>
                   ID: <span style={{ color: activeNode.color, marginLeft: '6px', fontWeight: 'bold' }}>{activeNode.id.toUpperCase()}</span>
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setSelectedNodeId(null)} sx={{ p: 0.5, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', '&:hover': { bgcolor: 'rgba(239,68,68,0.2)' } }}>
                <CloseIcon sx={{ color: isDark ? '#cbd5e1' : '#64748b', fontSize: 18 }} />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 'bold' }}>IP Root:</Typography>
                 <Typography variant="caption" sx={{ color: isDark ? '#fff' : '#0f172a', fontFamily: 'monospace', fontSize: '13px' }}>{activeNode.ip}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 'bold' }}>Network Role:</Typography>
                 <Typography variant="caption" sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>{activeNode.role}</Typography>
              </Box>
              
              {activeNode.alert ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, p: 1, bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)', borderRadius: 1, border: '1px solid rgba(239,68,68,0.3)' }}>
                   <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 'bold' }}>Node Integrity:</Typography>
                   <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 'bold' }}>CRITICAL BREACH</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 'bold' }}>Live Bandwidth:</Typography>
                   <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 'bold', fontSize: '13px' }}>{Math.floor(Math.random() * 800 + 100)} Mbps</Typography>
                </Box>
              )}
            </Box>
            
            <Typography variant="caption" sx={{ color: activeNode.alert ? '#ef4444' : '#3b82f6', display: 'block', mb: 1.5, fontWeight: 'bold' }}>Payload Telemetry Trace:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 45, gap: '4px' }}>
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: [`${Math.random() * 30 + 10}%`, `${Math.random() * 100}%`, `${Math.random() * 30 + 10}%`] }}
                  transition={{ duration: Math.random() * 0.4 + 0.5, repeat: Infinity }}
                  style={{ flex: 1, backgroundColor: activeNode.alert ? '#ef4444' : '#3b82f6', borderRadius: '2px', minHeight: '10%' }}
                />
              ))}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
      
    </Box>
  );
}