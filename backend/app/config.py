import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@db:5432/inventory",
        description="Database connection URL"
    )
    LOW_STOCK_THRESHOLD: int = Field(
        default=10,
        description="Threshold below which inventory is marked as low stock"
    )
    PORT: int = Field(
        default=8000,
        description="Port to run the backend API server"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
