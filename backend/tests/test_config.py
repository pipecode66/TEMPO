from app.core.config import Settings


def test_database_url_normalizes_postgres_scheme_for_psycopg() -> None:
    settings = Settings(database_url="postgres://user:secret@db.example.com:5432/tempo")
    assert settings.database_url == "postgresql+psycopg://user:secret@db.example.com:5432/tempo"


def test_database_url_normalizes_postgresql_scheme_for_psycopg() -> None:
    settings = Settings(database_url="postgresql://user:secret@db.example.com:5432/tempo")
    assert settings.database_url == "postgresql+psycopg://user:secret@db.example.com:5432/tempo"


def test_cors_origins_accepts_plain_comma_separated_env_value() -> None:
    settings = Settings(cors_origins="https://tempopro.vercel.app,https://admin.tempopro.vercel.app")
    assert settings.cors_origins == [
        "https://tempopro.vercel.app",
        "https://admin.tempopro.vercel.app",
    ]


def test_cors_origins_accepts_json_array_env_value() -> None:
    settings = Settings(cors_origins='["https://tempopro.vercel.app"]')
    assert settings.cors_origins == ["https://tempopro.vercel.app"]
