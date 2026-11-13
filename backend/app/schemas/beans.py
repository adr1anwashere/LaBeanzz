from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional
from decimal import Decimal

RoastLevel = Literal["LIGHT", "MEDIUM_LIGHT", "MEDIUM", "MEDIUM_DARK", "DARK"]
BeanStatus = Literal["AVAILABLE", "LOW_STOCK", "RESERVED", "OUT_OF_STOCK"]


def _clamp_rating(v: Decimal) -> Decimal:
    if v < 0 or v > 10:
        raise ValueError("Rating must be between 0.0 and 10.0")
    return v


class CreateBeanRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    origin: str = Field(min_length=1, max_length=100)
    region: Optional[str] = Field(None, max_length=100)
    farm: Optional[str] = Field(None, max_length=200)
    producer: Optional[str] = Field(None, max_length=200)
    varietal: Optional[str] = Field(None, max_length=100)
    altitude_m: Optional[int] = Field(None, ge=0, le=5000)
    processing_method: Optional[str] = Field(None, max_length=100)
    roast_level: RoastLevel
    flavor_notes: list[str] = Field(default_factory=list)
    acidity: Decimal = Field(ge=Decimal("0"), le=Decimal("10"))
    body: Decimal = Field(ge=Decimal("0"), le=Decimal("10"))
    sweetness: Decimal = Field(ge=Decimal("0"), le=Decimal("10"))
    price_per_kg: Decimal = Field(gt=Decimal("0"))
    stock_kg: Decimal = Field(ge=Decimal("0"), default=Decimal("0"))
    status: BeanStatus = "AVAILABLE"
    producer_story: Optional[str] = None

    @field_validator("flavor_notes")
    @classmethod
    def _cap_notes(cls, v: list[str]) -> list[str]:
        return [n.strip()[:100] for n in v[:20] if n.strip()]


class PatchBeanRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    origin: Optional[str] = Field(None, min_length=1, max_length=100)
    region: Optional[str] = Field(None, max_length=100)
    farm: Optional[str] = Field(None, max_length=200)
    producer: Optional[str] = Field(None, max_length=200)
    varietal: Optional[str] = Field(None, max_length=100)
    altitude_m: Optional[int] = Field(None, ge=0, le=5000)
    processing_method: Optional[str] = Field(None, max_length=100)
    roast_level: Optional[RoastLevel] = None
    flavor_notes: Optional[list[str]] = None
    acidity: Optional[Decimal] = Field(None, ge=Decimal("0"), le=Decimal("10"))
    body: Optional[Decimal] = Field(None, ge=Decimal("0"), le=Decimal("10"))
    sweetness: Optional[Decimal] = Field(None, ge=Decimal("0"), le=Decimal("10"))
    price_per_kg: Optional[Decimal] = Field(None, gt=Decimal("0"))
    stock_kg: Optional[Decimal] = Field(None, ge=Decimal("0"))
    status: Optional[BeanStatus] = None
    producer_story: Optional[str] = None

    @field_validator("flavor_notes")
    @classmethod
    def _cap_notes(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        return [n.strip()[:100] for n in v[:20] if n.strip()]


class BeanFilterParams(BaseModel):
    origin: Optional[str] = None
    roast_level: Optional[RoastLevel] = None
    status: Optional[BeanStatus] = None
    max_price: Optional[Decimal] = Field(None, gt=Decimal("0"))
    supplier_id: Optional[str] = None
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)
