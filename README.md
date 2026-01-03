# 🐎 경마 예측 웹 애플리케이션

Gemini AI 기반 한국 경마 예측 시스템

## 📋 프로젝트 개요

- **목적**: 실제 베팅 보조를 위한 AI 기반 경마 예측
- **예측 타입**: 단승, 연승, 복승, 삼복승, 복연승
- **기술 스택**: React + FastAPI + Gemini 2.0 Pro + PostgreSQL
- **데이터 소스**: 한국마사회(KRA) 공공데이터포털 API

## 🚀 빠른 시작

### 1. 사전 요구사항

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (또는 Docker 사용)
- Redis (또는 Docker 사용)

### 2. API 키 발급

#### KRA API (한국마사회 공공데이터)
1. [공공데이터포털](https://www.data.go.kr) 접속
2. 회원가입 및 로그인
3. "한국마사회" 검색
4. API 활용 신청 (즉시 승인)
5. API 키 발급받기

#### Gemini API
1. [Google AI Studio](https://aistudio.google.com) 접속
2. Google 계정으로 로그인
3. "Get API key" 클릭
4. API 키 생성 (무료)

### 3. 프로젝트 설정

```bash
# 저장소 클론 (또는 다운로드)
cd C:\projects\horserace

# 환경 변수 설정
cp backend/.env.example backend/.env
cp prediction-service/.env.example prediction-service/.env

# .env 파일에 API 키 입력
# - KRA_API_KEY=your_kra_api_key
# - GEMINI_API_KEY=your_gemini_api_key
```

### 4. Docker로 데이터베이스 실행

```bash
cd infrastructure/docker
docker-compose up -d

# 확인
docker ps
```

### 5. Backend 실행

```bash
cd backend

# Python 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스 마이그레이션 (Alembic)
# alembic upgrade head

# 서버 실행
python -m app.main

# 또는
uvicorn app.main:app --reload --port 8000
```

서버 실행 후: http://localhost:8000/docs

### 6. Prediction Service 실행

```bash
cd prediction-service

# Python 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행 (포트 8001)
# uvicorn src.api.main:app --reload --port 8001
```

### 7. Frontend 실행 (추후)

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 서버 실행 후: http://localhost:5173
```

## 📁 프로젝트 구조

```
horserace/
├── backend/                     # FastAPI 백엔드
│   ├── app/
│   │   ├── api/                # API 엔드포인트
│   │   ├── models/             # 데이터베이스 모델
│   │   ├── services/           # 비즈니스 로직
│   │   │   └── kra_sync_service.py  # KRA API 클라이언트
│   │   └── main.py
│   └── requirements.txt
│
├── prediction-service/          # Gemini LLM 예측 서비스
│   ├── src/
│   │   └── llm/
│   │       └── gemini_client.py  # Gemini API 클라이언트
│   └── requirements.txt
│
├── frontend/                    # React 프론트엔드 (예정)
├── infrastructure/docker/       # Docker 설정
│   └── docker-compose.yml
└── README.md
```

## 🔧 개발 가이드

### 데이터베이스 스키마 업데이트

```bash
cd backend

# 마이그레이션 생성
alembic revision --autogenerate -m "description"

# 마이그레이션 적용
alembic upgrade head

# 롤백
alembic downgrade -1
```

### API 테스트

```bash
# Health check
curl http://localhost:8000/health

# API 문서
open http://localhost:8000/api/docs
```

### Gemini API 테스트

```python
import google.generativeai as genai

genai.configure(api_key="YOUR_API_KEY")
model = genai.GenerativeModel('gemini-2.0-flash-exp')

response = model.generate_content("Hello!")
print(response.text)
```

## 💰 비용 정보

### Gemini API (Google)
- **무료 티어**: 일 1,500 requests (월 45,000 경주 무료!)
- **유료**: 경주당 약 $0.006 (월 $18 for 일 100경주)
- **결론**: 초기 단계 완전 무료

### 인프라
- 서버: $50-100/월
- 데이터베이스: $20-50/월
- **총 예상**: $60-150/월

## 📊 기능 로드맵

### Phase 1 (현재)
- [x] 프로젝트 구조 생성
- [x] 데이터베이스 모델
- [x] KRA API 클라이언트 기본 구조
- [x] Gemini API 클라이언트
- [ ] 데이터 수집 파이프라인
- [ ] 기본 API 엔드포인트

### Phase 2
- [ ] LLM 프롬프트 최적화
- [ ] 예측 생성 로직
- [ ] 캐싱 시스템

### Phase 3
- [ ] React 프론트엔드
- [ ] 실시간 WebSocket
- [ ] 예측 대시보드

### Phase 4
- [ ] 테스트 & 최적화
- [ ] 배포 준비

## ⚠️ 법적 고려사항

- ✅ 정보 제공 목적의 베팅 보조 앱은 **합법**
- ❌ 직접 베팅 거래 처리는 **불법** (한국마사회만 가능)
- ✅ 19세 이상 연령 확인 필요
- ✅ 책임있는 도박 안내 필수
- ✅ 예측 면책조항 필요

## 📞 도움말

### API 문서
- 공공데이터포털: https://www.data.go.kr
- Gemini AI: https://ai.google.dev/

### 기술 지원
- KRA API: 1566-0025
- Google AI: https://ai.google.dev/support

## 📝 라이선스

이 프로젝트는 교육 및 개인 학습 목적으로 제공됩니다.
상업적 사용 시 관련 법규를 준수해야 합니다.

---

**개발 시작일**: 2026-01-03
**예상 완료**: 2026-04-30 (15-16주)
