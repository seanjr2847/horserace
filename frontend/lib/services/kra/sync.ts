/**
 * KRA API 데이터 동기화 로직
 * KRA API → Prisma Database
 */

import { prisma } from '@/lib/prisma'
import { getKRAClient, KRAApiClient } from './client'
import {
  KRARaceInfo,
  KRAHorseEntry,
  KRAHorseDetail,
  KRAJockeyInfo,
  KRATrainerInfo,
  KRARaceResult,
  HorseGender,
} from './types'

// ============================================
// 동기화 결과 타입
// ============================================

export interface SyncResult {
  success: boolean
  message: string
  stats: {
    racesCreated: number
    racesUpdated: number
    horsesCreated: number
    horsesUpdated: number
    jockeysCreated: number
    jockeysUpdated: number
    trainersCreated: number
    trainersUpdated: number
    entriesCreated: number
    entriesUpdated: number
    errors: number
  }
}

// ============================================
// 경주장 코드 → DB ID 매핑
// ============================================

const TRACK_CODE_MAP: Record<string, number> = {
  '1': 1, // 서울
  '2': 2, // 부산경남
  '3': 3, // 제주
}

// ============================================
// 경주장 초기 데이터 생성
// ============================================

export async function syncRaceTracks(): Promise<void> {
  const tracks = [
    { code: 1, name: '서울', location: '서울특별시' },
    { code: 2, name: '부산경남', location: '부산광역시' },
    { code: 3, name: '제주', location: '제주특별자치도' },
  ]

  for (const track of tracks) {
    await prisma.raceTrack.upsert({
      where: { code: track.code },
      update: {},
      create: track,
    })
  }

  console.log('✅ 경주장 정보 동기화 완료')
}

// ============================================
// 데이터 변환 유틸리티
// ============================================

function parseGender(koreanGender: string): HorseGender {
  if (koreanGender.includes('거세') || koreanGender.includes('gelding')) {
    return 'gelding'
  }
  if (koreanGender.includes('암') || koreanGender.includes('mare')) {
    return 'mare'
  }
  return 'stallion'
}

function parseRating(rating: string | number | null | undefined): number | null {
  if (rating === null || rating === undefined || rating === '' || rating === '-') {
    return null
  }
  const parsed = typeof rating === 'number' ? rating : parseInt(rating, 10)
  return isNaN(parsed) ? null : parsed
}

function parseSurfaceType(trackStat: string): string {
  if (trackStat && trackStat.includes('잔디')) {
    return '잔디'
  }
  return '모래'
}

function normalizeTrackCondition(trackStat: string): string {
  if (!trackStat) return '양호'

  if (trackStat.includes('불량')) return '불량'
  if (trackStat.includes('포화')) return '포화'
  if (trackStat.includes('다습')) return '다습'
  if (trackStat.includes('건조')) return '건조'

  return '양호'
}

// ============================================
// 경주 정보 동기화
// ============================================

export async function syncRace(raceInfo: KRARaceInfo): Promise<number> {
  const raceDate = KRAApiClient.parseDate(String(raceInfo.rcDate))
  const trackId = TRACK_CODE_MAP[raceInfo.meet] || 1

  // Upsert 경주 정보
  const race = await prisma.race.upsert({
    where: {
      raceDate_raceNumber_trackId: {
        raceDate,
        raceNumber: raceInfo.rcNo,
        trackId,
      },
    },
    update: {
      distance: raceInfo.rcDist,
      surfaceType: parseSurfaceType(raceInfo.trackStat),
      weather: raceInfo.weather || null,
      trackCondition: normalizeTrackCondition(raceInfo.trackStat),
      raceClass: raceInfo.divSn || null,
      prizeMoney: raceInfo.prize1 ? raceInfo.prize1.toString() : null,
      raceStatus: 'scheduled',
    },
    create: {
      raceDate,
      raceNumber: raceInfo.rcNo,
      trackId,
      distance: raceInfo.rcDist,
      surfaceType: parseSurfaceType(raceInfo.trackStat),
      weather: raceInfo.weather || null,
      trackCondition: normalizeTrackCondition(raceInfo.trackStat),
      raceClass: raceInfo.divSn || null,
      prizeMoney: raceInfo.prize1 ? raceInfo.prize1.toString() : null,
      raceStatus: 'scheduled',
    },
  })

  return race.id
}

// ============================================
// 말 정보 동기화
// ============================================

export async function syncHorse(
  entry: KRAHorseEntry,
  horseDetail?: KRAHorseDetail
): Promise<number> {
  const registrationNumber = entry.hrRegNo || entry.hrNo

  // 말 기본 정보
  const horseData: any = {
    nameKo: entry.hrName,
    nameEn: entry.hrNameEn || horseDetail?.hrNameEn || null,
    gender: parseGender(entry.sex),
    rating: parseRating(entry.rating) ?? parseRating(horseDetail?.rating),
  }

  // 상세 정보가 있으면 추가
  if (horseDetail) {
    horseData.birthDate = KRAApiClient.parseDate(horseDetail.birthDate)
    horseData.totalRaces = horseDetail.totRcCnt
    horseData.totalWins = horseDetail.totWinCnt
    horseData.totalPlaces = horseDetail.totPlcCnt
    horseData.totalShows = horseDetail.totShowCnt
    horseData.totalEarnings = horseDetail.totPrize.toString()
  } else {
    // 상세 정보가 없으면 기본값 또는 추정값
    horseData.birthDate = new Date(new Date().getFullYear() - entry.age, 0, 1)
    horseData.totalRaces = 0
    horseData.totalWins = 0
    horseData.totalPlaces = 0
    horseData.totalShows = 0
    horseData.totalEarnings = '0'
  }

  const horse = await prisma.horse.upsert({
    where: { registrationNumber },
    update: horseData,
    create: {
      registrationNumber,
      ...horseData,
    },
  })

  return horse.id
}

// ============================================
// 기수 정보 동기화
// ============================================

export async function syncJockey(
  jkNo: string,
  jkName: string,
  jockeyDetail?: KRAJockeyInfo
): Promise<number> {
  const jockeyData: any = {
    nameKo: jkName,
  }

  if (jockeyDetail) {
    jockeyData.nameEn = jockeyDetail.jkNameEn || null
    jockeyData.debutDate = jockeyDetail.debDate
      ? KRAApiClient.parseDate(jockeyDetail.debDate)
      : null
    jockeyData.totalRaces = jockeyDetail.totRcCnt
    jockeyData.totalWins = jockeyDetail.totWinCnt
    jockeyData.winRate = jockeyDetail.win1Rate.toString()
    jockeyData.placeRate = jockeyDetail.plc2Rate.toString()
  } else {
    jockeyData.totalRaces = 0
    jockeyData.totalWins = 0
    jockeyData.winRate = '0'
    jockeyData.placeRate = '0'
  }

  const jockey = await prisma.jockey.upsert({
    where: { licenseNumber: jkNo },
    update: jockeyData,
    create: {
      licenseNumber: jkNo,
      ...jockeyData,
    },
  })

  return jockey.id
}

// ============================================
// 조교사 정보 동기화
// ============================================

export async function syncTrainer(
  trNo: string,
  trName: string,
  trainerDetail?: KRATrainerInfo
): Promise<number> {
  const trainerData: any = {
    nameKo: trName,
  }

  if (trainerDetail) {
    trainerData.nameEn = trainerDetail.trNameEn || null
    trainerData.stableName = trainerDetail.stable || null
    trainerData.totalRaces = trainerDetail.totRcCnt
    trainerData.totalWins = trainerDetail.totWinCnt
    trainerData.winRate = trainerDetail.winRate.toString()
  } else {
    trainerData.totalRaces = 0
    trainerData.totalWins = 0
    trainerData.winRate = '0'
  }

  const trainer = await prisma.trainer.upsert({
    where: { licenseNumber: trNo },
    update: trainerData,
    create: {
      licenseNumber: trNo,
      ...trainerData,
    },
  })

  return trainer.id
}

// ============================================
// 출전 정보 동기화
// ============================================

export async function syncRaceEntry(
  raceId: number,
  entry: KRAHorseEntry,
  horseId: number,
  jockeyId: number,
  trainerId: number
): Promise<void> {
  await prisma.raceEntry.upsert({
    where: {
      raceId_horseId: {
        raceId,
        horseId,
      },
    },
    update: {
      jockeyId,
      trainerId,
      gateNumber: entry.ordNo || entry.hrNo ? parseInt(entry.hrNo) : 1,
      horseWeightKg: entry.wgHr ? entry.wgHr.toString() : null,
      jockeyWeightKg: entry.wgBudam ? entry.wgBudam.toString() : null,
      odds: entry.odds ? entry.odds.toString() : null,
      finishPosition: entry.ord || null,
      finishTime: entry.rcTime ? parseFloat(entry.rcTime) : null,
    },
    create: {
      raceId,
      horseId,
      jockeyId,
      trainerId,
      gateNumber: entry.ordNo || entry.hrNo ? parseInt(entry.hrNo) : 1,
      horseWeightKg: entry.wgHr ? entry.wgHr.toString() : null,
      jockeyWeightKg: entry.wgBudam ? entry.wgBudam.toString() : null,
      odds: entry.odds ? entry.odds.toString() : null,
      finishPosition: entry.ord || null,
      finishTime: entry.rcTime ? parseFloat(entry.rcTime) : null,
    },
  })
}

// ============================================
// 특정 날짜 경주 전체 동기화
// ============================================

export async function syncRacesByDate(date: Date): Promise<SyncResult> {
  const kraClient = getKRAClient()
  const dateStr = KRAApiClient.formatDate(date)

  const result: SyncResult = {
    success: true,
    message: '',
    stats: {
      racesCreated: 0,
      racesUpdated: 0,
      horsesCreated: 0,
      horsesUpdated: 0,
      jockeysCreated: 0,
      jockeysUpdated: 0,
      trainersCreated: 0,
      trainersUpdated: 0,
      entriesCreated: 0,
      entriesUpdated: 0,
      errors: 0,
    },
  }

  try {
    console.log(`📅 ${dateStr} 경주 데이터 동기화 시작...`)

    // 1. 해당 날짜의 경주 목록 조회
    const races = await kraClient.getRacesByDate(dateStr)
    console.log(`   - 경주 ${races.length}개 발견`)

    // 2. 해당 날짜의 전체 출전마 한 번에 조회 (API 호출 최적화)
    const allEntries = await kraClient.getEntriesByDate(dateStr)
    console.log(`   - 전체 출전마 ${allEntries.length}마 조회됨`)

    // meet별로 출전마 그룹화 (meet + rcNo 조합으로 필터링)
    const entriesByRace = new Map<string, KRAHorseEntry[]>()
    for (const entry of allEntries) {
      const key = `${entry.meet}_${entry.rcNo}`
      if (!entriesByRace.has(key)) {
        entriesByRace.set(key, [])
      }
      entriesByRace.get(key)!.push(entry)
    }

    for (const raceInfo of races) {
      try {
        // 3. 경주 정보 저장
        const raceId = await syncRace(raceInfo)
        result.stats.racesCreated++

        // 4. 해당 경주의 출전마 필터링
        const raceKey = `${raceInfo.meet}_${raceInfo.rcNo}`
        const entries = entriesByRace.get(raceKey) || []
        console.log(`   - 경주 ${raceInfo.rcNo}: 출전마 ${entries.length}마`)

        for (const entry of entries) {
          try {
            // 5. 말 정보 동기화
            const horseId = await syncHorse(entry)
            result.stats.horsesCreated++

            // 6. 기수 정보 동기화
            const jockeyId = await syncJockey(entry.jkNo, entry.jkName)
            result.stats.jockeysCreated++

            // 7. 조교사 정보 동기화
            const trainerId = await syncTrainer(entry.trNo, entry.trName)
            result.stats.trainersCreated++

            // 8. 출전 정보 동기화
            await syncRaceEntry(raceId, entry, horseId, jockeyId, trainerId)
            result.stats.entriesCreated++
          } catch (error) {
            console.error(`     ⚠️ 출전마 ${entry.hrName} 동기화 실패:`, error)
            result.stats.errors++
          }
        }
      } catch (error) {
        console.error(`   ⚠️ 경주 ${raceInfo.rcNo} 동기화 실패:`, error)
        result.stats.errors++
      }
    }

    result.message = `${dateStr} 동기화 완료: 경주 ${result.stats.racesCreated}개, 출전마 ${result.stats.entriesCreated}개`
    console.log(`✅ ${result.message}`)
  } catch (error) {
    result.success = false
    result.message = `동기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    console.error(`❌ ${result.message}`)
  }

  return result
}

// ============================================
// 날짜 범위 동기화
// ============================================

export async function syncRacesByDateRange(
  startDate: Date,
  endDate: Date
): Promise<SyncResult> {
  const aggregatedResult: SyncResult = {
    success: true,
    message: '',
    stats: {
      racesCreated: 0,
      racesUpdated: 0,
      horsesCreated: 0,
      horsesUpdated: 0,
      jockeysCreated: 0,
      jockeysUpdated: 0,
      trainersCreated: 0,
      trainersUpdated: 0,
      entriesCreated: 0,
      entriesUpdated: 0,
      errors: 0,
    },
  }

  const currentDate = new Date(startDate)

  console.log(
    `📅 날짜 범위 동기화: ${KRAApiClient.formatDate(startDate)} ~ ${KRAApiClient.formatDate(endDate)}`
  )

  while (currentDate <= endDate) {
    const result = await syncRacesByDate(new Date(currentDate))

    // 통계 누적
    aggregatedResult.stats.racesCreated += result.stats.racesCreated
    aggregatedResult.stats.horsesCreated += result.stats.horsesCreated
    aggregatedResult.stats.jockeysCreated += result.stats.jockeysCreated
    aggregatedResult.stats.trainersCreated += result.stats.trainersCreated
    aggregatedResult.stats.entriesCreated += result.stats.entriesCreated
    aggregatedResult.stats.errors += result.stats.errors

    if (!result.success) {
      aggregatedResult.success = false
    }

    // 다음 날로 이동
    currentDate.setDate(currentDate.getDate() + 1)

    // API Rate Limit 고려하여 약간의 딜레이
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  aggregatedResult.message = `총 ${aggregatedResult.stats.racesCreated}개 경주, ${aggregatedResult.stats.entriesCreated}개 출전 정보 동기화 완료 (에러: ${aggregatedResult.stats.errors})`
  console.log(`✅ ${aggregatedResult.message}`)

  return aggregatedResult
}

// ============================================
// 경주 결과 업데이트
// ============================================

export async function updateRaceResults(
  rcDate: string,
  rcNo: number,
  meet: string
): Promise<void> {
  const kraClient = getKRAClient()

  try {
    // 경주 결과 조회
    const results = await kraClient.getRaceResults(rcDate, rcNo, meet)

    if (results.length === 0) {
      console.log(`경주 결과 없음: ${rcDate} - ${rcNo}`)
      return
    }

    // 해당 경주 찾기
    const raceDate = KRAApiClient.parseDate(String(rcDate))
    const trackId = TRACK_CODE_MAP[meet] || 1

    const race = await prisma.race.findUnique({
      where: {
        raceDate_raceNumber_trackId: {
          raceDate,
          raceNumber: rcNo,
          trackId,
        },
      },
      include: {
        entries: {
          include: {
            horse: true,
          },
        },
      },
    })

    if (!race) {
      console.error(`경주를 찾을 수 없음: ${rcDate} - ${rcNo}`)
      return
    }

    // 경주 상태를 completed로 업데이트
    await prisma.race.update({
      where: { id: race.id },
      data: { raceStatus: 'completed' },
    })

    // 각 출전마의 결과 업데이트
    for (const result of results) {
      const entry = race.entries.find(
        (e) => e.horse.registrationNumber === result.hrNo || e.horse.nameKo === result.hrName
      )

      if (entry) {
        await prisma.raceEntry.update({
          where: { id: entry.id },
          data: {
            finishPosition: result.ord,
            finishTime: result.rcTime ? parseFloat(result.rcTime) : null,
          },
        })
      }
    }

    console.log(`✅ 경주 결과 업데이트 완료: ${rcDate} - ${rcNo}`)
  } catch (error) {
    console.error(`경주 결과 업데이트 실패:`, error)
    throw error
  }
}
