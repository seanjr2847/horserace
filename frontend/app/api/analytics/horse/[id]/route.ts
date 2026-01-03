/**
 * 말 분석 API
 * GET /api/analytics/horse/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const horseId = parseInt(params.id)

    if (isNaN(horseId)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 말 ID' },
        { status: 400 }
      )
    }

    // 말 기본 정보 조회
    const horse = await prisma.horse.findUnique({
      where: { id: horseId },
    })

    if (!horse) {
      return NextResponse.json(
        { success: false, message: '말을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 전체 경주 기록
    const allRaces = await prisma.raceEntry.findMany({
      where: { horseId },
      include: {
        race: {
          include: {
            track: true,
          },
        },
        jockey: true,
      },
      orderBy: {
        race: {
          raceDate: 'desc',
        },
      },
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
        positions.length > 0
          ? positions.reduce((a, b) => a + b, 0) / positions.length
          : 0
    })

    // 주로 상태별 통계
    const surfaceStats: Record<string, { races: number; wins: number; winRate: number }> = {}

    allRaces.forEach((entry) => {
      const surface = entry.race.surfaceType
      if (!surfaceStats[surface]) {
        surfaceStats[surface] = { races: 0, wins: 0, winRate: 0 }
      }

      surfaceStats[surface].races++
      if (entry.finishPosition === 1) surfaceStats[surface].wins++
    })

    Object.keys(surfaceStats).forEach((surface) => {
      surfaceStats[surface].winRate =
        surfaceStats[surface].races > 0
          ? surfaceStats[surface].wins / surfaceStats[surface].races
          : 0
    })

    // 최근 폼 (최근 10경주)
    const recentForm = allRaces.slice(0, 10).map((entry) => ({
      date: entry.race.raceDate,
      raceNumber: entry.race.raceNumber,
      track: entry.race.track.name,
      distance: entry.race.distance,
      finishPosition: entry.finishPosition,
      finishTime: entry.finishTime?.toString(),
      jockey: entry.jockey.nameKo,
    }))

    // 기수별 조합 통계
    const jockeyStats: Record<
      string,
      { name: string; races: number; wins: number; winRate: number }
    > = {}

    allRaces.forEach((entry) => {
      const jockeyId = entry.jockey.id.toString()
      if (!jockeyStats[jockeyId]) {
        jockeyStats[jockeyId] = {
          name: entry.jockey.nameKo,
          races: 0,
          wins: 0,
          winRate: 0,
        }
      }

      jockeyStats[jockeyId].races++
      if (entry.finishPosition === 1) jockeyStats[jockeyId].wins++
    })

    Object.keys(jockeyStats).forEach((jockeyId) => {
      jockeyStats[jockeyId].winRate =
        jockeyStats[jockeyId].races > 0
          ? jockeyStats[jockeyId].wins / jockeyStats[jockeyId].races
          : 0
    })

    // 최고 조합 찾기
    const bestJockeyCombination = Object.values(jockeyStats)
      .filter((stat) => stat.races >= 3) // 최소 3경주 이상
      .sort((a, b) => b.winRate - a.winRate)[0]

    // 응답 데이터 구성
    const result = {
      success: true,
      horse: {
        id: horse.id,
        registrationNumber: horse.registrationNumber,
        nameKo: horse.nameKo,
        nameEn: horse.nameEn,
        birthDate: horse.birthDate,
        gender: horse.gender,
        rating: horse.rating,
      },
      statistics: {
        overall: {
          totalRaces: horse.totalRaces,
          totalWins: horse.totalWins,
          totalPlaces: horse.totalPlaces,
          totalShows: horse.totalShows,
          totalEarnings: horse.totalEarnings.toString(),
          winRate: horse.totalRaces > 0 ? horse.totalWins / horse.totalRaces : 0,
          placeRate: horse.totalRaces > 0 ? horse.totalPlaces / horse.totalRaces : 0,
        },
        byDistance: Object.entries(distanceStats).map(([distance, stats]) => ({
          distance: parseInt(distance),
          ...stats,
          winRate: stats.races > 0 ? stats.wins / stats.races : 0,
        })),
        bySurface: Object.entries(surfaceStats).map(([surface, stats]) => ({
          surface,
          ...stats,
        })),
      },
      recentForm,
      bestJockeyCombination,
      totalRaceHistory: allRaces.length,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('말 분석 조회 에러:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '말 분석 조회 실패',
      },
      { status: 500 }
    )
  }
}
