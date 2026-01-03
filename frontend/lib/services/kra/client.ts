/**
 * KRA API 클라이언트
 * 한국마사회 공공데이터포털 API 연동
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import {
  KRAApiResponse,
  KRAApiParams,
  KRARaceInfo,
  KRAHorseEntry,
  KRAHorseDetail,
  KRAJockeyInfo,
  KRATrainerInfo,
  KRARaceResult,
  KRAOddsInfo,
  KRAQuinellaOdds,
  KRAApiError,
} from './types'

// ============================================
// 설정 상수
// ============================================

const KRA_API_BASE_URL = 'https://apis.data.go.kr/B551015' // KRA API 기본 URL (예시)
const DEFAULT_TIMEOUT = 15000 // 15초
const MAX_RETRIES = 3 // 최대 재시도 횟수
const RETRY_DELAY = 1000 // 재시도 기본 딜레이 (ms)
const RATE_LIMIT_DELAY = 100 // API 호출 간 최소 딜레이 (ms)

// ============================================
// KRA API 클라이언트 클래스
// ============================================

export class KRAApiClient {
  private client: AxiosInstance
  private apiKey: string
  private lastRequestTime: number = 0

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.KRA_API_KEY || ''

    if (!this.apiKey) {
      throw new KRAApiError(
        'KRA API 키가 설정되지 않았습니다. 환경 변수 KRA_API_KEY를 설정하세요.'
      )
    }

    // Axios 인스턴스 생성
    this.client = axios.create({
      baseURL: KRA_API_BASE_URL,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 응답 인터셉터: 에러 처리
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // 서버 응답 에러
          throw new KRAApiError(
            `KRA API 에러: ${error.response.statusText}`,
            error.response.status
          )
        } else if (error.request) {
          // 요청은 보냈지만 응답 없음
          throw new KRAApiError('KRA API 서버로부터 응답이 없습니다.')
        } else {
          // 요청 설정 중 에러
          throw new KRAApiError(`요청 설정 에러: ${error.message}`)
        }
      }
    )
  }

  // ============================================
  // Rate Limiting
  // ============================================

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      const delay = RATE_LIMIT_DELAY - timeSinceLastRequest
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    this.lastRequestTime = Date.now()
  }

  // ============================================
  // 재시도 로직 (Exponential Backoff)
  // ============================================

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = MAX_RETRIES
  ): Promise<T> {
    try {
      return await requestFn()
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        const delay = RETRY_DELAY * (MAX_RETRIES - retries + 1) // Exponential backoff
        console.warn(`API 요청 실패, ${delay}ms 후 재시도... (남은 횟수: ${retries})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return this.retryRequest(requestFn, retries - 1)
      }
      throw error
    }
  }

  private isRetryableError(error: any): boolean {
    // 재시도 가능한 에러인지 판단
    if (error instanceof KRAApiError) {
      // 5xx 서버 에러는 재시도
      if (error.statusCode && error.statusCode >= 500) {
        return true
      }
      // 타임아웃, 네트워크 에러도 재시도
      if (error.message.includes('timeout') || error.message.includes('응답이 없습니다')) {
        return true
      }
    }
    return false
  }

  // ============================================
  // 공통 API 호출 메서드
  // ============================================

  private async request<T>(
    endpoint: string,
    params: Partial<KRAApiParams> = {}
  ): Promise<KRAApiResponse<T>> {
    await this.waitForRateLimit()

    const requestFn = async () => {
      const response = await this.client.get<KRAApiResponse<T>>(endpoint, {
        params: {
          serviceKey: this.apiKey,
          numOfRows: 100, // 기본값
          ...params,
        },
      })

      // API 응답 검증
      const resultCode = response.data.response.header.resultCode
      if (resultCode !== '00') {
        throw new KRAApiError(
          `KRA API 에러: ${response.data.response.header.resultMsg}`,
          undefined,
          resultCode
        )
      }

      return response.data
    }

    return this.retryRequest(requestFn)
  }

  // ============================================
  // 경주 정보 API
  // ============================================

  /**
   * 특정 날짜의 경주 목록 조회
   */
  async getRacesByDate(rcDate: string, meet?: string): Promise<KRARaceInfo[]> {
    const response = await this.request<KRARaceInfo>('/api/raceInfo', {
      rcDate,
      meet,
      numOfRows: 1000,
    })

    return response.response.body.items?.item || []
  }

  /**
   * 특정 경주 상세 정보 조회
   */
  async getRaceDetail(rcDate: string, rcNo: number, meet: string): Promise<KRARaceInfo | null> {
    const response = await this.request<KRARaceInfo>('/api/raceInfo', {
      rcDate,
      rcNo,
      meet,
    })

    const items = response.response.body.items?.item || []
    return items.length > 0 ? items[0] : null
  }

  /**
   * 날짜 범위로 경주 목록 조회
   */
  async getRacesByDateRange(
    startDate: string,
    endDate: string,
    meet?: string
  ): Promise<KRARaceInfo[]> {
    const response = await this.request<KRARaceInfo>('/api/raceInfo', {
      startDate,
      endDate,
      meet,
      numOfRows: 10000,
    })

    return response.response.body.items?.item || []
  }

  // ============================================
  // 출전마 정보 API
  // ============================================

  /**
   * 특정 경주의 출전마 목록 조회
   */
  async getHorseEntries(rcDate: string, rcNo: number, meet: string): Promise<KRAHorseEntry[]> {
    const response = await this.request<KRAHorseEntry>('/api/entryInfo', {
      rcDate,
      rcNo,
      meet,
      numOfRows: 100,
    })

    return response.response.body.items?.item || []
  }

  /**
   * 말 상세 정보 조회
   */
  async getHorseDetail(hrNo: string): Promise<KRAHorseDetail | null> {
    const response = await this.request<KRAHorseDetail>('/api/horseInfo', {
      hrNo,
    })

    const items = response.response.body.items?.item || []
    return items.length > 0 ? items[0] : null
  }

  /**
   * 말 과거 경주 기록 조회
   */
  async getHorseHistory(
    hrNo: string,
    startDate?: string,
    endDate?: string
  ): Promise<KRARaceResult[]> {
    const response = await this.request<KRARaceResult>('/api/horseHistory', {
      hrNo,
      startDate,
      endDate,
      numOfRows: 1000,
    })

    return response.response.body.items?.item || []
  }

  // ============================================
  // 기수 정보 API
  // ============================================

  /**
   * 기수 정보 조회
   */
  async getJockeyInfo(jkNo: string): Promise<KRAJockeyInfo | null> {
    const response = await this.request<KRAJockeyInfo>('/api/jockeyInfo', {
      jkNo,
    })

    const items = response.response.body.items?.item || []
    return items.length > 0 ? items[0] : null
  }

  /**
   * 전체 기수 목록 조회
   */
  async getAllJockeys(): Promise<KRAJockeyInfo[]> {
    const response = await this.request<KRAJockeyInfo>('/api/jockeyInfo', {
      numOfRows: 1000,
    })

    return response.response.body.items?.item || []
  }

  // ============================================
  // 조교사 정보 API
  // ============================================

  /**
   * 조교사 정보 조회
   */
  async getTrainerInfo(trNo: string): Promise<KRATrainerInfo | null> {
    const response = await this.request<KRATrainerInfo>('/api/trainerInfo', {
      trNo,
    })

    const items = response.response.body.items?.item || []
    return items.length > 0 ? items[0] : null
  }

  /**
   * 전체 조교사 목록 조회
   */
  async getAllTrainers(): Promise<KRATrainerInfo[]> {
    const response = await this.request<KRATrainerInfo>('/api/trainerInfo', {
      numOfRows: 1000,
    })

    return response.response.body.items?.item || []
  }

  // ============================================
  // 경주 결과 API
  // ============================================

  /**
   * 경주 결과 조회
   */
  async getRaceResults(rcDate: string, rcNo: number, meet: string): Promise<KRARaceResult[]> {
    const response = await this.request<KRARaceResult>('/api/raceResult', {
      rcDate,
      rcNo,
      meet,
      numOfRows: 100,
    })

    return response.response.body.items?.item || []
  }

  // ============================================
  // 배당률 API
  // ============================================

  /**
   * 단승/복승 배당률 조회
   */
  async getOdds(rcDate: string, rcNo: number, meet: string): Promise<KRAOddsInfo[]> {
    const response = await this.request<KRAOddsInfo>('/api/oddsInfo', {
      rcDate,
      rcNo,
      meet,
      numOfRows: 100,
    })

    return response.response.body.items?.item || []
  }

  /**
   * 복연승 배당률 조회
   */
  async getQuinellaOdds(
    rcDate: string,
    rcNo: number,
    meet: string
  ): Promise<KRAQuinellaOdds[]> {
    const response = await this.request<KRAQuinellaOdds>('/api/quinellaOdds', {
      rcDate,
      rcNo,
      meet,
      numOfRows: 1000,
    })

    return response.response.body.items?.item || []
  }

  // ============================================
  // 유틸리티 메서드
  // ============================================

  /**
   * 날짜를 KRA API 형식으로 변환 (YYYYMMDD)
   */
  static formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }

  /**
   * KRA API 날짜를 Date 객체로 변환
   */
  static parseDate(dateStr: string): Date {
    const year = parseInt(dateStr.substring(0, 4))
    const month = parseInt(dateStr.substring(4, 6)) - 1
    const day = parseInt(dateStr.substring(6, 8))
    return new Date(year, month, day)
  }

  /**
   * 경주장 코드를 이름으로 변환
   */
  static getTrackName(code: string): string {
    const trackNames: Record<string, string> = {
      '1': '서울',
      '2': '부산경남',
      '3': '제주',
    }
    return trackNames[code] || '알 수 없음'
  }

  /**
   * API 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    try {
      const today = KRAApiClient.formatDate(new Date())
      await this.getRacesByDate(today)
      return true
    } catch (error) {
      console.error('KRA API 연결 테스트 실패:', error)
      return false
    }
  }
}

// ============================================
// 싱글톤 인스턴스 export
// ============================================

let kraClientInstance: KRAApiClient | null = null

export function getKRAClient(): KRAApiClient {
  if (!kraClientInstance) {
    kraClientInstance = new KRAApiClient()
  }
  return kraClientInstance
}

export default getKRAClient
