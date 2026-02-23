"""Wallet routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Wallet, CreditLine, Transaction, TransactionType
from app.schemas import WalletResponse, DepositRequest, WithdrawalRequest
from app.auth import get_current_user

router = APIRouter(prefix="/wallets", tags=["wallets"])


def get_wallet_for_user(db: Session, user: User) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet


@router.get("/me", response_model=WalletResponse)
def get_my_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's wallet with balance."""
    wallet = get_wallet_for_user(db, current_user)
    
    # Get available credit if customer has credit line
    available_credit = None
    credit_line = db.query(CreditLine).filter(CreditLine.user_id == current_user.id).first()
    if credit_line and credit_line.status == "active":
        available_credit = credit_line.available_amount
    
    return WalletResponse(
        id=wallet.id,
        user_id=wallet.user_id,
        balance=wallet.balance,
        currency=wallet.currency,
        available_credit=available_credit
    )


@router.post("/deposit", response_model=WalletResponse)
def deposit(
    request: DepositRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deposit funds to wallet."""
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    wallet = get_wallet_for_user(db, current_user)
    new_balance = wallet.balance + request.amount
    
    # Record transaction
    tx = Transaction(
        wallet_id=wallet.id,
        amount=request.amount,
        type=TransactionType.DEPOSIT,
        description=request.description or "Deposit",
        balance_after=new_balance
    )
    db.add(tx)
    
    wallet.balance = new_balance
    db.commit()
    db.refresh(wallet)
    
    available_credit = None
    credit_line = db.query(CreditLine).filter(CreditLine.user_id == current_user.id).first()
    if credit_line and credit_line.status == "active":
        available_credit = credit_line.available_amount
    
    return WalletResponse(
        id=wallet.id,
        user_id=wallet.user_id,
        balance=wallet.balance,
        currency=wallet.currency,
        available_credit=available_credit
    )


@router.post("/withdraw", response_model=WalletResponse)
def withdraw(
    request: WithdrawalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Withdraw funds from wallet."""
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    wallet = get_wallet_for_user(db, current_user)
    if wallet.balance < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    new_balance = wallet.balance - request.amount
    
    tx = Transaction(
        wallet_id=wallet.id,
        amount=-request.amount,
        type=TransactionType.WITHDRAWAL,
        description=request.description or "Withdrawal",
        balance_after=new_balance
    )
    db.add(tx)
    
    wallet.balance = new_balance
    db.commit()
    db.refresh(wallet)
    
    available_credit = None
    credit_line = db.query(CreditLine).filter(CreditLine.user_id == current_user.id).first()
    if credit_line and credit_line.status == "active":
        available_credit = credit_line.available_amount
    
    return WalletResponse(
        id=wallet.id,
        user_id=wallet.user_id,
        balance=wallet.balance,
        currency=wallet.currency,
        available_credit=available_credit
    )
