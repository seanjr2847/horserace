# KRA API 연동 가이드

한국마사회(KRA) 공공데이터 API 연동 및 사용 방법

## 📋 목차

1. [필수 API 목록](#-필수-api-목록)
2. [API 키 발급](#-api-키-발급)
3. [API 연결 테스트](#-api-연결-테스트)
4. [API 사용 예시](#-api-사용-예시)
5. [문제 해결](#-문제-해결)

---

## 🎯 필수 API 목록

프로젝트에 필요한 **6개 API**를 모두 신청해야 합니다.

### 1. RC경마경주정보 (15063950) ⭐ 최우선
- **링크**: https://www.data.go.kr/data/15063950/openapi.do
- **엔드포인트**: `https://apis.data.go.kr/B551015/API186_1/SeoulRace_1`
- **용도**: 경주 일정, 출전마, 기수, 조교사 정보 (가장 포괄적)
- **파라미터**:
  - `ServiceKey`: API 인증키 (필수)
  - `rc_date_fr`: 시작일자 YYYYMMDD (필수)
  - `rc_date_to`: 종료일자 YYYYMMDD (필수)
  - `meet`: 경마장 코드 (1: 서울, 2: 제주, 3: 부산경남)
  - `_type`: 응답 형식 (json/xml)

### 2. 출전표정보 (15058677)
- **링크**: https://www.data.go.kr/data/15058677/openapi.do
- **엔드포인트**: `https://apis.data.go.kr/B551015/API26_2/entrySheet_2`
- **용도**: 출전 예정 경주마 상세 정보 (40+ 필드)
- **파라미터**:
  - `ServiceKey`: API 인증키 (필수)
  - `rc_date`: 경주일자 YYYYMMDD
  - `rc_month`: 경주월 YYYYMM
  - `rc_no`: 경주번호
  - `meet`: 경마장 코드

### 3. AI학습용_경주결과 (15143803)
- **링크**: https://www.data.go.kr/data/15143803/openapi.do
- **엔드포인트**: `https://apis.data.go.kr/B551015/API155/raceResult`
- **용도**: 과거 경주 결과 (예측 학습용)
- **파라미터**:
  - `ServiceKey`: API 인증키 (필수)
  - `race_dt`: 경주일자 YYYYMMDD (필수)
  - `rccrs_cd`: 경마장 코드 (필수: 1=서울, 2=제주, 3=부산경남)
  - `_type`: 응답 형식 (json/xml)

### 4. 확정배당율 통합 정보 (15058559)
- **링크**: https://www.data.go.kr/data/15058559/openapi.do
- **엔드포인트**: `https://apis.data.go.kr/B551015/API160_1/integratedInfo_1`
- **용도**: 모든 승식별 확정 배당률
- **파라미터**:
  - `ServiceKey`: API 인증키 (필수)
  - `rc_date`: 경주일자 YYYYMMDD
  - `rc_no`: 경주번호
  - `meet`: 경마장 코드
  - `pool`: 승식 (WIN=단승, PLC=복승, QNL=복연승, EXA=쌍승, TRI=삼복승)

### 5. 조교사정보_영문추가 (15130588)
- **링크**: https://www.data.go.kr/data/15130588/openapi.do
- **엔드포인트**: `https://apis.data.go.kr/B551015/API308/trainerInfo`
- **용도**: 조교사 상세 정보 및 통계
- **파라미터**:
  - `ServiceKey`: API 인증키 (필수)
  - `tr_no`: 조교사번호
  - `tr_name`: 조교사명
  - `meet`: 경마장 코드

### 6. 말정보 및 개체식별 (15105155)
- **링크**: https://www.data.go.kr/data/15105155/openapi.do
- **엔드포인트**: `https://apis.data.go.kr/B551015/horseinfohi/gethorseinfohi`
- **용도**: 말 상세 정보 및 개체 식별
- **파라미터**:
  - `ServiceKey`: API 인증키 (필수)
  - `hrno`: 말 등록번호
  - `hrname`: 말 이름
  - `reg_dt_fr`: 등록시작일자 YYYYMMDD
  - `reg_dt_to`: 등록종료일자 YYYYMMDD

---

## 🔑 API 키 발급

### 1단계: 공공데이터포털 회원가입 (3분)

1. [공공데이터포털](https://www.data.go.kr) 접속
2. 우측 상단 **"회원가입"** 클릭
3. 개인 회원 가입 (이메일 인증)

### 2단계: 6개 API 신청 (5분)

**중요: 위 6개 API를 모두 신청해야 합니다!**

각 API 링크를 클릭하여 활용신청:

1. **로그인 필수** (안 하면 버튼 안 보임)
2. 각 API 상세 페이지에서 **"활용신청"** 버튼 클릭
3. **개발계정** 선택 (일 10,000 요청)
4. 활용 목적: `경마 예측 시스템 개발` (자유롭게 작성)
5. **즉시 자동승인** (심사 없음)

### 3단계: API 키 확인 및 설정 (1분)

1. **마이페이지 → 오픈API → 개발계정 상세** 클릭
2. **일반 인증키(Encoding)** 복사
3. `.env.local` 파일에 붙여넣기:

```bash
KRA_API_KEY="복사한_API_키를_여기에_붙여넣기"
```

**주의**: `your_kra_api_key_here`를 실제 키로 교체하세요!

### API 사용 제한

- **개발 계정**: 일 10,000 요청 (즉시 승인)
- **운영 계정**: 일 100,000 요청 (활용사례 등록 필요)
- **무료 사용**: 상업적 이용 가능 (재판매 불가)

---

## 🔗 API 연결 테스트

### 1. 환경 변수 확인

```bash
# .env.local 파일 확인
cat .env.local | grep KRA_API_KEY
```

API 키가 `your_kra_api_key_here`로 되어 있으면 **실제 키로 교체 필수**!

### 2. curl로 테스트 (추천)

```bash
# 오늘 날짜의 경주 조회 테스트
curl "https://apis.data.go.kr/B551015/API186_1/SeoulRace_1?ServiceKey=YOUR_API_KEY&rc_date_fr=20240104&rc_date_to=20240104&_type=json"
```

**YOUR_API_KEY**를 실제 키로 교체하세요.

**성공 응답:**
```json
{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL_CODE"
    },
    "body": {
      "items": { ... }
    }
  }
}
```

**실패 응답 (401 Unauthorized):**
- API 키가 없거나 잘못됨
- 해결: API 키 재확인 및 교체

**실패 응답 (resultCode: "03"):**
- 데이터 없음 (해당 날짜에 경주 없음)
- 해결: 다른 날짜로 시도

### 3. Next.js 서버에서 테스트

개발 서버 실행:
```bash
npm run dev
```

브라우저에서 접속:
```
http://localhost:4000/api/kra/sync?action=test_connection
```

### 4. TypeScript 코드로 테스트

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

---

## 💻 API 사용 예시

### 예시 1: 오늘 경주 목록 조회

```typescript
import { getKRAClient } from '@/lib/services/kra/client'
import { KRAApiClient } from '@/lib/services/kra/client'

const client = getKRAClient()
const today = KRAApiClient.formatDate(new Date()) // '20240104'

// 오늘 서울 경마장 경주 조회
const races = await client.getRacesByDate(today, '1')
console.log(`오늘 경주 수: ${races.length}`)
```

### 예시 2: 특정 경주 출전마 조회

```typescript
const client = getKRAClient()

// 2024년 1월 4일, 서울 경마장, 1번 경주
const entries = await client.getHorseEntries('20240104', 1, '1')

entries.forEach((entry) => {
  console.log(`
    말: ${entry.hrName}
    기수: ${entry.jkName}
    조교사: ${entry.trName}
    게이트: ${entry.ordNo}번
  `)
})
```

### 예시 3: 경주 결과 조회

```typescript
const client = getKRAClient()

// 과거 경주 결과 조회
const results = await client.getRaceResults('20231220', 5, '1')

results.forEach((result) => {
  console.log(`
    ${result.ord}위: ${result.hrName}
    기수: ${result.jkName}
    주파시간: ${result.rcTime}
  `)
})
```

### 예시 4: 배당률 조회

```typescript
const client = getKRAClient()

// 단승식 배당률 조회
const winOdds = await client.getOdds('20240104', 1, '1', 'WIN')

// 복연승 배당률 조회
const quinellaOdds = await client.getQuinellaOdds('20240104', 1, '1')

// 삼복승 배당률 조회
const trifectaOdds = await client.getTrifectaOdds('20240104', 1, '1')
```

### 예시 5: 조교사 정보 조회

```typescript
const client = getKRAClient()

// 특정 조교사 정보 조회
const trainer = await client.getTrainerInfo('12345', '1')

if (trainer) {
  console.log(`
    조교사: ${trainer.trName}
    영문명: ${trainer.trNameEn}
    마방: ${trainer.stable}
    총 경주: ${trainer.totRcCnt}회
    승수: ${trainer.totWinCnt}승
    승률: ${(trainer.winRate * 100).toFixed(1)}%
  `)
}

// 전체 조교사 목록 조회
const allTrainers = await client.getAllTrainers('1')
```

### 예시 6: 말 정보 조회

```typescript
const client = getKRAClient()

// 말 상세 정보 조회
const horse = await client.getHorseDetail('HR123456')

if (horse) {
  console.log(`
    말: ${horse.hrName} (${horse.hrNameEn})
    생년월일: ${horse.birthDate}
    성별: ${horse.sex}
    레이팅: ${horse.rating}
    부: ${horse.faName}
    모: ${horse.moName}
    총 경주: ${horse.totRcCnt}회
    승수: ${horse.totWinCnt}승
    총 상금: ${horse.totPrize.toLocaleString()}원
  `)
}

// 말 이름으로 검색
const horses = await client.searchHorseByName('질주')
```

---

## 🔧 문제 해결

### 문제 1: "KRA API 키가 설정되지 않았습니다"

**원인**: `.env.local` 파일에 API 키가 없거나 잘못됨

**해결**:
1. `.env.local` 파일 확인
2. `KRA_API_KEY="실제_API_키"` 형식으로 작성
3. 개발 서버 재시작 (`Ctrl+C` → `npm run dev`)

### 문제 2: "401 Unauthorized" 에러

**원인**: API 키가 유효하지 않음

**해결**:
1. 공공데이터포털에서 API 키 재확인
2. **일반 인증키(Encoding)** 사용 (Decoding 키 아님!)
3. 복사할 때 공백 없이 정확히 복사

### 문제 3: "resultCode: 03" - 데이터 없음

**원인**: 해당 날짜/경주에 데이터가 없음

**해결**:
1. 다른 날짜로 시도 (경주가 있는 날짜)
2. 경마 일정 확인: https://race.kra.co.kr
3. 주말 또는 공휴일에 경주가 많음

### 문제 4: "Network Error" 또는 타임아웃

**원인**: 네트워크 연결 문제 또는 API 서버 일시 장애

**해결**:
1. 인터넷 연결 확인
2. 5-10초 후 재시도 (자동 재시도 기능 있음)
3. 공공데이터포털 서버 상태 확인

### 문제 5: 특정 API만 동작 안 함

**원인**: 해당 API를 신청하지 않음

**해결**:
1. 공공데이터포털 → 마이페이지 → 오픈API 확인
2. 6개 API가 모두 승인되었는지 확인
3. 누락된 API 활용신청

---

## 📚 추가 리소스

- **공공데이터포털**: https://www.data.go.kr
- **한국마사회 공식**: https://www.kra.co.kr
- **경주 일정**: https://race.kra.co.kr
- **문의**: KRA 공공데이터 담당 (inter@kra.co.kr)

---

## ✅ 체크리스트

개발 시작 전 확인:

- [ ] 공공데이터포털 회원가입 완료
- [ ] 6개 API 모두 활용신청 완료
- [ ] API 키 발급 및 `.env.local`에 설정
- [ ] `npm run dev` 서버 실행
- [ ] API 연결 테스트 성공
- [ ] Gemini API 키도 설정 완료 (예측 기능용)

모두 체크되면 개발 시작 가능! 🚀
