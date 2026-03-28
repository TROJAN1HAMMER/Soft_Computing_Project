import React from "react";
import { Box, Card, CardContent, Container, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import DynamicFormIcon from '@mui/icons-material/DynamicForm';
import CodeIcon from '@mui/icons-material/Code';

const DEEP_DIVE_INSIGHTS = [
  {
    version: "V1: Baseline Classic",
    subtext: "Neuro-Fuzzy Architecture",
    accuracy: "78.4%",
    architecture: "Sequential Isolation Forest → SMOTE Augmentation → Fuzzy Logic MLP",
    strengths: "Demonstrated excellent baseline anomaly detection mapping standard numeric KDD distributions. Extremely lightweight computation layer designed strictly for standard static DDoS vectors.",
    limitations: "Critically structurally unable to adapt mathematically to Zero-Day data distribution shifts. Performance hard-capped at 78% retention during stringent KDDTest+ unseen evaluation sweeps.",
    color: "#8884d8",
    icon: <AutoGraphIcon sx={{ fontSize: 30, color: '#fff' }} />,
    position: "left"
  },
  {
    version: "V2: Deep Learning",
    subtext: "LSTM Stacked Autoencoder",
    accuracy: "73.6%",
    architecture: "PyTorch Autoencoder (MSE Thresholding) → Stacked LSTM Sequence Classifier",
    strengths: "Successfully executed dynamic boundary detection leveraging explicit Mathematical Reconstruction Error sequences. Unlocked robust multi-class separation analysis previously impossible in V1 matrices.",
    limitations: "Deep recurrent sequences mathematically forced crucial network parameter correlations to drop across extended time-steps, triggering an inherent accuracy decay explicitly on border attacks (R2L).",
    color: "#f59e0b",
    icon: <DynamicFormIcon sx={{ fontSize: 30, color: '#fff' }} />,
    position: "right"
  },
  {
    version: "V3: Transformer Array",
    subtext: "10-Feature Attention Gate",
    accuracy: "91.13%",
    architecture: "PyTorch Multi-Head Self-Attention Transformer → Layered XGBoost/SHAP Connectors",
    strengths: "Violently shattered the 90% accuracy barrier utilizing Stratified Global Validation tensors. Retains instantaneous Layer-3 Live Scapy interception latencies by natively demanding exactly 10 parameters.",
    limitations: "Enforced an absolute mathematically capped evaluation ceiling dictated strictly by the rapid UI constraint. Physically excises 31 structural packet flags, preventing deeper sub-layer categorization.",
    color: "#10b981",
    icon: <CodeIcon sx={{ fontSize: 30, color: '#fff' }} />,
    position: "left"
  },
  {
    version: "V4: NLP Transformer",
    subtext: "Definitive Categorical Embedding",
    accuracy: "96.22%",
    architecture: "122-Dimension One-Hot Embedded Transformer Matrix → Deep Neural Dense Expansion Array",
    strengths: "The unequivocally ultimate mathematical endpoint of the IDS topology. Fully taps into all 41 KDD data structures alongside native categorical NLP embeddings to surgically isolate zero-day payloads.",
    limitations: "Demands extremely massive, high-latency Pandas sequential encoding pipelines globally. Theoretically impossible to manually configure vector parameters without autonomous scripting bridges.",
    color: "#3b82f6",
    icon: <AccountTreeIcon sx={{ fontSize: 30, color: '#fff' }} />,
    position: "right"
  }
];

export default function ArchitecturePage() {
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', pt: 6, pb: 12, overflowX: 'hidden' }}>
      <Container maxWidth="lg">
        
        {/* Header Sequence */}
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography variant="h3" fontWeight="900" sx={{ mb: 2, background: 'linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 1 }}>
            Evolutionary Timeline
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', fontSize: '1.1rem', lineHeight: 1.6 }}>
            The chronological structural dissection tracing the exact architectural paradigm shifts that exponentially forced the IDS accuracy yield boundary from 78.4% up to an absolute 96.22% climax.
          </Typography>
        </Box>

        {/* Custom Vertical Branching Timeline */}
        <Box sx={{ position: 'relative', width: '100%', mt: 4 }}>
          
          {/* Center Luminous Track */}
          <Box sx={{ 
            position: 'absolute', left: { xs: '30px', md: '50%' }, top: 0, bottom: 0, width: 4, 
            background: 'linear-gradient(to bottom, #8884d8 0%, #f59e0b 33%, #10b981 66%, #3b82f6 100%)',
            transform: { xs: 'none', md: 'translateX(-50%)' }, borderRadius: 4, opacity: 0.5, boxShadow: '0 0 20px rgba(255,255,255,0.1)' 
          }} />

          {DEEP_DIVE_INSIGHTS.map((insight, idx) => {
            const isLeft = insight.position === 'left';
            return (
              <Box key={idx} sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: isLeft ? 'row' : 'row-reverse' }, 
                alignItems: 'center', 
                justifyContent: 'center', 
                mb: 10, position: 'relative', width: '100%' 
              }}>
                
                {/* Node Icon Boundary */}
                <Box sx={{ 
                  position: 'absolute', left: { xs: '30px', md: '50%' }, 
                  transform: { xs: 'translateX(-18px)', md: 'translateX(-50%)' },
                  width: 56, height: 56, borderRadius: '50%', bgcolor: insight.color, zIndex: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 25px ${insight.color}`
                }}>
                  {insight.icon}
                </Box>

                {/* Timeline Connector Line Segment */}
                <Box sx={{
                  display: { xs: 'none', md: 'block' },
                  width: 'calc(50% - 400px)', height: 2, bgcolor: insight.color, opacity: 0.3,
                  position: 'absolute', top: '50%', 
                  left: isLeft ? 400 : 'calc(50% + 28px)', right: isLeft ? 'calc(50% + 28px)' : 400
                }} />

                {/* Data Card Wrapper */}
                <Box sx={{ 
                  width: { xs: '100%', md: 400 }, 
                  ml: { xs: 8, md: isLeft ? 0 : 'auto' }, 
                  mr: { xs: 0, md: isLeft ? 'auto' : 0 },
                  display: 'flex', justifyContent: isLeft ? 'flex-end' : 'flex-start'
                }}>
                  <motion.div 
                    initial={{ opacity: 0, x: isLeft ? -50 : 50 }} 
                    whileInView={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.6, type: "spring", bounce: 0.4 }} 
                    viewport={{ once: true, margin: "-100px" }}
                    style={{ width: '100%' }}
                  >
                    <Card sx={{ 
                      width: '100%', p: 1, borderRadius: 4, 
                      background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(16px)', 
                      border: `1px solid ${insight.color}40`, borderTop: `4px solid ${insight.color}`,
                      boxShadow: `0 10px 40px -10px ${insight.color}30`
                    }}>
                      <CardContent sx={{ pb: '16px !important' }}>
                        
                        {/* Title Matrix */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h5" fontWeight="900" color="#fff" sx={{ letterSpacing: 0.5, lineHeight: 1.2 }}>{insight.version}</Typography>
                            <Typography variant="body2" sx={{ color: insight.color, fontWeight: 'bold', mt: 0.5 }}>{insight.subtext}</Typography>
                          </Box>
                          <Typography variant="h6" fontWeight="900" sx={{ color: '#fff', bgcolor: `${insight.color}30`, px: 1.5, py: 0.5, borderRadius: 2 }}>
                            {insight.accuracy}
                          </Typography>
                        </Box>

                        {/* Structural Blueprint Segment */}
                        <Box sx={{ mb: 2.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.3)', borderLeft: `3px solid ${insight.color}` }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Neural Pipeline</Typography>
                          <Typography variant="body2" sx={{ color: '#e2e8f0', mt: 0.5, fontWeight: 500 }}>{insight.architecture}</Typography>
                        </Box>

                        {/* Analysis Grid */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#4ade80', fontWeight: '900', letterSpacing: 1.5, display: 'flex', alignItems: 'center' }}>
                              <span style={{ marginRight: 6, fontSize: '1.1rem' }}>+</span> THEORETICAL STRENGTHS
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>{insight.strengths}</Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" sx={{ color: '#f87171', fontWeight: '900', letterSpacing: 1.5, display: 'flex', alignItems: 'center' }}>
                              <span style={{ marginRight: 6, fontSize: '1.1rem' }}>-</span> CRITICAL BOTTLENECKS
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>{insight.limitations}</Typography>
                          </Box>
                        </Box>

                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
