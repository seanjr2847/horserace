/**
 * 예측 생성 API 엔드포인트
 * POST /api/predictions/generate
 * GET /api/predictions/generate?raceId=123
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPredictionEngine, PredictionOptions } from '@/lib/services/gemini/predictor'
import { PredictionType } from '@/lib/services/gemini/prompts'
import { validateRaceContext } from '@/lib/services/context/race-context'

// ============================================
// POST: 새로운 예측 생성
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { raceId, predictionTypes, options } = body as {
      raceId: number
      predictionTypes?: PredictionType[]
      options?: PredictionOptions
    }

    // 유효성 검사
    if (!raceId || typeof raceId !== 'number') {
      return NextResponse.json(
        { success: false, message: 'raceId가 필요합니다' },
        { status: 400 }
      )
    }

    // 경주 컨텍스트 검증
    const validation = await validateRaceContext(raceId)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: '경주 데이터가 유효하지 않습니다',
          errors: validation.errors,
        },
        { status: 400 }
      )
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️ 경주 데이터 경고:', validation.warnings)
    }

    const engine = getPredictionEngine()

    // 단일 또는 다중 예측
    if (!predictionTypes || predictionTypes.length === 0) {
      // 기본: 단승 예측만
      const result = await engine.generatePrediction(raceId, 'win', options)

      return NextResponse.json({
        success: true,
        prediction: result,
      })
    } else if (predictionTypes.length === 1) {
      // 단일 타입
      const result = await engine.generatePrediction(raceId, predictionTypes[0], options)

      return NextResponse.json({
        success: true,
        prediction: result,
      })
    } else {
      // 다중 타입
      const results = await engine.generateMultiplePredictions(raceId, predictionTypes, options)

      return NextResponse.json({
        success: true,
        predictions: results,
        summary: {
          total: predictionTypes.length,
          generated: results.length,
          failed: predictionTypes.length - results.length,
        },
      })
    }
  } catch (error: any) {
    console.error('예측 생성 API 에러:', error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || '예측 생성 중 오류가 발생했습니다',
        code: error.code || 'UNKNOWN_ERROR',
      },
      { status: 500 }
    )
  }
}

// ============================================
// GET: 저장된 예측 조회
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const raceId = searchParams.get('raceId')
    const type = searchParams.get('type') as PredictionType | null

    if (!raceId) {
      return NextResponse.json(
        {
          success: false,
          message: 'raceId 파라미터가 필요합니다',
        },
        { status: 400 }
      )
    }

    const engine = getPredictionEngine()
    const raceIdNum = parseInt(raceId, 10)

    if (type) {
      // 특정 타입 예측 조회
      const prediction = await engine.getPrediction(raceIdNum, type)

      if (!prediction) {
        return NextResponse.json(
          {
            success: false,
            message: `${type} 예측을 찾을 수 없습니다`,
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        prediction,
      })
    } else {
      // 모든 예측 조회
      const predictions = await engine.getAllPredictions(raceIdNum)

      return NextResponse.json({
        success: true,
        predictions,
        count: predictions.length,
      })
    }
  } catch (error: any) {
    console.error('예측 조회 API 에러:', error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || '예측 조회 중 오류가 발생했습니다',
      },
      { status: 500 }
    )
  }
}
