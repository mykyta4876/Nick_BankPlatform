"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base, get_db
from app.routers import auth, wallets, credit_line, transactions

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Nick Bank Platform API",
    description="Online banking platform for investors and customers",
    version="1.0.0"
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(wallets.router, prefix="/api")
app.include_router(credit_line.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Nick Bank Platform API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
