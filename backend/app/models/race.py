"""
Race-related database models.
경주 관련 데이터베이스 모델
"""
from datetime import date, time, datetime
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Date, Time, DateTime, BigInteger,
    ForeignKey, Boolean, Numeric, Text, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class RaceTrack(Base):
    """경마장 (Race Tracks)"""
    __tablename__ = "race_tracks"

    id = Column(Integer, primary_key=True, index=True)
    name_ko = Column(String(100), nullable=False, comment="한국어 이름")
    name_en = Column(String(100), comment="영어 이름")
    location = Column(String(200), comment="위치")
    track_length = Column(Integer, comment="트랙 길이 (미터)")
    track_type = Column(String(50), comment="트랙 종류 (모래/잔디)")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    races = relationship("Race", back_populates="track")


class Race(Base):
    """경주 (Races)"""
    __tablename__ = "races"

    id = Column(Integer, primary_key=True, index=True)
    race_track_id = Column(Integer, ForeignKey("race_tracks.id"), nullable=False)
    race_date = Column(Date, nullable=False, index=True, comment="경주 날짜")
    race_number = Column(Integer, nullable=False, comment="경주 번호")
    race_name = Column(String(200), comment="경주 이름")
    race_class = Column(String(50), comment="등급")
    distance = Column(Integer, comment="거리 (미터)")
    surface_type = Column(String(50), comment="마장 종류 (모래/잔디)")
    weather = Column(String(50), comment="날씨")
    track_condition = Column(String(50), comment="마장 상태 (양호/불량 등)")
    prize_money = Column(BigInteger, comment="상금")
    race_status = Column(
        String(50),
        default="scheduled",
        comment="상태 (scheduled/in_progress/completed/cancelled)"
    )
    start_time = Column(Time, comment="예정 출발 시간")
    actual_start_time = Column(Time, comment="실제 출발 시간")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    track = relationship("RaceTrack", back_populates="races")
    entries = relationship("RaceEntry", back_populates="race", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="race", cascade="all, delete-orphan")

    # Indexes and Constraints
    __table_args__ = (
        UniqueConstraint('race_track_id', 'race_date', 'race_number', name='uq_race_track_date_number'),
        Index('idx_race_date_track', 'race_date', 'race_track_id'),
        Index('idx_race_status', 'race_status'),
    )


class RaceEntry(Base):
    """출전 정보 (Race Entries)"""
    __tablename__ = "race_entries"

    id = Column(Integer, primary_key=True, index=True)
    race_id = Column(Integer, ForeignKey("races.id", ondelete="CASCADE"), nullable=False)
    horse_id = Column(Integer, ForeignKey("horses.id"), nullable=False)
    jockey_id = Column(Integer, ForeignKey("jockeys.id"), nullable=False)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    gate_number = Column(Integer, nullable=False, comment="출발 번호")
    horse_weight_kg = Column(Numeric(6, 2), comment="말 무게 (kg)")
    jockey_weight_kg = Column(Numeric(5, 2), comment="기수 무게 (kg)")
    handicap_weight_kg = Column(Numeric(5, 2), comment="핸디캡 무게 (kg)")
    morning_odds = Column(Numeric(8, 2), comment="아침 배당률")
    final_odds = Column(Numeric(8, 2), comment="최종 배당률")
    popularity_rank = Column(Integer, comment="인기 순위")

    # Results (filled after race)
    finish_position = Column(Integer, comment="최종 순위")
    finish_time = Column(Numeric(8, 3), comment="기록 (초)")
    margin = Column(Numeric(6, 2), comment="착차 (마신)")
    comment = Column(Text, comment="경주평")
    scratched = Column(Boolean, default=False, comment="제외 여부")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    race = relationship("Race", back_populates="entries")
    horse = relationship("Horse", back_populates="race_entries")
    jockey = relationship("Jockey", back_populates="race_entries")
    trainer = relationship("Trainer", back_populates="race_entries")

    # Indexes and Constraints
    __table_args__ = (
        UniqueConstraint('race_id', 'gate_number', name='uq_race_gate'),
        Index('idx_race_entry_race', 'race_id'),
        Index('idx_race_entry_horse', 'horse_id'),
        Index('idx_race_entry_jockey', 'jockey_id'),
    )
