# 🔐 Neuro-Fuzzy Hybrid Intrusion Detection System (IDS)

## 📌 Overview

This project implements a **Hybrid Intrusion Detection System (IDS)** focused on improving the detection of rare cyber attacks such as:

* **U2R (User to Root)** – Privilege Escalation
* **R2L (Remote to Local)** – Remote Access Attacks

These attacks are difficult to detect due to:

* Severe class imbalance
* Similarity to normal traffic
* Subtle behavioral patterns

The system integrates:

* 🧠 **Artificial Neural Network (ANN)**
* 🔍 **Isolation Forest (Anomaly Detection)**
* 🧮 **Fuzzy Logic (Risk Reasoning)**

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

---

## 🏗 System Architecture

### Stage 1 – Anomaly Detection

* **Isolation Forest**
* Trained only on normal traffic
* Detects anomalous connections

### Stage 2 – Attack Classification

* **Multi-Layer Perceptron (Backpropagation ANN)**
* Trained on attack-only data (balanced using SMOTE)
* Classifies into:

  * `dos`
  * `probe`
  * `r2l`
  * `u2r`

### Stage 3 – Fuzzy Risk Reasoning

Fuzzy logic layer assigns severity levels:

| Attack Type | Risk Level |
| ----------- | ---------- |
| normal      | Low        |
| probe       | Medium     |
| dos         | High       |
| r2l         | Very High  |
| u2r         | Critical   |

---

## ⚙️ Techniques Used

* Data preprocessing
* One-hot encoding
* SMOTE (Class imbalance handling)
* Random Forest (baseline comparison)
* Isolation Forest (unsupervised anomaly detection)
* MLPClassifier (Neural Network)
* StandardScaler (feature scaling)
* Fuzzy decision reasoning

---

## 📊 Model Performance

### Baseline Random Forest

* Accuracy: **75%**
* U2R Recall: **2%**
* R2L Recall: **2%**

### SMOTE + Random Forest

* Accuracy: **76%**
* U2R Recall: **14%**
* R2L Recall: **9%**

### Isolation Forest (Binary Detection)

* Accuracy: **84%**
* U2R Detection: **63%**
* R2L Detection: **39%**

### 🚀 Final Neuro-Fuzzy Hybrid Model

* Accuracy: **78%**
* U2R Recall: **35%**
* R2L Recall: **30%**

📈 Achieves ~15–17× improvement in rare attack detection compared to baseline.

---

## 🧠 Key Contributions

* Addressed extreme class imbalance in intrusion detection.
* Compared supervised and anomaly-based approaches.
* Designed a layered hybrid IDS architecture.
* Integrated ANN + Fuzzy Logic for soft computing compliance.
* Significantly improved detection of rare privilege escalation attacks.

---

## 🛠 Installation

### Requirements

* Python 3.x

### Install Dependencies

```bash
pip install pandas numpy scikit-learn imbalanced-learn
```

---

## ▶️ How to Run

1. Place `KDDTrain+.txt` and `KDDTest+.txt` in the project directory.
2. Run:

```bash
python u2r_r2l_project.py
```

---

## ⚠️ Limitations

* NSL-KDD is an older simulated dataset.
* Not production-ready.
* Rare attack detection remains inherently challenging.

---

## 📚 Academic Relevance

This project demonstrates:

* Hybrid Soft Computing Architecture
* Neural Network-based Classification
* Fuzzy Logic for Approximate Reasoning
* Anomaly Detection for Rare Events

Suitable for:

* Soft Computing coursework
* Cybersecurity research experiments
* Academic IDS studies

---

## 👨‍💻 Author

Neuro-Fuzzy Hybrid Intrusion Detection System
Developed as part of Soft Computing / Cybersecurity coursework.
