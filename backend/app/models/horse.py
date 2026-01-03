"""
Horse database model.
말 데이터베이스 모델
"""
from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, BigInteger
from sqlalchemy.orm import relationship
from app.db.session import Base


class Horse(Base):
    """말 (Horses)"""
    __tablename__ = "horses"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        comment="등록 번호"
    )
    name_ko = Column(String(100), nullable=False, comment="한국어 이름")
    name_en = Column(String(100), comment="영어 이름")
    birth_date = Column(Date, comment="생년월일")
    gender = Column(String(10), comment="성별 (수말/암말/거세마)")
    origin_country = Column(String(50), comment="원산지")
    father_name = Column(String(100), comment="부마 이름")
    mother_name = Column(String(100), comment="모마 이름")
    owner_name = Column(String(200), comment="마주 이름")

    # Performance Statistics
    rating = Column(Integer, comment="레이팅")
    total_races = Column(Integer, default=0, comment="총 출전 횟수")
    total_wins = Column(Integer, default=0, comment="1위 횟수")
    total_places = Column(Integer, default=0, comment="2위 횟수")
    total_shows = Column(Integer, default=0, comment="3위 횟수")
    total_earnings = Column(BigInteger, default=0, comment="총 상금")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    race_entries = relationship("RaceEntry", back_populates="horse")
