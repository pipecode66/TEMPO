from app.core.config import Settings


def test_database_url_normalizes_postgres_scheme_for_psycopg() -> None:
    settings = Settings(database_url="postgres://user:secret@db.example.com:5432/tempo")
    assert settings.database_url == "postgresql+psycopg://user:secret@db.example.com:5432/tempo"


def test_database_url_normalizes_postgresql_scheme_for_psycopg() -> None:
    settings = Settings(database_url="postgresql://user:secret@db.example.com:5432/tempo")
    assert settings.database_url == "postgresql+psycopg://user:secret@db.example.com:5432/tempo"
