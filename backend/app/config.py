from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    storage_mode: str = "local"
    app_env: str = "dev"
    mongodb_uri: str = "mongodb://mongo:27017"
    mongodb_db: str = "structural_bug_db"

    # ✅ FIXED (string + correct Docker hostname)
    neo4j_uri: str = "bolt://neo4j:7687"

    neo4j_user: str = "neo4j"
    neo4j_password: str = "password"

    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_exp_minutes: int = 60

    model_path: str = "models/risk_model.joblib"
    razorpay_key_id: str = "rzp_test_dummy"
    razorpay_key_secret: str = "dummy_secret"


settings = Settings()