import pandas as pd
import numpy as np
import os
import sys
import json
import joblib
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, confusion_matrix

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.feature_schema import FEATURE_COLUMNS, FEATURE_SCHEMA_VERSION

MODEL_VERSION = "rf-v1.0.0"

def evaluate_thresholds(y_true, y_probs):
    thresholds = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
    results = {}
    best_f1 = 0
    best_threshold = 0.5
    for t in thresholds:
        preds = (y_probs >= t).astype(int)
        p = precision_score(y_true, preds, zero_division=0)
        r = recall_score(y_true, preds, zero_division=0)
        f1 = f1_score(y_true, preds, zero_division=0)
        results[str(t)] = {"precision": p, "recall": r, "f1": f1}
        if f1 > best_f1:
            best_f1 = f1
            best_threshold = t
    return results, best_threshold

def main():
    data_path = os.path.join(os.path.dirname(__file__), "../data/synthetic_dataset.csv")
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}. Run generate_synthetic_data.py first.")
        sys.exit(1)
        
    df = pd.read_csv(data_path)
    X = df[FEATURE_COLUMNS]
    y = df["label"]
    
    print(f"Dataset size: {len(df)}")
    print(f"Class distribution: Legit={len(df[y==0])}, Fraud={len(df[y==1])}")
    
    # Train/Val/Test Split: 70/15/15
    X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.15, random_state=42, stratify=y)
    X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.1765, random_state=42, stratify=y_temp) # 0.1765 of 0.85 approx 0.15
    
    print(f"Train size: {len(X_train)}, Val size: {len(X_val)}, Test size: {len(X_test)}")
    
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    
    print("Training Random Forest...")
    model.fit(X_train, y_train)
    
    print("Evaluating on validation set...")
    val_probs = model.predict_proba(X_val)[:, 1]
    threshold_evals, best_threshold = evaluate_thresholds(y_val, val_probs)
    print(f"Selected threshold from validation: {best_threshold}")
    
    print("Evaluating on test set...")
    test_probs = model.predict_proba(X_test)[:, 1]
    test_preds = (test_probs >= best_threshold).astype(int)
    
    metrics = {
        "accuracy": accuracy_score(y_test, test_preds),
        "precision": precision_score(y_test, test_preds, zero_division=0),
        "recall": recall_score(y_test, test_preds, zero_division=0),
        "f1": f1_score(y_test, test_preds, zero_division=0),
        "roc_auc": roc_auc_score(y_test, test_probs),
        "pr_auc": average_precision_score(y_test, test_probs)
    }
    
    cm = confusion_matrix(y_test, test_preds)
    
    # Feature Importance
    importances = model.feature_importances_
    feat_imp = [{"feature": f, "importance": float(imp)} for f, imp in zip(FEATURE_COLUMNS, importances)]
    feat_imp.sort(key=lambda x: x["importance"], reverse=True)
    
    out_dir = os.path.join(os.path.dirname(__file__), "../data")
    os.makedirs(out_dir, exist_ok=True)
    
    with open(os.path.join(out_dir, "feature_importance.json"), "w") as f:
        json.dump(feat_imp, f, indent=2)
        
    eval_report = {
        "dataset_statistics": {
            "total": len(df),
            "legitimate": int(len(df[y==0])),
            "fraud": int(len(df[y==1]))
        },
        "metrics": metrics,
        "confusion_matrix": cm.tolist(),
        "threshold_evaluation": threshold_evals,
        "selected_threshold": best_threshold
    }
    
    with open(os.path.join(out_dir, "evaluation.json"), "w") as f:
        json.dump(eval_report, f, indent=2)
        
    # Metadata for Firestore/serving
    metadata = {
        "model_version": MODEL_VERSION,
        "algorithm": "RandomForestClassifier",
        "feature_schema_version": FEATURE_SCHEMA_VERSION,
        "training_samples": len(df),
        "synthetic_samples": len(df[df["is_synthetic"] == True]),
        "real_samples": len(df[df["is_synthetic"] == False]),
        "label_quality": "synthetic_bootstrap",
        "fraud_threshold": best_threshold,
        "metrics": metrics,
        "status": "ACTIVE",
        "created_at": datetime.utcnow().isoformat(),
        "hyperparameters": {
            "random_state": 42,
            "n_estimators": 100,
            "max_depth": 12,
            "class_weight": "balanced"
        }
    }
    
    models_dir = os.path.join(os.path.dirname(__file__), "../models")
    os.makedirs(models_dir, exist_ok=True)
    
    with open(os.path.join(models_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
        
    joblib.dump(model, os.path.join(models_dir, f"{MODEL_VERSION}.joblib"))
    print(f"Model saved to models/{MODEL_VERSION}.joblib")
    print(f"Metadata saved to models/metadata.json")

if __name__ == "__main__":
    main()
