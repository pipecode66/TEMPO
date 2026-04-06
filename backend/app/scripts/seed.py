from __future__ import annotations

from app.db.bootstrap import create_all_tables, seed_defaults
from app.db.session import SessionLocal


def main() -> None:
    create_all_tables()
    with SessionLocal() as db:
        seed_defaults(db)


if __name__ == "__main__":
    main()
