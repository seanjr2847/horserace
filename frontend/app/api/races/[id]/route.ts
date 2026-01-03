/**
 * 경주 상세 API
 * GET /api/races/[id]
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
    const cacheKey = `race:detail:${raceId}`
    const cache = getRedisCache()
    const cached = await cache.get(cacheKey)

    if (cached) {
      return NextResponse.json(cached)
    }

    // 경주 상세 조회
    const race = await prisma.race.findUnique({
      where: { id: raceId },
      include: {
        track: true,
        entries: {
          include: {
            horse: {
              include: {
                entries: {
                  where: {
                    race: {
                      raceDate: {
                        lt: new Date(), // 과거 경주만
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
                  take: 5, // 최근 5경주
                },
              },
            },
            jockey: true,
            trainer: true,
          },
          orderBy: {
            gateNumber: 'asc',
          },
        },
        predictions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!race) {
      return NextResponse.json(
        { success: false, message: '경주를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 응답 데이터 구성
    const result = {
      success: true,
      race: {
        id: race.id,
        raceDate: race.raceDate,
        raceNumber: race.raceNumber,
        track: {
          id: race.track.id,
          name: race.track.name,
          code: race.track.code,
          location: race.track.location,
        },
        distance: race.distance,
        surfaceType: race.surfaceType,
        weather: race.weather,
        trackCondition: race.trackCondition,
        raceClass: race.raceClass,
        prizeMoney: race.prizeMoney?.toString(),
        raceStatus: race.raceStatus,
        createdAt: race.createdAt,
        updatedAt: race.updatedAt,
      },
      entries: race.entries.map((entry) => ({
        id: entry.id,
        gateNumber: entry.gateNumber,
        horse: {
          id: entry.horse.id,
          registrationNumber: entry.horse.registrationNumber,
          nameKo: entry.horse.nameKo,
          nameEn: entry.horse.nameEn,
          birthDate: entry.horse.birthDate,
          gender: entry.horse.gender,
          rating: entry.horse.rating,
          totalRaces: entry.horse.totalRaces,
          totalWins: entry.horse.totalWins,
          totalPlaces: entry.horse.totalPlaces,
          totalShows: entry.horse.totalShows,
          totalEarnings: entry.horse.totalEarnings.toString(),
          recentRaces: entry.horse.entries.map((e) => ({
            date: e.race.raceDate,
            raceNumber: e.race.raceNumber,
            distance: e.race.distance,
            finishPosition: e.finishPosition,
            finishTime: e.finishTime?.toString(),
          })),
        },
        jockey: {
          id: entry.jockey.id,
          licenseNumber: entry.jockey.licenseNumber,
          nameKo: entry.jockey.nameKo,
          nameEn: entry.jockey.nameEn,
          totalRaces: entry.jockey.totalRaces,
          totalWins: entry.jockey.totalWins,
          winRate: parseFloat(entry.jockey.winRate.toString()),
          placeRate: parseFloat(entry.jockey.placeRate.toString()),
        },
        trainer: {
          id: entry.trainer.id,
          licenseNumber: entry.trainer.licenseNumber,
          nameKo: entry.trainer.nameKo,
          nameEn: entry.trainer.nameEn,
          stableName: entry.trainer.stableName,
          totalRaces: entry.trainer.totalRaces,
          totalWins: entry.trainer.totalWins,
          winRate: parseFloat(entry.trainer.winRate.toString()),
        },
        horseWeightKg: entry.horseWeightKg?.toString(),
        jockeyWeightKg: entry.jockeyWeightKg?.toString(),
        odds: entry.odds?.toString(),
        finishPosition: entry.finishPosition,
        finishTime: entry.finishTime?.toString(),
      })),
      predictions: race.predictions.map((p) => ({
        id: p.id,
        predictionType: p.predictionType,
        predictionData: p.predictionData,
        confidenceScore: parseFloat(p.confidenceScore.toString()),
        llmModelVersion: p.llmModelVersion,
        llmReasoning: p.llmReasoning,
        createdAt: p.createdAt,
      })),
    }

    // 캐시 저장 (10분)
    await cache.set(cacheKey, result, 600)

    return NextResponse.json(result)
  } catch (error) {
    console.error('경주 상세 조회 에러:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '경주 상세 조회 실패',
      },
      { status: 500 }
    )
  }
}
