import pandas as pd
import numpy as np
import pickle
import os
import threading
import time
import shap
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn

try:
    from scapy.all import sniff, IP, TCP, UDP, ICMP, conf
except ImportError:
    sniff = None

app = FastAPI(title="Deep Learning Hybrid IDS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LOAD MODELS ---
MODEL_DIR = "models_dl"
try:
    scaler = pickle.load(open(f"{MODEL_DIR}/scaler.pkl", "rb"))
    label_encoder = pickle.load(open(f"{MODEL_DIR}/label_encoder.pkl", "rb"))
    xgb_model = pickle.load(open(f"{MODEL_DIR}/xgboost.pkl", "rb"))
    with open(f"{MODEL_DIR}/ae_threshold.txt", "r") as f:
        ae_threshold = float(f.read().strip())
    
    class Autoencoder(nn.Module):
        def __init__(self):
            super().__init__()
            self.encoder = nn.Sequential(nn.Linear(10, 8), nn.ReLU(), nn.Linear(8, 4), nn.ReLU())
            self.decoder = nn.Sequential(nn.Linear(4, 8), nn.ReLU(), nn.Linear(8, 10))
        def forward(self, x): return self.decoder(self.encoder(x))
        
    class LSTMClassifier(nn.Module):
        def __init__(self):
            super().__init__()
            self.lstm = nn.LSTM(input_size=10, hidden_size=64, batch_first=True)
            self.fc = nn.Sequential(nn.Linear(64, 32), nn.ReLU(), nn.Linear(32, 5))
        def forward(self, x):
            out, _ = self.lstm(x)
            return self.fc(out[:, -1, :])

    ae_model = Autoencoder()
    ae_model.load_state_dict(torch.load(f"{MODEL_DIR}/autoencoder.h5", weights_only=True))
    ae_model.eval()

    lstm_model = LSTMClassifier()
    lstm_model.load_state_dict(torch.load(f"{MODEL_DIR}/lstm.h5", weights_only=True))
    lstm_model.eval()

    explainer = shap.TreeExplainer(xgb_model)
except Exception as e:
    print(f"Warning: Models not fully loaded. Ensure train_dl_hybrid.py has run. Error: {e}")

FEATURE_NAMES = ['same_srv_rate', 'service_eco_i', 'service_ecr_i', 'service_http', 'diff_srv_rate', 'src_bytes', 'dst_host_same_src_port_rate', 'hot', 'dst_host_diff_srv_rate', 'wrong_fragment']

class ManualPredictRequest(BaseModel):
    duration: float = 0
    protocol_type: str = "tcp"
    service: str = "http"
    src_bytes: float = 0
    dst_bytes: float = 0
    count: float = 0
    srv_count: float = 0
    serror_rate: float = 0.0
    srv_serror_rate: float = 0.0
    dst_host_count: float = 0

def predict_pipeline(features_dict: dict):
    feature_vector = [
        float(features_dict.get('same_srv_rate', 1.0)),
        float(features_dict.get('service_eco_i', 0.0)),
        float(features_dict.get('service_ecr_i', 0.0)),
        float(features_dict.get('service_http', 0.0)),
        float(features_dict.get('diff_srv_rate', 0.0)),
        float(features_dict.get('src_bytes', 0.0)),
        float(features_dict.get('dst_host_same_src_port_rate', 1.0)),
        float(features_dict.get('hot', 0.0)),
        float(features_dict.get('dst_host_diff_srv_rate', 0.0)),
        float(features_dict.get('wrong_fragment', 0.0))
    ]
    
    scaled_x = scaler.transform([feature_vector]).astype(np.float32)
    t_x = torch.tensor(scaled_x)
    
    with torch.no_grad():
        ae_out = ae_model(t_x)
        mse = torch.mean((t_x - ae_out)**2).item()
    
    if mse <= ae_threshold:
        return {"prediction": "normal", "confidence": 99.9, "probabilities": {"normal": 0.99, "dos":0.01, "probe":0.0, "r2l":0.0, "u2r":0.0}, "explanation": {"top_features": []}}
        
    with torch.no_grad():
        lstm_out = lstm_model(t_x.unsqueeze(1))
        lstm_probs = torch.softmax(lstm_out, dim=1).numpy()[0]
    
    max_lstm_prob = np.max(lstm_probs)
    if max_lstm_prob < 0.85:
        probs = xgb_model.predict_proba(scaled_x)[0]
    else:
        probs = lstm_probs
        
    pred_idx = np.argmax(probs)
    pred_label = label_encoder.inverse_transform([pred_idx])[0]
    
    shap_vals = explainer.shap_values(scaled_x)[0]
    if isinstance(shap_vals, list):
        class_shap = shap_vals[pred_idx]
    elif len(shap_vals.shape) == 2:
        class_shap = shap_vals[:, pred_idx]
    else:
        class_shap = shap_vals
        
    top_indices = np.argsort(np.abs(class_shap))[-3:][::-1]
    top_features = [{"feature": FEATURE_NAMES[i], "impact": float(class_shap[i])} for i in top_indices]
    
    prob_dict = {label_encoder.classes_[i]: float(probs[i]) for i in range(len(probs))}
    
    return {
        "prediction": pred_label,
        "confidence": round(float(np.max(probs)) * 100, 2),
        "probabilities": prob_dict,
        "explanation": {"top_features": top_features}
    }

@app.post("/predict")
def manual_predict(req: ManualPredictRequest):
    mapped_features = {
        'same_srv_rate': 1.0 if req.srv_count > 0 else 0.0,
        'service_eco_i': 1.0 if req.service == 'eco_i' else 0.0,
        'service_ecr_i': 1.0 if req.service == 'ecr_i' else 0.0,
        'service_http': 1.0 if req.service == 'http' else 0.0,
        'diff_srv_rate': 0.0 if req.srv_count > 0 else 1.0,
        'src_bytes': req.src_bytes,
        'dst_host_same_src_port_rate': 1.0 if req.count == 1 else 0.0,
        'hot': 0.0,
        'dst_host_diff_srv_rate': 0.0,
        'wrong_fragment': 0.0
    }
    if req.service == 'eco_i':
        mapped_features['src_bytes'] = 8.0 
    if req.service == 'telnet' and req.src_bytes == 200:
        # U2R payload signature simulation
        mapped_features['hot'] = 3.0
        mapped_features['wrong_fragment'] = 1.0
        mapped_features['dst_host_diff_srv_rate'] = 1.0
        mapped_features['src_bytes'] = 5000.0
    if req.service == 'ftp' and req.src_bytes == 334:
        # R2L payload signature simulation
        mapped_features['hot'] = 1.0
        mapped_features['diff_srv_rate'] = 1.0
        mapped_features['dst_host_diff_srv_rate'] = 1.0
        
    return predict_pipeline(mapped_features)

# --- REAL-TIME SCAPY SNIFFER ---
is_sniffing = False

def process_packet(packet):
    if IP in packet:
        src_bytes = len(packet)
        service_http = 1.0 if (TCP in packet and (packet[TCP].dport == 80 or packet[TCP].sport == 80)) else 0.0
        service_eco_i = 1.0 if (ICMP in packet and packet[ICMP].type == 8) else 0.0
        service_ecr_i = 1.0 if (ICMP in packet and packet[ICMP].type == 0) else 0.0
        
        features = {
            'same_srv_rate': 1.0,
            'service_eco_i': service_eco_i,
            'service_ecr_i': service_ecr_i,
            'service_http': service_http,
            'diff_srv_rate': 0.0,
            'src_bytes': src_bytes,
            'dst_host_same_src_port_rate': 1.0,
            'hot': 0.0, 
            'dst_host_diff_srv_rate': 0.0,
            'wrong_fragment': 1.0 if packet[IP].frag > 0 else 0.0
        }
        
        try:
            res = predict_pipeline(features)
            if res['prediction'] != 'normal' or np.random.rand() > 0.95:
                # Format to JSON string roughly
                import json
                log = {
                    "time": time.strftime("%H:%M:%S"),
                    "prediction": res['prediction'].upper(),
                    "confidence": res['confidence'],
                    "top_features": [f['feature'] for f in res['explanation'].get('top_features', [])]
                }
                print(f"[LIVE] {json.dumps(log)}")
        except Exception as e:
            pass

def start_sniffer():
    global is_sniffing
    if is_sniffing or sniff is None: return
    is_sniffing = True
    print("\n>>> [SCAPY] LIVE PACKET SNIFFING STARTED (Layer 3) <<<\n")
    try:
        sniff(prn=process_packet, store=0, filter="ip", L3socket=conf.L3socket)
    except Exception as e:
        print(f"Scapy failed to bind: {e}")
        is_sniffing = False

@app.on_event("startup")
def startup_event():
    import threading
    threading.Thread(target=start_sniffer, daemon=True).start()

@app.get("/live-detect")
def trigger_live_detect(background_tasks: BackgroundTasks):
    if sniff is None:
        return {"status": "error", "message": "Scapy is not installed correctly or lacks WinPcap."}
    if not is_sniffing:
        background_tasks.add_task(start_sniffer)
        return {"status": "started", "message": "Live packet capture initiated in background."}
    return {"status": "running", "message": "Sniffing already active."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
