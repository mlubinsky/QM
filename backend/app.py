"""Top-level FastAPI application.

Mounts each solver as an APIRouter with its own URL prefix.
Adding a new solver = one new import + one include_router call.

All solver quantities in atomic units: ħ = m_e = 1.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from solvers.schrodinger_1d.router import router as schrodinger_router
from solvers.hydrogenic.router import router as hydrogenic_router
from solvers.spin.router import router as spin_router

__version__ = "0.2026.0502"

app = FastAPI(title="Schrödinger Solver", version=__version__)

_cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "version": __version__}


app.include_router(schrodinger_router, prefix="/schrodinger1d")
app.include_router(hydrogenic_router, prefix="/hydrogenic")
app.include_router(spin_router, prefix="/spin")
