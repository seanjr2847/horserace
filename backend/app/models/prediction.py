"""
Prediction database models.
예측 데이터베이스 모델
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Numeric, ForeignKey, Text, JSON, Index
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.session import Base


class Prediction(Base):
    """예측 결과 (Predictions)"""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    race_id = Column(
        Integer,
        ForeignKey("races.id", ondelete="CASCADE"),
        nullable=False
    )
    prediction_type = Column(
        String(50),
        nullable=False,
        comment="예측 타입 (win/place/quinella/exacta/trifecta)"
    )
    model_version = Column(String(50), nullable=False, comment="모델 버전")
    prediction_data = Column(JSONB, nullable=False, comment="예측 결과 (JSON)")
    confidence_score = Column(Numeric(5, 4), comment="신뢰도 점수 (0.0-1.0)")
    feature_importance = Column(JSONB, comment="주요 특징 중요도")
    llm_reasoning = Column(Text, comment="LLM 분석 근거")

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    race = relationship("Race", back_populates="predictions")

    # Indexes
    __table_args__ = (
        Index('idx_prediction_race_type', 'race_id', 'prediction_type'),
    )


class PredictionDetailSingle(Base):
    """예측별 상세 - 단승/연승용 (Prediction Details - Single)"""
    __tablename__ = "prediction_details_single"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(
        Integer,
        ForeignKey("predictions.id", ondelete="CASCADE"),
        nullable=False
    )
    race_entry_id = Column(Integer, ForeignKey("race_entries.id"), nullable=False)
    predicted_probability = Column(
        Numeric(7, 6),
        nullable=False,
        comment="예측 확률"
    )
    confidence_level = Column(
        String(20),
        comment="신뢰도 레벨 (high/medium/low)"
    )
    rank_prediction = Column(Integer, comment="예상 순위")

    created_at = Column(DateTime, default=datetime.utcnow)


class PredictionDetailCombination(Base):
    """조합 예측 - 복승/복연승/삼복승용 (Combination Predictions)"""
    __tablename__ = "prediction_details_combination"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(
        Integer,
        ForeignKey("predictions.id", ondelete="CASCADE"),
        nullable=False
    )
    combination_entries = Column(
        JSON,
        nullable=False,
        comment="race_entry_id 배열"
    )
    predicted_probability = Column(Numeric(7, 6), comment="예측 확률")
    confidence_level = Column(String(20), comment="신뢰도 레벨")
    expected_return = Column(Numeric(8, 2), comment="예상 배당")

    created_at = Column(DateTime, default=datetime.utcnow)
