import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  Paper,
  Chip,
  Switch,
  FormControlLabel
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BugReportIcon from '@mui/icons-material/BugReport';
import ShieldIcon from '@mui/icons-material/Shield';
import TerminalIcon from '@mui/icons-material/Terminal';
import LanguageIcon from '@mui/icons-material/Language';

// --- Explicit 10-Feature Matrix Samples ---
const SAMPLE_PAYLOADS = {
  normal: {
    same_srv_rate: 1.0,
    service_eco_i: 0.0,
    service_ecr_i: 0.0,
    service_http: 1.0,
    diff_srv_rate: 0.0,
    src_bytes: 215,
    dst_host_same_src_port_rate: 0.05,
    hot: 0.0,
    dst_host_diff_srv_rate: 0.0,
    wrong_fragment: 0.0
  },
  dos: {
    same_srv_rate: 1.0,
    service_eco_i: 0.0,
    service_ecr_i: 1.0,
    service_http: 0.0,
    diff_srv_rate: 0.0,
    src_bytes: 1032,
    dst_host_same_src_port_rate: 1.0,
    hot: 0.0,
    dst_host_diff_srv_rate: 0.0,
    wrong_fragment: 0.0
  },
  probe: {
    same_srv_rate: 0.05,
    service_eco_i: 0.0,
    service_ecr_i: 0.0,
    service_http: 0.0, // Other
    diff_srv_rate: 0.95,
    src_bytes: 8,
    dst_host_same_src_port_rate: 1.0,
    hot: 0.0,
    dst_host_diff_srv_rate: 1.0,
    wrong_fragment: 0.0
  },
  r2l: {
    same_srv_rate: 1.0,
    service_eco_i: 0.0,
    service_ecr_i: 0.0,
    service_http: 0.0,
    diff_srv_rate: 0.0,
    src_bytes: 50,
    dst_host_same_src_port_rate: 0.0,
    hot: 2.0,
    dst_host_diff_srv_rate: 0.05,
    wrong_fragment: 0.0
  },
  u2r: {
    same_srv_rate: 1.0,
    service_eco_i: 0.0,
    service_ecr_i: 0.0,
    service_http: 0.0,
    diff_srv_rate: 0.0,
    src_bytes: 5124,
    dst_host_same_src_port_rate: 0.0,
    hot: 3.0,
    dst_host_diff_srv_rate: 0.0,
    wrong_fragment: 0.0
  }
};

const runRealPrediction = async (data) => {
  const response = await fetch("http://127.0.0.1:8002/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

const PredictorPage = () => {
  const [formData, setFormData] = useState(SAMPLE_PAYLOADS.normal);
  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1.0 : 0.0) : (isNaN(value) ? value : Number(value)),
    }));
  };

  const fillSample = (type) => {
    setFormData(SAMPLE_PAYLOADS[type]);
    setPredictionResult(null); 
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPredictionResult(null);
    setError(null);
    try {
      const result = await runRealPrediction(formData);
      setPredictionResult(result);
    } catch (err) {
      console.error("Prediction failed:", err);
      setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const resultColors = {
    normal: "success.main",
    dos: "error.main",
    probe: "warning.main",
    r2l: "secondary.main",
    u2r: "error.dark",
  };

  const pieData = useMemo(() => {
    if (!predictionResult || !predictionResult.probabilities) return [];
    try {
      return Object.entries(predictionResult.probabilities)
        .filter(([_, value]) => parseFloat(value) > 0.005) 
        .map(([name, value]) => ({
          name,
          value: parseFloat(value),
          fill: name === 'normal' ? "#22c55e" : name === 'dos' ? "#ef4444" : name === 'probe' ? "#f97316" : name === 'r2l' ? "#8b5cf6" : "#dc2626",
        }));
    } catch (err) { return []; }
  }, [predictionResult]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h3" fontWeight="900" sx={{ background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            V3 Deep Transformer Predictor
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
            Explicitly Analyze the Core 10 Features mapped identically into PyTorch.
          </Typography>
        </Box>

        {/* --- SAMPLE PAYLOAD INJECTORS --- */}
        <Paper elevation={0} sx={{ p: 2, mb: 4, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                QUICK INJECT PAYLOADS:
            </Typography>
            <Grid container spacing={2}>
                <Grid item><Button variant="outlined" color="success" startIcon={<ShieldIcon />} onClick={() => fillSample('normal')}>Normal Traffic</Button></Grid>
                <Grid item><Button variant="outlined" color="error" startIcon={<LanguageIcon />} onClick={() => fillSample('dos')}>simulate DOS</Button></Grid>
                <Grid item><Button variant="outlined" color="warning" startIcon={<BugReportIcon />} onClick={() => fillSample('probe')}>simulate PROBE</Button></Grid>
                <Grid item><Button variant="outlined" color="secondary" startIcon={<TerminalIcon />} onClick={() => fillSample('r2l')}>simulate R2L Exploit</Button></Grid>
                <Grid item><Button variant="outlined" color="error" sx={{ borderColor: 'error.dark', color: 'error.dark' }} startIcon={<TerminalIcon />} onClick={() => fillSample('u2r')}>simulate U2R Exploit</Button></Grid>
            </Grid>
        </Paper>

        <Grid container spacing={4} direction={predictionResult ? "column-reverse" : "column"}>
            
            {/* Input Form Column */}
            <Grid item xs={12} md={12} sx={{ transition: 'all 0.3s ease-in-out' }}>
                <Card elevation={4} sx={{ borderRadius: 3 }}>
                    <Box component="form" onSubmit={handleSubmit}>
                        <CardHeader 
                            title="XAI Explicit 10-Feature Inputs" 
                            titleTypographyProps={{ fontWeight: 'bold' }}
                            sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
                        />
                        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 4 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="1. same_srv_rate" name="same_srv_rate" type="number" inputProps={{ step: "0.01" }} value={formData.same_srv_rate} onChange={handleInputChange} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="2. diff_srv_rate" name="diff_srv_rate" type="number" inputProps={{ step: "0.01" }} value={formData.diff_srv_rate} onChange={handleInputChange} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="3. src_bytes" name="src_bytes" type="number" value={formData.src_bytes} onChange={handleInputChange} />
                                </Grid>
                                
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="4. dst_host_same_src_port_rate" name="dst_host_same_src_port_rate" type="number" inputProps={{ step: "0.01" }} value={formData.dst_host_same_src_port_rate} onChange={handleInputChange} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="5. hot" name="hot" type="number" inputProps={{ step: "0.1" }} value={formData.hot} onChange={handleInputChange} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="6. dst_host_diff_srv_rate" name="dst_host_diff_srv_rate" type="number" inputProps={{ step: "0.01" }} value={formData.dst_host_diff_srv_rate} onChange={handleInputChange} />
                                </Grid>
                                
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="7. wrong_fragment" name="wrong_fragment" type="number" value={formData.wrong_fragment} onChange={handleInputChange} />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 1 }}>Categorical Embeddings</Divider>

                            <Grid container spacing={3} sx={{ mt: 1 }}>
                                <Grid item xs={12} sm={4}>
                                    <FormControlLabel control={<Switch checked={formData.service_eco_i === 1.0} onChange={handleInputChange} name="service_eco_i" />} label="8. service_eco_i (ICMP Ping)" />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <FormControlLabel control={<Switch checked={formData.service_ecr_i === 1.0} onChange={handleInputChange} name="service_ecr_i" />} label="9. service_ecr_i (ICMP Reply)" />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <FormControlLabel control={<Switch checked={formData.service_http === 1.0} onChange={handleInputChange} name="service_http" />} label="10. service_http (Web Traffic)" />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 1 }} />
                            
                            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                <Button type="submit" variant="contained" size="large" disabled={isLoading} sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 'bold' }} startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}>
                                {isLoading ? "Processing Tensor..." : "XAI EVALUATE PAYLOAD"}
                                </Button>
                            </Box>
                        </CardContent>
                    </Box>
                </Card>

                {error && (
                    <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                        <AlertTitle>Deep Learning API Error</AlertTitle>
                        {error}
                    </Alert>
                )}
            </Grid>

            {/* Results Column */}
            <AnimatePresence mode="wait">
            {predictionResult && (
                <Grid item xs={12} md={12} component={motion.div} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5, type: "spring" }}>
                    <Card elevation={6} sx={{ borderRadius: 3, background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', border: '1px solid', borderColor: 'divider', mb: predictionResult ? 2 : 0 }}>
                        <CardHeader title="Transformer & SHAP Evaluation" sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}/>
                        <CardContent sx={{ pt: 4 }}>
                            {/* TOP ROW: Title & Pie Chart */}
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%', justifyContent: 'center' }}>
                                        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
                                            Neural Classification
                                        </Typography>
                                        <Typography variant="h1" fontWeight="900" sx={{ color: resultColors[predictionResult.prediction || 'normal'] || "text.primary", textTransform: 'uppercase', textShadow: '0px 4px 10px rgba(0,0,0,0.1)' }}>
                                            {predictionResult.prediction || "UNKNOWN"}
                                        </Typography>
                                        
                                        <Chip label={`${predictionResult.confidence}% Confidence`} color={(predictionResult.prediction === 'normal') ? 'success' : 'error'} variant="outlined" sx={{ mt: 2, mb: 2, fontWeight: 'bold', fontSize: '1.1rem', p: 1 }} />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ width: '100%', height: 280, display: 'flex', justifyContent: 'center' }}>
                                        {pieData.length > 0 && (
                                            <ResponsiveContainer width={300} height="100%">
                                                <PieChart>
                                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={8} dataKey="value" label={({ name, percent }) => `${name.toUpperCase()} ${(percent * 100).toFixed(0)}%`}>
                                                        {pieData.map((entry, i) => (
                                                            <Cell key={i} fill={entry.fill} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        formatter={(v) => `${(v * 100).toFixed(2)}%`}
                                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                            
                            {/* BOTTOM ROW: SHAP Explainability Graph */}
                            {predictionResult.explanation?.top_features?.length > 0 && (
                                <Box sx={{ mt: 4, width: '100%', bgcolor: 'background.default', borderRadius: 2, p: 3, border: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                        XAI SHAP Explainability Matrix
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        The Transformer calculates precisely which of the 10 explicit features triggered the network alarm natively.
                                    </Typography>

                                    <Box sx={{ width: '100%', height: 350 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart layout="vertical" data={predictionResult.explanation.top_features.map(f => ({ name: f.feature, impact: Math.abs(f.impact), raw: f.impact }))} margin={{ top: 20, right: 30, left: 130, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                                                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.2)' }} tickLine={{ stroke: 'rgba(255,255,255,0.2)' }} />
                                                <YAxis dataKey="name" type="category" width={220} tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.8)', fontWeight: '500' }} axisLine={{ stroke: 'rgba(255,255,255,0.2)' }} tickLine={{ stroke: 'rgba(255,255,255,0.2)' }} />
                                                <Tooltip 
                                                    formatter={(val, name, props) => [`${props.payload.raw.toFixed(4)}`, "SHAP Impact Score"]} 
                                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                />
                                                <Bar dataKey="impact" radius={[0, 6, 6, 0]}>
                                                    {predictionResult.explanation.top_features.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={(predictionResult.prediction === 'normal' || entry.raw < 0) ? '#22c55e' : '#ef4444'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Box>
                            )}

                        </CardContent>
                    </Card>
                </Grid>
            )}
            </AnimatePresence>
        </Grid>
      </Container>
    </motion.div>
  );
};

export default PredictorPage;
