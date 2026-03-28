import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE
import xgboost as xgb
import os
import pickle
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

print("Initializing Ultimate V3 (41-Feature) Transformer Pipeline...")

columns = [
    'duration','protocol_type','service','flag','src_bytes','dst_bytes','land',
    'wrong_fragment','urgent','hot','num_failed_logins','logged_in','num_compromised',
    'root_shell','su_attempted','num_root','num_file_creations','num_shells','num_access_files',
    'num_outbound_cmds','is_host_login','is_guest_login','count','srv_count','serror_rate',
    'srv_serror_rate','rerror_rate','srv_rerror_rate','same_srv_rate','diff_srv_rate',
    'srv_diff_host_rate','dst_host_count','dst_host_srv_count','dst_host_same_srv_rate',
    'dst_host_diff_srv_rate','dst_host_same_src_port_rate','dst_host_srv_diff_host_rate',
    'dst_host_serror_rate','dst_host_srv_serror_rate','dst_host_rerror_rate',
    'dst_host_srv_rerror_rate','label','difficulty'
]

# STRATIFIED GLOBAL SPLIT
train_df = pd.read_csv("../../ML/data/KDDTrain+.txt", names=columns)
test_df  = pd.read_csv("../../ML/data/KDDTest+.txt", names=columns)
global_df = pd.concat([train_df, test_df], ignore_index=True)
global_df.drop("difficulty", axis=1, inplace=True)

dos_attacks = ['neptune','smurf','back','teardrop','pod','land','apache2','mailbomb','processtable','udpstorm']
probe_attacks = ['satan','ipsweep','nmap','portsweep','mscan','saint']
r2l_attacks = ['guess_passwd','ftp_write','imap','phf','multihop','warezmaster','warezclient','spy','xlock','xsnoop','snmpguess','snmpgetattack','httptunnel','sendmail','named']
u2r_attacks = ['buffer_overflow','rootkit','loadmodule','perl','sqlattack','xterm','ps']

def map_attack(label):
    if label == 'normal': return 'normal'
    if label in dos_attacks: return 'dos'
    if label in probe_attacks: return 'probe'
    if label in r2l_attacks: return 'r2l'
    if label in u2r_attacks: return 'u2r'
    return 'unknown'

global_df['attack_class'] = global_df['label'].apply(map_attack)
global_df = global_df[global_df['attack_class'] != 'unknown']

y_global = global_df['attack_class']
X_global = global_df.drop(['label', 'attack_class'], axis=1)

# One-Hot Encoding ALL Categorical Features
X_global = pd.get_dummies(X_global, columns=['protocol_type', 'service', 'flag'])
X_global = X_global.astype(float) # Ensure all purely numerical for PyTorch

input_dim = X_global.shape[1]
print(f"Dynamically generated {input_dim} total structural features via one-hot encoding!")

X_train_raw, X_test_raw, y_train_raw, y_test_raw = train_test_split(X_global, y_global, test_size=0.20, stratify=y_global, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_raw).astype(np.float32)
X_test_scaled = scaler.transform(X_test_raw).astype(np.float32)

os.makedirs("../../Backend/v3_transformer/models_41", exist_ok=True)
pickle.dump(scaler, open("../../Backend/v3_transformer/models_41/scaler.pkl", "wb"))

print("Balancing Matrix Arrays using SMOTE... (this will take a moment given 120+ columns)")
smote = SMOTE(random_state=42)
X_train_resampled, y_train_resampled = smote.fit_resample(X_train_scaled, y_train_raw)

# --- 1. PYTORCH AUTOENCODER ---
print("\n--- Training Deep Autoencoder (Stage 1) ---")
X_train_normal = X_train_scaled[y_train_raw == 'normal']
train_loader_ae = DataLoader(TensorDataset(torch.tensor(X_train_normal)), batch_size=256, shuffle=True)

class Autoencoder(nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.encoder = nn.Sequential(nn.Linear(dim, 64), nn.ReLU(), nn.Linear(64, 32), nn.ReLU())
        self.decoder = nn.Sequential(nn.Linear(32, 64), nn.ReLU(), nn.Linear(64, dim))
    def forward(self, x): return self.decoder(self.encoder(x))
    
ae_model = Autoencoder(input_dim)
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

torch.save(ae_model.state_dict(), "../../Backend/v3_transformer/models_41/autoencoder.h5")

ae_model.eval()
with torch.no_grad():
    preds = ae_model(torch.tensor(X_train_normal))
    mse = torch.mean((torch.tensor(X_train_normal) - preds)**2, dim=1).numpy()
    threshold = np.percentile(mse, 95)
    print(f"Autoencoder Anomaly Threshold: {threshold}")

# --- 2. PYTORCH TRANSFORMER ---
print("\n--- Training Dense Transformer Engine (Stage 2) ---")
le = LabelEncoder()
fixed_classes = ['dos', 'normal', 'probe', 'r2l', 'u2r']
le.fit(fixed_classes)
y_train_encoded = le.transform(y_train_resampled)
y_test_encoded = le.transform(y_test_raw)
pickle.dump(le, open("../../Backend/v3_transformer/models_41/label_encoder.pkl", "wb"))

X_train_tf = torch.tensor(X_train_resampled).unsqueeze(1).float()
y_train_tf = torch.tensor(y_train_encoded).long()

train_loader = DataLoader(TensorDataset(X_train_tf, y_train_tf), batch_size=256, shuffle=True)

class TransformerClassifier(nn.Module):
    def __init__(self, input_size, d_model=32, nhead=4, num_layers=2, num_classes=5):
        super().__init__()
        self.embedding = nn.Linear(input_size, d_model)
        encoder_layer = nn.TransformerEncoderLayer(d_model=d_model, nhead=nhead, batch_first=True)
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.fc = nn.Linear(d_model, num_classes)
        
    def forward(self, x):
        x = self.embedding(x)
        out = self.transformer(x)
        return self.fc(out[:, -1, :])

tf_model = TransformerClassifier(input_size=input_dim)
criterion_tf = nn.CrossEntropyLoss()
optimizer_tf = optim.Adam(tf_model.parameters(), lr=0.005)

tf_model.train()
for epoch in range(10):
    total_loss = 0
    for batch_x, batch_y in train_loader:
        optimizer_tf.zero_grad()
        out = tf_model(batch_x)
        loss = criterion_tf(out, batch_y)
        loss.backward()
        optimizer_tf.step()
        total_loss += loss.item()
    print(f"Transformer Epoch {epoch+1}/10 - Loss: {total_loss/len(train_loader):.4f}")

torch.save(tf_model.state_dict(), "../../Backend/v3_transformer/models_41/transformer.h5")

# --- 3. XGBOOST FALLBACK ---
print("\n--- Training XGBoost Full Fallback ---")
xgb = xgb.XGBClassifier(
    objective='multi:softprob', num_class=5,
    eval_metric='mlogloss', n_estimators=50, max_depth=6,
    random_state=42, n_jobs=-1
)
xgb.fit(X_train_resampled, y_train_encoded)
pickle.dump(xgb, open("../../Backend/v3_transformer/models_41/xgboost.pkl", "wb"))

# --- 4. ULTIMATE EVALUATION ---
print("\n--- Evaluation on Ultimate 41-Feature Benchmark ---")
X_test_tensor = torch.tensor(X_test_scaled).float()

ae_model.eval()
with torch.no_grad():
    ae_out = ae_model(X_test_tensor)
    test_mse = torch.mean((X_test_tensor - ae_out)**2, dim=1).numpy()

tf_model.eval()
with torch.no_grad():
    tf_out = tf_model(X_test_tensor.unsqueeze(1))
    tf_probs = torch.softmax(tf_out, dim=1).numpy()

xgb_probs = xgb.predict_proba(X_test_scaled)
final_preds = []

for i in range(len(X_test_tensor)):
    if test_mse[i] <= threshold:
        final_preds.append(le.transform(['normal'])[0])
    else:
        tf_prob = tf_probs[i]
        if np.max(tf_prob) < 0.90:
            final_preds.append(np.argmax(xgb_probs[i]))
        else:
            final_preds.append(np.argmax(tf_prob))

final_labels = le.inverse_transform(final_preds)
print("\n--- Ultimate 41-Feature Metric Array ---")
print(classification_report(y_test_raw, final_labels))
print(f"ABSOLUTE MAXIMUM ACCURACY: {accuracy_score(y_test_raw, final_labels):.4f}")
