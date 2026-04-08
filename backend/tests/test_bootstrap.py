from __future__ import annotations

from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.bootstrap import seed_defaults
from app.db.models import Company, User
from app.main import bootstrap_database


class DummySessionContext:
    def __init__(self, session: object) -> None:
        self._session = session

    def __enter__(self) -> object:
        return self._session

    def __exit__(self, exc_type, exc, tb) -> None:
        return None


def test_seed_defaults_is_idempotent(tmp_path) -> None:
    database_path = tmp_path / "tempo-bootstrap.db"
    engine = create_engine(
        f"sqlite:///{database_path}",
        connect_args={"check_same_thread": False},
        future=True,
    )
    TestingSessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        future=True,
    )
    Base.metadata.create_all(bind=engine)

    try:
        with TestingSessionLocal() as db:
            seed_defaults(db)
            seed_defaults(db)

            company_count = db.scalar(select(func.count()).select_from(Company))
            user_count = db.scalar(select(func.count()).select_from(User))
            admin = db.scalar(select(User).where(User.email == "admin@empresa.com"))

            assert company_count == 1
            assert user_count == 1
            assert admin is not None
            assert admin.is_active is True
    finally:
        engine.dispose()


def test_bootstrap_database_runs_schema_creation_and_seed(monkeypatch) -> None:
    calls: list[str] = []
    fake_session = object()

    monkeypatch.setattr(
        "app.main.create_all_tables",
        lambda: calls.append("create_all_tables"),
    )
    monkeypatch.setattr(
        "app.main.seed_defaults",
        lambda db: calls.append(f"seed_defaults:{db is fake_session}"),
    )
    monkeypatch.setattr(
        "app.main.SessionLocal",
        lambda: DummySessionContext(fake_session),
    )

    bootstrap_database()

    assert calls == ["create_all_tables", "seed_defaults:True"]
