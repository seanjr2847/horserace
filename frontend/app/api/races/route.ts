/**
 * 경주 목록 API
 * GET /api/races
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // YYYY-MM-DD
    const trackId = searchParams.get('trackId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // 필터 조건 구성
    const where: any = {}

    if (date) {
      where.raceDate = new Date(date)
    }

    if (trackId) {
      where.trackId = parseInt(trackId)
    }

    if (status) {
      where.raceStatus = status
    }

    // 총 개수 조회
    const total = await prisma.race.count({ where })

    // 페이지네이션 적용
    const skip = (page - 1) * limit

    // 경주 목록 조회
    const races = await prisma.race.findMany({
      where,
      include: {
        track: true,
        entries: {
          select: {
            id: true,
          },
        },
        predictions: {
          select: {
            id: true,
            predictionType: true,
          },
        },
      },
      orderBy: [
        { raceDate: 'desc' },
        { raceNumber: 'asc' },
      ],
      skip,
      take: limit,
    })

    // 응답 데이터 구성
    const result = {
      success: true,
      races: races.map((race) => ({
        id: race.id,
        raceDate: race.raceDate,
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
        entryCount: race.entries.length,
        hasPredictions: race.predictions.length > 0,
        predictionTypes: race.predictions.map((p) => p.predictionType),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('경주 목록 조회 에러:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '경주 목록 조회 실패',
      },
      { status: 500 }
    )
  }
}
