from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class GuestCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    email: Optional[str] = Field(None, max_length=254)
    phone: Optional[str] = Field(None, max_length=40)
    side: Literal["bride", "groom", "mutual"] = "mutual"
    rsvp_status: Literal["pending", "confirmed", "declined"] = "pending"
    meal_preference: Optional[str] = Field(None, max_length=160)
    table_number: Optional[str] = Field(None, max_length=80)
    is_vip: bool = False
    plus_ones: int = Field(0, ge=0, le=20)
    notes: Optional[str] = Field(None, max_length=2000)


class GuestUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=160)
    email: Optional[str] = Field(None, max_length=254)
    phone: Optional[str] = Field(None, max_length=40)
    side: Optional[Literal["bride", "groom", "mutual"]] = None
    rsvp_status: Optional[Literal["pending", "confirmed", "declined"]] = None
    meal_preference: Optional[str] = Field(None, max_length=160)
    table_number: Optional[str] = Field(None, max_length=80)
    is_vip: Optional[bool] = None
    plus_ones: Optional[int] = Field(None, ge=0, le=20)
    notes: Optional[str] = Field(None, max_length=2000)


class GuestResponse(GuestCreate):
    id: str
    wedding_id: str
