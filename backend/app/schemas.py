"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from app.models import UserRole, TransactionType


# Auth
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.CUSTOMER


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True


# Wallet
class WalletResponse(BaseModel):
    id: int
    user_id: int
    balance: float
    currency: str
    available_credit: Optional[float] = None  # For display

    class Config:
        from_attributes = True


# Credit Line
class CreditLineResponse(BaseModel):
    id: int
    user_id: int
    limit_amount: float
    used_amount: float
    available_amount: float
    currency: str
    status: str

    class Config:
        from_attributes = True


class CreditDrawRequest(BaseModel):
    amount: float
    description: Optional[str] = None


# Transaction
class TransactionResponse(BaseModel):
    id: int
    wallet_id: int
    amount: float
    type: TransactionType
    description: Optional[str] = None
    balance_after: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DepositRequest(BaseModel):
    amount: float
    description: Optional[str] = None


class WithdrawalRequest(BaseModel):
    amount: float
    description: Optional[str] = None


# Update schema references
Token.model_rebuild()
