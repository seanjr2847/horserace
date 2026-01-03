# 경마 예측 시스템 설치 가이드

Next.js 풀스택 경마 예측 애플리케이션 로컬 개발 환경 설정 가이드입니다.

## 📋 사전 요구사항

시작하기 전에 다음 소프트웨어가 설치되어 있는지 확인하세요:

- **Node.js 18+**: [https://nodejs.org](https://nodejs.org)
  ```bash
  node -v  # v18 이상 확인
  ```

- **Docker Desktop**: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
  ```bash
  docker --version
  docker-compose --version
  ```

- **Git**: [https://git-scm.com](https://git-scm.com)

## 🚀 설치 단계

### 1단계: 프로젝트 디렉토리 이동

```bash
cd C:\projects\horserace\frontend
```

### 2단계: 의존성 설치

```bash
npm install
```

설치되는 주요 패키지:
- `@prisma/client` - Prisma ORM 클라이언트
- `@google/generative-ai` - Gemini API SDK
- `prisma` - Prisma CLI (devDependency)
- Next.js, React, TailwindCSS 등

### 3단계: 환경 변수 설정

`.env.local` 파일을 열고 필요한 API 키를 설정하세요:

```bash
# .env.local
DATABASE_URL="postgresql://horserace:horserace_dev_password@localhost:5432/horserace_db"
REDIS_URL="redis://localhost:6379"

# 🔑 KRA API 키 발급 필요
# https://www.data.go.kr 에서 계정 생성 후 "한국마사회" 검색하여 API 신청
KRA_API_KEY="your_kra_api_key_here"

# 🔑 Gemini API 키 발급 필요
# https://aistudio.google.com 에서 무료 API 키 즉시 발급 가능
GEMINI_API_KEY="your_gemini_api_key_here"

NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

#### API 키 발급 방법

**KRA API (한국마사회 공공데이터)**:
1. [공공데이터포털](https://www.data.go.kr) 접속 및 회원가입
2. "한국마사회" 검색
3. 원하는 API 선택 후 활용신청
4. 개발 계정은 즉시 승인 (일 10,000 요청)
5. 발급받은 API 키를 `KRA_API_KEY`에 입력

**Gemini API (Google AI Studio)**:
1. [Google AI Studio](https://aistudio.google.com) 접속
2. Google 계정으로 로그인
3. "Get API Key" 클릭하여 즉시 발급
4. 무료 티어: 일 1,500 requests (월 45,000 경주 분석 가능)
5. 발급받은 API 키를 `GEMINI_API_KEY`에 입력

### 4단계: Docker 컨테이너 시작

PostgreSQL과 Redis를 Docker로 실행합니다:

```bash
# 프로젝트 루트로 이동 (docker-compose.yml이 있는 위치)
cd C:\projects\horserace

# Docker 컨테이너 시작 (백그라운드 실행)
docker-compose up -d
```

컨테이너 상태 확인:
```bash
docker-compose ps
```

출력 예시:
```
NAME                   IMAGE                STATUS
horserace_postgres     postgres:15-alpine   Up
horserace_redis        redis:7-alpine       Up
```

컨테이너 로그 확인 (문제 발생 시):
```bash
docker-compose logs postgres
docker-compose logs redis
```

### 5단계: Prisma 클라이언트 생성

```bash
cd C:\projects\horserace\frontend

# Prisma 클라이언트 생성
npm run prisma:generate
```

### 6단계: 데이터베이스 마이그레이션

```bash
# 초기 마이그레이션 실행
npm run prisma:migrate

# 마이그레이션 이름 입력 프롬프트가 나오면:
# "init" 입력 후 Enter
```

성공 메시지 예시:
```
✔ Generated Prisma Client
✔ Migration applied successfully
```

### 7단계: 데이터베이스 확인

Prisma Studio로 데이터베이스를 시각적으로 확인할 수 있습니다:

```bash
npm run prisma:studio
```

브라우저가 자동으로 열리며 `http://localhost:5555`에서 다음 테이블들을 확인할 수 있습니다:
- `race_tracks` (경주장)
- `races` (경주)
- `horses` (말)
- `jockeys` (기수)
- `trainers` (조교사)
- `race_entries` (출전 정보)
- `predictions` (예측 결과)

## 🏃 개발 서버 실행

모든 설정이 완료되면 개발 서버를 실행합니다:

```bash
cd C:\projects\horserace\frontend

npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📊 데이터베이스 스키마

### 주요 테이블 구조

**race_tracks** - 경주장 정보
- `id`, `name`, `code`, `location`

**races** - 경주 정보
- `race_date`, `race_number`, `track_id`
- `distance`, `surface_type` (모래/잔디)
- `weather`, `track_condition`
- `race_status` (scheduled/in_progress/completed)

**horses** - 말 정보
- `registration_number`, `name_ko`, `birth_date`, `gender`
- `total_races`, `total_wins`, `total_earnings`

**jockeys** - 기수 정보
- `license_number`, `name_ko`
- `total_races`, `total_wins`, `win_rate`, `place_rate`

**trainers** - 조교사 정보
- `license_number`, `name_ko`, `stable_name`
- `total_races`, `total_wins`, `win_rate`

**race_entries** - 출전 정보
- `race_id`, `horse_id`, `jockey_id`, `trainer_id`
- `gate_number`, `horse_weight_kg`, `odds`
- `finish_position`, `finish_time`

**predictions** - AI 예측 결과
- `race_id`, `prediction_type` (win/place/quinella/exacta/trifecta)
- `prediction_data` (JSON), `confidence_score`
- `llm_model_version`, `llm_reasoning`

## 🛠️ 유용한 명령어

### Prisma 관련
```bash
# Prisma 클라이언트 재생성
npm run prisma:generate

# 새 마이그레이션 생성
npm run prisma:migrate

# 데이터베이스 리셋 (주의: 모든 데이터 삭제)
npx prisma migrate reset

# 스키마를 DB에 직접 푸시 (개발용, 마이그레이션 없이)
npm run db:push

# Prisma Studio 실행
npm run prisma:studio
```

### Docker 관련
```bash
# 컨테이너 시작
docker-compose up -d

# 컨테이너 중지
docker-compose down

# 컨테이너 중지 + 볼륨 삭제 (데이터 완전 삭제)
docker-compose down -v

# 컨테이너 재시작
docker-compose restart

# 로그 확인
docker-compose logs -f
```

### Next.js 관련
```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 타입 체크
npm run type-check

# 린트 검사
npm run lint
```

## 🔍 문제 해결

### PostgreSQL 연결 실패
```bash
# Docker 컨테이너 상태 확인
docker-compose ps

# PostgreSQL 로그 확인
docker-compose logs postgres

# 포트 충돌 확인 (5432 포트 사용 중인지)
netstat -ano | findstr :5432

# 컨테이너 재시작
docker-compose restart postgres
```

### Prisma 마이그레이션 실패
```bash
# Prisma 캐시 삭제
npx prisma generate --force

# 데이터베이스 리셋 후 재시도
npx prisma migrate reset
npx prisma migrate dev --name init
```

### "Module not found" 에러
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
rm package-lock.json
npm install
```

### Docker Desktop이 실행되지 않음
- Windows: Docker Desktop 앱을 관리자 권한으로 실행
- WSL2 업데이트 필요할 수 있음: [WSL2 설치 가이드](https://docs.microsoft.com/ko-kr/windows/wsl/install)

## 📁 프로젝트 구조

```
C:\projects\horserace\
├── docker-compose.yml          # PostgreSQL + Redis 설정
├── frontend/                   # Next.js 애플리케이션
│   ├── .env.local             # 환경 변수 (Git 제외)
│   ├── package.json           # 의존성 및 스크립트
│   ├── prisma/
│   │   └── schema.prisma      # 데이터베이스 스키마
│   ├── lib/
│   │   └── prisma.ts          # Prisma 클라이언트
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # 홈 페이지
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   └── api/               # API Routes (백엔드)
│   ├── components/            # React 컴포넌트
│   ├── store/                 # Zustand 상태 관리
│   └── types/                 # TypeScript 타입
```

## 🎯 다음 단계

Phase 1 설정이 완료되었습니다! 이제 다음 단계로 진행할 수 있습니다:

1. **KRA API 클라이언트 구현** (`lib/services/kra/client.ts`)
2. **Gemini LLM 서비스 구현** (`lib/services/gemini/client.ts`)
3. **API Routes 구현** (`app/api/races/route.ts` 등)
4. **페이지 구현 및 데이터 연동**

자세한 내용은 프로젝트 계획 문서를 참조하세요.

## 💰 비용 정보

### 개발 환경 (완전 무료 🎉)
- Docker Desktop: 무료
- PostgreSQL: 무료 (로컬)
- Redis: 무료 (로컬)
- Gemini API: 무료 티어 (일 1,500 requests)
- KRA API: 무료 (일 10,000 requests)

### 프로덕션 환경 (선택사항)
- Vercel Hobby: $0/월 (무료)
- Supabase Free: $0/월 (PostgreSQL)
- Upstash Free: $0/월 (Redis)
- **총 운영비: $0/월로 시작 가능!**

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 모든 사전 요구사항이 설치되었는지 확인
2. Docker Desktop이 실행 중인지 확인
3. 환경 변수가 올바르게 설정되었는지 확인
4. 포트 충돌이 없는지 확인 (3000, 5432, 6379)

---

**설치 완료 후 개발 서버 실행:**
```bash
npm run dev
```

**브라우저에서 확인:**
[http://localhost:3000](http://localhost:3000)
