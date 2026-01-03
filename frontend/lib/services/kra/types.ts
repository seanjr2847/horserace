/**
 * KRA API 타입 정의
 * 한국마사회 공공데이터포털 API 응답 타입
 */

// ============================================
// 공통 API 응답 타입
// ============================================

export interface KRAApiResponse<T> {
  response: {
    header: {
      resultCode: string
      resultMsg: string
    }
    body: {
      items?: {
        item: T[]
      }
      totalCount?: number
      pageNo?: number
      numOfRows?: number
    }
  }
}

// ============================================
// 경주장 관련 타입
// ============================================

export interface KRARaceTrackInfo {
  meet: string // 경주장 코드 (1: 서울, 2: 부산경남, 3: 제주)
  meetName: string // 경주장 명
}

// ============================================
// 경주 정보 타입
// ============================================

export interface KRARaceInfo {
  rcDate: string // 경주일자 (YYYYMMDD)
  rcNo: number // 경주번호
  meet: string // 경주장 코드
  rcDist: number // 경주거리 (미터)
  rcTime: string // 경주시각 (HHMM)
  trackStat: string // 주로상태 (양호, 불량, 포화 등)
  weather: string // 날씨 (맑음, 흐림, 비 등)
  humidity: string // 습도
  rcName: string // 경주명
  divSn: string // 등급
  chulNo: number // 출전두수
  prize1: number // 1착 상금
  prize2: number // 2착 상금
  prize3: number // 3착 상금
  prize4: number // 4착 상금
  prize5: number // 5착 상금
}

// ============================================
// 출전마 정보 타입
// ============================================

export interface KRAHorseEntry {
  rcDate: string // 경주일자
  rcNo: number // 경주번호
  meet: string // 경주장
  hrNo: string // 마번
  hrName: string // 마명
  hrNameEn?: string // 마명(영문)
  sex: string // 성별 (거세마, 암말, 숫말)
  age: number // 연령
  rating: number // 레이팅
  wgHr: number // 마체중 (kg)
  wgBudam: number // 부담중량 (kg)
  jkName: string // 기수명
  jkNo: string // 기수번호
  trName: string // 조교사명
  trNo: string // 조교사번호
  hrRegNo: string // 마등록번호
  blinker: string // 블링커 착용 여부
  ord: number // 착순 (경주 후)
  ordNo?: number // 게이트 번호
  rcTime?: string // 주파시간 (경주 후)
  diffUnit?: string // 차이 (경주 후)
  odds?: number // 단승식 배당률
  plcOdds?: number // 복승식 배당률
}

// ============================================
// 말 상세 정보 타입
// ============================================

export interface KRAHorseDetail {
  hrNo: string // 마등록번호
  hrName: string // 마명
  hrNameEn?: string // 마명(영문)
  birthDate: string // 생년월일
  sex: string // 성별
  rating: number // 레이팅
  faName?: string // 부(父) 이름
  moName?: string // 모(母) 이름
  owName?: string // 마주명
  prodName?: string // 생산목장
  importName?: string // 수입국
  totRcCnt: number // 총 출주횟수
  totWinCnt: number // 총 1착 횟수
  totPlcCnt: number // 총 2착 횟수
  totShowCnt: number // 총 3착 횟수
  totPrize: number // 총 상금
}

// ============================================
// 기수 정보 타입
// ============================================

export interface KRAJockeyInfo {
  jkNo: string // 기수번호
  jkName: string // 기수명
  jkNameEn?: string // 기수명(영문)
  debDate?: string // 데뷔일자
  totRcCnt: number // 총 출주횟수
  totWinCnt: number // 총 우승횟수
  win1Rate: number // 승률
  plc2Rate: number // 연대율
}

// ============================================
// 조교사 정보 타입
// ============================================

export interface KRATrainerInfo {
  trNo: string // 조교사번호
  trName: string // 조교사명
  trNameEn?: string // 조교사명(영문)
  stable?: string // 마방
  debDate?: string // 데뷔일자
  totRcCnt: number // 총 출주횟수
  totWinCnt: number // 총 우승횟수
  winRate: number // 승률
}

// ============================================
// 경주 결과 타입
// ============================================

export interface KRARaceResult {
  rcDate: string // 경주일자
  rcNo: number // 경주번호
  meet: string // 경주장
  ord: number // 착순
  hrNo: string // 마번
  hrName: string // 마명
  jkName: string // 기수명
  rcTime: string // 주파시간
  diffUnit: string // 차이
  wgBudam: number // 부담중량
  wgHr: number // 마체중
  rating: number // 레이팅
  jkNo: string // 기수번호
}

// ============================================
// 배당률 정보 타입
// ============================================

export interface KRAOddsInfo {
  rcDate: string // 경주일자
  rcNo: number // 경주번호
  meet: string // 경주장
  hrNo: string // 마번
  winOdds: number // 단승식 배당률
  placeOdds: number // 복승식 배당률
  updateTime: string // 갱신시각
}

// ============================================
// 복식 배당 타입
// ============================================

export interface KRAQuinellaOdds {
  rcDate: string
  rcNo: number
  meet: string
  hrNo1: string // 첫 번째 말
  hrNo2: string // 두 번째 말
  odds: number // 배당률
}

export interface KRAExactaOdds {
  rcDate: string
  rcNo: number
  meet: string
  hrNo1: string // 1착 말
  hrNo2: string // 2착 말
  odds: number // 배당률
}

export interface KRATrifectaOdds {
  rcDate: string
  rcNo: number
  meet: string
  hrNo1: string // 1착 말
  hrNo2: string // 2착 말
  hrNo3: string // 3착 말
  odds: number // 배당률
}

// ============================================
// API 요청 파라미터 타입
// ============================================

export interface KRAApiParams {
  serviceKey: string // API 인증키
  pageNo?: number // 페이지 번호
  numOfRows?: number // 한 페이지 결과 수
  rcDate?: string // 경주일자 (YYYYMMDD)
  meet?: string // 경주장 코드
  rcNo?: number // 경주번호
  hrNo?: string // 마번 또는 마등록번호
  jkNo?: string // 기수번호
  trNo?: string // 조교사번호
  startDate?: string // 시작일자
  endDate?: string // 종료일자
}

// ============================================
// 내부 변환 타입 (KRA → Prisma)
// ============================================

export interface ParsedRaceData {
  raceDate: Date
  raceNumber: number
  trackId: number
  distance: number
  surfaceType: string
  weather?: string
  trackCondition?: string
  raceClass?: string
  prizeMoney?: number
  raceStatus: string
}

export interface ParsedHorseData {
  registrationNumber: string
  nameKo: string
  nameEn?: string
  birthDate: Date
  gender: string
  rating?: number
  totalRaces: number
  totalWins: number
  totalPlaces: number
  totalShows: number
  totalEarnings: number
}

export interface ParsedJockeyData {
  licenseNumber: string
  nameKo: string
  nameEn?: string
  debutDate?: Date
  totalRaces: number
  totalWins: number
  winRate: number
  placeRate: number
}

export interface ParsedTrainerData {
  licenseNumber: string
  nameKo: string
  nameEn?: string
  stableName?: string
  totalRaces: number
  totalWins: number
  winRate: number
}

export interface ParsedEntryData {
  raceId: number
  horseId: number
  jockeyId: number
  trainerId: number
  gateNumber: number
  horseWeightKg?: number
  jockeyWeightKg?: number
  odds?: number
  finishPosition?: number
  finishTime?: number
}

// ============================================
// 에러 타입
// ============================================

export class KRAApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public resultCode?: string
  ) {
    super(message)
    this.name = 'KRAApiError'
  }
}

// ============================================
// 헬퍼 타입
// ============================================

export type RaceTrackCode = '1' | '2' | '3' // 1: 서울, 2: 부산경남, 3: 제주
export type RaceSurfaceType = '모래' | '잔디'
export type HorseGender = 'stallion' | 'mare' | 'gelding' // 숫말, 암말, 거세마
export type RaceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
