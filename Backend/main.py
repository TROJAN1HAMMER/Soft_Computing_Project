from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import pickle

# Initialize FastAPI
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# Load Models
# -----------------------
with open("isolation_forest.pkl", "rb") as f:
    iso_model = pickle.load(f)

with open("mlp_stage2.pkl", "rb") as f:
    mlp_model = pickle.load(f)

with open("label_encoder.pkl", "rb") as f:
    label_encoder = pickle.load(f)

with open("scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

# -----------------------
# Input Schema
# -----------------------
class NetworkInput(BaseModel):
    duration: float
    protocol_type: str
    service: str
    src_bytes: float
    dst_bytes: float
    count: float
    srv_count: float
    serror_rate: float
    srv_serror_rate: float
    dst_host_count: float

protocol_map = {
    "tcp": 0,
    "udp": 1,
    "icmp": 2
}

service_map = {
    "http": 0,
    "ftp": 1,
    "smtp": 2,
}

# -----------------------
# Prediction Endpoint
# -----------------------
@app.post("/predict")
def predict(data: NetworkInput):
    
    # Encode categorical values
    protocol_encoded = protocol_map.get(data.protocol_type, 0)
    service_encoded = service_map.get(data.service, 0)
    
    features = np.array([[ 
        float(data.duration),
        protocol_encoded,
        service_encoded,
        data.src_bytes,
        data.dst_bytes,
        data.count,
        data.srv_count,
        data.serror_rate,
        data.srv_serror_rate,
        data.dst_host_count
    ]])

    # Stage 1: Binary Detection
    iso_pred = iso_model.predict(features)[0]

    if iso_pred == -1:
        # Anomaly detected → classify attack
        features_scaled = scaler.transform(features)
        attack_pred_encoded = mlp_model.predict(features_scaled)[0]
        attack_pred = label_encoder.inverse_transform([attack_pred_encoded])[0]
    else:
        attack_pred = "normal"

    return {
        "prediction": attack_pred,
        "probabilities": {}
    }