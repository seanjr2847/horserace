/**
 * Gemini LLM 예측 엔진
 * 경주 데이터 → LLM 예측 → 결과 저장
 */

import { getGeminiClient, GeminiApiError } from './client'
import { getPredictionPrompt, PredictionType, PREDICTION_TYPE_INFO } from './prompts'
import { buildRaceContext, buildCompactRaceContext, getContextStats } from '../context/race-context'
import { prisma } from '@/lib/prisma'

// ============================================
// 예측 결과 타입
// ============================================

export interface PredictionResult {
  id: number
  raceId: number
  predictionType: string
  predictionData: any
  confidenceScore: number
  llmModelVersion: string
  llmReasoning?: string
  createdAt: Date
  metadata?: {
    tokenCount?: number
    processingTime?: number
    contextQuality?: number
  }
}

// ============================================
// 예측 생성 옵션
// ============================================

export interface PredictionOptions {
  useCompactContext?: boolean // 요약된 컨텍스트 사용
  saveToDatabase?: boolean // DB에 자동 저장
  temperature?: number // LLM temperature
  maxRetries?: number // 실패 시 재시도 횟수
}

// ============================================
// 예측 엔진 클래스
// ============================================

export class RacePredictionEngine {
  private geminiClient

  constructor() {
    this.geminiClient = getGeminiClient()
  }

  // ============================================
  // 단일 타입 예측 생성
  // ============================================

  async generatePrediction(
    raceId: number,
    type: PredictionType,
    options: PredictionOptions = {}
  ): Promise<PredictionResult> {
    const {
      useCompactContext = false,
      saveToDatabase = true,
      temperature = 0.7,
      maxRetries = 2,
    } = options

    const startTime = Date.now()

    try {
      console.log(`🎯 ${PREDICTION_TYPE_INFO[type].name} 예측 생성 시작 (경주 ID: ${raceId})`)

      // 1. 컨텍스트 구축
      const context = useCompactContext
        ? await buildCompactRaceContext(raceId)
        : await buildRaceContext(raceId)

      const stats = await getContextStats(raceId)
      console.log(
        `   📊 컨텍스트: ${stats.token_estimate} 토큰 (예상), 완전성 ${(stats.data_completeness * 100).toFixed(1)}%`
      )

      // 2. 프롬프트 생성
      const prompt = getPredictionPrompt(type, context)

      // 3. LLM 호출 (재시도 로직 포함)
      let predictionData: any
      let attempt = 0
      let lastError: Error | null = null

      while (attempt <= maxRetries) {
        try {
          predictionData = await this.geminiClient.generateJSON(prompt, {
            temperature,
            maxOutputTokens: 8192,
          })
          break // 성공
        } catch (error) {
          lastError = error as Error
          attempt++
          if (attempt <= maxRetries) {
            console.warn(`   ⚠️ 재시도 ${attempt}/${maxRetries}...`)
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
          }
        }
      }

      if (!predictionData) {
        throw new GeminiApiError(
          `예측 생성 실패 (${maxRetries}회 재시도): ${lastError?.message}`,
          'PREDICTION_FAILED'
        )
      }

      // 4. 신뢰도 점수 추출
      const confidenceScore = this.extractConfidence(predictionData)

      // 5. 추론 과정 추출
      const reasoning = this.extractReasoning(predictionData)

      const processingTime = Date.now() - startTime
      console.log(
        `   ✅ 예측 완료 (${processingTime}ms, 신뢰도: ${(confidenceScore * 100).toFixed(1)}%)`
      )

      // 6. 데이터베이스 저장
      let result: PredictionResult

      if (saveToDatabase) {
        const saved = await prisma.prediction.create({
          data: {
            raceId,
            predictionType: type,
            predictionData: predictionData as any,
            confidenceScore: confidenceScore.toString(),
            llmModelVersion: this.geminiClient.getModelInfo().name,
            llmReasoning: reasoning,
          },
        })

        result = {
          id: saved.id,
          raceId: saved.raceId,
          predictionType: saved.predictionType,
          predictionData: saved.predictionData,
          confidenceScore: parseFloat(saved.confidenceScore.toString()),
          llmModelVersion: saved.llmModelVersion,
          llmReasoning: saved.llmReasoning || undefined,
          createdAt: saved.createdAt,
          metadata: {
            tokenCount: stats.token_estimate,
            processingTime,
            contextQuality: stats.data_completeness,
          },
        }
      } else {
        result = {
          id: 0,
          raceId,
          predictionType: type,
          predictionData,
          confidenceScore,
          llmModelVersion: this.geminiClient.getModelInfo().name,
          llmReasoning: reasoning,
          createdAt: new Date(),
          metadata: {
            tokenCount: stats.token_estimate,
            processingTime,
            contextQuality: stats.data_completeness,
          },
        }
      }

      return result
    } catch (error) {
      console.error(`❌ 예측 생성 실패:`, error)
      throw error
    }
  }

  // ============================================
  // 다중 타입 예측 생성 (배치)
  // ============================================

  async generateMultiplePredictions(
    raceId: number,
    types: PredictionType[],
    options: PredictionOptions = {}
  ): Promise<PredictionResult[]> {
    console.log(`🎯 ${types.length}개 타입 예측 생성 시작 (경주 ID: ${raceId})`)

    const results: PredictionResult[] = []

    // 순차 실행 (동시 실행 시 API Rate Limit 우려)
    for (const type of types) {
      try {
        const result = await this.generatePrediction(raceId, type, options)
        results.push(result)

        // API Rate Limit 방지를 위한 딜레이
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`${type} 예측 실패:`, error)
        // 계속 진행 (부분 실패 허용)
      }
    }

    console.log(`✅ ${results.length}/${types.length}개 예측 생성 완료`)
    return results
  }

  // ============================================
  // 예측 조회
  // ============================================

  async getPrediction(raceId: number, type: PredictionType): Promise<PredictionResult | null> {
    const prediction = await prisma.prediction.findFirst({
      where: {
        raceId,
        predictionType: type,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!prediction) return null

    return {
      id: prediction.id,
      raceId: prediction.raceId,
      predictionType: prediction.predictionType,
      predictionData: prediction.predictionData,
      confidenceScore: parseFloat(prediction.confidenceScore.toString()),
      llmModelVersion: prediction.llmModelVersion,
      llmReasoning: prediction.llmReasoning || undefined,
      createdAt: prediction.createdAt,
    }
  }

  async getAllPredictions(raceId: number): Promise<PredictionResult[]> {
    const predictions = await prisma.prediction.findMany({
      where: { raceId },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return predictions.map((p) => ({
      id: p.id,
      raceId: p.raceId,
      predictionType: p.predictionType,
      predictionData: p.predictionData,
      confidenceScore: parseFloat(p.confidenceScore.toString()),
      llmModelVersion: p.llmModelVersion,
      llmReasoning: p.llmReasoning || undefined,
      createdAt: p.createdAt,
    }))
  }

  // ============================================
  // 헬퍼 메서드
  // ============================================

  private extractConfidence(predictionData: any): number {
    // 예측 데이터에서 신뢰도 점수 추출
    if (predictionData.overall_confidence !== undefined) {
      return Math.max(0, Math.min(1, predictionData.overall_confidence))
    }

    if (predictionData.confidence !== undefined) {
      return Math.max(0, Math.min(1, predictionData.confidence))
    }

    // 개별 예측들의 평균 신뢰도
    if (predictionData.predictions && Array.isArray(predictionData.predictions)) {
      const confidences = predictionData.predictions
        .map((p: any) => p.confidence)
        .filter((c: any) => typeof c === 'number')

      if (confidences.length > 0) {
        return confidences.reduce((a: number, b: number) => a + b) / confidences.length
      }
    }

    // 기본값
    return 0.5
  }

  private extractReasoning(predictionData: any): string | undefined {
    if (predictionData.race_analysis) {
      return predictionData.race_analysis
    }

    if (predictionData.reasoning) {
      return predictionData.reasoning
    }

    if (predictionData.predictions && predictionData.predictions[0]?.reasoning) {
      return predictionData.predictions[0].reasoning
    }

    return undefined
  }

  // ============================================
  // 예측 검증
  // ============================================

  async validatePrediction(predictionId: number): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const result = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
    }

    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
    })

    if (!prediction) {
      result.valid = false
      result.errors.push('예측을 찾을 수 없습니다')
      return result
    }

    // JSON 구조 검증
    try {
      const data = prediction.predictionData as any

      if (!data.predictions || !Array.isArray(data.predictions)) {
        result.valid = false
        result.errors.push('predictions 배열이 없습니다')
      }

      if (data.predictions && data.predictions.length === 0) {
        result.warnings.push('예측 결과가 비어있습니다')
      }

      const confidence = parseFloat(prediction.confidenceScore.toString())
      if (confidence < 0.3) {
        result.warnings.push(`매우 낮은 신뢰도: ${(confidence * 100).toFixed(1)}%`)
      }
    } catch (error) {
      result.valid = false
      result.errors.push('예측 데이터 파싱 실패')
    }

    return result
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

let predictionEngineInstance: RacePredictionEngine | null = null

export function getPredictionEngine(): RacePredictionEngine {
  if (!predictionEngineInstance) {
    predictionEngineInstance = new RacePredictionEngine()
  }
  return predictionEngineInstance
}

export default getPredictionEngine
