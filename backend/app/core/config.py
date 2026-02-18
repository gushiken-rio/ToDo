from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "todo-backend"
    environment: str = "local"

    database_url: str = "sqlite:///./app.db"

    cors_origins: str = "http://localhost:3000"


settings = Settings()


