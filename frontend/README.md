# 경마 예측 시스템 - Frontend (Next.js)

Next.js 14 App Router 기반 프론트엔드 애플리케이션입니다.

## 기술 스택

- **Next.js 14**: React 프레임워크 (App Router)
- **TypeScript**: 타입 안전성
- **Zustand**: 경량 상태 관리
- **Axios**: HTTP 클라이언트
- **TailwindCSS**: 유틸리티 CSS 프레임워크
- **Recharts**: 데이터 시각화

## 프로젝트 구조

```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # 루트 레이아웃
│   ├── page.tsx             # 홈 페이지
│   ├── globals.css          # 글로벌 스타일
│   ├── races/               # 경주 일정 페이지
│   ├── predictions/         # AI 예측 페이지
│   └── analytics/           # 통계 분석 페이지
│
├── components/               # 재사용 가능한 컴포넌트
│   ├── RaceCard.tsx         # 경주 카드
│   ├── EntryTable.tsx       # 출전마 테이블
│   ├── PredictionCard.tsx   # 예측 결과 카드
│   ├── LoadingSpinner.tsx   # 로딩 스피너
│   ├── ErrorAlert.tsx       # 에러 알림
│   └── index.ts             # 컴포넌트 내보내기
│
├── lib/                      # 유틸리티 및 서비스
│   └── api/                 # API 서비스 레이어
│       ├── client.ts        # Axios 클라이언트
│       ├── races.ts         # 경주 API
│       ├── predictions.ts   # 예측 API
│       ├── analytics.ts     # 분석 API
│       └── index.ts         # API 내보내기
│
├── store/                    # Zustand 상태 관리
│   ├── useRaceStore.ts      # 경주 상태
│   ├── usePredictionStore.ts # 예측 상태
│   └── index.ts             # 스토어 내보내기
│
├── types/                    # TypeScript 타입 정의
│   ├── race.ts              # 경주 관련 타입
│   ├── prediction.ts        # 예측 관련 타입
│   ├── api.ts               # API 응답 타입
│   └── index.ts             # 타입 내보내기
│
└── public/                   # 정적 파일
```

## 설치 및 실행

### 개발 환경

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

### 환경 변수

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 주요 기능

### 1. 경주 일정 (`/races`)

- 오늘의 경주 목록 조회
- 날짜별 경주 검색
- 경주 상세 정보 및 출전마 정보

### 2. AI 예측 (`/predictions`)

- Gemini AI 기반 경주 예측
- 예측 타입: 단승, 연승, 복승, 복연승, 삼복승
- 신뢰도 점수 및 AI 분석 근거 제공

### 3. 통계 분석 (`/analytics`)

- 말, 기수, 조교사 통계
- 성적 트렌드 및 폼 분석
- 데이터 시각화

## API 통합

### API 클라이언트 사용

```typescript
import { racesApi, predictionsApi } from '@/lib/api'

// 오늘의 경주 조회
const races = await racesApi.getTodayRaces()

// 예측 생성
const prediction = await predictionsApi.generatePrediction(raceId, ['win', 'place'])
```

### Zustand 스토어 사용

```typescript
import { useRaceStore, usePredictionStore } from '@/store'

function RacePage() {
  const { races, loading, fetchTodayRaces } = useRaceStore()
  const { predictions, generatePrediction } = usePredictionStore()

  useEffect(() => {
    fetchTodayRaces()
  }, [])

  return (
    // ...
  )
}
```

## 컴포넌트 사용

### RaceCard

```typescript
import { RaceCard } from '@/components'

<RaceCard
  race={race}
  onClick={() => router.push(`/races/${race.id}`)}
/>
```

### EntryTable

```typescript
import { EntryTable } from '@/components'

<EntryTable entries={raceEntries} />
```

### PredictionCard

```typescript
import { PredictionCard } from '@/components'

<PredictionCard prediction={prediction} />
```

## 스타일링

TailwindCSS를 사용하여 커스텀 테마 적용:

```javascript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f0f9ff',
        // ... 기타 색상
        900: '#0c4a6e',
      },
    },
  },
}
```

## API 프록시

`next.config.js`에서 FastAPI 백엔드로 프록시 설정:

```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*',
    },
  ]
}
```

## 타입 안전성

모든 API 응답과 상태는 TypeScript로 타입이 정의되어 있습니다:

```typescript
import type { Race, Prediction, RaceEntry } from '@/types'
```

## 개발 가이드

### 새로운 페이지 추가

1. `app/` 디렉토리에 폴더 생성
2. `page.tsx` 파일 생성
3. 필요한 컴포넌트 및 스토어 연결

### 새로운 API 엔드포인트 추가

1. `lib/api/` 디렉토리에 서비스 파일 생성
2. `types/` 디렉토리에 타입 정의 추가
3. 필요시 Zustand 스토어 업데이트

### 새로운 컴포넌트 추가

1. `components/` 디렉토리에 컴포넌트 파일 생성
2. `components/index.ts`에 내보내기 추가

## 주의사항

- 모든 페이지는 서버 컴포넌트로 시작하며, 필요시 'use client' 지시어 사용
- API 호출은 항상 try-catch로 에러 처리
- 환경 변수는 NEXT_PUBLIC_ 접두사로 클라이언트에서 접근 가능
- 빌드 전 타입 체크: `npm run type-check`

## 라이선스

Private - 내부 사용 전용
