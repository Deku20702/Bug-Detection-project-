from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, health, payments, projects, scans

app = FastAPI(
    title="Structural Bug Detection API",
    version="0.1.0",
    description="AI-based structural bug detection and prevention backend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(scans.router, prefix="/scans", tags=["Scans"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])

