import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ml_service_api_key: str = os.getenv("ML_SERVICE_API_KEY", "dev_secret_key_123")
    
settings = Settings()
