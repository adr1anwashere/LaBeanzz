import os
from dotenv import load_dotenv

load_dotenv()


class Base:
    SECRET_KEY: str = os.environ["SECRET_KEY"]
    DATABASE_URL: str = os.environ["DATABASE_URL"]
    SQLALCHEMY_DATABASE_URI: str = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET: str = os.environ["JWT_SECRET"]
    JWT_EXPIRES_HOURS: int = int(os.getenv("JWT_EXPIRES_HOURS", "24"))
    GOOGLE_CLIENT_ID: str = os.environ["GOOGLE_CLIENT_ID"]
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000"
    ).split(",")


class Development(Base):
    DEBUG = True


class Production(Base):
    DEBUG = False


config_map = {
    "development": Development,
    "production": Production,
    "testing": Development,
}
