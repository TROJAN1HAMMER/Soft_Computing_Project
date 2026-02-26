// src/pages/PredictorPage.jsx

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// --- MUI Imports ---
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  Select,
  MenuItem,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  AlertTitle,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

// --- Label Map for Readable Names ---
const PRETTY_LABELS = {
  code_module: "Course Module",
  code_presentation: "Semester / Presentation",
  gender: "Gender",
  region: "Region",
  highest_education: "Highest Education",
  imd_band: "IMD Band (Deprivation Index)",
  age_band: "Age Band",
  num_of_prev_attempts: "Previous Attempts",
  studied_credits: "Studied Credits",
  disability: "Disability Status",
  date_registration: "Registration Date (Days relative to start)",
  days_studied: "Total Days Studied",
  ass_count: "Total Assignments",
  ass_mean_score: "Mean Assignment Score",
  ass_mean_weight: "Mean Assignment Weight",
  ass_total_weighted_score: "Total Weighted Score",
  ass_std_score: "Assignment Score Std. Dev.",
  mean_CMA_score: "Mean CMA Score",
  mean_TMA_score: "Mean TMA Score",
  total_clicks: "Total Clicks",
  active_days: "Active Days",
  // VLE Interactions
  dataplus: "DataPlus",
  dualpane: "DualPane",
  externalquiz: "External Quiz",
  folder: "Folder",
  forumng: "Forum Activity",
  glossary: "Glossary",
  homepage: "Homepage",
  htmlactivity: "HTML Activity",
  oucollaborate: "OU Collaborate",
  oucontent: "OU Content",
  ouelluminate: "OU Elluminate",
  ouwiki: "OU Wiki",
  page: "Page",
  questionnaire: "Questionnaire",
  quiz: "Quiz",
  repeatactivity: "Repeat Activity",
  resource: "Resource",
  sharedsubpage: "Shared Subpage",
  subpage: "Subpage",
  url: "URL",
};

// --- Hardcoded Data for Dropdowns ---
const le_dict = {
  code_module: ["AAA", "BBB", "CCC", "DDD", "EEE", "FFF", "GGG"],
  code_presentation: ["2013B", "2013J", "2014B", "2014J"],
  gender: ["F", "M"],
  region: [
    "East Anglian Region",
    "East Midlands Region",
    "Ireland",
    "London Region",
    "North Region",
    "North Western Region",
    "Scotland",
    "South East Region",
    "South Region",
    "South West Region",
    "Wales",
    "West Midlands Region",
    "Yorkshire Region",
  ],
  highest_education: [
    "A Level or Equivalent",
    "HE Qualification",
    "Lower Than A Level",
    "No Formal quals",
    "Post Graduate Qualification",
  ],
  imd_band: [
    "0-10%",
    "10-20",
    "20-30%",
    "30-40%",
    "40-50%",
    "50-60%",
    "60-70%",
    "70-80%",
    "80-90%",
    "90-100%",
    "Unknown",
  ],
  age_band: ["0-35", "35-55", "55<="],
  disability: ["N", "Y"],
};

const FINAL_FEATURE_ORDER = [
  "duration",
  "protocol_type",
  "service",
  "src_bytes",
  "dst_bytes",
  "count",
  "srv_count",
  "serror_rate",
  "srv_serror_rate",
  "dst_host_count",
];

const TARGET_NAMES = ["normal", "dos", "probe", "r2l", "u2r"];

// --- Prediction API Call ---
const runRealPrediction = async (data) => {
  const response = await fetch("http://127.0.0.1:8000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(
      errorBody.error || `HTTP error! status: ${response.status}`,
    );
  }

  return await response.json();
};

// --- Main Component ---
const PredictorPage = () => {
  const [formData, setFormData] = useState({
    duration: 0,
    protocol_type: "tcp",
    service: "http",
    src_bytes: 181,
    dst_bytes: 5450,
    count: 2,
    srv_count: 2,
    serror_rate: 0.0,
    srv_serror_rate: 0.0,
    dst_host_count: 150,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: isNaN(value) ? value : Number(value),
    }));
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

  const resultPieColors = {
    normal: "#22c55e",
    dos: "#ef4444",
    probe: "#f97316",
    r2l: "#8b5cf6",
    u2r: "#dc2626",
  };

  const pieData = useMemo(() => {
    if (!predictionResult || !predictionResult.probabilities) return [];
    try {
      return Object.entries(predictionResult.probabilities).map(
        ([name, value]) => ({
          name,
          value: parseFloat(value),
          fill: resultPieColors[name] || "#8884d8",
        }),
      );
    } catch (err) {
      console.error("Error parsing probabilities:", err);
      return [];
    }
  }, [predictionResult]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h3" fontWeight="bold">
            AI Intrusion Detection System
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Enter network traffic features to detect anomalies and classify
            attack types.
          </Typography>
        </Box>

        {/* --- Form Card --- */}
        <Card elevation={3}>
          <Box component="form" onSubmit={handleSubmit}>
            <CardHeader
              title="Data Input"
            />
            <CardContent
              sx={{ display: "flex", flexDirection: "column", gap: 3 }}
            >
              {/* --- Section 1 --- */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Network Traffic Features</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Duration"
                        name="duration"
                        type="number"
                        value={formData.duration}
                        onChange={handleInputChange}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Protocol</InputLabel>
                        <Select
                          label="Protocol"
                          name="protocol_type"
                          value={formData.protocol_type}
                          onChange={handleInputChange}
                        >
                          <MenuItem value="tcp">TCP</MenuItem>
                          <MenuItem value="udp">UDP</MenuItem>
                          <MenuItem value="icmp">ICMP</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Source Bytes"
                        name="src_bytes"
                        type="number"
                        value={formData.src_bytes}
                        onChange={handleInputChange}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Destination Bytes"
                        name="dst_bytes"
                        type="number"
                        value={formData.dst_bytes}
                        onChange={handleInputChange}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Connection Count"
                        name="count"
                        type="number"
                        value={formData.count}
                        onChange={handleInputChange}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Service Count"
                        name="srv_count"
                        type="number"
                        value={formData.srv_count}
                        onChange={handleInputChange}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Serror Rate"
                        name="serror_rate"
                        type="number"
                        value={formData.serror_rate}
                        onChange={handleInputChange}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Srv Serror Rate"
                        name="srv_serror_rate"
                        type="number"
                        value={formData.srv_serror_rate}
                        onChange={handleInputChange}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Destination Host Count"
                        name="dst_host_count"
                        type="number"
                        value={formData.dst_host_count}
                        onChange={handleInputChange}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  startIcon={
                    isLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <AutoAwesomeIcon />
                    )
                  }
                >
                  {isLoading ? "Predicting..." : "Run Prediction"}
                </Button>
              </Box>
            </CardContent>
          </Box>
        </Card>

        {/* --- API Error Message --- */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Alert severity="error" sx={{ mt: 4 }}>
                <AlertTitle>API Error</AlertTitle>
                Could not connect to the model. <br />
                <strong>Details:</strong> {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Prediction Result --- */}
        <AnimatePresence>
          {predictionResult && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card elevation={3} sx={{ mt: 4 }}>
                <CardHeader
                  title="Prediction Result"
                  sx={{ bgcolor: "action.hover" }}
                />
                <CardContent>
                  {(() => {
                    try {
                      const mapping = ["normal", "dos", "probe", "r2l", "u2r"];
                      let label = predictionResult.prediction;
                      if (!mapping.includes(label)) {
                        const idx = parseInt(label);
                        label =
                          !isNaN(idx) && idx < mapping.length
                            ? mapping[idx]
                            : "Unknown";
                      }
                      const colorKey = resultColors[label] || "text.primary";
                      const probabilities =
                        predictionResult.probabilities || {};
                      const maxProb = Math.max(
                        ...Object.values(probabilities || { 0: 0 }),
                      );

                      return (
                        <Grid
                          container
                          spacing={2}
                          alignItems="center"
                          justifyContent="center"
                        >
                          {/* --- Centered Text Block --- */}
                          <Grid item xs={12} md={6}>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                textAlign: "center",
                                height: "100%",
                              }}
                            >
                              <Typography
                                variant="button"
                                color="text.secondary"
                                gutterBottom
                              >
                                Predicted Traffic Type
                              </Typography>
                              <Typography
                                variant="h2"
                                fontWeight="bold"
                                sx={{
                                  color: colorKey,
                                  letterSpacing: "-2px",
                                  textAlign: "center",
                                }}
                              >
                                {label.toUpperCase()}
                              </Typography>
                              <Typography
                                variant="h6"
                                color="text.secondary"
                                sx={{ textAlign: "center", mt: 1 }}
                              >
                                Model is{" "}
                                <Box
                                  component="span"
                                  fontWeight="bold"
                                  color="primary.main"
                                >
                                  {(maxProb * 100).toFixed(1)}%
                                </Box>{" "}
                                confident.
                              </Typography>
                            </Box>
                          </Grid>

                          {/* --- Pie Chart --- */}
                          <Grid item xs={12} md={6} sx={{ height: 250 }}>
                            {pieData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) =>
                                      `${name} ${(percent * 100).toFixed(0)}%`
                                    }
                                  >
                                    {pieData.map((entry, i) => (
                                      <Cell key={i} fill={entry.fill} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    formatter={(v) =>
                                      `${(v * 100).toFixed(1)}%`
                                    }
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <Typography
                                color="text.secondary"
                                textAlign="center"
                              >
                                No probability data.
                              </Typography>
                            )}
                          </Grid>
                        </Grid>
                      );
                    } catch (err) {
                      console.error("Render error:", err);
                      return (
                        <Alert severity="error">
                          Error rendering prediction result.
                        </Alert>
                      );
                    }
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </motion.div>
  );
};

export default PredictorPage;
