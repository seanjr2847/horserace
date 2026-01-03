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

    // GoogleGenerativeAI 인스턴스 생성 (v1beta API 사용)
    this.genAI = new GoogleGenerativeAI(this.apiKey, { apiVersion: 'v1beta' })

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
      jsonText = jsonText
        // 싱글쿼트 → 더블쿼트 (속성명과 문자열 값)
        .replace(/(\s*)'([^']+)'(\s*:)/g, '$1"$2"$3')  // 키: 'key': → "key":
        .replace(/:\s*'([^']*)'/g, ': "$1"')           // 값: : 'value' → : "value"
        // trailing comma 제거 (마지막 , 뒤에 } 또는 ])
        .replace(/,(\s*[}\]])/g, '$1')
        // 주석 제거
        .replace(/\/\/[^\n]*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // 줄바꿈 문자열 내 이스케이프
        .replace(/:\s*"([^"]*)\n([^"]*)"/g, ': "$1\\n$2"')

      console.log('📝 Cleaned JSON (first 300):', jsonText.substring(0, 300))

      // JSON 파싱
      const parsed = JSON.parse(jsonText)
      return parsed as T
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
