/**
 * Gemini API 클라이언트
 * Google Generative AI SDK를 사용한 LLM 예측
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai'

// ============================================
// 설정 상수
// ============================================

const GEMINI_MODEL = 'gemini-3-flash-preview' // 빠르고 저렴한 모델
const DEFAULT_TEMPERATURE = 0.7 // 창의성과 일관성 균형
const DEFAULT_MAX_TOKENS = 30000 // 응답 최대 토큰
const DEFAULT_TIMEOUT = 30000 // 30초

// ============================================
// Gemini API 에러 클래스
// ============================================

export class GeminiApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'GeminiApiError'
  }
}

// ============================================
// Gemini 응답 타입
// ============================================

export interface GeminiResponse {
  text: string
  finishReason: string
  safetyRatings?: any[]
  tokenCount?: {
    promptTokens: number
    responseTokens: number
    totalTokens: number
  }
}

// ============================================
// Generation 설정 타입
// ============================================

export interface GeminiGenerationOptions {
  temperature?: number
  maxOutputTokens?: number
  topP?: number
  topK?: number
}

// ============================================
// Gemini API 클라이언트 클래스
// ============================================

export class GeminiClient {
  private genAI: GoogleGenerativeAI
  private model: GenerativeModel
  private apiKey: string

  constructor(apiKey?: string, modelName: string = GEMINI_MODEL) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || ''

    if (!this.apiKey) {
      throw new GeminiApiError(
        'Gemini API 키가 설정되지 않았습니다. 환경 변수 GEMINI_API_KEY를 설정하세요.'
      )
    }

    // GoogleGenerativeAI 인스턴스 생성
    this.genAI = new GoogleGenerativeAI(this.apiKey)

    // 모델 생성
    this.model = this.genAI.getGenerativeModel({
      model: modelName,
    })

    console.log(`✅ Gemini 클라이언트 초기화 완료 (모델: ${modelName})`)
  }

  // ============================================
  // 텍스트 생성 (기본)
  // ============================================

  async generateText(
    prompt: string,
    options: GeminiGenerationOptions = {}
  ): Promise<GeminiResponse> {
    try {
      const generationConfig: GenerationConfig = {
        temperature: options.temperature ?? DEFAULT_TEMPERATURE,
        maxOutputTokens: options.maxOutputTokens ?? DEFAULT_MAX_TOKENS,
        topP: options.topP,
        topK: options.topK,
      }

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      })

      const response = result.response
      const text = response.text()

      if (!text) {
        throw new GeminiApiError('Gemini API가 빈 응답을 반환했습니다.')
      }

      return {
        text,
        finishReason: response.candidates?.[0]?.finishReason || 'STOP',
        safetyRatings: response.candidates?.[0]?.safetyRatings,
        tokenCount: {
          promptTokens: (result.response as any).usageMetadata?.promptTokenCount || 0,
          responseTokens: (result.response as any).usageMetadata?.candidatesTokenCount || 0,
          totalTokens: (result.response as any).usageMetadata?.totalTokenCount || 0,
        },
      }
    } catch (error: any) {
      console.error('Gemini API 에러:', error)

      if (error.message?.includes('API key')) {
        throw new GeminiApiError('유효하지 않은 API 키입니다.', 'INVALID_API_KEY')
      }

      if (error.message?.includes('quota')) {
        throw new GeminiApiError('API 할당량이 초과되었습니다.', 'QUOTA_EXCEEDED', error)
      }

      if (error.message?.includes('safety')) {
        throw new GeminiApiError(
          'Gemini 안전 필터에 의해 차단되었습니다.',
          'SAFETY_BLOCK',
          error
        )
      }

      throw new GeminiApiError(
        `Gemini API 호출 실패: ${error.message}`,
        'API_ERROR',
        error
      )
    }
  }

  // ============================================
  // JSON 형식 응답 생성
  // ============================================

  async generateJSON<T = any>(
    prompt: string,
    options: GeminiGenerationOptions = {}
  ): Promise<T> {
    try {
      // JSON 출력 강제
      const jsonPrompt = `${prompt}\n\n응답은 반드시 유효한 JSON 형식이어야 합니다. 다른 텍스트 없이 JSON만 출력하세요.`

      const response = await this.generateText(jsonPrompt, {
        ...options,
        temperature: 0.3, // JSON 생성은 낮은 temperature
      })

      // JSON 추출 (마크다운 코드 블록 제거)
      let jsonText = response.text.trim()

      console.log('📝 Raw LLM response length:', jsonText.length)
      console.log('📝 Raw LLM response (first 500):', jsonText.substring(0, 500))
      console.log('📝 Raw LLM response (last 200):', jsonText.substring(jsonText.length - 200))

      // ```json ... ``` 형식 제거 (닫는 ``` 없어도 처리)
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```\s*$/, '')
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```\s*$/, '')
      }

      // JSON 객체/배열 추출 (시작 { 또는 [ 부터 마지막 } 또는 ] 까지)
      const jsonMatch = jsonText.match(/[\[{][\s\S]*[\]}]/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
      }

      // LLM이 자주 하는 JSON 실수 정리
      jsonText = this.cleanJsonText(jsonText)

      console.log('📝 Cleaned JSON (first 500):', jsonText.substring(0, 500))

      // JSON 파싱 시도
      try {
        const parsed = JSON.parse(jsonText)
        return parsed as T
      } catch (parseError) {
        // 파싱 실패 시 추가 복구 시도
        console.warn('⚠️ 1차 파싱 실패, 복구 시도 중...')
        const repairedJson = this.repairJson(jsonText)
        const parsed = JSON.parse(repairedJson)
        return parsed as T
      }
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        throw new GeminiApiError(
          `JSON 파싱 실패: ${error.message}`,
          'JSON_PARSE_ERROR',
          error
        )
      }
      throw error
    }
  }

  // ============================================
  // 스트리밍 생성 (실시간 응답)
  // ============================================

  async *generateTextStream(
    prompt: string,
    options: GeminiGenerationOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    try {
      const generationConfig: GenerationConfig = {
        temperature: options.temperature ?? DEFAULT_TEMPERATURE,
        maxOutputTokens: options.maxOutputTokens ?? DEFAULT_MAX_TOKENS,
        topP: options.topP,
        topK: options.topK,
      }

      const result = await this.model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      })

      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        if (chunkText) {
          yield chunkText
        }
      }
    } catch (error: any) {
      console.error('Gemini 스트리밍 에러:', error)
      throw new GeminiApiError(
        `스트리밍 생성 실패: ${error.message}`,
        'STREAM_ERROR',
        error
      )
    }
  }

  // ============================================
  // 대화 세션 생성
  // ============================================

  createChatSession(systemInstruction?: string) {
    const chat = this.model.startChat({
      history: systemInstruction
        ? [
            {
              role: 'user',
              parts: [{ text: `시스템 지시사항: ${systemInstruction}` }],
            },
            {
              role: 'model',
              parts: [{ text: '이해했습니다. 지시사항을 따르겠습니다.' }],
            },
          ]
        : [],
    })

    return {
      sendMessage: async (message: string): Promise<string> => {
        const result = await chat.sendMessage(message)
        return result.response.text()
      },
      sendMessageStream: async function* (message: string): AsyncGenerator<string> {
        const result = await chat.sendMessageStream(message)
        for await (const chunk of result.stream) {
          yield chunk.text()
        }
      },
    }
  }

  // ============================================
  // 토큰 수 계산 (추정)
  // ============================================

  async countTokens(text: string): Promise<number> {
    try {
      const result = await this.model.countTokens(text)
      return result.totalTokens
    } catch (error: any) {
      console.warn('토큰 계산 실패, 추정값 반환:', error.message)
      // 대략적인 추정 (1 토큰 ≈ 4 문자)
      return Math.ceil(text.length / 4)
    }
  }

  // ============================================
  // 연결 테스트
  // ============================================

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.generateText('Hello, are you working?', {
        maxOutputTokens: 50,
      })
      return response.text.length > 0
    } catch (error) {
      console.error('Gemini 연결 테스트 실패:', error)
      return false
    }
  }

  // ============================================
  // 모델 정보
  // ============================================

  getModelInfo(): {
    name: string
    apiKey: string
    description: string
  } {
    return {
      name: GEMINI_MODEL,
      apiKey: this.apiKey.substring(0, 10) + '...',
      description: 'Google Gemini 2.0 Flash - Fast and cost-effective',
    }
  }

  // ============================================
  // JSON 정리 헬퍼
  // ============================================

  private cleanJsonText(text: string): string {
    // 먼저 문자열 값 내의 줄바꿈을 안전하게 이스케이프
    // 문자열 내부의 줄바꿈만 찾아서 \\n으로 변환
    let cleaned = text

    // 문자열 리터럴 내부 처리를 위한 파싱
    // 문자열 값에서 줄바꿈을 이스케이프 시퀀스로 변환
    const stringValueRegex = /:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g
    cleaned = cleaned.replace(stringValueRegex, (match) => {
      return match
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
    })

    return cleaned
      // 싱글쿼트 → 더블쿼트 (속성명)
      .replace(/(\s*)'([^']+)'(\s*:)/g, '$1"$2"$3')
      // 싱글쿼트 → 더블쿼트 (값)
      .replace(/:\s*'([^']*)'/g, ': "$1"')
      // trailing comma 제거
      .replace(/,(\s*[}\]])/g, '$1')
      // 주석 제거
      .replace(/\/\/[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // 제어 문자 제거 (줄바꿈, 탭 제외 - 구조용)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  }

  private repairJson(text: string): string {
    let repaired = text

    // 불완전한 배열 닫기
    const openBrackets = (repaired.match(/\[/g) || []).length
    const closeBrackets = (repaired.match(/\]/g) || []).length
    if (openBrackets > closeBrackets) {
      // 마지막 유효 요소 찾기
      repaired = repaired.replace(/,\s*$/, '') // trailing comma 제거
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        repaired += ']'
      }
    }

    // 불완전한 객체 닫기
    const openBraces = (repaired.match(/\{/g) || []).length
    const closeBraces = (repaired.match(/\}/g) || []).length
    if (openBraces > closeBraces) {
      repaired = repaired.replace(/,\s*$/, '')
      for (let i = 0; i < openBraces - closeBraces; i++) {
        repaired += '}'
      }
    }

    // 미완성 문자열 닫기 (홀수 개의 따옴표)
    const quoteCount = (repaired.match(/"/g) || []).length
    if (quoteCount % 2 !== 0) {
      // 마지막 따옴표 찾아서 문자열 닫기
      const lastQuoteIndex = repaired.lastIndexOf('"')
      const afterLastQuote = repaired.substring(lastQuoteIndex + 1)

      // 닫히지 않은 문자열이면 닫기
      if (!afterLastQuote.includes('"')) {
        repaired = repaired + '"'
      }
    }

    // 중복 쉼표 제거
    repaired = repaired.replace(/,\s*,/g, ',')

    // 빈 값 처리
    repaired = repaired.replace(/:\s*,/g, ': null,')
    repaired = repaired.replace(/:\s*}/g, ': null}')
    repaired = repaired.replace(/:\s*]/g, ': null]')

    return repaired
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

let geminiClientInstance: GeminiClient | null = null

export function getGeminiClient(): GeminiClient {
  if (!geminiClientInstance) {
    geminiClientInstance = new GeminiClient()
  }
  return geminiClientInstance
}

export default getGeminiClient
