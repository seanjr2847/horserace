/**
 * 오늘 경주 API
 * GET /api/races/today
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRedisCache } from '@/lib/services/cache/redis'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackId = searchParams.get('trackId')

    // 오늘 날짜 (한국 시간 기준)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 캐시 키
    const cacheKey = `races:today:${trackId || 'all'}`
    const cache = getRedisCache()

    // 캐시 확인 (5분)
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // 필터 조건
    const where: any = {
      raceDate: today,
    }

    if (trackId) {
      where.trackId = parseInt(trackId)
    }

    // 오늘 경주 조회
    const races = await prisma.race.findMany({
      where,
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
        predictions: {
          select: {
            id: true,
            predictionType: true,
            confidenceScore: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: [
        { raceNumber: 'asc' },
      ],
    })

    // 응답 데이터 구성
    const result = {
      success: true,
      date: today,
      raceCount: races.length,
      tracks: Array.from(new Set(races.map((r) => r.track.name))),
      races: races.map((race) => ({
        id: race.id,
        raceNumber: race.raceNumber,
        track: {
          id: race.track.id,
          name: race.track.name,
          code: race.track.code,
        },
        distance: race.distance,
        surfaceType: race.surfaceType,
        weather: race.weather,
        trackCondition: race.trackCondition,
        raceClass: race.raceClass,
        prizeMoney: race.prizeMoney?.toString(),
        raceStatus: race.raceStatus,
        entries: race.entries.map((entry) => ({
          id: entry.id,
          gateNumber: entry.gateNumber,
          horse: {
            id: entry.horse.id,
            registrationNumber: entry.horse.registrationNumber,
            nameKo: entry.horse.nameKo,
            rating: entry.horse.rating,
          },
          jockey: {
            id: entry.jockey.id,
            nameKo: entry.jockey.nameKo,
            winRate: parseFloat(entry.jockey.winRate.toString()),
          },
          trainer: {
            id: entry.trainer.id,
            nameKo: entry.trainer.nameKo,
          },
          horseWeightKg: entry.horseWeightKg?.toString(),
          odds: entry.odds?.toString(),
          finishPosition: entry.finishPosition,
        })),
        predictions: race.predictions.map((p) => ({
          id: p.id,
          type: p.predictionType,
          confidence: parseFloat(p.confidenceScore.toString()),
          createdAt: p.createdAt,
        })),
      })),
    }

    // 캐시 저장 (5분)
    await cache.set(cacheKey, result, 300)

    return NextResponse.json(result)
  } catch (error) {
    console.error('오늘 경주 조회 에러:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '오늘 경주 조회 실패',
      },
      { status: 500 }
    )
  }
}
