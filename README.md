<div align="center">
  <br />

  <div>
    <img src="https://img.shields.io/badge/-Next.JS_15-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=black" alt="next.js" />
    <img src="https://img.shields.io/badge/-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="react" />
    <img src="https://img.shields.io/badge/-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="typescript" />
    <img src="https://img.shields.io/badge/-Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="tailwind" />
    <img src="https://img.shields.io/badge/-Clerk-6C47FF?style=for-the-badge&logoColor=white&logo=clerk" alt="clerk" />
    <img src="https://img.shields.io/badge/-Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="supabase" />
  </div>

  <h1 align="center">오즈 8주 프로젝트 - 도소매 가격비교 플랫폼</h1>
  <h3 align="center">AI 기반 B2B 도소매 가격 비교 웹 서비스</h3>

  <p align="center">
    여러 도매점의 상품을 AI가 정리해서 최저가를 한눈에 비교할 수 있는 웹 플랫폼
  </p>
</div>

## 📋 목차

1. [프로젝트 소개](#프로젝트-소개)
2. [핵심 기능](#핵심-기능)
3. [기술 스택](#기술-스택)
4. [시작하기](#시작하기)
5. [개발 명령어](#개발-명령어)
6. [프로젝트 구조](#프로젝트-구조)

## 프로젝트 소개

**도소매 가격비교 플랫폼**은 소매점이 여러 도매점의 가격을 쉽게 비교할 수 있도록 도와주는 AI 기반 웹 서비스입니다.

### 핵심 가치

- 🤖 **AI 자동 상품명 정리**: 도매점마다 다른 상품명을 AI가 자동으로 표준화하여 진짜 최저가를 쉽게 찾을 수 있습니다
- 📊 **공영도매시장 실시간 시세**: 공영도매시장의 실시간 경매 시세를 함께 보여줘서 가격 협상의 기준점을 제공합니다
- 🔒 **익명 도매점 보호**: 도매점 정보는 익명으로 보호되어 안심하고 거래할 수 있습니다

### 타겟 사용자

- **소매점**: 여러 도매점 가격을 일일이 비교하기 힘든 분들
- **도매점**: 더 많은 소매점에게 상품을 알리고 싶은 분들

## 핵심 기능

### 1️⃣ AI 자동 상품명 정리

- 도매점이 상품 등록할 때 상품명을 자유롭게 입력
- **Google Gemini API**가 자동으로 표준 이름으로 변환
- 예: "청양고추 1kg", "청양 고추 1키로" → 모두 "청양고추 1kg"로 통일

### 2️⃣ 익명 도매점 최저가 비교

- 소매점은 상품명만 검색하면 됨
- 결과에는 "도매점 A", "도매점 B" 이런 식으로만 표시
- 진짜 상호명, 주소, 전화번호는 절대 안 보임
- 주문하면 그때 연락처만 공유

### 3️⃣ 공영도매시장 실시간 시세 조회

- **한국농수산식품유통공사 공공 API**를 활용
- 전국 공영도매시장의 실시간 경매 가격 데이터 제공
- 소매점이 검색할 때 도매점 가격과 공영시장 시세를 함께 표시

### 4️⃣ 간편 주문하기

- 소매점이 최저가 상품을 선택해서 주문서 작성
- 도매점에게 알림 전송 (이메일 또는 대시보드 알림)
- 실제 거래는 전화/문자로 진행 (웹 밖에서)

## 기술 스택

### 프레임워크 & 라이브러리

- **[Next.js 15](https://nextjs.org/)** - React 프레임워크 (App Router, Server Components)
- **[React 19](https://react.dev/)** - UI 라이브러리
- **[TypeScript](https://www.typescriptlang.org/)** - 타입 안정성

### 인증 & 데이터베이스

- **[Clerk](https://clerk.com/)** - 사용자 인증 및 관리
  - Google, 이메일 등 다양한 로그인 방식 지원
  - 한국어 UI 지원
  - Supabase와 네이티브 통합
- **[Supabase](https://supabase.com/)** - PostgreSQL 데이터베이스
  - 실시간 데이터 동기화
  - 파일 스토리지

### AI & 공공 데이터

- **[Google Gemini API](https://ai.google.dev/)** - 상품명 자동 표준화
  - Gemini 1.5 Flash 사용
  - 월 1,500회 무료 할당량
  - 한국어 처리 성능 우수
- **[한국농수산식품유통공사 공공 API](https://www.data.go.kr/)** - 공영도매시장 실시간 시세

### UI & 스타일링

- **[Tailwind CSS v4](https://tailwindcss.com/)** - 유틸리티 우선 CSS 프레임워크
- **[shadcn/ui](https://ui.shadcn.com/)** - 재사용 가능한 컴포넌트 라이브러리
- **[lucide-react](https://lucide.dev/)** - 아이콘 라이브러리

### 폼 & 검증

- **[React Hook Form](https://react-hook-form.com/)** - 폼 상태 관리
- **[Zod](https://zod.dev/)** - 스키마 검증

## 시작하기

### 필수 요구사항

시스템에 다음이 설치되어 있어야 합니다:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en) (v18 이상)
- [pnpm](https://pnpm.io/) (권장 패키지 매니저)

```bash
# pnpm 설치
npm install -g pnpm
```

### 프로젝트 초기화

다음 단계를 순서대로 진행하세요:

#### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd geniemarket
pnpm install
```

#### 2. 환경 변수 설정

`.env.example` 파일을 참고하여 `.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
NEXT_PUBLIC_STORAGE_BUCKET=uploads

# Google Gemini API
GEMINI_API_KEY=xxxxx

# 공공데이터 API
PUBLIC_DATA_API_KEY=xxxxx
```

#### 3. Supabase 프로젝트 설정

1. [Supabase Dashboard](https://supabase.com/dashboard)에서 프로젝트 생성
2. `supabase/migrations/` 폴더의 마이그레이션 파일들을 SQL Editor에서 실행
3. Storage 버킷 생성 (`uploads`)

#### 4. Clerk 프로젝트 설정

1. [Clerk Dashboard](https://dashboard.clerk.com/)에서 애플리케이션 생성
2. Supabase와 네이티브 통합 설정 (자세한 내용은 [AGENTS.md](AGENTS.md) 참고)

#### 5. API 키 발급

- **Google Gemini API**: [Google AI Studio](https://aistudio.google.com/)에서 API 키 발급
- **공공데이터 API**: [공공데이터포털](https://www.data.go.kr/)에서 "한국농수산식품유통공사\_전국 공영도매시장 실시간 경매정보" API 키 신청

#### 6. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## 개발 명령어

```bash
# 개발 서버 실행 (Turbopack)
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 린팅
pnpm lint
```

## 프로젝트 구조

```
geniemarket/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (main)/            # 메인 페이지 (소매점용)
│   ├── (vendor)/          # 도매점 페이지
│   ├── layout.tsx         # Root Layout
│   └── page.tsx           # 홈페이지
│
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── products/         # 상품 관련 컴포넌트
│   ├── market-prices/    # 시세 관련 컴포넌트
│   └── orders/           # 주문 관련 컴포넌트
│
├── lib/                   # 유틸리티 및 설정
│   ├── supabase/         # Supabase 클라이언트들
│   ├── gemini.ts         # Gemini API 호출
│   └── market-api.ts     # 공공 API 호출
│
├── hooks/                 # Custom React Hooks
│
├── supabase/             # Supabase 관련 파일
│   └── migrations/       # 데이터베이스 마이그레이션
│
├── docs/                 # 문서
│   ├── PRD.md           # 제품 요구사항 문서
│   ├── TODO.md          # 작업 목록
│   └── Design.md        # 디자인 문서
│
└── .cursor/              # Cursor AI 규칙
```

## 추가 리소스

- [PRD 문서](docs/PRD.md) - 제품 요구사항 상세 문서
- [TODO 문서](docs/TODO.md) - 개발 작업 목록
- [Next.js 15 문서](https://nextjs.org/docs)
- [Clerk 문서](https://clerk.com/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Gemini API 문서](https://ai.google.dev/gemini-api/docs?hl=ko)

## 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

---

**이제 시작할 준비가 되었습니다! 화이팅! 🚀**
