/**
 * 기수 분석 API
 * GET /api/analytics/jockey/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRedisCache } from '@/lib/services/cache/redis'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jockeyId = parseInt(params.id)

    if (isNaN(jockeyId)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 기수 ID' },
        { status: 400 }
      )
    }

    // 캐시 확인
    const cacheKey = `analytics:jockey:${jockeyId}`
    const cache = getRedisCache()
    const cached = await cache.get(cacheKey)

    if (cached) {
      return NextResponse.json(cached)
    }

    // 기수 기본 정보 조회
    const jockey = await prisma.jockey.findUnique({
      where: { id: jockeyId },
    })

    if (!jockey) {
      return NextResponse.json(
        { success: false, message: '기수를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 전체 경주 기록
    const allRaces = await prisma.raceEntry.findMany({
      where: { jockeyId },
      include: {
        race: {
          include: {
            track: true,
          },
        },
        horse: true,
      },
      orderBy: {
        race: {
          raceDate: 'desc',
        },
      },
    })

    // 경마장별 통계
    const trackStats: Record<
      number,
      { trackName: string; races: number; wins: number; places: number; winRate: number }
    > = {}

    allRaces.forEach((entry) => {
      const trackId = entry.race.trackId
      if (!trackStats[trackId]) {
        trackStats[trackId] = {
          trackName: entry.race.track.name,
          races: 0,
          wins: 0,
          places: 0,
          winRate: 0,
        }
      }

      trackStats[trackId].races++
      if (entry.finishPosition === 1) trackStats[trackId].wins++
      if (entry.finishPosition && entry.finishPosition <= 3) trackStats[trackId].places++
    })

    // 승률 계산
    Object.keys(trackStats).forEach((trackId) => {
      const track = parseInt(trackId)
      trackStats[track].winRate =
        trackStats[track].races > 0 ? trackStats[track].wins / trackStats[track].races : 0
    })

    // 거리별 통계
    const distanceStats: Record<
      number,
      { races: number; wins: number; places: number; avgPosition: number }
    > = {}

    allRaces.forEach((entry) => {
      const distance = entry.race.distance
      if (!distanceStats[distance]) {
        distanceStats[distance] = { races: 0, wins: 0, places: 0, avgPosition: 0 }
      }

      distanceStats[distance].races++
      if (entry.finishPosition === 1) distanceStats[distance].wins++
      if (entry.finishPosition && entry.finishPosition <= 3) distanceStats[distance].places++
    })

    // 평균 착순 계산
    Object.keys(distanceStats).forEach((distance) => {
      const dist = parseInt(distance)
      const positions = allRaces
        .filter((e) => e.race.distance === dist && e.finishPosition)
        .map((e) => e.finishPosition!)

      distanceStats[dist].avgPosition =
        positions.length > 0 ? positions.reduce((a, b) => a + b, 0) / positions.length : 0
    })

    // 최근 폼 (최근 10경주)
    const recentForm = allRaces.slice(0, 10).map((entry) => ({
      date: entry.race.raceDate,
      raceNumber: entry.race.raceNumber,
      track: entry.race.track.name,
      distance: entry.race.distance,
      horse: entry.horse.nameKo,
      finishPosition: entry.finishPosition,
      finishTime: entry.finishTime?.toString(),
    }))

    // 말별 조합 통계
    const horseStats: Record<
      string,
      { name: string; races: number; wins: number; winRate: number }
    > = {}

    allRaces.forEach((entry) => {
      const horseId = entry.horse.id.toString()
      if (!horseStats[horseId]) {
        horseStats[horseId] = {
          name: entry.horse.nameKo,
          races: 0,
          wins: 0,
          winRate: 0,
        }
      }

      horseStats[horseId].races++
      if (entry.finishPosition === 1) horseStats[horseId].wins++
    })

    Object.keys(horseStats).forEach((horseId) => {
      horseStats[horseId].winRate =
        horseStats[horseId].races > 0
          ? horseStats[horseId].wins / horseStats[horseId].races
          : 0
    })

    // 최고 조합 찾기
    const bestHorseCombination = Object.values(horseStats)
      .filter((stat) => stat.races >= 3) // 최소 3경주 이상
      .sort((a, b) => b.winRate - a.winRate)[0]

    // 월별 트렌드 (최근 12개월)
    const monthlyTrend: Record<
      string,
      { month: string; races: number; wins: number; winRate: number }
    > = {}

    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    allRaces
      .filter((entry) => entry.race.raceDate >= twelveMonthsAgo)
      .forEach((entry) => {
        const month = entry.race.raceDate.toISOString().substring(0, 7) // YYYY-MM
        if (!monthlyTrend[month]) {
          monthlyTrend[month] = { month, races: 0, wins: 0, winRate: 0 }
        }

        monthlyTrend[month].races++
        if (entry.finishPosition === 1) monthlyTrend[month].wins++
      })

    Object.keys(monthlyTrend).forEach((month) => {
      monthlyTrend[month].winRate =
        monthlyTrend[month].races > 0
          ? monthlyTrend[month].wins / monthlyTrend[month].races
          : 0
    })

    // 응답 데이터 구성
    const result = {
      success: true,
      jockey: {
        id: jockey.id,
        licenseNumber: jockey.licenseNumber,
        nameKo: jockey.nameKo,
        nameEn: jockey.nameEn,
        debut: jockey.debut,
      },
      statistics: {
        overall: {
          totalRaces: jockey.totalRaces,
          totalWins: jockey.totalWins,
          totalPlaces: jockey.totalPlaces,
          totalShows: jockey.totalShows,
          winRate: parseFloat(jockey.winRate.toString()),
          placeRate: parseFloat(jockey.placeRate.toString()),
        },
        byTrack: Object.entries(trackStats).map(([trackId, stats]) => ({
          trackId: parseInt(trackId),
          trackName: stats.trackName,
          races: stats.races,
          wins: stats.wins,
          places: stats.places,
          winRate: stats.winRate,
          placeRate: stats.races > 0 ? stats.places / stats.races : 0,
        })),
        byDistance: Object.entries(distanceStats).map(([distance, stats]) => ({
          distance: parseInt(distance),
          ...stats,
          winRate: stats.races > 0 ? stats.wins / stats.races : 0,
        })),
        monthlyTrend: Object.values(monthlyTrend).sort((a, b) =>
          a.month.localeCompare(b.month)
        ),
      },
      recentForm,
      bestHorseCombination,
      totalRaceHistory: allRaces.length,
    }

    // 캐시 저장 (30분)
    await cache.set(cacheKey, result, 1800)

    return NextResponse.json(result)
  } catch (error) {
    console.error('기수 분석 조회 에러:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '기수 분석 조회 실패',
      },
      { status: 500 }
    )
  }
}
