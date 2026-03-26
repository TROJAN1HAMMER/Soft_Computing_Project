import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier

print("Starting production ML model training on 10 specific features...")

# -----------------------
# 1. Feature Definition
# -----------------------
# These are the 10 features used by the Backend prediction API
prod_features = [
    'duration', 'protocol_type', 'service', 'src_bytes', 'dst_bytes',
    'count', 'srv_count', 'serror_rate', 'srv_serror_rate', 'dst_host_count'
]
target_col = 'attack_type'

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

# -----------------------
# 2. Data Loading & Parsing
# -----------------------
train_df = pd.read_csv("./data/KDDTrain+.txt", names=columns)
test_df  = pd.read_csv("./data/KDDTest+.txt", names=columns)

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

# Extract only the required production features + label
df_train_prod = train_df[prod_features + [target_col]].copy()
df_test_prod = test_df[prod_features + [target_col]].copy()

# -----------------------
# 3. Categorical Encoding (Matching Backend)
# -----------------------
protocol_map = {"tcp": 0, "udp": 1, "icmp": 2}
service_map = {"http": 0, "ftp": 1, "smtp": 2}

def encode_cats(df):
    df['protocol_type'] = df['protocol_type'].map(protocol_map).fillna(0) # 0 for others
    df['service'] = df['service'].map(service_map).fillna(0) # 0 for others
    return df

df_train_prod = encode_cats(df_train_prod)
df_test_prod = encode_cats(df_test_prod)

X_train = df_train_prod.drop('attack_type', axis=1)
y_train = df_train_prod['attack_type']

X_test = df_test_prod.drop('attack_type', axis=1)
y_test = df_test_prod['attack_type']

# -----------------------
# 4. Isolation Forest (Stage 1)
# -----------------------
print("Training Isolation Forest on 10 features...")
X_train_normal = X_train[y_train == "normal"]
iso = IsolationForest(n_estimators=100, contamination=0.2, random_state=42, n_jobs=-1)
iso.fit(X_train_normal)

# Test Binary Detection Phase
iso_preds = iso.predict(X_test)
iso_preds_binary = np.where(iso_preds == 1, 0, 1)

print("\nIsolation Forest Binary Detection:")
print(classification_report((y_test != "normal").astype(int), iso_preds_binary))

# -----------------------
# 5. XGBoost Model (Stage 2)
# -----------------------
print("Balancing attack classes using SMOTE...")
X_train_attack = X_train[y_train != "normal"]
y_train_attack = y_train[y_train != "normal"]

smote_attack = SMOTE(random_state=42)
X_train_attack_smote, y_train_attack_smote = smote_attack.fit_resample(X_train_attack, y_train_attack)

label_encoder = LabelEncoder()
y_train_attack_encoded = label_encoder.fit_transform(y_train_attack_smote)

scaler = StandardScaler()
X_train_attack_scaled = scaler.fit_transform(X_train_attack_smote)
X_test_scaled = scaler.transform(X_test)

print("Training tuned XGBoost model on scaled 10 features...")
xgb_model = XGBClassifier(
    n_estimators=300,        # Boosted estimators
    max_depth=6,             # Optimal depth
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="multi:softprob",
    eval_metric="mlogloss",
    random_state=42,
    n_jobs=-1
)
xgb_model.fit(X_train_attack_scaled, y_train_attack_encoded)

# -----------------------
# 6. Hybrid System Evaluation
# -----------------------
hybrid_predictions = np.array(["normal"] * len(X_test))
anomaly_indices = np.where(iso_preds_binary == 1)[0]

attack_preds_encoded = xgb_model.predict(X_test_scaled[anomaly_indices])
attack_preds_decoded = label_encoder.inverse_transform(attack_preds_encoded)

hybrid_predictions[anomaly_indices] = attack_preds_decoded

print("\nFinal Hybrid Model (ISO + XGB) Report on 10 Features:")
print(classification_report(y_test, hybrid_predictions))

# -----------------------
# 7. Export Models to Backend
# -----------------------
backend_dir = "../Backend"

pickle.dump(iso, open(os.path.join(backend_dir, "isolation_forest.pkl"), "wb"))
pickle.dump(xgb_model, open(os.path.join(backend_dir, "xgb_prod.pkl"), "wb"))
pickle.dump(label_encoder, open(os.path.join(backend_dir, "label_encoder.pkl"), "wb"))
pickle.dump(scaler, open(os.path.join(backend_dir, "scaler.pkl"), "wb"))

print("\nProduction models successfully exported to Backend directory!")
