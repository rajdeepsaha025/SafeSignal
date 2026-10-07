import pandas as pd
import numpy as np
import os
import sys

# Add parent dir to path so we can import app.feature_schema
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.feature_schema import FEATURE_COLUMNS, FEATURE_SCHEMA_VERSION

def generate_legitimate(num_samples):
    data = {}
    
    # Profile
    data["profile_age_days"] = np.random.randint(30, 1000, num_samples)
    data["is_known_upi"] = np.random.choice([0, 1], num_samples, p=[0.2, 0.8])
    data["is_blacklisted"] = np.zeros(num_samples)
    data["has_previous_reports"] = np.random.choice([0, 1], num_samples, p=[0.95, 0.05])
    
    # Community
    total_reports = np.random.choice([0, 1, 2], num_samples, p=[0.8, 0.15, 0.05])
    data["total_reports"] = total_reports
    data["approved_reports"] = np.zeros(num_samples)
    data["rejected_reports"] = total_reports  # if reported, they were rejected
    data["pending_reports"] = np.zeros(num_samples)
    data["duplicate_reports"] = np.zeros(num_samples)
    data["unique_reporters"] = np.where(total_reports > 0, 1, 0)
    
    # Recent activity
    data["reports_last_7d"] = np.zeros(num_samples)
    data["reports_last_30d"] = np.where(total_reports > 0, np.random.randint(0, 2, num_samples), 0)
    data["checks_last_24h"] = np.random.randint(0, 5, num_samples)
    data["checks_last_7d"] = data["checks_last_24h"] + np.random.randint(0, 10, num_samples)
    data["high_risk_checks_last_7d"] = np.zeros(num_samples)
    
    # Categories (all 0 for legit)
    categories = [
        "investment_scam_reports", "job_scam_reports", "marketplace_scam_reports",
        "refund_scam_reports", "qr_scam_reports", "lottery_scam_reports",
        "digital_arrest_reports", "kyc_scam_reports", "phishing_reports", "other_reports"
    ]
    for cat in categories:
        data[cat] = np.zeros(num_samples)
        
    # Velocity
    data["report_velocity_7d"] = np.zeros(num_samples)
    data["check_velocity_24h"] = data["checks_last_24h"] / (data["checks_last_7d"] + 1)
    data["check_velocity_7d"] = data["checks_last_7d"] / 7
    
    # Deterministic
    data["rule_risk_score"] = np.random.randint(0, 30, num_samples)
    data["blacklist_signal"] = np.zeros(num_samples)
    
    df = pd.DataFrame(data)
    df["label"] = 0
    return df

def generate_fraud_high_report(num_samples):
    data = {}
    
    # Profile
    data["profile_age_days"] = np.random.randint(0, 365, num_samples)
    data["is_known_upi"] = np.random.choice([0, 1], num_samples, p=[0.7, 0.3])
    data["is_blacklisted"] = np.random.choice([0, 1], num_samples, p=[0.6, 0.4])
    data["has_previous_reports"] = np.ones(num_samples)
    
    # Community
    approved = np.random.randint(3, 20, num_samples)
    pending = np.random.randint(0, 5, num_samples)
    rejected = np.random.randint(0, 3, num_samples)
    
    data["total_reports"] = approved + pending + rejected
    data["approved_reports"] = approved
    data["rejected_reports"] = rejected
    data["pending_reports"] = pending
    data["duplicate_reports"] = np.random.randint(0, 4, num_samples)
    data["unique_reporters"] = np.clip(data["total_reports"] - data["duplicate_reports"], 1, None)
    
    # Recent activity
    data["reports_last_7d"] = np.clip(data["total_reports"] - np.random.randint(0, 5, num_samples), 1, None)
    data["reports_last_30d"] = data["total_reports"]
    data["checks_last_24h"] = np.random.randint(5, 50, num_samples)
    data["checks_last_7d"] = data["checks_last_24h"] + np.random.randint(10, 100, num_samples)
    data["high_risk_checks_last_7d"] = np.random.randint(2, 20, num_samples)
    
    # Categories
    categories = [
        "investment_scam_reports", "job_scam_reports", "marketplace_scam_reports",
        "refund_scam_reports", "qr_scam_reports", "lottery_scam_reports",
        "digital_arrest_reports", "kyc_scam_reports", "phishing_reports", "other_reports"
    ]
    for cat in categories:
        data[cat] = np.zeros(num_samples)
    
    # Assign most reports to 1 or 2 primary scam types
    for i in range(num_samples):
        primary_cat = np.random.choice(categories)
        data[primary_cat][i] = data["total_reports"][i]
        
    # Velocity
    data["report_velocity_7d"] = data["reports_last_7d"] / 7
    data["check_velocity_24h"] = data["checks_last_24h"] / (data["checks_last_7d"] + 1)
    data["check_velocity_7d"] = data["checks_last_7d"] / 7
    
    # Deterministic
    data["rule_risk_score"] = np.random.randint(60, 100, num_samples)
    data["blacklist_signal"] = data["is_blacklisted"]
    
    df = pd.DataFrame(data)
    df["label"] = 1
    return df

def generate_fraud_burst(num_samples):
    data = {}
    # Profile
    data["profile_age_days"] = np.random.randint(0, 10, num_samples)
    data["is_known_upi"] = np.zeros(num_samples)
    data["is_blacklisted"] = np.zeros(num_samples)
    data["has_previous_reports"] = np.random.choice([0, 1], num_samples, p=[0.5, 0.5])
    
    # Community
    data["total_reports"] = np.random.randint(1, 5, num_samples)
    data["approved_reports"] = np.random.randint(0, 2, num_samples)
    data["pending_reports"] = data["total_reports"] - data["approved_reports"]
    data["rejected_reports"] = np.zeros(num_samples)
    data["duplicate_reports"] = np.zeros(num_samples)
    data["unique_reporters"] = data["total_reports"]
    
    # Recent activity
    data["reports_last_7d"] = data["total_reports"]
    data["reports_last_30d"] = data["total_reports"]
    data["checks_last_24h"] = np.random.randint(20, 200, num_samples)
    data["checks_last_7d"] = data["checks_last_24h"] + np.random.randint(0, 10, num_samples)
    data["high_risk_checks_last_7d"] = np.random.randint(0, 5, num_samples)
    
    categories = [
        "investment_scam_reports", "job_scam_reports", "marketplace_scam_reports",
        "refund_scam_reports", "qr_scam_reports", "lottery_scam_reports",
        "digital_arrest_reports", "kyc_scam_reports", "phishing_reports", "other_reports"
    ]
    for cat in categories:
        data[cat] = np.zeros(num_samples)
        
    for i in range(num_samples):
        primary_cat = np.random.choice(categories)
        data[primary_cat][i] = data["total_reports"][i]
        
    # Velocity
    data["report_velocity_7d"] = data["reports_last_7d"] / 7
    data["check_velocity_24h"] = data["checks_last_24h"] / (data["checks_last_7d"] + 1)
    data["check_velocity_7d"] = data["checks_last_7d"] / 7
    
    # Deterministic
    data["rule_risk_score"] = np.random.randint(40, 80, num_samples)
    data["blacklist_signal"] = np.zeros(num_samples)
    
    df = pd.DataFrame(data)
    df["label"] = 1
    return df

def generate_fraud_ambiguous(num_samples):
    data = {}
    # Profile
    data["profile_age_days"] = np.random.randint(30, 500, num_samples)
    data["is_known_upi"] = np.random.choice([0, 1], num_samples)
    data["is_blacklisted"] = np.zeros(num_samples)
    data["has_previous_reports"] = np.ones(num_samples)
    
    # Community
    data["total_reports"] = np.random.randint(1, 4, num_samples)
    data["approved_reports"] = np.zeros(num_samples)
    data["pending_reports"] = np.random.randint(0, 2, num_samples)
    data["rejected_reports"] = data["total_reports"] - data["pending_reports"]
    data["duplicate_reports"] = np.zeros(num_samples)
    data["unique_reporters"] = data["total_reports"]
    
    # Recent activity
    data["reports_last_7d"] = np.random.randint(0, 2, num_samples)
    data["reports_last_30d"] = data["total_reports"]
    data["checks_last_24h"] = np.random.randint(2, 10, num_samples)
    data["checks_last_7d"] = data["checks_last_24h"] + np.random.randint(5, 20, num_samples)
    data["high_risk_checks_last_7d"] = np.random.randint(0, 2, num_samples)
    
    categories = [
        "investment_scam_reports", "job_scam_reports", "marketplace_scam_reports",
        "refund_scam_reports", "qr_scam_reports", "lottery_scam_reports",
        "digital_arrest_reports", "kyc_scam_reports", "phishing_reports", "other_reports"
    ]
    for cat in categories:
        data[cat] = np.zeros(num_samples)
        
    for i in range(num_samples):
        primary_cat = np.random.choice(categories)
        data[primary_cat][i] = data["total_reports"][i]
        
    # Velocity
    data["report_velocity_7d"] = data["reports_last_7d"] / 7
    data["check_velocity_24h"] = data["checks_last_24h"] / (data["checks_last_7d"] + 1)
    data["check_velocity_7d"] = data["checks_last_7d"] / 7
    
    # Deterministic
    data["rule_risk_score"] = np.random.randint(20, 60, num_samples)
    data["blacklist_signal"] = np.zeros(num_samples)
    
    df = pd.DataFrame(data)
    df["label"] = 1
    return df

if __name__ == "__main__":
    np.random.seed(42)
    print("Generating synthetic data...")
    
    df_legit = generate_legitimate(15000)
    df_fraud_high = generate_fraud_high_report(2000)
    df_fraud_burst = generate_fraud_burst(2000)
    df_fraud_amb = generate_fraud_ambiguous(1000)
    
    df = pd.concat([df_legit, df_fraud_high, df_fraud_burst, df_fraud_amb], ignore_index=True)
    
    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Add metadata
    df["data_source"] = "synthetic"
    df["is_synthetic"] = True
    df["label_source"] = "synthetic_rule"
    
    # Validate features match schema exactly
    for col in FEATURE_COLUMNS:
        if col not in df.columns:
            df[col] = 0
            
    # Reorder columns to ensure exact match with FEATURE_COLUMNS before saving
    final_cols = FEATURE_COLUMNS + ["label", "data_source", "is_synthetic", "label_source"]
    df = df[final_cols]
    
    os.makedirs(os.path.join(os.path.dirname(__file__), "../data"), exist_ok=True)
    out_path = os.path.join(os.path.dirname(__file__), "../data/synthetic_dataset.csv")
    df.to_csv(out_path, index=False)
    
    print(f"Generated {len(df)} samples ({len(df[df.label==1])} fraud, {len(df[df.label==0])} legit).")
    print(f"Dataset saved to {os.path.abspath(out_path)}")
