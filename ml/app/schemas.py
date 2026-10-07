from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class FeatureVector(BaseModel):
    profile_age_days: int = Field(0, description="Age of profile in days")
    is_known_upi: int = Field(0, description="1 if known provider, 0 otherwise")
    is_blacklisted: int = Field(0, description="1 if blacklisted")
    has_previous_reports: int = Field(0, description="1 if reported previously")
    total_reports: int = Field(0)
    approved_reports: int = Field(0)
    rejected_reports: int = Field(0)
    pending_reports: int = Field(0)
    duplicate_reports: int = Field(0)
    unique_reporters: int = Field(0)
    reports_last_7d: int = Field(0)
    reports_last_30d: int = Field(0)
    checks_last_24h: int = Field(0)
    checks_last_7d: int = Field(0)
    high_risk_checks_last_7d: int = Field(0)
    investment_scam_reports: int = Field(0)
    job_scam_reports: int = Field(0)
    marketplace_scam_reports: int = Field(0)
    refund_scam_reports: int = Field(0)
    qr_scam_reports: int = Field(0)
    lottery_scam_reports: int = Field(0)
    digital_arrest_reports: int = Field(0)
    kyc_scam_reports: int = Field(0)
    phishing_reports: int = Field(0)
    other_reports: int = Field(0)
    report_velocity_7d: float = Field(0.0)
    check_velocity_24h: float = Field(0.0)
    check_velocity_7d: float = Field(0.0)
    rule_risk_score: int = Field(0)
    blacklist_signal: int = Field(0)

class PredictRequest(BaseModel):
    features: FeatureVector

class TopSignal(BaseModel):
    feature: str
    importance: float

class PredictResponse(BaseModel):
    model_version: str
    feature_schema_version: str
    fraud_probability: float
    predicted_label: str
    threshold: float
    top_signals: List[TopSignal]

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: Optional[str] = None
