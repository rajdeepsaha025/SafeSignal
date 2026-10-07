# SafeSignal Machine Learning Pipeline

## Overview
This directory contains the Python ML service and training pipeline for the SafeSignal platform. The model serves to estimate $P(fraud | available SafeSignal features)$.

**CRITICAL LIMITATION**: SafeSignal does not have access to private NPCI or bank transaction data. Synthetic training data is suitable for engineering validation and demonstration, but does not establish real-world fraud detection accuracy.

## Architecture
- **Model**: `RandomForestClassifier` from `scikit-learn`.
- **Inference Service**: `FastAPI` providing an internal REST API.
- **Gateway**: The Node.js `Express` backend acts as a gateway and consumes the ML service. 
- **Storage**: Trained models are serialized using `joblib`. Metadata is stored in Firestore's `ml_metadata` collection.

## Why Random Forest
We chose Random Forest because it is robust, handles non-linear relationships, requires less preprocessing compared to neural networks, and importantly, it provides **feature importance** which is useful for explainability in the UI.

## Features
The feature vector relies purely on SafeSignal-available data (No PII):
- Profile age, known provider check, blacklist signals.
- Community intelligence (number of approved/rejected/pending reports).
- Activity velocity (checks/reports per day/week).
- Categorical breakdown of prior reports (investment scam, phishing, etc.).
See `ml/app/feature_schema.py` for the exact specification.

## Labels
- `0 = LEGITIMATE`
- `1 = FRAUD`
Labels in the initial version are generated synthetically.

## Threshold Selection
We do not hardcode `0.5` as the threshold. During evaluation, we calculate F1, Precision, and Recall across various thresholds (`0.3` to `0.8`) and select the threshold that maximizes the F1 score for validation data. This threshold is saved in the model metadata.

## Security
- The ML API is protected by a static API Key (`X-API-KEY` header).
- Training and data generation are offline scripts, not exposed as API endpoints.
- No PII is sent to the ML service.
