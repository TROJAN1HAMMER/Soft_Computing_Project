import pandas as pd
import numpy as np
import pickle
import os
import time
import shap
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import threading
import torch
import torch.nn as nn

try:
    from scapy.all import sniff, IP, TCP, UDP, ICMP, conf
except ImportError:
    sniff = None

is_sniffing = False

def start_sniffer():
    global is_sniffing
    if is_sniffing or sniff is None: return
    is_sniffing = True
    print("\n>>> [SCAPY V3] LIVE PACKET SNIFFING STARTED (Layer 3) <<<\n")
    try:
        sniff(prn=process_packet, store=0, filter="ip", L3socket=conf.L3socket)
    except Exception as e:
        print(f"Scapy failed to bind: {e}")
        is_sniffing = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=start_sniffer, daemon=True).start()
    yield

app = FastAPI(title="Transformer Hybrid IDS API (V3)", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LOAD MODELS ---
MODEL_DIR = "models"
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
        
    class TransformerClassifier(nn.Module):
        def __init__(self, input_size=10, d_model=16, nhead=2, num_layers=2, num_classes=5):
            super().__init__()
            self.embedding = nn.Linear(input_size, d_model)
            encoder_layer = nn.TransformerEncoderLayer(d_model=d_model, nhead=nhead, batch_first=True)
            self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
            self.fc = nn.Linear(d_model, num_classes)
            
        def forward(self, x):
            x = self.embedding(x)
            out = self.transformer(x)
            return self.fc(out[:, -1, :])

    ae_model = Autoencoder()
    ae_model.load_state_dict(torch.load(f"{MODEL_DIR}/autoencoder.h5", weights_only=True))
    ae_model.eval()

    tf_model = TransformerClassifier()
    tf_model.load_state_dict(torch.load(f"{MODEL_DIR}/transformer.h5", weights_only=True))
    tf_model.eval()

    explainer = shap.TreeExplainer(xgb_model)
except Exception as e:
    print(f"Warning: Models not fully loaded. Ensure train_transformer_ids.py has run. Error: {e}")

FEATURE_NAMES = ['same_srv_rate', 'service_eco_i', 'service_ecr_i', 'service_http', 'diff_srv_rate', 'src_bytes', 'dst_host_same_src_port_rate', 'hot', 'dst_host_diff_srv_rate', 'wrong_fragment']

class ManualPredictRequestV3(BaseModel):
    same_srv_rate: float
    service_eco_i: float
    service_ecr_i: float
    service_http: float
    diff_srv_rate: float
    src_bytes: float
    dst_host_same_src_port_rate: float
    hot: float
    dst_host_diff_srv_rate: float
    wrong_fragment: float

def extract_features(req: ManualPredictRequestV3):
    return [
        req.same_srv_rate,
        req.service_eco_i,
        req.service_ecr_i,
        req.service_http,
        req.diff_srv_rate,
        req.src_bytes,
        req.dst_host_same_src_port_rate,
        req.hot,
        req.dst_host_diff_srv_rate,
        req.wrong_fragment
    ]

@app.post("/predict")
def manual_predict(req: ManualPredictRequestV3):
    feature_vector = extract_features(req)
    scaled_x = scaler.transform([feature_vector]).astype(np.float32)
    t_x = torch.tensor(scaled_x)
    
    with torch.no_grad():
        ae_out = ae_model(t_x)
        mse = torch.mean((t_x - ae_out)**2).item()
        tf_out = tf_model(t_x.unsqueeze(1))
        tf_probs = torch.softmax(tf_out, dim=1).numpy()[0]
    
    if mse <= ae_threshold:
        pred_label = "normal"
        confidence = 99.9
        prob_dict = {"normal": 0.99, "dos":0.01, "probe":0.0, "r2l":0.0, "u2r":0.0}
        pred_idx = label_encoder.transform(["normal"])[0]
    else:
        max_tf_prob = np.max(tf_probs)
        if max_tf_prob < 0.90:
            probs = xgb_model.predict_proba(scaled_x)[0]
        else:
            probs = tf_probs
        pred_idx = np.argmax(probs)
        pred_label = label_encoder.inverse_transform([pred_idx])[0]
        prob_dict = {label_encoder.classes_[i]: float(probs[i]) for i in range(len(probs))}
        confidence = round(float(np.max(probs)) * 100, 2)
        
    shap_vals = explainer.shap_values(scaled_x)[0]
    if isinstance(shap_vals, list):
        class_shap = shap_vals[pred_idx]
    elif len(shap_vals.shape) == 2:
        class_shap = shap_vals[:, pred_idx]
    else:
        class_shap = shap_vals
        
    top_indices = np.argsort(np.abs(class_shap))[-6:][::-1]
    top_features = [{"feature": FEATURE_NAMES[i], "impact": float(class_shap[i])} for i in top_indices]
    
    return {
        "prediction": pred_label,
        "confidence": confidence,
        "probabilities": prob_dict,
        "explanation": {"top_features": top_features, "mse": mse}
    }

# --- REAL-TIME SCAPY SNIFFER ---
def process_packet(packet):
    if IP in packet:
        src_bytes = len(packet)
        service_http = 1.0 if (TCP in packet and (packet[TCP].dport == 80 or packet[TCP].sport == 80)) else 0.0
        service_eco_i = 1.0 if (ICMP in packet and packet[ICMP].type == 8) else 0.0
        service_ecr_i = 1.0 if (ICMP in packet and packet[ICMP].type == 0) else 0.0
        
        req = ManualPredictRequestV3(
            same_srv_rate=1.0,
            service_eco_i=service_eco_i,
            service_ecr_i=service_ecr_i,
            service_http=service_http,
            diff_srv_rate=0.0,
            src_bytes=src_bytes,
            dst_host_same_src_port_rate=1.0,
            hot=0.0,
            dst_host_diff_srv_rate=0.0,
            wrong_fragment=1.0 if packet[IP].frag > 0 else 0.0
        )
        try:
            res = manual_predict(req)
            if res['prediction'] != 'normal' or np.random.rand() > 0.95:
                import json
                log = {
                    "time": time.strftime("%H:%M:%S"),
                    "prediction": res['prediction'].upper(),
                    "confidence": res['confidence'],
                    "top_features": [f['feature'] for f in res['explanation'].get('top_features', [])]
                }
                print(f"[LIVE V3] {json.dumps(log)}")
        except Exception as e:
            pass

@app.get("/live-detect")
def trigger_live_detect(background_tasks: BackgroundTasks):
    if sniff is None:
        return {"status": "error", "message": "Scapy is not installed correctly."}
    if not is_sniffing:
        background_tasks.add_task(start_sniffer)
        return {"status": "started", "message": "Live V3 packet capture initiated."}
    return {"status": "running", "message": "Sniffing already active."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
