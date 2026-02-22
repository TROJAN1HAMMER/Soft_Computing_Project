import pandas as pd
import numpy as np

# Column names for NSL-KDD (41 features + label + difficulty level)
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

# Load train and test
train_df = pd.read_csv("KDDTrain+.txt", names=columns)
test_df = pd.read_csv("KDDTest+.txt", names=columns)

print("Train shape:", train_df.shape)
print("Test shape:", test_df.shape)

train_df.drop("difficulty", axis=1, inplace=True)
test_df.drop("difficulty", axis=1, inplace=True)

print("\nTrain Label Distribution:")
print(train_df['label'].value_counts())

print("\nTest Label Distribution:")
print(test_df['label'].value_counts())

# Attack category mapping based on NSL-KDD documentation

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
test_df['attack_type'] = test_df['label'].apply(map_attack)

print("\nNew Train Distribution:")
print(train_df['attack_type'].value_counts())

print("\nNew Test Distribution:")
print(test_df['attack_type'].value_counts())

# Drop original label column
train_df.drop("label", axis=1, inplace=True)
test_df.drop("label", axis=1, inplace=True)

# Separate features and target
X_train = train_df.drop("attack_type", axis=1)
y_train = train_df["attack_type"]

X_test = test_df.drop("attack_type", axis=1)
y_test = test_df["attack_type"]

# One-hot encode categorical columns
X_train = pd.get_dummies(X_train)
X_test = pd.get_dummies(X_test)

# Align test columns to train columns
X_train, X_test = X_train.align(X_test, join='left', axis=1, fill_value=0)

print("Final Train Shape:", X_train.shape)
print("Final Test Shape:", X_test.shape)

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix

# Baseline model
rf = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
)

rf.fit(X_train, y_train)

y_pred = rf.predict(X_test)

print("\nClassification Report (Baseline):")
print(classification_report(y_test, y_pred))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

from imblearn.over_sampling import SMOTE

print("\nBefore SMOTE:")
print(y_train.value_counts())

smote = SMOTE(random_state=42)
X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)

print("\nAfter SMOTE:")
print(pd.Series(y_train_smote).value_counts())

# Train on SMOTE-balanced data
rf_smote = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
)

rf_smote.fit(X_train_smote, y_train_smote)

y_pred_smote = rf_smote.predict(X_test)

print("\nClassification Report (SMOTE):")
print(classification_report(y_test, y_pred_smote))

print("\nConfusion Matrix (SMOTE):")
print(confusion_matrix(y_test, y_pred_smote))

# RandomForest with class weights
rf_weighted = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced"
)

rf_weighted.fit(X_train, y_train)

y_pred_weighted = rf_weighted.predict(X_test)

print("\nClassification Report (Class Weight Balanced):")
print(classification_report(y_test, y_pred_weighted))

print("\nConfusion Matrix (Class Weight Balanced):")
print(confusion_matrix(y_test, y_pred_weighted))

# Binary labels for anomaly detection
y_train_binary = (y_train != "normal").astype(int)
y_test_binary = (y_test != "normal").astype(int)

from sklearn.ensemble import IsolationForest

# Use only normal traffic for training
X_train_normal = X_train[y_train == "normal"]

iso = IsolationForest(
    n_estimators=100,
    contamination=0.15,  # expected anomaly proportion (we can tune later)
    random_state=42,
    n_jobs=-1
)

iso.fit(X_train_normal)

# Predict on test data
iso_preds = iso.predict(X_test)

# Convert predictions
# IsolationForest outputs:
# 1 = normal
# -1 = anomaly
iso_preds_binary = np.where(iso_preds == 1, 0, 1)

from sklearn.ensemble import IsolationForest

# Use only normal traffic for training
X_train_normal = X_train[y_train == "normal"]

iso = IsolationForest(
    n_estimators=100,
    contamination=0.2,  # expected anomaly proportion (we can tune later)
    random_state=42,
    n_jobs=-1
)

iso.fit(X_train_normal)

# Predict on test data
iso_preds = iso.predict(X_test)

# Convert predictions
# IsolationForest outputs:
# 1 = normal
# -1 = anomaly
iso_preds_binary = np.where(iso_preds == 1, 0, 1)

from sklearn.metrics import classification_report

print("\nIsolation Forest (Binary Detection):")
print(classification_report(y_test_binary, iso_preds_binary))

# Create a DataFrame for analysis
results_df = pd.DataFrame({
    "true_label": y_test.values,
    "anomaly_pred": iso_preds_binary
})

# Filter U2R and R2L
u2r_results = results_df[results_df["true_label"] == "u2r"]
r2l_results = results_df[results_df["true_label"] == "r2l"]

u2r_detected = u2r_results["anomaly_pred"].sum()
r2l_detected = r2l_results["anomaly_pred"].sum()

print("\nU2R Detection Rate:")
print(f"Detected {u2r_detected} out of {len(u2r_results)}")

print("\nR2L Detection Rate:")
print(f"Detected {r2l_detected} out of {len(r2l_results)}")

print("\nU2R Recall (Anomaly):", u2r_detected / len(u2r_results))
print("R2L Recall (Anomaly):", r2l_detected / len(r2l_results))

# Train classifier only on attack samples
X_train_attack = X_train[y_train != "normal"]
y_train_attack = y_train[y_train != "normal"]

print("Attack-only training shape:", X_train_attack.shape)
print(y_train_attack.value_counts())

from imblearn.over_sampling import SMOTE

print("\nBefore SMOTE (Attack-only):")
print(y_train_attack.value_counts())

smote_attack = SMOTE(random_state=42)
X_train_attack_smote, y_train_attack_smote = smote_attack.fit_resample(
    X_train_attack, y_train_attack
)

print("\nAfter SMOTE (Attack-only):")
print(pd.Series(y_train_attack_smote).value_counts())

from imblearn.over_sampling import SMOTE

print("\nBefore SMOTE (Attack-only):")
print(y_train_attack.value_counts())

smote_attack = SMOTE(random_state=42)
X_train_attack_smote, y_train_attack_smote = smote_attack.fit_resample(
    X_train_attack, y_train_attack
)

print("\nAfter SMOTE (Attack-only):")
print(pd.Series(y_train_attack_smote).value_counts())

# from xgboost import XGBClassifier
# from sklearn.preprocessing import LabelEncoder

# # XGBoost requires numeric labels → encode attack types
# label_encoder = LabelEncoder()
# y_train_attack_encoded = label_encoder.fit_transform(y_train_attack_smote)

# # Create XGBoost classifier
# xgb_stage2 = XGBClassifier(
#     n_estimators=300,
#     max_depth=6,
#     learning_rate=0.1,
#     subsample=0.8,
#     colsample_bytree=0.8,
#     objective="multi:softmax",   # multi-class classification
#     num_class=4,                 # dos, probe, r2l, u2r
#     random_state=42,
#     n_jobs=-1,
#     eval_metric="mlogloss"
# )

# # Train Stage-2 model
# xgb_stage2.fit(X_train_attack_smote, y_train_attack_encoded)

# # Hybrid prediction (vectorized)
# hybrid_predictions = np.array(["normal"] * len(X_test))

# # Get anomaly indices from Isolation Forest
# anomaly_indices = np.where(iso_preds_binary == 1)[0]

# # Predict encoded attack labels
# attack_preds_encoded = xgb_stage2.predict(X_test.iloc[anomaly_indices])

# # Decode back to original labels
# attack_preds_decoded = label_encoder.inverse_transform(attack_preds_encoded)

# # Fill predictions
# hybrid_predictions[anomaly_indices] = attack_preds_decoded

# print("\nHybrid Model Classification Report:")
# print(classification_report(y_test, hybrid_predictions))

# print("\nHybrid Confusion Matrix:")
# print(confusion_matrix(y_test, hybrid_predictions))

from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import LabelEncoder

# Encode attack labels (ANN needs numeric labels)
label_encoder = LabelEncoder()
y_train_attack_encoded = label_encoder.fit_transform(y_train_attack_smote)

# Create MLP (Backpropagation Network)
mlp_stage2 = MLPClassifier(
    hidden_layer_sizes=(128, 64),   # 2 hidden layers
    activation='relu',
    solver='adam',
    max_iter=200,
    early_stopping=True,
    random_state=42
)

from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix

scaler = StandardScaler()
X_train_attack_smote = scaler.fit_transform(X_train_attack_smote)
X_test_scaled = scaler.transform(X_test)

# Then use X_test_scaled in prediction instead of X_test

# Train ANN
mlp_stage2.fit(X_train_attack_smote, y_train_attack_encoded)

# Hybrid prediction (vectorized)
hybrid_predictions = np.array(["normal"] * len(X_test))

# Get anomaly indices
anomaly_indices = np.where(iso_preds_binary == 1)[0]

# Predict attack classes using ANN
attack_preds_encoded = mlp_stage2.predict(X_test_scaled[anomaly_indices])

# Decode labels back
attack_preds_decoded = label_encoder.inverse_transform(attack_preds_encoded)

# Fill predictions
hybrid_predictions[anomaly_indices] = attack_preds_decoded

print("\nHybrid Model Classification Report:")
print(classification_report(y_test, hybrid_predictions))

print("\nHybrid Confusion Matrix:")
print(confusion_matrix(y_test, hybrid_predictions))

# --- Fuzzy Risk Scoring Layer ---

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

# Apply fuzzy risk scoring
fuzzy_risk_levels = np.array([fuzzy_risk_score(pred) for pred in hybrid_predictions])

# Example: print first 20 predictions with risk
print("\nSample Fuzzy Risk Output:")
for i in range(20):
    print("Predicted:", hybrid_predictions[i], "→ Risk Level:", fuzzy_risk_levels[i])