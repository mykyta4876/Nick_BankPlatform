"""Line of credit routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Wallet, CreditLine, Transaction, TransactionType
from app.schemas import CreditLineResponse, CreditDrawRequest
from app.auth import get_current_user, get_current_customer

router = APIRouter(prefix="/credit", tags=["credit"])


@router.get("/me", response_model=CreditLineResponse)
def get_my_credit_line(
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get current user's line of credit."""
    credit = db.query(CreditLine).filter(CreditLine.user_id == current_user.id).first()
    if not credit:
        raise HTTPException(status_code=404, detail="No credit line found")
    return credit


@router.post("/draw", response_model=CreditLineResponse)
def draw_from_credit(
    request: CreditDrawRequest,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Draw from line of credit - adds to wallet."""
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    credit = db.query(CreditLine).filter(CreditLine.user_id == current_user.id).first()
    if not credit:
        raise HTTPException(status_code=404, detail="No credit line found")
    if credit.status != "active":
        raise HTTPException(status_code=400, detail="Credit line is not active")
    if request.amount > credit.available_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient credit. Available: {credit.available_amount}"
        )
    
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    # Update credit line
    credit.used_amount += request.amount
    credit.available_amount = credit.limit_amount - credit.used_amount
    
    # Update wallet
    new_balance = wallet.balance + request.amount
    wallet.balance = new_balance
    
    # Record transaction
    tx = Transaction(
        wallet_id=wallet.id,
        amount=request.amount,
        type=TransactionType.CREDIT_DRAW,
        description=request.description or "Draw from line of credit",
        balance_after=new_balance,
        reference=f"credit_draw_{credit.id}"
    )
    db.add(tx)
    
    db.commit()
    db.refresh(credit)
    
    return credit
