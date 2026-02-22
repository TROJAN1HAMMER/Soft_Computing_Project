# 🔐 Neuro-Fuzzy Hybrid Intrusion Detection System (IDS)

---

## 📌 Overview

This project implements a **Hybrid Intrusion Detection System (IDS)** designed to improve detection of rare cyber attacks such as:

* **U2R (User to Root)** – Privilege Escalation
* **R2L (Remote to Local)** – Unauthorized Remote Access

These attacks are difficult to detect because:

* Severe class imbalance
* Very few training samples
* Similar behavior to normal traffic
* Subtle exploitation patterns

To address this, the system integrates:

* 🧠 **Artificial Neural Network (ANN – Backpropagation)**
* 🔍 **Isolation Forest (Anomaly Detection)**
* 🧮 **Fuzzy Logic (Risk Reasoning Layer)**

This makes it a **Neuro-Fuzzy Hybrid Soft Computing IDS**.

---

## 🗂 Dataset

**NSL-KDD Dataset**

Files used:

* `KDDTrain+.txt`
* `KDDTest+.txt`

Attack classes grouped into:

* `normal`
* `dos`
* `probe`
* `r2l`
* `u2r`

Dataset Size:

* 125,973 training samples
* 22,544 testing samples

---

## 🏗 System Architecture

### 🔹 Stage 1 – Binary Anomaly Detection

**Isolation Forest**

* Trained to detect anomalous traffic
* Separates:

  * `normal`
  * `anomaly`

Binary Detection Accuracy:
**84%**

Rare Attack Detection (Stage 1):

* U2R Detection Rate: **63%**
* R2L Detection Rate: **39%**

This significantly improves rare attack identification before classification.

---

### 🔹 Stage 2 – Multi-Class Attack Classification

**Multi-Layer Perceptron (Backpropagation Neural Network)**

* Trained only on attack data
* SMOTE used for class balancing
* Classifies into:

  * `dos`
  * `probe`
  * `r2l`
  * `u2r`

---

### 🔹 Stage 3 – Fuzzy Risk Reasoning Layer

A fuzzy logic layer converts model output into decision-level severity:

| Attack Type | Risk Level |
| ----------- | ---------- |
| normal      | Low        |
| probe       | Medium     |
| dos         | High       |
| r2l         | Very High  |
| u2r         | Critical   |

This enables approximate reasoning instead of raw label output.

---

## ⚙️ Techniques Used

* Data preprocessing
* One-hot encoding
* StandardScaler
* SMOTE (Imbalance handling)
* Random Forest (baseline comparison)
* Isolation Forest (unsupervised anomaly detection)
* MLPClassifier (ANN)
* Hybrid model pipeline
* Fuzzy decision mapping

---

## 📊 Model Performance

### 🥉 Baseline Random Forest

* Accuracy: **75%**
* U2R Recall: **2%**
* R2L Recall: **2%**

---

### 🥈 SMOTE + Random Forest

* Accuracy: **76%**
* U2R Recall: **14%**
* R2L Recall: **9%**

---

### 🥇 Isolation Forest (Binary Detection)

* Accuracy: **84%**
* U2R Detection: **63%**
* R2L Detection: **39%**

---

### 🚀 Final Neuro-Fuzzy Hybrid Model

* Overall Accuracy: **78%**
* Weighted F1 Score: **0.77**
* Macro F1 Score: **0.62**
* U2R Recall: **35%**
* R2L Recall: **30%**

📈 Achieves approximately **15× improvement in U2R detection** compared to baseline.

---

## 🖥 Production-Oriented Version

A streamlined deployment model was created using **10 core network features**:

```
duration
protocol_type
service
src_bytes
dst_bytes
count
srv_count
serror_rate
srv_serror_rate
dst_host_count
```

This version includes:

* FastAPI backend
* Pickled trained models (.pkl)
* Real-time prediction API
* React-based interactive dashboard
* Live prediction visualization (Pie Chart + Confidence)

---

## 🛠 Installation

### Requirements

* Python 3.x

### Install Dependencies

```bash
pip install pandas numpy scikit-learn imbalanced-learn fastapi uvicorn
```

---

## ▶️ How to Run (Academic Version)

1. Place `KDDTrain+.txt` and `KDDTest+.txt` in the project directory.
2. Run:

```bash
python u2r_r2l_project.py
```

---

## ▶️ How to Run (Full Stack Version)

### Backend

```bash
uvicorn main:app --reload
```

Runs at:

```
http://127.0.0.1:8000
```

### Frontend

```bash
npm install
npm start
```

Runs at:

```
http://localhost:3000
```

---

## 🧠 Key Contributions

* Addressed extreme class imbalance in intrusion detection.
* Compared supervised vs anomaly-based approaches.
* Designed a layered hybrid IDS architecture.
* Integrated ANN + Fuzzy Logic for soft computing compliance.
* Improved detection of rare privilege escalation attacks.
* Built a deployable frontend + backend ML system.

---

## ⚠️ Limitations

* NSL-KDD is an older benchmark dataset.
* Real-world traffic patterns are more complex.
* Rare attack detection remains inherently difficult.
* Model not yet validated on live packet streams.

---

## 📚 Academic Relevance

This project demonstrates:

* Hybrid Soft Computing Architecture
* Neural Network Classification
* Fuzzy Logic & Approximate Reasoning
* Anomaly Detection for Rare Events
* Imbalanced Learning Techniques

Suitable for:

* Soft Computing coursework
* Cybersecurity academic research
* IDS experimentation studies
* ML deployment demonstrations

---

## 👨‍💻 Author

Neuro-Fuzzy Hybrid Intrusion Detection System
Developed as part of Soft Computing & Cybersecurity coursework.
