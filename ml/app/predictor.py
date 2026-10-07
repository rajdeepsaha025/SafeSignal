import os
import json
import joblib
import pandas as pd
from typing import Dict, Any, Tuple, List

from .feature_schema import FEATURE_COLUMNS, FEATURE_SCHEMA_VERSION

class Predictor:
    def __init__(self):
        self.model = None
        self.metadata = None
        self.feature_importance = None
        self.model_version = None
        self.threshold = 0.5
        self.load_model()
        
    def load_model(self):
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
        meta_path = os.path.join(models_dir, "metadata.json")
        
        if not os.path.exists(meta_path):
            print("No metadata.json found.")
            return
            
        with open(meta_path, "r") as f:
            self.metadata = json.load(f)
            
        self.model_version = self.metadata.get("model_version")
        self.threshold = self.metadata.get("fraud_threshold", 0.5)
        
        model_path = os.path.join(models_dir, f"{self.model_version}.joblib")
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
            # Create feature importance map
            importances = self.model.feature_importances_
            self.feature_importance = {f: float(imp) for f, imp in zip(FEATURE_COLUMNS, importances)}
            print(f"Loaded model {self.model_version} with threshold {self.threshold}")
        else:
            print(f"Model file {model_path} not found.")

    def is_loaded(self) -> bool:
        return self.model is not None
        
    def predict(self, feature_dict: Dict[str, Any]) -> Tuple[float, str, List[Dict]]:
        if not self.is_loaded():
            raise Exception("Model not loaded")
            
        # Ensure ordered list
        feature_values = []
        for col in FEATURE_COLUMNS:
            feature_values.append(feature_dict.get(col, 0))
            
        # Convert to 2D array / DataFrame
        X = pd.DataFrame([feature_values], columns=FEATURE_COLUMNS)
        
        prob = self.model.predict_proba(X)[0][1]
        label = "FRAUD" if prob >= self.threshold else "LEGITIMATE"
        
        # Determine top signals
        # Get features with highest importance that have non-zero values (or just highest importance)
        signals = []
        for feat in FEATURE_COLUMNS:
            # simple heuristic: if it's important and present in this instance
            val = feature_dict.get(feat, 0)
            imp = self.feature_importance.get(feat, 0)
            # Only add to signals if the feature is actually non-zero in the request (unless it's a negative signal)
            if val != 0 and imp > 0.01:
                signals.append({
                    "feature": feat,
                    "importance": imp
                })
                
        # Sort by importance
        signals.sort(key=lambda x: x["importance"], reverse=True)
        top_signals = signals[:3] # return top 3
        
        return prob, label, top_signals
