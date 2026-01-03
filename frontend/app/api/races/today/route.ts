/**
 * 오늘 경주 API
 * GET /api/races/today
 *
 * 오늘 경주 데이터가 없으면 자동으로 KRA API에서 가져옴
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncRacesByDate } from '@/lib/services/kra/sync'

// 동기화 중복 방지를 위한 락
let isSyncing = false
let lastSyncDate: string | null = null

// 한국 시간 기준 오늘 날짜 구하기 (자정)
function getKoreanToday(): Date {
  // 현재 UTC 시간에서 한국 시간(+9) 기준 날짜 계산
  const now = new Date()
  const koreaOffset = 9 * 60 // 분 단위
  const koreaTime = new Date(now.getTime() + koreaOffset * 60 * 1000)

  // 한국 날짜의 자정을 UTC로 표현
  const year = koreaTime.getUTCFullYear()
  const month = koreaTime.getUTCMonth()
  const day = koreaTime.getUTCDate()

  // 로컬 타임존의 자정으로 생성 (Prisma가 저장하는 방식과 일치)
  return new Date(year, month, day)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackId = searchParams.get('trackId')
    const forceSync = searchParams.get('sync') === 'true'

    // 한국 시간 기준 오늘 날짜
    const today = getKoreanToday()
    const todayStr = today.toISOString().split('T')[0]
    console.log('오늘 날짜 조회:', todayStr, '(Date:', today.toISOString(), ')')

    // 필터 조건
    const where: any = {
      raceDate: today,
    }

    if (trackId) {
      where.trackId = parseInt(trackId)
    }

    // 오늘 경주 조회
    let races = await prisma.race.findMany({
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

    // 오늘 경주가 없고, 아직 오늘 동기화를 안 했으면 KRA API에서 가져오기
    const shouldSync = (races.length === 0 && lastSyncDate !== todayStr) || forceSync

    if (shouldSync && !isSyncing) {
      isSyncing = true
      console.log('KRA API 동기화 시작...')

      try {
        const syncResult = await syncRacesByDate(today)
        console.log('KRA 동기화 결과:', syncResult.message)
        lastSyncDate = todayStr

        if (syncResult.success && syncResult.syncedRaces > 0) {
          // 동기화 후 다시 조회
          races = await prisma.race.findMany({
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
        }
      } catch (syncError) {
        console.error('KRA 동기화 실패:', syncError)
      } finally {
        isSyncing = false
      }
    } else if (isSyncing) {
      console.log('동기화 진행 중 - 대기...')
    }

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
      message: races.length === 0 ? '오늘 예정된 경주가 없습니다' : undefined,
    }

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
