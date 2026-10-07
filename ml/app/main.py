from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from starlette.status import HTTP_403_FORBIDDEN

from .config import settings
from .schemas import PredictRequest, PredictResponse, HealthResponse, TopSignal
from .predictor import Predictor
from .feature_schema import FEATURE_SCHEMA_VERSION

app = FastAPI(title="SafeSignal ML Service", version="1.0.0")

predictor = Predictor()

api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header == settings.ml_service_api_key:
        return api_key_header
    else:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN, detail="Could not validate credentials"
        )

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        model_loaded=predictor.is_loaded(),
        model_version=predictor.model_version if predictor.is_loaded() else None
    )

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest, api_key: str = Depends(get_api_key)):
    if not predictor.is_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded")
        
    prob, label, top_signals = predictor.predict(request.features.model_dump())
    
    signals = [TopSignal(feature=s["feature"], importance=s["importance"]) for s in top_signals]
    
    return PredictResponse(
        model_version=predictor.model_version,
        feature_schema_version=FEATURE_SCHEMA_VERSION,
        fraud_probability=prob,
        predicted_label=label,
        threshold=predictor.threshold,
        top_signals=signals
    )
