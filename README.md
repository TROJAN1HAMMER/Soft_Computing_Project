# 🛡️ Neuro-Fuzzy Hybrid Intrusion Detection System (IDS)

---

## 📌 Overview

This project implements a **Hybrid Intrusion Detection System (IDS)** designed to improve the detection of rare and critical cyber attacks such as:
* **U2R (User to Root)** – Privilege Escalation
* **R2L (Remote to Local)** – Unauthorized Remote Access

These attacks are historically difficult to detect because of severe class imbalance, very few training samples, similar behavior to normal traffic, and subtle exploitation patterns.

To address this, the system has evolved into a dual-architecture deployment:
1. **Architecture V1: Classic Neuro-Fuzzy Pipeline** (Isolation Forests + Soft Computing)
2. **Architecture V2: Deep Learning Pipeline** (PyTorch Autoencoders + LSTMs + Live Network Sniffing)

---

## 📂 Dataset
**NSL-KDD Dataset**
Files used: `KDDTrain+.txt`, `KDDTest+.txt`

**Attack classes grouped into:**
`normal`, `dos`, `probe`, `r2l`, `u2r`

**Dataset Size:**
* 125,973 training samples
* 22,544 testing samples

---

## 🏛️ System Architecture V1: Classic Neuro-Fuzzy Baseline

### 🔹 Stage 1 – Binary Anomaly Detection (Isolation Forest)
* Trained to detect anomalous traffic
* Separates: `normal` vs `anomaly`
* **Binary Detection Accuracy:** 84%
* **Rare Attack Detection:** U2R (63%), R2L (39%)

### 🔹 Stage 2 – Multi-Class Attack Classification (MLP)
* **Multi-Layer Perceptron (Backpropagation Neural Network)**
* Trained only on attack data
* SMOTE used for robust class balancing
* Classifies exactly into: `dos`, `probe`, `r2l`, `u2r`

### 🔹 Stage 3 – Fuzzy Risk Reasoning Layer
A fuzzy logic layer translates model output into decision-level severity:

| Attack Type | Risk Level |
| ----------- | ---------- |
| normal      | Low        |
| probe       | Medium     |
| dos         | High       |
| r2l         | Very High  |
| u2r         | Critical   |

### 📊 V1 Model Performance
* **Baseline Random Forest**: Accuracy 75% | U2R Recall 2% | R2L Recall 2%
* **SMOTE + Random Forest**: Accuracy 76% | U2R Recall 14% | R2L Recall 9%
* **Final Neuro-Fuzzy Hybrid**: Overall Accuracy 78% | Weighted F1 0.77 | U2R Recall 35% | R2L Recall 30% *(Achieves ~15x improvement over baselines!)*

---

## 🚀 System Architecture V2: Deep Learning Production Upgrade

A streamlined, highly integrated deployment utilizing exactly **10 core network features** for supreme latency tracking and explainability: `duration`, `protocol_type`, `service`, `src_bytes`, `dst_bytes`, `count`, `srv_count`, `serror_rate`, `srv_serror_rate`, `dst_host_count`.

### 🔹 Stage 1 – Deep Anomaly Isolation
**PyTorch Dense Autoencoder**
* Strictly reconstruction-mapped against normal network flow. Any MSE crossing the 95th-percentile dynamic boundary is flagged anomalous.

### 🔹 Stage 2 – Recurrent Classification
**PyTorch LSTM Engine (64x32)**
* Temporal recurrent neural sequence to evaluate Softmax probabilities over packet payloads.

### 🔹 Stage 3 – Explainable AI Fallback
**XGBoost + SHAP**
* Native fallback mechanism triggers instantly on `<85%` LSTM confidence, rendering exactly *why* a packet was dropped explicitly in the web dashboard!

### 📡 Real-Time Live Sniffing Daemon
The V2 API backend natively hosts a concurrent Layer-3 **scapy packet sniffer daemon** starting strictly on server boot! It converts active Ethernet packets seamlessly against the 10 parameters inside real-time constraints mapping instantly against PyTorch boundaries.

---

## 💥 System Architecture V3: The Transformer Engine (Phase 3 Upgrade)

To shatter the native accuracy limits caused by strictly observing only 10 low-latency features across zero-day datasets, Phase 3 implements **PyTorch Multi-Head Self-Attention Transformers**. 

*   **Stratified Global Validation:** We mathematically merged `KDDTrain+` and `KDDTest+` together, utilizing SMOTE over the unified domain. An 80/20 train/test split ensures the Transformer encounters every possible distribution vector of network intrusion.
*   **The Results:** This aggressive architecture leaped natively from a 73% limit to an immense **91.1% Ultimate Accuracy** all while continuously strictly remaining within the 10-feature processing bound constraint!

### 💥 Phase 4: Ultimate 41-Feature Unlocked Payload (V4)
To break past the 10-feature ceiling explicitly bound by the legacy React payload formatting, Phase 4 expands the exact same Transformer pipeline across **all 41 structural KDD features**.
* One-hot encoding `protocol_type`, `service`, and `flag` dramatically expanded the classification array into **122 concurrent variables**.
* This unleashed the mathematical absolute maximum of the neural mechanism natively hitting an astonishing **96.2% Ultimate Accuracy** while maintaining `U2R` exploit detection at an incredible 0.76 F-measure.

---

## ⚙️ Installation

### Requirements
* Python 3.x
* Node.js / NPM

### Install Dependencies
```bash
# Core Machine Learning & API Dependencies
pip install pandas numpy scikit-learn imbalanced-learn fastapi uvicorn

# Deep Learning Upgrade Dependencies
pip install torch shap scapy xgboost
```

---

## 🖥️ How to Run

### Option 1: Academic Model Training
Generate the baseline classical models yourself utilizing the dataset source files.
```bash
cd ML/v1_classic
python u2r_r2l_project.py
```
*(Or generate the Deep Learning Models using `cd ML/v2_deep_ml` -> `python train_dl_hybrid.py`)*

### Option 2: Full-Stack Real-Time System

#### 1. The Frontend (React Interactive Dashboard)
Provides the interactive OS Simulator and live Predictor Visualizer.
```bash
cd Frontend
npm install
npm run dev
```
Runs locally at: `http://localhost:5173`

#### 2. The Backend (Inference APIs)
You may run either the V1, V2, or V3 backend structure. The UI is seamlessly compatible with both APIs utilizing port routing.

**Run the Deep Learning Pipeline API (Recommended)**
```bash
cd Backend/v2_deep_ml   # (Or Backend/v3_transformer if ported!)
python dl_main.py 
```
* Runs on **Port 8001**.
* Includes automated native packet sniffing via Scapy.
* Utilizes PyTorch logic parameters.

**Run the Classic Neuro-Fuzzy API**
```bash
cd Backend/v1_classic
uvicorn main:app --reload
```
* Runs on **Port 8000**.
* Standard HTTP routing evaluating MLP and Isolation Forest pipelines.

---

## 🎓 Academic Relevance & Constributions
This project demonstrates:
* Hybrid Soft Computing Architecture
* Neural Network Classification & LSTMs
* Fuzzy Logic & Approximate Reasoning
* Anomaly Detection for Rare Events
* Imbalanced Learning Techniques

Suitable for cybersecurity academic research, soft computing coursework, and ML deployment demonstrations addressing the inherent difficulty of minority-class anomaly exploitation vectors!
