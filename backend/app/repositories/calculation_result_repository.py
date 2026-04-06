from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.models import CalculationResult


class CalculationResultRepository:
    def create(self, db: Session, **data: object) -> CalculationResult:
        result = CalculationResult(**data)
        db.add(result)
        db.flush()
        return result
