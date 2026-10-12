from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, TypeAdapter, field_validator

email_validator = TypeAdapter(EmailStr)


class CredentialsRequest(BaseModel):
    email: str = Field(json_schema_extra={"format": "email"})
    password: str = Field(min_length=1, repr=False)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        email_validator.validate_python(value)
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("password must contain at most 72 UTF-8 bytes")
        return value


class RegisterRequest(CredentialsRequest):
    first_name: str = ""
    last_name: str = ""


class LoginRequest(CredentialsRequest):
    pass


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(min_length=1, repr=False)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    first_name: str
    last_name: str
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    access: str
    refresh: str


class LoginResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user: UserResponse
    token: TokenResponse


class ErrorResponse(BaseModel):
    trace_id: str
    message: str
