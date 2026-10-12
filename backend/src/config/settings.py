from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.dev"),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    host: str = Field("127.0.0.1", validation_alias=AliasChoices("APP_HOST", "GOAPP_HOST"))
    port: int = Field(3000, ge=1, le=65535, validation_alias=AliasChoices("APP_PORT", "GOAPP_PORT"))
    name: str = Field("PYTHON FASTAPI APP", validation_alias=AliasChoices("APP_NAME", "GOAPP_NAME"))
    version: str = Field("0.1.0", validation_alias=AliasChoices("APP_VERSION", "GOAPP_VERSION"))
    secret_key: str = Field(
        min_length=1,
        repr=False,
        validation_alias=AliasChoices("APP_SECRET_KEY", "GOAPP_SECRET_KEY"),
    )
    jwt_access_expires: int = Field(
        86400,
        gt=0,
        validation_alias=AliasChoices("APP_JWT_ACCESS_EXPIRES", "GOAPP_JWT_ACCESS_EXPIRES"),
    )
    jwt_refresh_expires: int = Field(
        172800,
        gt=0,
        validation_alias=AliasChoices("APP_JWT_REFRESH_EXPIRES", "GOAPP_JWT_REFRESH_EXPIRES"),
    )
    database_url: str | None = Field(
        None, repr=False, validation_alias=AliasChoices("APP_DATABASE_URL", "GOAPP_DATABASE_URL")
    )
    postgres_db_name: str = Field(
        "postgres", validation_alias=AliasChoices("APP_POSTGRES_DB_NAME", "GOAPP_POSTGRES_DB_NAME")
    )
    postgres_db_user: str = Field(
        "postgres", validation_alias=AliasChoices("APP_POSTGRES_DB_USER", "GOAPP_POSTGRES_DB_USER")
    )
    postgres_db_password: str = Field(
        "golang-first-api",
        repr=False,
        validation_alias=AliasChoices("APP_POSTGRES_DB_PASSWORD", "GOAPP_POSTGRES_DB_PASSWORD"),
    )
    postgres_db_host: str = Field(
        "localhost", validation_alias=AliasChoices("APP_POSTGRES_DB_HOST", "GOAPP_POSTGRES_DB_HOST")
    )
    postgres_db_port: int = Field(
        5432,
        ge=1,
        le=65535,
        validation_alias=AliasChoices("APP_POSTGRES_DB_PORT", "GOAPP_POSTGRES_DB_PORT"),
    )
    postgres_sslmode: str = Field(
        "disable", validation_alias=AliasChoices("APP_POSTGRES_SSLMODE", "GOAPP_POSTGRES_SSLMODE")
    )
    mongodb_db_atlas_uri: str = Field(
        "mongodb://root:golang-first-api@127.0.0.1:27017/?authSource=admin",
        repr=False,
        validation_alias=AliasChoices("APP_MONGODB_DB_ATLAS_URI", "GOAPP_MONGODB_DB_ATLAS_URI"),
    )
    mongodb_db_name: str = Field(
        "golang_cleancode_example",
        validation_alias=AliasChoices("APP_MONGODB_DB_NAME", "GOAPP_MONGODB_DB_NAME"),
    )

    @property
    def postgres_url(self) -> str | URL:
        if self.database_url is not None:
            return self.database_url
        return URL.create(
            "postgresql+psycopg",
            username=self.postgres_db_user,
            password=self.postgres_db_password,
            host=self.postgres_db_host,
            port=self.postgres_db_port,
            database=self.postgres_db_name,
            query={"sslmode": self.postgres_sslmode},
        )
