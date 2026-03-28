# ============================================================
# NEURO-FUZZY HYBRID IDS WITH XGBOOST + ENSEMBLE BOOST
# ============================================================

import pandas as pd
import numpy as np
import json
import pickle
import matplotlib.pyplot as plt

from sklearn.ensemble import (
    RandomForestClassifier,
    IsolationForest,
    VotingClassifier
)
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score
)
from sklearn.model_selection import RandomizedSearchCV, cross_val_score

from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier

# ===========================
# FAST / HEAVY TUNING SWITCH
# ===========================
FAST_TUNING = True
N_ITER = 20 if FAST_TUNING else 50

# ============================================================
# LOAD DATA
# ============================================================

columns = [
    'duration','protocol_type','service','flag','src_bytes','dst_bytes','land',
    'wrong_fragment','urgent','hot','num_failed_logins','logged_in','num_compromised',
    'root_shell','su_attempted','num_root','num_file_creations','num_shells',
    'num_access_files','num_outbound_cmds','is_host_login','is_guest_login',
    'count','srv_count','serror_rate','srv_serror_rate','rerror_rate',
    'srv_rerror_rate','same_srv_rate','diff_srv_rate','srv_diff_host_rate',
    'dst_host_count','dst_host_srv_count','dst_host_same_srv_rate',
    'dst_host_diff_srv_rate','dst_host_same_src_port_rate',
    'dst_host_srv_diff_host_rate','dst_host_serror_rate',
    'dst_host_srv_serror_rate','dst_host_rerror_rate',
    'dst_host_srv_rerror_rate','label','difficulty'
]

train_df = pd.read_csv("../data/KDDTrain+.txt", names=columns)
test_df = pd.read_csv("../data/KDDTest+.txt", names=columns)

train_df.drop("difficulty", axis=1, inplace=True)
test_df.drop("difficulty", axis=1, inplace=True)

# ============================================================
# ATTACK GROUPING
# ============================================================

dos_attacks = [
    'neptune','smurf','back','teardrop','pod','land',
    'apache2','mailbomb','processtable','udpstorm'
]

probe_attacks = [
    'satan','ipsweep','nmap','portsweep','mscan','saint'
]

r2l_attacks = [
    'guess_passwd','ftp_write','imap','phf','multihop',
    'warezmaster','warezclient','spy','xlock','xsnoop',
    'snmpguess','snmpgetattack','httptunnel','sendmail',
    'named','worm','sqlattack'
]

u2r_attacks = [
    'buffer_overflow','loadmodule','rootkit','perl','xterm','ps'
]

def map_attack(label):
    if label == 'normal':
        return 'normal'
    elif label in dos_attacks:
        return 'dos'
    elif label in probe_attacks:
        return 'probe'
    elif label in r2l_attacks:
        return 'r2l'
    elif label in u2r_attacks:
        return 'u2r'
    else:
        return 'unknown'

train_df['attack_type'] = train_df['label'].apply(map_attack)
test_df['attack_type']  = test_df['label'].apply(map_attack)

train_df.drop("label", axis=1, inplace=True)
test_df.drop("label", axis=1, inplace=True)

X_train = train_df.drop("attack_type", axis=1)
y_train = train_df["attack_type"]

X_test = test_df.drop("attack_type", axis=1)
y_test = test_df["attack_type"]

# One-hot encoding
X_train = pd.get_dummies(X_train)
X_test  = pd.get_dummies(X_test)
X_train, X_test = X_train.align(X_test, join='left', axis=1, fill_value=0)

print("Train shape:", X_train.shape)
print("Test shape:", X_test.shape)

# ============================================================
# BASELINE RANDOM FOREST
# ============================================================

rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
rf.fit(X_train, y_train)
y_pred = rf.predict(X_test)

print("\nBaseline RF:")
print(classification_report(y_test, y_pred))

# ============================================================
# SMOTE RANDOM FOREST
# ============================================================

smote = SMOTE(random_state=42)
X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)

rf_smote = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
rf_smote.fit(X_train_smote, y_train_smote)
y_pred_smote = rf_smote.predict(X_test)

print("\nSMOTE RF:")
print(classification_report(y_test, y_pred_smote))

# ============================================================
# ISOLATION FOREST (STAGE 1)
# ============================================================

X_train_normal = X_train[y_train == "normal"]

iso = IsolationForest(
    n_estimators=100,
    contamination=0.2,
    random_state=42,
    n_jobs=-1
)

iso.fit(X_train_normal)

iso_preds = iso.predict(X_test)
iso_preds_binary = np.where(iso_preds == 1, 0, 1)

print("\nIsolation Forest Binary:")
print(classification_report(
    (y_test != "normal").astype(int),
    iso_preds_binary
))

# ============================================================
# ANN STAGE-2 HYBRID
# ============================================================

X_train_attack = X_train[y_train != "normal"]
y_train_attack = y_train[y_train != "normal"]

smote_attack = SMOTE(random_state=42)
X_train_attack_smote, y_train_attack_smote = smote_attack.fit_resample(
    X_train_attack, y_train_attack
)

label_encoder = LabelEncoder()
y_train_attack_encoded = label_encoder.fit_transform(y_train_attack_smote)

scaler = StandardScaler()
X_train_attack_scaled = scaler.fit_transform(X_train_attack_smote)
X_test_scaled = scaler.transform(X_test)

mlp_stage2 = MLPClassifier(
    hidden_layer_sizes=(128, 64),
    activation='relu',
    max_iter=200,
    early_stopping=True,
    random_state=42
)

mlp_stage2.fit(X_train_attack_scaled, y_train_attack_encoded)

hybrid_predictions_ann = np.array(["normal"] * len(X_test))
anomaly_indices = np.where(iso_preds_binary == 1)[0]

attack_preds_encoded = mlp_stage2.predict(X_test_scaled[anomaly_indices])
attack_preds_decoded = label_encoder.inverse_transform(attack_preds_encoded)

hybrid_predictions_ann[anomaly_indices] = attack_preds_decoded

print("\nHybrid ANN Report:")
print(classification_report(y_test, hybrid_predictions_ann))

# ============================================================
# XGBOOST STAGE-2 HYBRID (TUNED)
# ============================================================
from tqdm import tqdm
from sklearn.model_selection import ParameterSampler

param_dist = {
    "n_estimators": [200, 300],
    "max_depth": [4, 6],
    "learning_rate": [0.05, 0.1],
    "subsample": [0.8, 0.9],
    "colsample_bytree": [0.8],
    "gamma": [0, 0.1]
}

# Manual tuning with progress bar
param_list = list(
    ParameterSampler(param_dist, n_iter=N_ITER, random_state=42)
)

best_score = -np.inf
best_params = None
best_model = None

print("\nStarting XGBoost tuning with progress bar...\n")

for params in tqdm(param_list):

    model = XGBClassifier(
        objective="multi:softprob",
        num_class=4,
        eval_metric="mlogloss",
        tree_method="hist",
        max_bin=256,
        random_state=42,
        n_jobs=-1,
        **params
    )

    scores = cross_val_score(
        model,
        X_train_attack_smote,
        y_train_attack_encoded,
        cv=3 if FAST_TUNING else 5,
        scoring="f1_macro",
        n_jobs=-1
    )

    mean_score = scores.mean()

    if mean_score > best_score:
        best_score = mean_score
        best_params = params
        best_model = model

print("\nBest XGBoost Params:", best_params)
print("Best CV F1:", best_score)

xgb_stage2 = best_model
xgb_stage2.fit(X_train_attack_smote, y_train_attack_encoded)

# Hybrid Prediction (XGB)
hybrid_predictions_xgb = np.array(["normal"] * len(X_test))
attack_preds_encoded = xgb_stage2.predict(X_test.iloc[anomaly_indices])
attack_preds_decoded = label_encoder.inverse_transform(attack_preds_encoded)
hybrid_predictions_xgb[anomaly_indices] = attack_preds_decoded

print("\nHybrid XGBoost Report:")
print(classification_report(y_test, hybrid_predictions_xgb))

# ============================================================
# FULL MULTICLASS XGBOOST (FOR ENSEMBLE)
# ============================================================

xgb_full_model = XGBClassifier(
    tree_method="hist",
    max_bin=256,
    n_estimators=150,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="multi:softprob",
    eval_metric="mlogloss",
    random_state=42,
    n_jobs=-1
)

# ============================================================
# FULL MULTICLASS XGBOOST (FOR ENSEMBLE) - FIXED
# ============================================================

label_encoder_full = LabelEncoder()
y_train_smote_encoded = label_encoder_full.fit_transform(y_train_smote)

xgb_full_model = XGBClassifier(
    n_estimators=150,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="multi:softprob",
    eval_metric="mlogloss",
    random_state=42,
    n_jobs=-1
)

xgb_full_model.fit(X_train_smote, y_train_smote_encoded)

# ============================================================
# ENSEMBLE BOOST STAGE
# ============================================================

rf_full = RandomForestClassifier(
    n_estimators=200,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

svm_full = SVC(
    kernel="rbf",
    C=5,
    class_weight="balanced",
    probability=False,
    random_state=42
)

rf_full.fit(X_train_smote, y_train_smote)
svm_full.fit(X_train_smote, y_train_smote)

voting_model = VotingClassifier(
    estimators=[
        ("xgb", xgb_full_model),
        ("rf", rf_full),
        ("svm", svm_full)
    ],
    voting="hard",
    n_jobs=-1
)

voting_model.fit(X_train_smote, y_train_smote)

vote_pred_encoded = voting_model.predict(X_test)
vote_pred = label_encoder_full.inverse_transform(vote_pred_encoded)

print("\nVoting Ensemble Report:")
print(classification_report(y_test, vote_pred))

# ============================================================
# FUZZY RISK LAYER
# ============================================================

def fuzzy_risk_score(attack_type):
    if attack_type == "normal":
        return "Low"
    elif attack_type == "probe":
        return "Medium"
    elif attack_type == "dos":
        return "High"
    elif attack_type == "r2l":
        return "Very High"
    elif attack_type == "u2r":
        return "Critical"
    else:
        return "Unknown"

# ============================================================
# EXPORT METRICS
# ============================================================

report_dict = classification_report(
    y_test,
    hybrid_predictions_xgb,
    output_dict=True
)

dashboard_metrics = {
    "model_name": "Hybrid Neuro-Fuzzy IDS",
    "baseline_accuracy": accuracy_score(y_test, y_pred),
    "smote_accuracy": accuracy_score(y_test, y_pred_smote),
    "hybrid_accuracy": accuracy_score(y_test, hybrid_predictions_xgb),
    "binary_accuracy": accuracy_score(
        (y_test != "normal").astype(int),
        iso_preds_binary
    ),
    "macro_f1": report_dict["macro avg"]["f1-score"],
    "weighted_f1": report_dict["weighted avg"]["f1-score"],
    "confusion_matrix": confusion_matrix(
        y_test,
        hybrid_predictions_xgb
    ).tolist()
}

with open("dashboard_metrics.json", "w") as f:
    json.dump(dashboard_metrics, f, indent=4)

print("\nDashboard metrics saved.")

# ============================================================
# SAVE MODELS
# ============================================================

pickle.dump(iso, open("isolation_forest.pkl", "wb"))
pickle.dump(mlp_stage2, open("mlp_stage2.pkl", "wb"))
pickle.dump(xgb_stage2, open("xgb_stage2.pkl", "wb"))
pickle.dump(xgb_full_model, open("xgb_full_model.pkl", "wb"))
pickle.dump(voting_model, open("voting_ensemble.pkl", "wb"))
pickle.dump(label_encoder, open("label_encoder.pkl", "wb"))
pickle.dump(scaler, open("scaler.pkl", "wb"))

print("All models saved successfully.")