# Nick Bank Platform

Online banking platform for investors and customers. Features online wallet, line of credit, balance tracking, deposits, withdrawals, and transaction history.

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite (dev) / PostgreSQL (prod)
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Hosting:** GCP (Cloud Run)

## Project Structure

```
Nick_BankPlatform/
├── backend/           # Python FastAPI API
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   └── routers/
│   └── requirements.txt
├── frontend/          # React app
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   └── package.json
├── docker-compose.yml
└── cloudbuild.yaml    # GCP Cloud Build
```

## Quick Start (Local)

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at http://localhost:8000. API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173 with proxy to backend.

### 3. Or use Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost
- Backend: http://localhost:8000

## User Roles

- **Customer:** Wallet, deposits, withdrawals, line of credit (default $5,000 limit)
- **Investor:** Wallet, deposits, withdrawals, fund tracking
- **Admin:** Full access

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET | /api/wallets/me | Get wallet balance |
| POST | /api/wallets/deposit | Deposit funds |
| POST | /api/wallets/withdraw | Withdraw funds |
| GET | /api/credit/me | Get line of credit |
| POST | /api/credit/draw | Draw from credit |
| GET | /api/transactions/me | Transaction history |

## Deploy to GCP

### Prerequisites

- Google Cloud SDK (`gcloud`)
- GCP project with billing enabled

### Option A: Cloud Run (recommended)

1. **Enable APIs**

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

2. **Deploy backend**

```bash
cd backend
gcloud run deploy nick-bank-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

Note the backend URL (e.g. `https://nick-bank-backend-xxx.run.app`).

3. **Deploy frontend**

```bash
cd frontend
# Set backend URL for API calls
echo "VITE_API_URL=https://nick-bank-backend-xxx.run.app/api" > .env.production

gcloud run deploy nick-bank-frontend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

### Option B: Cloud Build

```bash
# Update cloudbuild.yaml with your backend URL for frontend build
gcloud builds submit --config cloudbuild.yaml
```

### Production Database (Cloud SQL)

1. Create Cloud SQL PostgreSQL instance
2. Set `DATABASE_URL` in backend Cloud Run:

```bash
gcloud run services update nick-bank-backend \
  --set-env-vars DATABASE_URL="postgresql+pg8000://user:pass@/dbname?unix_sock=/cloudsql/PROJECT:REGION:INSTANCE/.s.PGSQL.5432"
```

3. Add Cloud SQL connection in Cloud Run service

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| SECRET_KEY | (change in prod) | JWT secret |
| DATABASE_URL | sqlite:///./bank_platform.db | Database connection |
| CORS_ORIGINS | localhost:5173, localhost:3000 | Allowed origins |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| VITE_API_URL | /api | Backend API base URL |

## License

MIT
