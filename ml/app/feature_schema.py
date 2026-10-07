FEATURE_SCHEMA_VERSION = "1.0"

# Exact ordered list of features expected by the model
FEATURE_COLUMNS = [
    # Identity / profile signals
    "profile_age_days",
    "is_known_upi",
    "is_blacklisted",
    "has_previous_reports",
    
    # Community intelligence
    "total_reports",
    "approved_reports",
    "rejected_reports",
    "pending_reports",
    "duplicate_reports",
    "unique_reporters",
    
    # Recent activity
    "reports_last_7d",
    "reports_last_30d",
    "checks_last_24h",
    "checks_last_7d",
    "high_risk_checks_last_7d",
    
    # Risk/category signals
    "investment_scam_reports",
    "job_scam_reports",
    "marketplace_scam_reports",
    "refund_scam_reports",
    "qr_scam_reports",
    "lottery_scam_reports",
    "digital_arrest_reports",
    "kyc_scam_reports",
    "phishing_reports",
    "other_reports",
    
    # Velocity
    "report_velocity_7d",
    "check_velocity_24h",
    "check_velocity_7d",
    
    # Existing deterministic intelligence
    "rule_risk_score",
    "blacklist_signal"
]
