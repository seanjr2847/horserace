/**
 * 출전 정보 API
 * GET /api/races/[id]/entries
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRedisCache } from '@/lib/services/cache/redis'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const raceId = parseInt(params.id)

    if (isNaN(raceId)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 경주 ID' },
        { status: 400 }
      )
    }

    // 캐시 확인
    const cacheKey = `race:entries:${raceId}`
    const cache = getRedisCache()
    const cached = await cache.get(cacheKey)

    if (cached) {
      return NextResponse.json(cached)
    }

    // 출전 정보 조회
    const entries = await prisma.raceEntry.findMany({
      where: { raceId },
      include: {
        horse: true,
        jockey: true,
        trainer: true,
        race: {
          include: {
            track: true,
          },
        },
      },
      orderBy: {
        gateNumber: 'asc',
      },
    })

    if (entries.length === 0) {
      return NextResponse.json(
        { success: false, message: '출전 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 응답 데이터 구성
    const result = {
      success: true,
      raceInfo: {
        id: entries[0].race.id,
        raceDate: entries[0].race.raceDate,
        raceNumber: entries[0].race.raceNumber,
        track: entries[0].race.track.name,
        distance: entries[0].race.distance,
        surfaceType: entries[0].race.surfaceType,
      },
      entryCount: entries.length,
      entries: entries.map((entry) => ({
        id: entry.id,
        gateNumber: entry.gateNumber,
        horse: {
          id: entry.horse.id,
          registrationNumber: entry.horse.registrationNumber,
          nameKo: entry.horse.nameKo,
          nameEn: entry.horse.nameEn,
          gender: entry.horse.gender,
          rating: entry.horse.rating,
          totalRaces: entry.horse.totalRaces,
          totalWins: entry.horse.totalWins,
          winRate:
            entry.horse.totalRaces > 0
              ? (entry.horse.totalWins / entry.horse.totalRaces).toFixed(3)
              : '0.000',
        },
        jockey: {
          id: entry.jockey.id,
          nameKo: entry.jockey.nameKo,
          nameEn: entry.jockey.nameEn,
          winRate: parseFloat(entry.jockey.winRate.toString()),
          placeRate: parseFloat(entry.jockey.placeRate.toString()),
        },
        trainer: {
          id: entry.trainer.id,
          nameKo: entry.trainer.nameKo,
          stableName: entry.trainer.stableName,
          winRate: parseFloat(entry.trainer.winRate.toString()),
        },
        horseWeightKg: entry.horseWeightKg?.toString(),
        jockeyWeightKg: entry.jockeyWeightKg?.toString(),
        odds: entry.odds?.toString(),
        finishPosition: entry.finishPosition,
        finishTime: entry.finishTime?.toString(),
      })),
    }

    // 캐시 저장 (10분)
    await cache.set(cacheKey, result, 600)

    return NextResponse.json(result)
  } catch (error) {
    console.error('출전 정보 조회 에러:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '출전 정보 조회 실패',
      },
      { status: 500 }
    )
  }
}
