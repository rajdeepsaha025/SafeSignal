# SafeSignal ML Pipeline

## Setup Instructions (Windows)

1. **Create Virtual Environment:**
   ```bash
   python -m venv .venv
   ```

2. **Activate Environment:**
   ```bash
   .venv\Scripts\activate
   ```
   *(For Linux/macOS: `source .venv/bin/activate`)*

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Training the Model

1. **Generate Synthetic Data:**
   ```bash
   python training/generate_synthetic_data.py
   ```
   This creates `data/synthetic_dataset.csv`.

2. **Train the Model:**
   ```bash
   python training/train_model.py
   ```
   This trains the Random Forest model and saves it as `models/rf-v1.0.0.joblib` along with `models/metadata.json`. Evaluation metrics are stored in `data/evaluation.json` and `data/feature_importance.json`.

## Running the Inference Service

1. **Start the FastAPI Server:**
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```

2. **Test Health Endpoint:**
   ```bash
   curl http://localhost:8001/health
   ```

3. **Test Predict Endpoint:**
   The service is protected by the `X-API-KEY` header (default `dev_secret_key_123`).
   ```bash
   curl -X POST http://localhost:8001/predict \
        -H "Content-Type: application/json" \
        -H "X-API-KEY: dev_secret_key_123" \
        -d '{"features": {"profile_age_days": 120, "is_known_upi": 1, "is_blacklisted": 0, "total_reports": 12, "approved_reports": 9}}'
   ```
