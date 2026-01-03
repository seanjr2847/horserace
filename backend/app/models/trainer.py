"""
Trainer database model.
조교사 데이터베이스 모델
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Numeric
from sqlalchemy.orm import relationship
from app.db.session import Base


class Trainer(Base):
    """조교사 (Trainers)"""
    __tablename__ = "trainers"

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
    stable_name = Column(String(200), comment="마방 이름")

    # Performance Statistics
    total_horses = Column(Integer, default=0, comment="관리 말 수")
    total_wins = Column(Integer, default=0, comment="승리 횟수")
    win_rate = Column(Numeric(5, 4), default=0, comment="승률")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    race_entries = relationship("RaceEntry", back_populates="trainer")
