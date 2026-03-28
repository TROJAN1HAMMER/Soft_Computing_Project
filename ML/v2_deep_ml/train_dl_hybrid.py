import pandas as pd
import numpy as np
import pickle
import os

from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, f1_score, recall_score
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

print("Starting Deep Learning Hybrid IDS Pipeline on 10 specific features (PyTorch Backend)...")

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
test_df  = pd.read_csv("../data/KDDTest+.txt", names=columns)

dos_attacks = ['neptune','smurf','back','teardrop','pod','land','apache2','mailbomb','processtable','udpstorm']
probe_attacks = ['satan','ipsweep','nmap','portsweep','mscan','saint']
r2l_attacks = ['guess_passwd','ftp_write','imap','phf','multihop','warezmaster','warezclient','spy','xlock','xsnoop','snmpguess','snmpgetattack','httptunnel','sendmail','named','worm','sqlattack']
u2r_attacks = ['buffer_overflow','loadmodule','rootkit','perl','xterm','ps']

def map_attack(label):
    if label == 'normal': return 'normal'
    elif label in dos_attacks: return 'dos'
    elif label in probe_attacks: return 'probe'
    elif label in r2l_attacks: return 'r2l'
    elif label in u2r_attacks: return 'u2r'
    else: return 'unknown'

train_df['attack_type'] = train_df['label'].apply(map_attack)
test_df['attack_type']  = test_df['label'].apply(map_attack)

def engineer_10_features(df):
    new_df = pd.DataFrame()
    new_df['same_srv_rate'] = df['same_srv_rate']
    new_df['service_eco_i'] = (df['service'] == 'eco_i').astype(float)
    new_df['service_ecr_i'] = (df['service'] == 'ecr_i').astype(float)
    new_df['service_http']  = (df['service'] == 'http').astype(float)
    new_df['diff_srv_rate'] = df['diff_srv_rate'].astype(float)
    new_df['src_bytes'] = df['src_bytes'].astype(float)
    new_df['dst_host_same_src_port_rate'] = df['dst_host_same_src_port_rate'].astype(float)
    new_df['hot'] = df['hot'].astype(float)
    new_df['dst_host_diff_srv_rate'] = df['dst_host_diff_srv_rate'].astype(float)
    new_df['wrong_fragment'] = df['wrong_fragment'].astype(float)
    return new_df

X_train_raw = engineer_10_features(train_df)
y_train_raw = train_df['attack_type']

X_test_raw = engineer_10_features(test_df)
y_test_raw = test_df['attack_type']

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_raw).astype(np.float32)
X_test_scaled = scaler.transform(X_test_raw).astype(np.float32)

os.makedirs("../../Backend/v2_deep_ml/models_dl", exist_ok=True)
pickle.dump(scaler, open("../../Backend/v2_deep_ml/models_dl/scaler.pkl", "wb"))

# --- 1. PYTORCH AUTOENCODER ---
print("\n--- Training Autoencoder (Stage 1) ---")
normal_idx = (y_train_raw == 'normal')
X_train_normal = X_train_scaled[normal_idx]
train_loader_ae = DataLoader(TensorDataset(torch.tensor(X_train_normal)), batch_size=256, shuffle=True)

class Autoencoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.encoder = nn.Sequential(nn.Linear(10, 8), nn.ReLU(), nn.Linear(8, 4), nn.ReLU())
        self.decoder = nn.Sequential(nn.Linear(4, 8), nn.ReLU(), nn.Linear(8, 10))
    def forward(self, x): return self.decoder(self.encoder(x))
    
ae_model = Autoencoder()
criterion_ae = nn.MSELoss()
optimizer = optim.Adam(ae_model.parameters(), lr=0.01)

ae_model.train()
for epoch in range(5):
    total_loss = 0
    for batch in train_loader_ae:
        optimizer.zero_grad()
        out = ae_model(batch[0])
        loss = criterion_ae(out, batch[0])
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    print(f"AE Epoch {epoch+1}/5 - Loss: {total_loss/len(train_loader_ae):.4f}")

torch.save(ae_model.state_dict(), "../../Backend/v2_deep_ml/models_dl/autoencoder.h5")

ae_model.eval()
with torch.no_grad():
    preds = ae_model(torch.tensor(X_train_normal))
    mse = torch.mean((torch.tensor(X_train_normal) - preds)**2, dim=1).numpy()
    threshold = np.percentile(mse, 95)
    print(f"Autoencoder Anomaly Threshold: {threshold}")
    with open("../../Backend/v2_deep_ml/models_dl/ae_threshold.txt", "w") as f:
        f.write(str(threshold))

# --- 2. PYTORCH LSTM ---
print("\n--- Training LSTM Classifier (Stage 2) ---")
smote = SMOTE(random_state=42)
X_train_resampled, y_train_resampled = smote.fit_resample(X_train_scaled, y_train_raw)

le = LabelEncoder()
fixed_classes = ["normal", "dos", "probe", "r2l", "u2r"]
le.fit(fixed_classes)
y_train_encoded = le.transform(y_train_resampled)
y_test_encoded = le.transform(y_test_raw)
pickle.dump(le, open("../../Backend/v2_deep_ml/models_dl/label_encoder.pkl", "wb"))

# Reshape for LSTM: (samples, seq_len=1, features)
X_train_lstm = torch.tensor(X_train_resampled).unsqueeze(1).float()
y_train_tensor = torch.tensor(y_train_encoded).long()
train_dataset = TensorDataset(X_train_lstm, y_train_tensor)
train_loader = DataLoader(train_dataset, batch_size=256, shuffle=True)

class LSTMClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(input_size=10, hidden_size=64, batch_first=True)
        self.fc = nn.Sequential(
            nn.Linear(64, 32), nn.ReLU(),
            nn.Linear(32, 5)
        )
    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :] # Take last hidden state
        return self.fc(out)

lstm_model = LSTMClassifier()
criterion_lstm = nn.CrossEntropyLoss()
optimizer_lstm = optim.Adam(lstm_model.parameters(), lr=0.005)

lstm_model.train()
for epoch in range(5):
    total_loss = 0
    for batch_x, batch_y in train_loader:
        optimizer_lstm.zero_grad()
        out = lstm_model(batch_x)
        loss = criterion_lstm(out, batch_y)
        loss.backward()
        optimizer_lstm.step()
        total_loss += loss.item()
    print(f"LSTM Epoch {epoch+1}/5 - Loss: {total_loss/len(train_loader):.4f}")

torch.save(lstm_model.state_dict(), "../../Backend/v2_deep_ml/models_dl/lstm.h5")

# --- 3. XGBOOST FALLBACK ---
print("\n--- Training XGBoost Fallback Model ---")
xgb = XGBClassifier(
    n_estimators=150, max_depth=5, learning_rate=0.1,
    subsample=0.8, colsample_bytree=0.8, objective="multi:softprob",
    random_state=42, n_jobs=-1
)
xgb.fit(X_train_resampled, y_train_encoded)
pickle.dump(xgb, open("../../Backend/v2_deep_ml/models_dl/xgboost.pkl", "wb"))

# --- 4. EVALUATION ---
print("\n--- Evaluation on KDDTest+ ---")
ae_model.eval()
lstm_model.eval()

X_test_tensor = torch.tensor(X_test_scaled)
with torch.no_grad():
    ae_preds = ae_model(X_test_tensor)
    mse_test = torch.mean((X_test_tensor - ae_preds)**2, dim=1).numpy()

is_anomaly = (mse_test > threshold)
print(f"Autoencoder detected {np.sum(is_anomaly)} anomalies out of {len(X_test_scaled)}")

with torch.no_grad():
    lstm_out = lstm_model(X_test_tensor.unsqueeze(1))
    lstm_probs = torch.softmax(lstm_out, dim=1).numpy()

xgb_probs = xgb.predict_proba(X_test_scaled)

hybrid_preds = []
for i in range(len(X_test_scaled)):
    if not is_anomaly[i]:
        hybrid_preds.append("normal")
    else:
        l_prob = np.max(lstm_probs[i])
        if l_prob < 0.85: # Fallback
            pred_idx = np.argmax(xgb_probs[i])
        else:
            pred_idx = np.argmax(lstm_probs[i])
        hybrid_preds.append(le.inverse_transform([pred_idx])[0])

print("\nHybrid Implementation Report:")
report = classification_report(y_test_raw, hybrid_preds, output_dict=True)
print(classification_report(y_test_raw, hybrid_preds))
print(f"Accuracy: {accuracy_score(y_test_raw, hybrid_preds):.4f}")
print("Deep Learning Pipeline Training Complete. Models saved to ../Backend/models_dl/")
