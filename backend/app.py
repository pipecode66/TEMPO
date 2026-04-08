"""Compatibility entrypoint for Vercel FastAPI autodetection."""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure backend directory is FIRST in sys.path to avoid conflicts with Next.js app/ directory
PROJECT_ROOT = Path(__file__).resolve().parent
# Remove any paths that might contain a conflicting 'app' directory
sys.path = [p for p in sys.path if not (Path(p) / "app").is_dir() or Path(p) == PROJECT_ROOT]
# Insert our backend root at the beginning
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from index import app
