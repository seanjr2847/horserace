/**
 * 경주 컨텍스트 빌더
 * 데이터베이스 데이터 → LLM 입력 JSON 변환
 */

import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

// ============================================
// 컨텍스트 타입
// ============================================

export interface RaceContextData {
  race_info: {
    date: string
    race_number: number
    track: string
    distance: number
    surface: string
    weather?: string
    track_condition?: string
    race_class?: string
    total_entries: number
  }
  entries: Array<{
    gate_number: number
    horse: {
      registration_number: string
      name: string
      age: number
      gender: string
      rating?: number
      recent_races: Array<{
        date: string
        position?: number
        total_horses: number
        distance: number
        time?: number
      }>
      total_stats: {
        races: number
        wins: number
        places: number
        shows: number
        win_rate: number
        earnings: string
      }
      distance_stats?: {
        races_at_distance: number
        wins_at_distance: number
        win_rate: number
      }
    }
    jockey: {
      license: string
      name: string
      total_races: number
      total_wins: number
      win_rate: number
      place_rate: number
      recent_form: number[] // 최근 5경주 착순
    }
    trainer: {
      license: string
      name: string
      stable?: string
      total_races: number
      total_wins: number
      win_rate: number
    }
    current_info: {
      horse_weight?: number
      jockey_weight?: number
      odds?: number
    }
  }>
  historical_context?: {
    similar_races: number
    track_bias?: string
    weather_impact?: string
  }
}

// ============================================
// 경주 컨텍스트 생성
// ============================================

export async function buildRaceContext(raceId: number): Promise<string> {
  // 경주 및 출전 정보 조회 (Prisma 포함 관계)
  const race = await prisma.race.findUnique({
    where: { id: raceId },
    include: {
      track: true,
      entries: {
        include: {
          horse: true,
          jockey: true,
          trainer: true,
        },
        orderBy: {
          gateNumber: 'asc',
        },
      },
    },
  })

  if (!race) {
    throw new Error(`경주를 찾을 수 없습니다: ${raceId}`)
  }

  // 컨텍스트 데이터 구조화
  const contextData: RaceContextData = {
    race_info: {
      date: format(race.raceDate, 'yyyy-MM-dd'),
      race_number: race.raceNumber,
      track: race.track.name,
      distance: race.distance,
      surface: race.surfaceType,
      weather: race.weather || undefined,
      track_condition: race.trackCondition || undefined,
      race_class: race.raceClass || undefined,
      total_entries: race.entries.length,
    },
    entries: [],
  }

  // 각 출전마 정보 추가
  for (const entry of race.entries) {
    const horse = entry.horse
    const jockey = entry.jockey
    const trainer = entry.trainer

    // 말의 최근 경주 기록 조회 (최대 5개)
    const recentRaces = await prisma.raceEntry.findMany({
      where: {
        horseId: horse.id,
        race: {
          raceDate: {
            lt: race.raceDate, // 현재 경주보다 이전
          },
        },
      },
      include: {
        race: true,
      },
      orderBy: {
        race: {
          raceDate: 'desc',
        },
      },
      take: 5,
    })

    // 해당 거리에서의 성적 계산
    const distanceRaces = await prisma.raceEntry.findMany({
      where: {
        horseId: horse.id,
        race: {
          distance: race.distance,
        },
      },
    })

    const distanceWins = distanceRaces.filter((r) => r.finishPosition === 1).length

    // 기수의 최근 폼 (최근 5경주 착순)
    const jockeyRecentRaces = await prisma.raceEntry.findMany({
      where: {
        jockeyId: jockey.id,
        finishPosition: {
          not: null,
        },
      },
      orderBy: {
        race: {
          raceDate: 'desc',
        },
      },
      take: 5,
    })

    // 출전 정보 추가
    contextData.entries.push({
      gate_number: entry.gateNumber,
      horse: {
        registration_number: horse.registrationNumber,
        name: horse.nameKo,
        age: calculateAge(horse.birthDate),
        gender: translateGender(horse.gender),
        rating: horse.rating || undefined,
        recent_races: recentRaces.map((r) => ({
          date: format(r.race.raceDate, 'yyyy-MM-dd'),
          position: r.finishPosition || undefined,
          total_horses: 0, // TODO: 해당 경주의 총 출전마 수 조회
          distance: r.race.distance,
          time: r.finishTime ? parseFloat(r.finishTime.toString()) : undefined,
        })),
        total_stats: {
          races: horse.totalRaces,
          wins: horse.totalWins,
          places: horse.totalPlaces,
          shows: horse.totalShows,
          win_rate: horse.totalRaces > 0 ? horse.totalWins / horse.totalRaces : 0,
          earnings: horse.totalEarnings.toString(),
        },
        distance_stats:
          distanceRaces.length > 0
            ? {
                races_at_distance: distanceRaces.length,
                wins_at_distance: distanceWins,
                win_rate: distanceWins / distanceRaces.length,
              }
            : undefined,
      },
      jockey: {
        license: jockey.licenseNumber,
        name: jockey.nameKo,
        total_races: jockey.totalRaces,
        total_wins: jockey.totalWins,
        win_rate: parseFloat(jockey.winRate.toString()),
        place_rate: parseFloat(jockey.placeRate.toString()),
        recent_form: jockeyRecentRaces.map((r) => r.finishPosition || 99),
      },
      trainer: {
        license: trainer.licenseNumber,
        name: trainer.nameKo,
        stable: trainer.stableName || undefined,
        total_races: trainer.totalRaces,
        total_wins: trainer.totalWins,
        win_rate: parseFloat(trainer.winRate.toString()),
      },
      current_info: {
        horse_weight: entry.horseWeightKg
          ? parseFloat(entry.horseWeightKg.toString())
          : undefined,
        jockey_weight: entry.jockeyWeightKg
          ? parseFloat(entry.jockeyWeightKg.toString())
          : undefined,
        odds: entry.odds ? parseFloat(entry.odds.toString()) : undefined,
      },
    })
  }

  // JSON 문자열로 변환 (들여쓰기 포함)
  return JSON.stringify(contextData, null, 2)
}

// ============================================
// 요약된 컨텍스트 생성 (토큰 절약)
// ============================================

export async function buildCompactRaceContext(raceId: number): Promise<string> {
  const fullContext = await buildRaceContext(raceId)
  const data: RaceContextData = JSON.parse(fullContext)

  // 핵심 정보만 추출
  const compactData = {
    경주: {
      날짜: data.race_info.date,
      번호: data.race_info.race_number,
      경주장: data.race_info.track,
      거리: `${data.race_info.distance}m`,
      주로: data.race_info.surface,
      날씨: data.race_info.weather,
      상태: data.race_info.track_condition,
    },
    출전마: data.entries.map((e) => ({
      게이트: e.gate_number,
      말: `${e.horse.name} (${e.horse.age}세)`,
      최근성적: e.horse.recent_races.slice(0, 3).map((r) => r.position || '?'),
      승률: `${(e.horse.total_stats.win_rate * 100).toFixed(1)}%`,
      기수: `${e.jockey.name} (${(e.jockey.win_rate * 100).toFixed(1)}%)`,
      조교사: `${e.trainer.name} (${(e.trainer.win_rate * 100).toFixed(1)}%)`,
      배당: e.current_info.odds || 'N/A',
    })),
  }

  return JSON.stringify(compactData, null, 2)
}

// ============================================
// 헬퍼 함수
// ============================================

function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

function translateGender(gender: string): string {
  const genderMap: Record<string, string> = {
    stallion: '수말',
    mare: '암말',
    gelding: '거세마',
  }
  return genderMap[gender] || gender
}

// ============================================
// 컨텍스트 검증
// ============================================

export async function validateRaceContext(raceId: number): Promise<{
  valid: boolean
  errors: string[]
  warnings: string[]
}> {
  const result = {
    valid: true,
    errors: [] as string[],
    warnings: [] as string[],
  }

  try {
    const race = await prisma.race.findUnique({
      where: { id: raceId },
      include: {
        entries: true,
      },
    })

    if (!race) {
      result.valid = false
      result.errors.push('경주를 찾을 수 없습니다')
      return result
    }

    // 검증 규칙
    if (race.entries.length < 2) {
      result.valid = false
      result.errors.push('출전마가 2마리 미만입니다')
    }

    if (race.entries.length > 20) {
      result.warnings.push('출전마가 20마리를 초과합니다')
    }

    if (!race.distance || race.distance < 1000) {
      result.warnings.push('경주 거리 정보가 비정상적입니다')
    }

    // 출전 정보 검증
    const gateNumbers = race.entries.map((e) => e.gateNumber)
    const duplicates = gateNumbers.filter(
      (num, idx) => gateNumbers.indexOf(num) !== idx
    )
    if (duplicates.length > 0) {
      result.valid = false
      result.errors.push(`중복된 게이트 번호: ${duplicates.join(', ')}`)
    }
  } catch (error) {
    result.valid = false
    result.errors.push(`검증 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
  }

  return result
}

// ============================================
// 컨텍스트 통계
// ============================================

export async function getContextStats(raceId: number): Promise<{
  token_estimate: number
  entries_count: number
  avg_recent_races: number
  data_completeness: number
}> {
  const context = await buildRaceContext(raceId)
  const data: RaceContextData = JSON.parse(context)

  const totalRecentRaces = data.entries.reduce(
    (sum, e) => sum + e.horse.recent_races.length,
    0
  )

  // 데이터 완전성 계산 (0-1)
  let completenessScore = 0
  let totalFields = 0

  data.entries.forEach((e) => {
    totalFields += 7 // 각 출전마당 체크할 필드 수

    if (e.horse.rating) completenessScore++
    if (e.horse.recent_races.length >= 3) completenessScore++
    if (e.horse.distance_stats) completenessScore++
    if (e.current_info.horse_weight) completenessScore++
    if (e.current_info.odds) completenessScore++
    if (e.jockey.recent_form.length >= 3) completenessScore++
    if (e.trainer.stable) completenessScore++
  })

  return {
    token_estimate: Math.ceil(context.length / 4), // 대략 4자 = 1토큰
    entries_count: data.entries.length,
    avg_recent_races: totalRecentRaces / data.entries.length,
    data_completeness: completenessScore / totalFields,
  }
}
