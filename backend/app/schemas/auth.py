from pydantic import BaseModel, field_validator
from typing import Literal


class GoogleLoginRequest(BaseModel):
    credential: str  # Google ID token


class OnboardRequest(BaseModel):
    role: Literal["OWNER", "SUPPLIER"]
    # Optional fields depending on role
    business_name: str | None = None
    company_name: str | None = None
    location: str | None = None
    contact_email: str | None = None
    website: str | None = None

    @field_validator("company_name")
    @classmethod
    def company_name_required_for_supplier(cls, v, info):
        if info.data.get("role") == "SUPPLIER" and not v:
            raise ValueError("company_name is required for SUPPLIER role.")
        return v
