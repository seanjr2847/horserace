/**
 * KRA API 클라이언트
 * 한국마사회 공공데이터포털 API 연동 (실제 엔드포인트)
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
  KRAApiError,
} from './types'

// ============================================
// 설정 상수
// ============================================

const KRA_API_BASE_URL = 'https://apis.data.go.kr/B551015'
const DEFAULT_TIMEOUT = 15000 // 15초
const MAX_RETRIES = 3
const RETRY_DELAY = 1000
const RATE_LIMIT_DELAY = 100

// ============================================
// 실제 API 엔드포인트 (공공데이터포털 확인됨)
// ============================================

const ENDPOINTS = {
  // 1. RC경마경주정보 (15063950)
  SEOUL_RACE: '/API186_1/SeoulRace_1',

  // 2. 출전표정보 (15058677)
  ENTRY_SHEET: '/API26_2/entrySheet_2',

  // 3. AI학습용_경주결과 (15143803)
  RACE_RESULT: '/API155/raceResult',

  // 4. 확정배당율 통합 정보 (15058559)
  INTEGRATED_ODDS: '/API160_1/integratedInfo_1',

  // 5. 조교사정보 (15130588)
  TRAINER_INFO: '/API308/trainerInfo',

  // 6. 말정보 및 개체식별 (15105155)
  HORSE_INFO: '/horseinfohi/gethorseinfohi',
}

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

    this.client = axios.create({
      baseURL: KRA_API_BASE_URL,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          throw new KRAApiError(
            `KRA API 에러: ${error.response.statusText}`,
            error.response.status
          )
        } else if (error.request) {
          throw new KRAApiError('KRA API 서버로부터 응답이 없습니다.')
        } else {
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
  // 재시도 로직
  // ============================================

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = MAX_RETRIES
  ): Promise<T> {
    try {
      return await requestFn()
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        const delay = RETRY_DELAY * (MAX_RETRIES - retries + 1)
        console.warn(`API 요청 실패, ${delay}ms 후 재시도... (남은 횟수: ${retries})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return this.retryRequest(requestFn, retries - 1)
      }
      throw error
    }
  }

  private isRetryableError(error: any): boolean {
    if (error instanceof KRAApiError) {
      if (error.statusCode && error.statusCode >= 500) {
        return true
      }
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
    params: Record<string, any> = {}
  ): Promise<KRAApiResponse<T>> {
    await this.waitForRateLimit()

    const requestFn = async () => {
      const response = await this.client.get<KRAApiResponse<T>>(endpoint, {
        params: {
          ServiceKey: this.apiKey,
          pageNo: 1,
          numOfRows: 100,
          _type: 'json',
          ...params,
        },
      })

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
  // 1. 경주 정보 API (RC경마경주정보)
  // ============================================

  /**
   * 특정 날짜의 경주 목록 조회
   * API: RC경마경주정보 (15063950)
   */
  async getRacesByDate(rcDate: string, meet?: string): Promise<KRARaceInfo[]> {
    const response = await this.request<KRARaceInfo>(ENDPOINTS.SEOUL_RACE, {
      rc_date_fr: rcDate,
      rc_date_to: rcDate,
      meet,
      numOfRows: 1000,
    })

    return response.response.body.items?.item || []
  }

  /**
   * 특정 경주 상세 정보 조회
   */
  async getRaceDetail(rcDate: string, rcNo: number, meet?: string): Promise<KRARaceInfo | null> {
    const response = await this.request<KRARaceInfo>(ENDPOINTS.SEOUL_RACE, {
      rc_date_fr: rcDate,
      rc_date_to: rcDate,
      meet,
    })

    const items = response.response.body.items?.item || []
    return items.find((item) => item.rcNo === rcNo) || null
  }

  /**
   * 날짜 범위로 경주 목록 조회
   */
  async getRacesByDateRange(
    startDate: string,
    endDate: string,
    meet?: string
  ): Promise<KRARaceInfo[]> {
    const response = await this.request<KRARaceInfo>(ENDPOINTS.SEOUL_RACE, {
      rc_date_fr: startDate,
      rc_date_to: endDate,
      meet,
      numOfRows: 10000,
    })

    return response.response.body.items?.item || []
  }

  // ============================================
  // 2. 출전마 정보 API (출전표정보)
  // ============================================

  /**
   * 특정 경주의 출전마 목록 조회
   * API: 출전표정보 (15058677)
   * 참고: rc_no는 응답 필드이므로 요청 파라미터로 사용 불가, 응답에서 필터링
   */
  async getHorseEntries(rcDate: string, rcNo: number, meet: string): Promise<KRAHorseEntry[]> {
    const response = await this.request<KRAHorseEntry>(ENDPOINTS.ENTRY_SHEET, {
      rc_date: rcDate,
      meet,
      numOfRows: 1000,
    })

    const items = response.response.body.items?.item || []
    // rcNo로 필터링 (rc_no는 요청 파라미터가 아닌 응답 필드)
    return items.filter((item) => item.rcNo === rcNo)
  }

  /**
   * 특정 날짜의 전체 출전마 조회
   */
  async getEntriesByDate(rcDate: string, meet?: string): Promise<KRAHorseEntry[]> {
    const response = await this.request<KRAHorseEntry>(ENDPOINTS.ENTRY_SHEET, {
      rc_date: rcDate,
      meet,
      numOfRows: 1000,
    })

    return response.response.body.items?.item || []
  }

  /**
   * 월별 출전마 조회
   */
  async getEntriesByMonth(rcMonth: string, meet?: string): Promise<KRAHorseEntry[]> {
    const response = await this.request<KRAHorseEntry>(ENDPOINTS.ENTRY_SHEET, {
      rc_month: rcMonth,
      meet,
      numOfRows: 10000,
    })

    return response.response.body.items?.item || []
  }

  // ============================================
  // 3. 경주 결과 API (AI학습용_경주결과)
  // ============================================

  /**
   * 경주 결과 조회
   * API: AI학습용_경주결과 (15143803)
   */
  async getRaceResults(rcDate: string, rcNo: number, meet: string): Promise<KRARaceResult[]> {
    const rccrsCode = this.convertMeetToRccrsCode(meet)
    const response = await this.request<KRARaceResult>(ENDPOINTS.RACE_RESULT, {
      race_dt: rcDate,
      rccrs_cd: rccrsCode,
      numOfRows: 100,
    })

    const items = response.response.body.items?.item || []
    return items.filter((item) => item.rcNo === rcNo)
  }

  /**
   * 특정 날짜의 전체 경주 결과 조회
   */
  async getRaceResultsByDate(rcDate: string, meet?: string): Promise<KRARaceResult[]> {
    const rccrsCode = meet ? this.convertMeetToRccrsCode(meet) : undefined
    const response = await this.request<KRARaceResult>(ENDPOINTS.RACE_RESULT, {
      race_dt: rcDate,
      rccrs_cd: rccrsCode,
      numOfRows: 1000,
    })

    return response.response.body.items?.item || []
  }

  /**
   * 특정 말의 과거 경주 기록 조회
   */
  async getHorseHistory(
    hrNo: string,
    startDate: string,
    endDate: string,
    meet?: string
  ): Promise<KRARaceResult[]> {
    const rccrsCode = meet ? this.convertMeetToRccrsCode(meet) : undefined

    // 날짜 범위를 순회하며 데이터 수집 (API 제한으로 인해 한 번에 조회 불가)
    const results: KRARaceResult[] = []
    const currentDate = new Date(this.parseKRADate(startDate))
    const finalDate = new Date(this.parseKRADate(endDate))

    while (currentDate <= finalDate) {
      const dateStr = KRAApiClient.formatDate(currentDate)

      try {
        const dayResults = await this.getRaceResultsByDate(dateStr, meet)
        const horseResults = dayResults.filter((result) => result.hrNo === hrNo)
        results.push(...horseResults)
      } catch (error) {
        console.warn(`날짜 ${dateStr} 데이터 조회 실패:`, error)
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return results
  }

  // ============================================
  // 4. 배당률 API (확정배당율 통합 정보)
  // ============================================

  /**
   * 단승/복승 배당률 조회
   * API: 확정배당율 통합 정보 (15058559)
   */
  async getOdds(
    rcDate: string,
    rcNo: number,
    meet: string,
    pool: 'WIN' | 'PLC' = 'WIN'
  ): Promise<KRAOddsInfo[]> {
    const response = await this.request<any>(ENDPOINTS.INTEGRATED_ODDS, {
      rc_date: rcDate,
      rc_no: rcNo,
      meet,
      pool,
      numOfRows: 100,
    })

    return response.response.body.items?.item || []
  }

  /**
   * 복연승 배당률 조회
   */
  async getQuinellaOdds(rcDate: string, rcNo: number, meet: string): Promise<any[]> {
    const response = await this.request<any>(ENDPOINTS.INTEGRATED_ODDS, {
      rc_date: rcDate,
      rc_no: rcNo,
      meet,
      pool: 'QNL',
      numOfRows: 1000,
    })

    return response.response.body.items?.item || []
  }

  /**
   * 쌍승식 배당률 조회
   */
  async getExactaOdds(rcDate: string, rcNo: number, meet: string): Promise<any[]> {
    const response = await this.request<any>(ENDPOINTS.INTEGRATED_ODDS, {
      rc_date: rcDate,
      rc_no: rcNo,
      meet,
      pool: 'EXA',
      numOfRows: 1000,
    })

    return response.response.body.items?.item || []
  }

  /**
   * 삼복승 배당률 조회
   */
  async getTrifectaOdds(rcDate: string, rcNo: number, meet: string): Promise<any[]> {
    const response = await this.request<any>(ENDPOINTS.INTEGRATED_ODDS, {
      rc_date: rcDate,
      rc_no: rcNo,
      meet,
      pool: 'TRI',
      numOfRows: 1000,
    })

    return response.response.body.items?.item || []
  }

  /**
   * 특정 날짜의 전체 배당률 조회
   */
  async getAllOddsByDate(rcDate: string, meet?: string): Promise<any[]> {
    const response = await this.request<any>(ENDPOINTS.INTEGRATED_ODDS, {
      rc_date: rcDate,
      meet,
      numOfRows: 10000,
    })

    return response.response.body.items?.item || []
  }

  // ============================================
  // 5. 조교사 정보 API
  // ============================================

  /**
   * 조교사 정보 조회
   * API: 조교사정보_영문추가 (15130588)
   */
  async getTrainerInfo(trNo: string, meet?: string): Promise<KRATrainerInfo | null> {
    const response = await this.request<KRATrainerInfo>(ENDPOINTS.TRAINER_INFO, {
      tr_no: trNo,
      meet,
    })

    const items = response.response.body.items?.item || []
    return items.length > 0 ? items[0] : null
  }

  /**
   * 전체 조교사 목록 조회
   */
  async getAllTrainers(meet?: string): Promise<KRATrainerInfo[]> {
    const response = await this.request<KRATrainerInfo>(ENDPOINTS.TRAINER_INFO, {
      meet,
      numOfRows: 1000,
    })

    return response.response.body.items?.item || []
  }

  /**
   * 조교사명으로 검색
   */
  async searchTrainerByName(trName: string, meet?: string): Promise<KRATrainerInfo[]> {
    const response = await this.request<KRATrainerInfo>(ENDPOINTS.TRAINER_INFO, {
      tr_name: trName,
      meet,
      numOfRows: 100,
    })

    return response.response.body.items?.item || []
  }

  // ============================================
  // 6. 말 정보 API
  // ============================================

  /**
   * 말 상세 정보 조회
   * API: 말정보 및 개체식별 (15105155)
   */
  async getHorseDetail(hrNo: string): Promise<KRAHorseDetail | null> {
    const response = await this.request<KRAHorseDetail>(ENDPOINTS.HORSE_INFO, {
      hrno: hrNo,
    })

    const items = response.response.body.items?.item || []
    return items.length > 0 ? items[0] : null
  }

  /**
   * 말 이름으로 검색
   */
  async searchHorseByName(hrName: string): Promise<KRAHorseDetail[]> {
    const response = await this.request<KRAHorseDetail>(ENDPOINTS.HORSE_INFO, {
      hrname: hrName,
      numOfRows: 100,
    })

    return response.response.body.items?.item || []
  }

  /**
   * 등록일자 범위로 말 목록 조회
   */
  async getHorsesByRegistrationDate(
    startDate: string,
    endDate: string
  ): Promise<KRAHorseDetail[]> {
    const response = await this.request<KRAHorseDetail>(ENDPOINTS.HORSE_INFO, {
      reg_dt_fr: startDate,
      reg_dt_to: endDate,
      numOfRows: 1000,
    })

    return response.response.body.items?.item || []
  }

  // ============================================
  // 유틸리티 메서드
  // ============================================

  /**
   * meet 코드를 rccrs_cd로 변환 (AI API용)
   */
  private convertMeetToRccrsCode(meet: string): string {
    const mapping: Record<string, string> = {
      '1': '1', // 서울 → 1
      '2': '3', // 부산경남 → 3
      '3': '2', // 제주 → 2
    }
    return mapping[meet] || meet
  }

  /**
   * KRA API 날짜 파싱 (YYYYMMDD → Date)
   */
  private parseKRADate(dateStr: string): Date {
    const year = parseInt(dateStr.substring(0, 4))
    const month = parseInt(dateStr.substring(4, 6)) - 1
    const day = parseInt(dateStr.substring(6, 8))
    return new Date(year, month, day)
  }

  /**
   * KRA API 날짜 파싱 (YYYYMMDD → Date) - static 버전
   */
  static parseDate(dateStr: string): Date {
    const year = parseInt(dateStr.substring(0, 4))
    const month = parseInt(dateStr.substring(4, 6)) - 1
    const day = parseInt(dateStr.substring(6, 8))
    return new Date(year, month, day)
  }

  /**
   * 날짜를 KRA API 형식으로 변환 (Date → YYYYMMDD)
   */
  static formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
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
// 싱글톤 인스턴스
// ============================================

let kraClientInstance: KRAApiClient | null = null

export function getKRAClient(): KRAApiClient {
  if (!kraClientInstance) {
    kraClientInstance = new KRAApiClient()
  }
  return kraClientInstance
}

export default getKRAClient
