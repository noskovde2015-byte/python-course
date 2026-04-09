from pydantic import BaseModel, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class RunConfig(BaseModel):
    host: str = "127.0.0.1"
    port: int = 8001


class ApiPrefix(BaseModel):
    api_prefix: str = "/api"
    register_prefix: str = "/register"
    login_prefix: str = "/login"
    course_prefix: str = "/course"
    task_prefix: str = "/task"
    lesson_prefix: str = "/lesson"
    module_prefix: str = "/module"
    stars_prefix: str = "/stars"


class DataBaseConfig(BaseModel):
    url: PostgresDsn
    echo: bool = False
    echo_pool: bool = False
    pool_size: int = 50
    max_overflow: int = 10


class AuthConfig(BaseModel):
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE: int
    REFRESH_TOKEN_EXPIRE: int


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_prefix="APP_CONFIG__",
        env_nested_delimiter="__",
    )
    run: RunConfig = RunConfig()
    prefix: ApiPrefix = ApiPrefix()
    db: DataBaseConfig
    auth: AuthConfig


settings = Settings()
