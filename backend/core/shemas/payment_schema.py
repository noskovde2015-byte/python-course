from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PaymentPackageRead(BaseModel):
    id: int
    title: str
    stars: int
    amount: int


class PaymentCreateResponse(BaseModel):
    payment_id: int
    status: str
    checkout_url: str


class PaymentRead(BaseModel):
    id: int
    package_id: int
    stars: int
    amount: int
    currency: str
    status: str
    created_at: datetime
    paid_at: datetime | None = None
    canceled_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PaymentHistoryItem(BaseModel):
    id: int
    package_id: int
    stars: int
    amount: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
