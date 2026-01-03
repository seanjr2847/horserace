/**
 * KRA 데이터 동기화 API 엔드포인트
 * POST /api/kra/sync
 */

import { NextRequest, NextResponse } from 'next/server'

// Vercel에서 동적 렌더링 강제
export const dynamic = 'force-dynamic'
import {
  syncRacesByDate,
  syncRacesByDateRange,
  syncRaceTracks,
  updateRaceResults,
  SyncResult,
} from '@/lib/services/kra/sync'
import { KRAApiClient } from '@/lib/services/kra/client'

// ============================================
// POST: 데이터 동기화 실행
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, date, startDate, endDate, rcDate, rcNo, meet } = body

    let result: SyncResult | undefined

    switch (action) {
      case 'sync_tracks':
        // 경주장 정보 초기화
        await syncRaceTracks()
        return NextResponse.json({
          success: true,
          message: '경주장 정보 동기화 완료',
        })

      case 'sync_date':
        // 특정 날짜 동기화
        if (!date) {
          return NextResponse.json(
            { success: false, message: 'date 파라미터가 필요합니다' },
            { status: 400 }
          )
        }
        result = await syncRacesByDate(new Date(date))
        return NextResponse.json(result)

      case 'sync_date_range':
        // 날짜 범위 동기화
        if (!startDate || !endDate) {
          return NextResponse.json(
            { success: false, message: 'startDate와 endDate 파라미터가 필요합니다' },
            { status: 400 }
          )
        }
        result = await syncRacesByDateRange(new Date(startDate), new Date(endDate))
        return NextResponse.json(result)

      case 'update_results':
        // 경주 결과 업데이트
        if (!rcDate || !rcNo || !meet) {
          return NextResponse.json(
            { success: false, message: 'rcDate, rcNo, meet 파라미터가 필요합니다' },
            { status: 400 }
          )
        }
        await updateRaceResults(rcDate, rcNo, meet)
        return NextResponse.json({
          success: true,
          message: '경주 결과 업데이트 완료',
        })

      case 'sync_today':
        // 오늘 경주 동기화
        result = await syncRacesByDate(new Date())
        return NextResponse.json(result)

      case 'sync_recent':
        // 최근 7일 동기화
        const today = new Date()
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        result = await syncRacesByDateRange(weekAgo, today)
        return NextResponse.json(result)

      default:
        return NextResponse.json(
          {
            success: false,
            message: `알 수 없는 action: ${action}`,
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('동기화 API 에러:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}

// ============================================
// GET: 동기화 상태 및 정보 조회
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'test_connection':
        // KRA API 연결 테스트
        const kraClient = new KRAApiClient()
        const isConnected = await kraClient.testConnection()
        return NextResponse.json({
          success: isConnected,
          message: isConnected ? 'KRA API 연결 성공' : 'KRA API 연결 실패',
        })

      case 'sync_info':
        // 동기화 가능한 action 목록 반환
        return NextResponse.json({
          success: true,
          actions: {
            sync_tracks: {
              method: 'POST',
              description: '경주장 정보 초기화',
              params: {},
            },
            sync_date: {
              method: 'POST',
              description: '특정 날짜 경주 동기화',
              params: { date: 'YYYY-MM-DD' },
            },
            sync_date_range: {
              method: 'POST',
              description: '날짜 범위 경주 동기화',
              params: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' },
            },
            sync_today: {
              method: 'POST',
              description: '오늘 경주 동기화',
              params: {},
            },
            sync_recent: {
              method: 'POST',
              description: '최근 7일 경주 동기화',
              params: {},
            },
            update_results: {
              method: 'POST',
              description: '경주 결과 업데이트',
              params: { rcDate: 'YYYYMMDD', rcNo: 'number', meet: 'string' },
            },
          },
        })

      default:
        return NextResponse.json({
          success: true,
          message: 'KRA 동기화 API',
          usage: {
            sync: 'POST /api/kra/sync with { action, ...params }',
            info: 'GET /api/kra/sync?action=sync_info',
            test: 'GET /api/kra/sync?action=test_connection',
          },
        })
    }
  } catch (error) {
    console.error('동기화 API 에러:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
