"""
Jockey database model.
기수 데이터베이스 모델
"""
from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric
from sqlalchemy.orm import relationship
from app.db.session import Base


class Jockey(Base):
    """기수 (Jockeys)"""
    __tablename__ = "jockeys"

    id = Column(Integer, primary_key=True, index=True)
    license_number = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        comment="면허 번호"
    )
    name_ko = Column(String(100), nullable=False, comment="한국어 이름")
    name_en = Column(String(100), comment="영어 이름")
    birth_date = Column(Date, comment="생년월일")
    debut_date = Column(Date, comment="데뷔 날짜")
    weight_kg = Column(Numeric(5, 2), comment="체중 (kg)")

    # Performance Statistics
    total_races = Column(Integer, default=0, comment="총 기승 횟수")
    total_wins = Column(Integer, default=0, comment="1위 횟수")
    win_rate = Column(Numeric(5, 4), default=0, comment="승률")
    place_rate = Column(Numeric(5, 4), default=0, comment="연대율")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    race_entries = relationship("RaceEntry", back_populates="jockey")
