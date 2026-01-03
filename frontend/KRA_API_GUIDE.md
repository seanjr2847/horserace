# KRA API 연동 가이드

한국마사회(KRA) 공공데이터 API 연동 및 사용 방법

## 📋 목차

1. [KRA API 키 발급](#kra-api-키-발급)
2. [API 연결 테스트](#api-연결-테스트)
3. [데이터 동기화](#데이터-동기화)
4. [API 사용 예시](#api-사용-예시)
5. [문제 해결](#문제-해결)

## 🔑 KRA API 키 발급

### 1단계: 공공데이터포털 회원가입

1. [공공데이터포털](https://www.data.go.kr) 접속
2. 우측 상단 "회원가입" 클릭
3. 회원 정보 입력 및 가입 완료

### 2단계: API 신청

1. 로그인 후 검색창에 **"한국마사회"** 검색
2. 다음 API들을 활용신청:
   - 경마 경주정보 조회 서비스
   - 경마 출전정보 조회 서비스
   - 경마 경주결과 조회 서비스
   - 기수/조교사 정보 조회 서비스

3. 각 API의 "활용신청" 버튼 클릭
4. 활용 목적 작성 (예: "경마 데이터 분석 및 예측 시스템 개발")
5. 신청 완료

### 3단계: API 키 확인

1. 상단 메뉴에서 "마이페이지" → "오픈API" 클릭
2. "일반 인증키(Encoding)" 복사
3. `.env.local` 파일의 `KRA_API_KEY`에 붙여넣기

```bash
KRA_API_KEY="발급받은_API_키를_여기에_붙여넣기"
```

### API 사용 제한

- **개발 계정**: 일 10,000 요청 (즉시 승인)
- **운영 계정**: 일 100,000 요청 (검토 후 승인)
- **트래픽 제한**: 없음
- **상업적 이용**: 가능 (데이터 재판매는 불가)

## 🔗 API 연결 테스트

### 1. 환경 변수 확인

```bash
# .env.local 파일 확인
cat .env.local | grep KRA_API_KEY
```

API 키가 `your_kra_api_key_here`로 되어 있으면 실제 키로 변경해야 합니다.

### 2. HTTP 테스트 (curl)

```bash
curl http://localhost:3000/api/kra/sync?action=test_connection
```

**성공 응답:**
```json
{
  "success": true,
  "message": "KRA API 연결 성공"
}
```

**실패 응답:**
```json
{
  "success": false,
  "message": "KRA API 연결 실패"
}
```

### 3. 브라우저 테스트

개발 서버 실행 후 브라우저에서 접속:
```
http://localhost:3000/api/kra/sync?action=test_connection
```

### 4. 프로그래밍 방식 테스트 (TypeScript)

```typescript
import { getKRAClient } from '@/lib/services/kra/client'

const kraClient = getKRAClient()
const isConnected = await kraClient.testConnection()

if (isConnected) {
  console.log('✅ KRA API 연결 성공')
} else {
  console.error('❌ KRA API 연결 실패')
}
```

## 🔄 데이터 동기화

### 1. 경주장 정보 초기화 (최초 1회)

```bash
curl -X POST http://localhost:3000/api/kra/sync \
  -H "Content-Type: application/json" \
  -d '{"action": "sync_tracks"}'
```

이 작업은 다음 경주장 정보를 데이터베이스에 생성합니다:
- 서울 (코드: 1)
- 부산경남 (코드: 2)
- 제주 (코드: 3)

### 2. 오늘 경주 동기화

```bash
curl -X POST http://localhost:3000/api/kra/sync \
  -H "Content-Type: application/json" \
  -d '{"action": "sync_today"}'
```

**응답 예시:**
```json
{
  "success": true,
  "message": "20260103 동기화 완료: 경주 12개, 출전마 144개",
  "stats": {
    "racesCreated": 12,
    "horsesCreated": 87,
    "jockeysCreated": 15,
    "trainersCreated": 23,
    "entriesCreated": 144,
    "errors": 0
  }
}
```

### 3. 특정 날짜 동기화

```bash
curl -X POST http://localhost:3000/api/kra/sync \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sync_date",
    "date": "2026-01-03"
  }'
```

### 4. 날짜 범위 동기화 (역사적 데이터)

```bash
# 2024년 1월 전체 동기화
curl -X POST http://localhost:3000/api/kra/sync \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sync_date_range",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

⚠️ **주의**: 큰 범위 동기화는 시간이 오래 걸립니다.
- 1일: ~10초
- 1주일: ~1분
- 1개월: ~5분
- 1년: ~1시간

### 5. 최근 7일 동기화

```bash
curl -X POST http://localhost:3000/api/kra/sync \
  -H "Content-Type: application/json" \
  -d '{"action": "sync_recent"}'
```

### 6. 경주 결과 업데이트

경주가 완료된 후 결과를 업데이트:

```bash
curl -X POST http://localhost:3000/api/kra/sync \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update_results",
    "rcDate": "20260103",
    "rcNo": 1,
    "meet": "1"
  }'
```

파라미터:
- `rcDate`: 경주 날짜 (YYYYMMDD)
- `rcNo`: 경주 번호 (1부터 시작)
- `meet`: 경주장 코드 (1: 서울, 2: 부산경남, 3: 제주)

## 📝 API 사용 예시

### TypeScript/JavaScript에서 사용

#### 1. KRA 클라이언트 직접 사용

```typescript
import { getKRAClient, KRAApiClient } from '@/lib/services/kra/client'

// 클라이언트 가져오기
const kraClient = getKRAClient()

// 오늘 경주 조회
const today = KRAApiClient.formatDate(new Date())
const races = await kraClient.getRacesByDate(today)

console.log(`오늘 경주 ${races.length}개:`)
races.forEach(race => {
  console.log(`- ${race.rcNo}R: ${race.rcName} (${race.rcDist}m)`)
})

// 특정 경주의 출전마 조회
const entries = await kraClient.getHorseEntries(today, 1, '1')
console.log(`\n1R 출전마 ${entries.length}마:`)
entries.forEach(entry => {
  console.log(`- ${entry.hrNo}번 ${entry.hrName} (${entry.jkName} 기수)`)
})

// 말 상세 정보 조회
const horseDetail = await kraClient.getHorseDetail(entries[0].hrRegNo)
if (horseDetail) {
  console.log(`\n${horseDetail.hrName} 상세:`)
  console.log(`- 생년월일: ${horseDetail.birthDate}`)
  console.log(`- 출주: ${horseDetail.totRcCnt}회`)
  console.log(`- 1착: ${horseDetail.totWinCnt}회`)
  console.log(`- 총 상금: ${horseDetail.totPrize}원`)
}
```

#### 2. 동기화 함수 사용

```typescript
import { syncRacesByDate, syncRacesByDateRange } from '@/lib/services/kra/sync'

// 오늘 경주 동기화
const result = await syncRacesByDate(new Date())
console.log(result.message)
console.log(`경주: ${result.stats.racesCreated}개`)
console.log(`출전: ${result.stats.entriesCreated}개`)

// 최근 30일 동기화
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
const rangeResult = await syncRacesByDateRange(thirtyDaysAgo, new Date())
console.log(`30일간 총 ${rangeResult.stats.racesCreated}개 경주 동기화`)
```

#### 3. Next.js API Route에서 사용

```typescript
// app/api/my-endpoint/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncRacesByDate } from '@/lib/services/kra/sync'

export async function POST() {
  // 오늘 경주 동기화
  await syncRacesByDate(new Date())

  // 데이터베이스에서 조회
  const races = await prisma.race.findMany({
    where: {
      raceDate: new Date(),
    },
    include: {
      track: true,
      entries: {
        include: {
          horse: true,
          jockey: true,
          trainer: true,
        },
      },
    },
  })

  return NextResponse.json({ races })
}
```

### React 컴포넌트에서 사용

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function SyncButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSync = async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/kra/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_today' }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage(`✅ ${result.message}`)
      } else {
        setMessage(`❌ ${result.message}`)
      }
    } catch (error) {
      setMessage(`❌ 동기화 실패: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button onClick={handleSync} disabled={loading}>
        {loading ? '동기화 중...' : '오늘 경주 동기화'}
      </Button>
      {message && <p className="mt-2">{message}</p>}
    </div>
  )
}
```

## 🛠️ 문제 해결

### 1. "KRA API 키가 설정되지 않았습니다"

**원인**: 환경 변수가 설정되지 않음

**해결책**:
1. `.env.local` 파일 확인
2. `KRA_API_KEY="실제_키"` 형식으로 설정
3. 개발 서버 재시작 (`npm run dev` 종료 후 재실행)

### 2. "KRA API 에러: Unauthorized"

**원인**: API 키가 잘못되었거나 활용신청이 승인되지 않음

**해결책**:
1. 공공데이터포털 로그인
2. 마이페이지 → 오픈API에서 키 확인
3. 활용신청 상태 확인 (승인 대기/승인/거부)

### 3. API 호출 시 타임아웃

**원인**: KRA API 서버 응답 지연 또는 네트워크 문제

**해결책**:
- 자동 재시도 로직이 작동하므로 잠시 대기
- 지속적으로 실패 시 KRA API 서버 상태 확인
- 공공데이터포털 공지사항 확인

### 4. "no results found" 또는 빈 배열 반환

**원인**: 해당 날짜에 경주가 없거나 데이터가 아직 제공되지 않음

**해결책**:
- 경주가 있는 날짜인지 확인 (주로 주말)
- 과거 데이터만 확실하게 제공되므로 최근 데이터는 확인 필요
- [한국마사회 홈페이지](https://race.kra.co.kr)에서 경주 일정 확인

### 5. Rate Limit 초과

**원인**: 일일 요청 한도 초과

**해결책**:
- 개발 계정: 일 10,000 요청
- 필요시 운영 계정으로 업그레이드 신청
- 캐싱 활용하여 중복 요청 방지

### 6. 동기화 중 일부 실패

**원인**: 특정 경주나 말의 데이터 형식 불일치

**해결책**:
- 에러 로그 확인하여 어떤 데이터가 실패했는지 파악
- 해당 경주는 수동으로 다시 시도
- 로그 예시:
  ```
  ⚠️ 출전마 질주왕 동기화 실패: Invalid date format
  ```

## 📊 데이터 구조

### KRA API → Prisma Database 매핑

| KRA API | 설명 | Prisma 모델 | 필드 |
|---------|------|------------|------|
| 경주정보 | 경주 메타데이터 | Race | raceDate, raceNumber, distance 등 |
| 출전정보 | 출전마 목록 | RaceEntry | gateNumber, odds, finishPosition 등 |
| 말정보 | 말 상세 정보 | Horse | registrationNumber, nameKo, totalWins 등 |
| 기수정보 | 기수 통계 | Jockey | licenseNumber, nameKo, winRate 등 |
| 조교사정보 | 조교사 통계 | Trainer | licenseNumber, nameKo, winRate 등 |
| 경주결과 | 착순 및 시간 | RaceEntry | finishPosition, finishTime |

## 🔄 자동 동기화 설정 (선택사항)

### Cron Job 설정 (Linux/Mac)

```bash
# crontab -e

# 매일 오전 6시에 어제 경주 결과 동기화
0 6 * * * curl -X POST http://localhost:3000/api/kra/sync -H "Content-Type: application/json" -d '{"action":"sync_recent"}'
```

### Windows 작업 스케줄러

1. 작업 스케줄러 열기
2. "기본 작업 만들기"
3. 트리거: 매일 오전 6시
4. 작업: PowerShell 스크립트 실행
5. 스크립트 내용:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3000/api/kra/sync" `
     -Method POST `
     -ContentType "application/json" `
     -Body '{"action":"sync_recent"}'
   ```

### Node.js Cron (애플리케이션 내)

```typescript
// app/api/cron/sync/route.ts
import { NextResponse } from 'next/server'
import { syncRacesByDate } from '@/lib/services/kra/sync'

export async function GET(request: Request) {
  // Vercel Cron에서 호출
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  await syncRacesByDate(yesterday)

  return NextResponse.json({ success: true })
}
```

---

## 📚 추가 리소스

- [공공데이터포털](https://www.data.go.kr)
- [한국마사회 공식 홈페이지](https://race.kra.co.kr)
- [KRA 국제부 문의](mailto:inter@kra.co.kr) - +82-2-509-2991~5

## 💡 팁

1. **초기 설정 시**: 먼저 최근 1-2주 데이터만 동기화하여 테스트
2. **대량 동기화**: 야간 시간대에 진행하여 API 부하 분산
3. **데이터 검증**: Prisma Studio로 동기화된 데이터 확인
4. **에러 모니터링**: 콘솔 로그를 파일로 저장하여 추적

```bash
npm run dev 2>&1 | tee sync.log
```