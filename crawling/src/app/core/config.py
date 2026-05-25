from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    gemini_api_key: str
    gemini_model: str

    db_url: str
    db_port: int
    db_username: str
    db_password: str
    db_name: str

settings = Settings()