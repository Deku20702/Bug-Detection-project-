# Smart AI-Based Structural Bug Detection and Prevention System

This repository contains an implementation scaffold of the MCA major project:

- FastAPI backend with JWT auth
- Static structural analysis and dependency graph extraction
- Feature engineering and ML risk scoring
- LangGraph-style reasoning output for recommendations
- React dashboard for scan execution and risk visualization
- MongoDB + Neo4j persistence
- Razorpay integration skeleton for plan-based access

## Project Structure

- `backend/`: API, analysis engine, model inference, payment endpoints, tests
- `frontend/`: React dashboard
- `ml/`: offline training script
- `docker-compose.yml`: local stack for Mongo, Neo4j, backend, frontend

## Quick Start (Docker)

1. Copy `.env.example` to `.env` and adjust if needed.
2. Run:
   - `docker compose up --build`
3. Open:
   - Backend docs: `http://localhost:8000/docs`
   - Frontend: `http://localhost:5173`

## Quick Start (Without Docker)

### Backend

1. `cd backend`
2. `python -m venv venv`
3. `venv\\Scripts\\activate` (Windows)
4. `pip install -r requirements.txt`
5. Ensure `.env` has `storage_mode=local` (default in `.env.example`)
5. `uvicorn app.main:app --reload --port 8000`

### Frontend

1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Run Without MongoDB/Neo4j

This project supports local lightweight mode for demo/development:

- Set `storage_mode=local` in `.env`
- No MongoDB installation required
- No Neo4j installation required
- Dependency graph persistence to Neo4j is skipped automatically

## API Coverage Implemented

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /projects`
- `GET /projects`
- `POST /scans/start`
- `GET /scans/{scan_id}/status`
- `GET /scans/{scan_id}/summary`
- `GET /scans/{scan_id}/modules`
- `GET /scans/{scan_id}/graph`
- `GET /scans/{scan_id}/recommendations`
- `POST /payments/create-order`
- `POST /payments/webhook`

## Current Assumptions

- `repo_url` in project creation currently expects a local path to a source repository.
- Analyzer currently focuses on Python files for module dependency extraction.
- LangGraph flow is represented as deterministic pipeline logic and can be swapped with full LangGraph runtime.

## Testing

- Backend tests: `cd backend && pytest`
- Model training: `python ml/train.py`
