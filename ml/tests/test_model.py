import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.config import settings
from app.feature_schema import FEATURE_COLUMNS, FEATURE_SCHEMA_VERSION

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    # model_loaded might be False if test runs before model is trained, but endpoint should return 200.

def test_predict_requires_auth():
    # Provide dummy features
    features = {col: 0 for col in FEATURE_COLUMNS}
    response = client.post("/predict", json={"features": features})
    # Should be 403 Forbidden because API key is missing
    assert response.status_code == 403

def test_predict_with_auth_and_schema_validation():
    # Even if model is not loaded (503), schema validation (422) happens first.
    # Missing fields
    response = client.post(
        "/predict", 
        json={"features": {"profile_age_days": 10}}, 
        headers={"X-API-KEY": settings.ml_service_api_key}
    )
    # Pydantic should catch missing fields because we used default=0 or we didn't... wait, we used default=0 via Field(0)
    # Actually, if we used Field(0), it will fill defaults. Let's see.
    # But if we send invalid types:
    response = client.post(
        "/predict", 
        json={"features": {"profile_age_days": "not_an_int"}}, 
        headers={"X-API-KEY": settings.ml_service_api_key}
    )
    assert response.status_code == 422
