"""Catch-all Vercel function entrypoint for nested /api/* routes."""

from __future__ import annotations

import sys
from pathlib import Path


BACKEND_PATH = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_PATH))

from app.main import app
