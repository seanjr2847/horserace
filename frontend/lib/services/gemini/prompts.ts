/**
 * Gemini LLM 프롬프트 템플릿
 * 경마 예측을 위한 시스템 프롬프트 및 예측 타입별 프롬프트
 */

// ============================================
// 시스템 프롬프트 (경마 전문가 페르소나)
// ============================================

export const SYSTEM_PROMPT = `당신은 30년 경력의 경마 분석 전문가입니다.
경주 데이터를 분석하여 과학적이고 통계적으로 타당한 예측을 제공합니다.

**분석 기준:**
1. **말의 폼**: 최근 3-5경주 성적, 거리별 적합성, 주로 상태별 성적
2. **기수 실력**: 기수 승률, 해당 말과의 조합 성적, 최근 폼
3. **조교사 역량**: 조교사 승률, 해당 거리 전문성, 말 관리 능력
4. **경주 조건**: 거리, 주로 상태, 날씨, 경주장 특성
5. **게이트 위치**: 출발 게이트 번호의 유불리
6. **배당률 흐름**: 대중의 선택과 실제 능력의 괴리
7. **경쟁 강도**: 다른 출전마들의 수준 비교

**예측 원칙:**
- 과거 데이터에 기반한 객관적 분석
- 확률과 기댓값을 고려한 추천
- 근거를 명확히 제시
- 불확실성을 인정하고 리스크 설명

**응답 형식:**
반드시 유효한 JSON 형식으로 응답하세요. 추가 설명이나 마크다운 없이 순수 JSON만 출력하세요.`

// ============================================
// 예측 타입별 프롬프트 생성 함수
// ============================================

/**
 * 단승 예측 프롬프트
 * 1위를 예측
 */
export function getWinPredictionPrompt(raceContext: string): string {
  return `${SYSTEM_PROMPT}

**과제**: 다음 경주에서 1위로 들어올 가능성이 높은 말을 예측하세요.

**경주 정보:**
${raceContext}

**요구사항:**
1. 각 말의 1위 확률을 0~1 사이 값으로 평가
2. 상위 5마리를 추천 (확률 높은 순)
3. 각 말에 대한 분석 근거 제시
4. 전체 신뢰도 점수 (0~1)

**출력 형식 (JSON):**
{
  "predictions": [
    {
      "horse_id": "말 등록번호",
      "horse_name": "말 이름",
      "gate_number": 게이트번호,
      "win_probability": 0.35,
      "confidence": 0.8,
      "reasoning": "분석 근거 (200자 이내)",
      "key_factors": ["폼 상승세", "기수 조합 우수", "거리 적합"]
    }
  ],
  "overall_confidence": 0.75,
  "race_analysis": "경주 전체 분석 (300자 이내)",
  "risk_factors": ["변수1", "변수2"]
}`
}

/**
 * 복승 예측 프롬프트
 * 1-2위 안에 들 2마리 조합
 */
export function getPlacePredictionPrompt(raceContext: string): string {
  return `${SYSTEM_PROMPT}

**과제**: 다음 경주에서 1-2위 안에 들어올 2마리 조합을 예측하세요.

**경주 정보:**
${raceContext}

**요구사항:**
1. 1-2위 안에 들 확률이 높은 2마리 조합 추천
2. 상위 5개 조합 제시
3. 각 조합의 성공 확률과 기댓값 계산
4. 배당률 대비 가치 평가

**출력 형식 (JSON):**
{
  "predictions": [
    {
      "combination": [
        {
          "horse_id": "말1 등록번호",
          "horse_name": "말1 이름",
          "gate_number": 게이트번호
        },
        {
          "horse_id": "말2 등록번호",
          "horse_name": "말2 이름",
          "gate_number": 게이트번호
        }
      ],
      "success_probability": 0.42,
      "expected_return": 2.8,
      "confidence": 0.75,
      "reasoning": "조합 분석 (200자 이내)",
      "synergy": "두 말의 시너지 설명"
    }
  ],
  "overall_confidence": 0.7,
  "betting_strategy": "베팅 전략 제안"
}`
}

/**
 * 연승 예측 프롬프트
 * 정확한 1-2위 순서 예측
 */
export function getQuinellaPredictionPrompt(raceContext: string): string {
  return `${SYSTEM_PROMPT}

**과제**: 다음 경주에서 1위와 2위를 정확한 순서로 예측하세요.

**경주 정보:**
${raceContext}

**요구사항:**
1. 1위-2위 정확한 순서 조합 예측
2. 상위 5개 조합 제시
3. 순서가 중요하므로 마지막 직선주로 상황 고려
4. 배당률 대비 가치가 높은 조합 우선

**출력 형식 (JSON):**
{
  "predictions": [
    {
      "first_place": {
        "horse_id": "1위 말 등록번호",
        "horse_name": "1위 말 이름",
        "gate_number": 게이트번호,
        "winning_factors": ["요인1", "요인2"]
      },
      "second_place": {
        "horse_id": "2위 말 등록번호",
        "horse_name": "2위 말 이름",
        "gate_number": 게이트번호,
        "factors": ["요인1", "요인2"]
      },
      "probability": 0.18,
      "expected_return": 5.2,
      "confidence": 0.65,
      "reasoning": "순서 예측 근거 (200자 이내)"
    }
  ],
  "overall_confidence": 0.6,
  "race_scenario": "예상 경주 전개"
}`
}

/**
 * 복연승 예측 프롬프트
 * 1-2-3위 안에 들 3마리 조합 (순서 무관)
 */
export function getTrifectaPredictionPrompt(raceContext: string): string {
  return `${SYSTEM_PROMPT}

**과제**: 다음 경주에서 1-2-3위 안에 들어올 3마리를 예측하세요 (순서 무관).

**경주 정보:**
${raceContext}

**요구사항:**
1. 상위권(1-3위)에 들 확률이 높은 3마리 조합
2. 상위 5개 조합 제시
3. 안정성과 배당의 균형 고려
4. 다크호스 포함 여부 결정

**출력 형식 (JSON):**
{
  "predictions": [
    {
      "combination": [
        {
          "horse_id": "말1 등록번호",
          "horse_name": "말1 이름",
          "gate_number": 게이트번호,
          "expected_position": "1-2위권"
        },
        {
          "horse_id": "말2 등록번호",
          "horse_name": "말2 이름",
          "gate_number": 게이트번호,
          "expected_position": "2-3위권"
        },
        {
          "horse_id": "말3 등록번호",
          "horse_name": "말3 이름",
          "gate_number": 게이트번호,
          "expected_position": "다크호스"
        }
      ],
      "success_probability": 0.35,
      "expected_return": 4.5,
      "confidence": 0.7,
      "reasoning": "3마리 조합 분석 (250자 이내)",
      "risk_assessment": "리스크 평가"
    }
  ],
  "overall_confidence": 0.68,
  "recommended_stakes": "추천 베팅 비중"
}`
}

/**
 * 삼복승 예측 프롬프트
 * 정확한 1-2-3위 순서 예측
 */
export function getExactaPredictionPrompt(raceContext: string): string {
  return `${SYSTEM_PROMPT}

**과제**: 다음 경주에서 1위, 2위, 3위를 정확한 순서로 예측하세요.

**경주 정보:**
${raceContext}

**요구사항:**
1. 1-2-3위 정확한 순서 예측 (난이도 최고)
2. 상위 3개 조합만 제시 (확률이 매우 낮으므로)
3. 경주 전개 시나리오 상세 분석
4. 고배당 가능성과 리스크 명확히 제시

**출력 형식 (JSON):**
{
  "predictions": [
    {
      "first_place": {
        "horse_id": "1위 말 등록번호",
        "horse_name": "1위 말 이름",
        "gate_number": 게이트번호,
        "dominance_factors": ["압도적 요인들"]
      },
      "second_place": {
        "horse_id": "2위 말 등록번호",
        "horse_name": "2위 말 이름",
        "gate_number": 게이트번호,
        "positioning_factors": ["2위 예상 근거"]
      },
      "third_place": {
        "horse_id": "3위 말 등록번호",
        "horse_name": "3위 말 이름",
        "gate_number": 게이트번호,
        "factors": ["3위 예상 근거"]
      },
      "probability": 0.08,
      "expected_return": 12.5,
      "confidence": 0.5,
      "reasoning": "전체 순서 예측 근거 (300자 이내)",
      "race_narrative": "예상 경주 스토리"
    }
  ],
  "overall_confidence": 0.45,
  "high_risk_warning": "높은 리스크 경고 메시지",
  "alternative_strategy": "대안 베팅 전략"
}`
}

// ============================================
// 컨텍스트 요약 프롬프트 (토큰 절약)
// ============================================

export function getContextSummaryPrompt(fullContext: string): string {
  return `다음 경주 정보를 핵심만 요약하세요:

${fullContext}

요약 시 포함할 사항:
- 경주 기본 정보 (거리, 주로, 날씨)
- 각 말의 핵심 통계 (최근 성적, 승률)
- 기수/조교사 주요 지표
- 특이사항

JSON 형식으로 구조화된 요약 제공.`
}

// ============================================
// 예측 검증 프롬프트
// ============================================

export function getValidationPrompt(prediction: any, raceContext: string): string {
  return `${SYSTEM_PROMPT}

**과제**: 다음 예측을 검증하고 개선점을 제시하세요.

**예측 내용:**
${JSON.stringify(prediction, null, 2)}

**경주 정보:**
${raceContext}

**검증 사항:**
1. 예측의 논리적 일관성
2. 통계적 타당성
3. 누락된 중요 요인
4. 과신 또는 과소평가 여부

**출력 형식 (JSON):**
{
  "is_valid": true/false,
  "confidence_adjustment": -0.1 ~ +0.1,
  "issues_found": ["문제점1", "문제점2"],
  "improvements": ["개선사항1", "개선사항2"],
  "revised_reasoning": "수정된 분석"
}`
}

// ============================================
// 프롬프트 헬퍼 함수
// ============================================

export type PredictionType = 'win' | 'place' | 'quinella' | 'trifecta' | 'exacta'

export function getPredictionPrompt(type: PredictionType, raceContext: string): string {
  switch (type) {
    case 'win':
      return getWinPredictionPrompt(raceContext)
    case 'place':
      return getPlacePredictionPrompt(raceContext)
    case 'quinella':
      return getQuinellaPredictionPrompt(raceContext)
    case 'trifecta':
      return getTrifectaPredictionPrompt(raceContext)
    case 'exacta':
      return getExactaPredictionPrompt(raceContext)
    default:
      throw new Error(`알 수 없는 예측 타입: ${type}`)
  }
}

/**
 * 예측 타입별 설명
 */
export const PREDICTION_TYPE_INFO: Record<
  PredictionType,
  { name: string; description: string; difficulty: string }
> = {
  win: {
    name: '단승',
    description: '1위 예측',
    difficulty: '하',
  },
  place: {
    name: '복승',
    description: '1-2위 안에 들 2마리 (순서 무관)',
    difficulty: '하',
  },
  quinella: {
    name: '연승',
    description: '1위-2위 순서 예측',
    difficulty: '중',
  },
  trifecta: {
    name: '복연승 (삼복승)',
    description: '1-2-3위 안에 들 3마리 (순서 무관)',
    difficulty: '중상',
  },
  exacta: {
    name: '삼복승 (삼쌍승)',
    description: '1-2-3위 정확한 순서 예측',
    difficulty: '상',
  },
}
