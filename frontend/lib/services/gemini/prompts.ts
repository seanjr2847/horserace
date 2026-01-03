/**
 * Gemini LLM 프롬프트 템플릿
 * 경마 예측을 위한 시스템 프롬프트 및 예측 타입별 프롬프트
 *
 * 한국 경마 베팅 타입:
 * - 단승: 1위 예측
 * - 연승: 1~2위 안에 들 말 1마리
 * - 복승: 1~2위 2마리 (순서 무관)
 * - 쌍승: 1~2위 2마리 (순서 있음)
 * - 복연승: 1~3위 안에 들 2마리 (순서 무관)
 * - 삼복승: 1~3위 3마리 (순서 무관)
 * - 삼쌍승: 1~3위 3마리 (순서 있음)
 */

// ============================================
// 시스템 프롬프트 (경마 전문가 페르소나)
// ============================================

export const SYSTEM_PROMPT = `당신은 30년 경력의 한국 경마 데이터 분석 전문가입니다.
과거 데이터를 기반으로 **자체 확률을 먼저 계산**하고, 이를 배당률(시장 확률)과 비교하여 가치 베팅을 발굴합니다.

**🔴 핵심 분석 순서 (반드시 이 순서로!):**

**[1단계] 데이터 기반 자체 확률 계산 (AI 예상 확률)**
각 말의 승리/입상 확률을 다음 데이터로 계산:
- 최근 5경주 성적 (1착률, 연대율, 3착내율)
- 해당 거리 전적 (거리 적합성)
- 기수 승률 및 해당 말과의 조합 성적
- 조교사 승률 및 최근 폼
- 게이트 위치별 통계
- 마장 상태 적합성 (잔디/모래, 양호/불량)
- 휴식 기간 및 체중 변화

**[2단계] 시장 확률 계산 (배당률 기반)**
- 시장 확률 = 1 / 배당률
- 예: 배당 5.0배 → 시장 확률 = 20%
- 예: 배당 2.0배 → 시장 확률 = 50%

**[3단계] 확률 비교 → 가치 베팅 발굴**
- AI 확률 > 시장 확률 → 저평가 (가치 베팅 ✅)
- AI 확률 < 시장 확률 → 고평가 (피해야 함 ❌)
- 예: AI 30% vs 시장 20%(5배) → 저평가, 기댓값 +50%

**[4단계] 기댓값 계산**
- 기댓값 = (AI 확률 × 배당률) - 1
- 기댓값 > 0 → 장기적으로 수익
- 기댓값 < 0 → 장기적으로 손실

**응답 규칙:**
반드시 유효한 JSON 형식으로만 응답. 다른 텍스트 없이 순수 JSON만 출력.`

// ============================================
// 예측 타입 정의
// ============================================

export type PredictionType =
  | 'win'        // 단승: 1위
  | 'place'      // 연승: 1~2위 중 1마리
  | 'quinella'   // 복승: 1~2위 2마리 (무관)
  | 'exacta'     // 쌍승: 1~2위 2마리 (순서)
  | 'quinella_place' // 복연승: 1~3위 중 2마리 (무관)
  | 'trio'       // 삼복승: 1~3위 3마리 (무관)
  | 'trifecta'   // 삼쌍승: 1~3위 3마리 (순서)

/**
 * 예측 타입별 설명
 */
export const PREDICTION_TYPE_INFO: Record<
  PredictionType,
  { name: string; nameEn: string; description: string; difficulty: string; minHorses: number }
> = {
  win: {
    name: '단승',
    nameEn: 'Win',
    description: '1위 예측',
    difficulty: '하',
    minHorses: 1,
  },
  place: {
    name: '연승',
    nameEn: 'Place',
    description: '1~2위 안에 들 말 1마리',
    difficulty: '하',
    minHorses: 1,
  },
  quinella: {
    name: '복승',
    nameEn: 'Quinella',
    description: '1~2위 2마리 (순서 무관)',
    difficulty: '중',
    minHorses: 2,
  },
  exacta: {
    name: '쌍승',
    nameEn: 'Exacta',
    description: '1~2위 2마리 (정확한 순서)',
    difficulty: '중상',
    minHorses: 2,
  },
  quinella_place: {
    name: '복연승',
    nameEn: 'Quinella Place',
    description: '1~3위 안에 들 2마리 (순서 무관)',
    difficulty: '중',
    minHorses: 2,
  },
  trio: {
    name: '삼복승',
    nameEn: 'Trio',
    description: '1~3위 3마리 (순서 무관)',
    difficulty: '상',
    minHorses: 3,
  },
  trifecta: {
    name: '삼쌍승',
    nameEn: 'Trifecta',
    description: '1~3위 3마리 (정확한 순서)',
    difficulty: '최상',
    minHorses: 3,
  },
}

// ============================================
// 순위 예측 공통 프롬프트 (핵심)
// ============================================

const RANKING_ANALYSIS_PROMPT = `
**순위 예측 방법:**
1. 먼저 모든 출전마의 예상 순위를 1위부터 꼴찌까지 매겨라
2. 각 순위 예측의 근거를 명확히 제시
3. 배당률과 비교하여 기댓값이 높은 베팅 추천

**기댓값 계산:**
- 기댓값 = (예상 확률 × 배당률) - 1
- 기댓값 > 0 이면 가치 베팅
- 예: 30% 확률로 예상하는 말의 배당이 5배 → 기댓값 = 0.3 × 5 - 1 = 0.5 (좋음)
- 예: 30% 확률로 예상하는 말의 배당이 2배 → 기댓값 = 0.3 × 2 - 1 = -0.4 (나쁨)

**배당률 해석:**
- 낮은 배당 (1.5~3배): 인기마, 대중이 선호
- 중간 배당 (3~10배): 중위권 평가
- 높은 배당 (10배 이상): 비인기마, 이변 가능성

**가치 베팅 발굴:**
- 실력 대비 과소평가된 말 (배당 높음 + 실력 있음) = 가치 베팅
- 실력 대비 과대평가된 말 (배당 낮음 + 실력 의문) = 피해야 함
`

// ============================================
// 단승 (Win) - 1위 예측
// ============================================

export function getWinPredictionPrompt(raceContext: string): string {
  return `${SYSTEM_PROMPT}
${RANKING_ANALYSIS_PROMPT}

**과제**: 단승 베팅 추천 - 1위로 들어올 말 예측

**경주 정보:**
${raceContext}

**분석 요구사항:**
1. 모든 출전마의 예상 순위를 매겨라 (1위~꼴찌)
2. 1위 후보 상위 3마리의 승리 확률 계산
3. 배당률 대비 기댓값이 가장 높은 단승 베팅 추천
4. 본명 추천과 이변 시 대안 추천

**출력 형식 (JSON):**
{
  "predicted_ranking": [
    {"rank": 1, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "win_prob": 0.35, "odds": 3.2, "expected_value": 0.12},
    {"rank": 2, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "win_prob": 0.25, "odds": 4.5, "expected_value": 0.125},
    ...전체 출전마 순위
  ],
  "recommendations": {
    "primary": {
      "horse_id": "등록번호",
      "horse_name": "이름",
      "gate": 번호,
      "win_prob": 0.35,
      "odds": 3.2,
      "expected_value": 0.12,
      "reasoning": "추천 이유 (200자)",
      "confidence": 0.8
    },
    "value_bet": {
      "horse_id": "등록번호",
      "horse_name": "이름",
      "gate": 번호,
      "win_prob": 0.15,
      "odds": 12.0,
      "expected_value": 0.8,
      "reasoning": "기댓값이 높은 이변마 (200자)",
      "confidence": 0.5
    }
  },
  "betting_advice": "최종 베팅 조언 (어떤 말에 얼마나)",
  "overall_confidence": 0.75,
  "race_analysis": "경주 전체 분석 (300자)",
  "risk_factors": ["리스크1", "리스크2"]
}`
}

// ============================================
// 연승 (Place) - 1~2위 안에 들 말 1마리
// ============================================

export function getPlacePredictionPrompt(raceContext: string): string {
  return `${SYSTEM_PROMPT}
${RANKING_ANALYSIS_PROMPT}

**과제**: 연승 베팅 추천 - 1~2위 안에 들 말 1마리 예측

**경주 정보:**
${raceContext}

**분석 요구사항:**
1. 모든 출전마의 예상 순위 매기기
2. 1~2위권 진입 확률 계산 (연승 확률)
3. 연승 배당 대비 기댓값 계산
4. 안정적인 연승 베팅 추천

**연승 특징:**
- 1위 또는 2위면 적중
- 배당은 단승보다 낮지만 적중률 높음
- 안정적인 베팅에 적합

**출력 형식 (JSON):**
{
  "predicted_ranking": [
    {"rank": 1, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "place_prob": 0.65, "place_odds": 1.8, "expected_value": 0.17},
    {"rank": 2, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "place_prob": 0.55, "place_odds": 2.1, "expected_value": 0.155},
    ...
  ],
  "recommendations": {
    "safest": {
      "horse_id": "등록번호",
      "horse_name": "이름",
      "gate": 번호,
      "place_prob": 0.65,
      "place_odds": 1.8,
      "expected_value": 0.17,
      "reasoning": "가장 안정적인 연승 후보 (200자)",
      "confidence": 0.85
    },
    "value_bet": {
      "horse_id": "등록번호",
      "horse_name": "이름",
      "gate": 번호,
      "place_prob": 0.40,
      "place_odds": 3.5,
      "expected_value": 0.4,
      "reasoning": "기댓값 높은 연승 후보 (200자)",
      "confidence": 0.6
    }
  },
  "betting_advice": "연승 베팅 전략",
  "overall_confidence": 0.8,
  "race_analysis": "경주 분석"
}`
}

// ============================================
// 복승 (Quinella) - 1~2위 2마리 (순서 무관)
// ============================================

export function getQuinellaPredictionPrompt(raceContext: string): string {
  return `${SYSTEM_PROMPT}
${RANKING_ANALYSIS_PROMPT}

**과제**: 복승 베팅 추천 - 1~2위에 들어올 2마리 예측 (순서 무관)

**경주 정보:**
${raceContext}

**분석 요구사항:**
1. 모든 출전마의 예상 순위 매기기
2. 1~2위 진입 확률 높은 상위 4마리 선정
3. 가능한 2마리 조합의 성공 확률과 기댓값 계산
4. 최적의 복승 조합 추천

**출력 형식 (JSON):**
{
  "predicted_ranking": [
    {"rank": 1, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호},
    {"rank": 2, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호},
    ...
  ],
  "top_contenders": [
    {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "top2_prob": 0.6},
    {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "top2_prob": 0.5},
    {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "top2_prob": 0.35},
    {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "top2_prob": 0.25}
  ],
  "combinations": [
    {
      "horses": [
        {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호},
        {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호}
      ],
      "success_prob": 0.30,
      "quinella_odds": 8.5,
      "expected_value": 1.55,
      "reasoning": "조합 분석",
      "confidence": 0.7
    }
  ],
  "recommendations": {
    "primary": {
      "display": "3-5 복승",
      "horses": [{"gate": 3, "horse_name": "이름"}, {"gate": 5, "horse_name": "이름"}],
      "success_prob": 0.30,
      "odds": 8.5,
      "expected_value": 1.55,
      "reasoning": "본명 복승 추천 이유"
    },
    "value_bet": {
      "display": "3-7 복승",
      "horses": [{"gate": 3, "horse_name": "이름"}, {"gate": 7, "horse_name": "이름"}],
      "success_prob": 0.15,
      "odds": 25.0,
      "expected_value": 2.75,
      "reasoning": "고배당 가치 베팅"
    }
  },
  "betting_advice": "복승 베팅 전략",
  "overall_confidence": 0.7
}`
}

// ============================================
// 쌍승 (Exacta) - 1~2위 2마리 (순서 있음)
// ============================================

export function getExactaPredictionPrompt(raceContext: string): string {
  return `${SYSTEM_PROMPT}
${RANKING_ANALYSIS_PROMPT}

**과제**: 쌍승 베팅 추천 - 1위와 2위를 정확한 순서로 예측

**경주 정보:**
${raceContext}

**분석 요구사항:**
1. 1위 후보 상위 3마리 선정
2. 2위 후보 상위 4마리 선정
3. 1위-2위 순서 조합의 성공 확률과 기댓값 계산
4. 경주 전개 시나리오 기반 순서 예측

**쌍승 특징:**
- 순서가 정확해야 적중 (복승보다 어려움)
- 배당이 복승의 약 2배
- 경주 전개 예측이 중요

**출력 형식 (JSON):**
{
  "predicted_ranking": [
    {"rank": 1, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "win_prob": 0.35},
    {"rank": 2, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "win_prob": 0.25},
    ...
  ],
  "combinations": [
    {
      "first": {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호},
      "second": {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호},
      "success_prob": 0.12,
      "exacta_odds": 18.0,
      "expected_value": 1.16,
      "reasoning": "이 순서로 예상하는 이유",
      "race_scenario": "예상 경주 전개"
    }
  ],
  "recommendations": {
    "primary": {
      "display": "5→3 쌍승",
      "first": {"gate": 5, "horse_name": "1위 예상마"},
      "second": {"gate": 3, "horse_name": "2위 예상마"},
      "success_prob": 0.12,
      "odds": 18.0,
      "expected_value": 1.16,
      "reasoning": "본명 쌍승 추천"
    },
    "reverse": {
      "display": "3→5 쌍승",
      "first": {"gate": 3, "horse_name": "이름"},
      "second": {"gate": 5, "horse_name": "이름"},
      "success_prob": 0.10,
      "odds": 22.0,
      "expected_value": 1.2,
      "reasoning": "역전 시나리오"
    }
  },
  "betting_advice": "쌍승 베팅 전략 (마방 추천: 본명+역순)",
  "overall_confidence": 0.65
}`
}

// ============================================
// 복연승 (Quinella Place) - 1~3위 중 2마리 (순서 무관)
// ============================================

export function getQuinellaPlacePredictionPrompt(raceContext: string): string {
  return `${SYSTEM_PROMPT}
${RANKING_ANALYSIS_PROMPT}

**과제**: 복연승 베팅 추천 - 1~3위 안에 들 2마리 예측 (순서 무관)

**경주 정보:**
${raceContext}

**분석 요구사항:**
1. 모든 출전마의 예상 순위 매기기
2. 1~3위권 진입 확률 계산
3. 2마리 조합의 복연승 성공 확률과 기댓값 계산
4. 안정적인 조합과 고배당 조합 추천

**복연승 특징:**
- 2마리 모두 1~3위 안에 들면 적중
- 복승보다 쉬움 (3위까지 인정)
- 배당은 복승보다 낮음
- 안정적인 조합 베팅에 적합

**출력 형식 (JSON):**
{
  "predicted_ranking": [
    {"rank": 1, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "top3_prob": 0.85},
    {"rank": 2, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "top3_prob": 0.75},
    {"rank": 3, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "top3_prob": 0.60},
    ...
  ],
  "combinations": [
    {
      "horses": [
        {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호},
        {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호}
      ],
      "success_prob": 0.55,
      "qp_odds": 2.5,
      "expected_value": 0.375,
      "reasoning": "조합 분석"
    }
  ],
  "recommendations": {
    "safest": {
      "display": "1-3 복연승",
      "horses": [{"gate": 1, "horse_name": "이름"}, {"gate": 3, "horse_name": "이름"}],
      "success_prob": 0.55,
      "odds": 2.5,
      "expected_value": 0.375,
      "reasoning": "가장 안정적인 조합"
    },
    "value_bet": {
      "display": "1-6 복연승",
      "horses": [{"gate": 1, "horse_name": "이름"}, {"gate": 6, "horse_name": "이름"}],
      "success_prob": 0.30,
      "odds": 6.0,
      "expected_value": 0.8,
      "reasoning": "기댓값 높은 조합"
    }
  },
  "betting_advice": "복연승 베팅 전략",
  "overall_confidence": 0.75
}`
}

// ============================================
// 삼복승 (Trio) - 1~3위 3마리 (순서 무관)
// ============================================

export function getTrioPredictionPrompt(raceContext: string): string {
  return `${SYSTEM_PROMPT}
${RANKING_ANALYSIS_PROMPT}

**과제**: 삼복승 베팅 추천 - 1~3위에 들어올 3마리 예측 (순서 무관)

**경주 정보:**
${raceContext}

**분석 요구사항:**
1. 모든 출전마의 예상 순위 매기기
2. 1~3위권 진입 확률 높은 상위 5마리 선정
3. 3마리 조합의 성공 확률과 기댓값 계산
4. 안정 조합 + 다크호스 포함 조합 추천

**출력 형식 (JSON):**
{
  "predicted_ranking": [
    {"rank": 1, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호},
    {"rank": 2, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호},
    {"rank": 3, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호},
    ...
  ],
  "top_contenders": [
    {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "top3_prob": 0.80, "role": "본명"},
    {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "top3_prob": 0.65, "role": "본명"},
    {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "top3_prob": 0.55, "role": "준본명"},
    {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "top3_prob": 0.30, "role": "다크호스"},
    {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "top3_prob": 0.20, "role": "이변마"}
  ],
  "combinations": [
    {
      "horses": [
        {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호},
        {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호},
        {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호}
      ],
      "success_prob": 0.28,
      "trio_odds": 12.0,
      "expected_value": 2.36,
      "reasoning": "조합 분석"
    }
  ],
  "recommendations": {
    "primary": {
      "display": "1-3-5 삼복승",
      "horses": [{"gate": 1}, {"gate": 3}, {"gate": 5}],
      "success_prob": 0.28,
      "odds": 12.0,
      "expected_value": 2.36,
      "reasoning": "본명 조합"
    },
    "with_dark_horse": {
      "display": "1-3-7 삼복승",
      "horses": [{"gate": 1}, {"gate": 3}, {"gate": 7}],
      "success_prob": 0.12,
      "odds": 45.0,
      "expected_value": 4.4,
      "reasoning": "다크호스 포함 고배당"
    }
  },
  "betting_advice": "삼복승 베팅 전략",
  "overall_confidence": 0.65
}`
}

// ============================================
// 삼쌍승 (Trifecta) - 1~3위 3마리 (순서 있음)
// ============================================

export function getTrifectaPredictionPrompt(raceContext: string): string {
  return `${SYSTEM_PROMPT}
${RANKING_ANALYSIS_PROMPT}

**과제**: 삼쌍승 베팅 추천 - 1위, 2위, 3위를 정확한 순서로 예측

**경주 정보:**
${raceContext}

**분석 요구사항:**
1. 1위, 2위, 3위를 정확히 예측
2. 상위 3개 순서 조합의 성공 확률과 기댓값 계산
3. 경주 전개 시나리오 상세 분석
4. 고위험 고수익 베팅임을 감안한 조언

**삼쌍승 특징:**
- 1-2-3위 순서가 정확해야 적중
- 가장 어려운 베팅, 가장 높은 배당
- 마방(박스) 베팅으로 리스크 분산 가능

**출력 형식 (JSON):**
{
  "predicted_ranking": [
    {"rank": 1, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "win_prob": 0.35},
    {"rank": 2, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "second_prob": 0.30},
    {"rank": 3, "horse_id": "등록번호", "horse_name": "이름", "gate": 번호, "third_prob": 0.25},
    ...
  ],
  "combinations": [
    {
      "first": {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호},
      "second": {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호},
      "third": {"horse_id": "등록번호", "horse_name": "이름", "gate": 번호},
      "success_prob": 0.05,
      "trifecta_odds": 85.0,
      "expected_value": 3.25,
      "reasoning": "순서 예측 근거",
      "race_scenario": "예상 경주 전개 스토리"
    }
  ],
  "recommendations": {
    "primary": {
      "display": "5→3→1 삼쌍승",
      "first": {"gate": 5, "horse_name": "이름"},
      "second": {"gate": 3, "horse_name": "이름"},
      "third": {"gate": 1, "horse_name": "이름"},
      "success_prob": 0.05,
      "odds": 85.0,
      "expected_value": 3.25,
      "reasoning": "본명 삼쌍승"
    },
    "box_suggestion": {
      "display": "1,3,5 마방 (6점)",
      "horses": [{"gate": 1}, {"gate": 3}, {"gate": 5}],
      "total_combinations": 6,
      "any_hit_prob": 0.28,
      "reasoning": "마방으로 리스크 분산"
    }
  },
  "betting_advice": "삼쌍승 베팅 전략 (고위험)",
  "overall_confidence": 0.50,
  "high_risk_warning": "삼쌍승은 적중률이 매우 낮습니다. 소액 베팅 권장."
}`
}

// ============================================
// 프롬프트 라우터
// ============================================

export function getPredictionPrompt(type: PredictionType, raceContext: string): string {
  switch (type) {
    case 'win':
      return getWinPredictionPrompt(raceContext)
    case 'place':
      return getPlacePredictionPrompt(raceContext)
    case 'quinella':
      return getQuinellaPredictionPrompt(raceContext)
    case 'exacta':
      return getExactaPredictionPrompt(raceContext)
    case 'quinella_place':
      return getQuinellaPlacePredictionPrompt(raceContext)
    case 'trio':
      return getTrioPredictionPrompt(raceContext)
    case 'trifecta':
      return getTrifectaPredictionPrompt(raceContext)
    default:
      throw new Error(`알 수 없는 예측 타입: ${type}`)
  }
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
- 현재 배당률
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
1. 순위 예측의 논리적 일관성
2. 확률 계산의 타당성
3. 기댓값 계산 정확성
4. 누락된 중요 요인
5. 과신 또는 과소평가 여부

**출력 형식 (JSON):**
{
  "is_valid": true/false,
  "confidence_adjustment": -0.1 ~ +0.1,
  "issues_found": ["문제점1", "문제점2"],
  "improvements": ["개선사항1", "개선사항2"],
  "revised_ranking": [순위 수정이 필요하면 새 순위],
  "revised_reasoning": "수정된 분석"
}`
}
