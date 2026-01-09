# 도소매 가격비교 플랫폼 - 프로젝트 전체 개요

**작성일**: 2025년 11월  
**버전**: 1.0  
**프로젝트명**: AI 기반 B2B 도소매 가격 비교 플랫폼 (GenieMarket)

---

## 📋 목차

1. [프로젝트 소개](#1-프로젝트-소개)
2. [핵심 기능](#2-핵심-기능)
3. [기술 스택](#3-기술-스택)
4. [프로젝트 구조](#4-프로젝트-구조)
5. [데이터베이스 설계](#5-데이터베이스-설계)
6. [주요 API 엔드포인트](#6-주요-api-엔드포인트)
7. [인증 및 보안](#7-인증-및-보안)
8. [개발 환경 설정](#8-개발-환경-설정)
9. [배포 및 운영](#9-배포-및-운영)
10. [참고 문서](#10-참고-문서)

---

## 1. 프로젝트 소개

### 1.1 프로젝트 개요

**도소매 가격비교 플랫폼**은 소매점이 여러 도매점의 가격을 쉽게 비교할 수 있도록 도와주는 AI 기반 웹 서비스입니다.

### 1.2 핵심 가치

- 🤖 **AI 자동 상품명 정리**: 도매점마다 다른 상품명을 AI가 자동으로 표준화하여 진짜 최저가를 쉽게 찾을 수 있습니다
- 📊 **공영도매시장 실시간 시세**: 공영도매시장의 실시간 경매 시세를 함께 보여줘서 가격 협상의 기준점을 제공합니다
- 🔒 **익명 도매점 보호**: 도매점 정보는 익명으로 보호되어 안심하고 거래할 수 있습니다

### 1.3 타겟 사용자

- **소매점**: 여러 도매점 가격을 일일이 비교하기 힘든 분들
- **도매점**: 더 많은 소매점에게 상품을 알리고 싶은 분들

### 1.4 프로젝트 목표

"여러 도매점의 상품을 AI가 정리해서 최저가를 한눈에 비교할 수 있는 웹 플랫폼"

---

## 2. 핵심 기능

### 2.1 AI 자동 상품명 정리

- 도매점이 상품 등록할 때 상품명을 자유롭게 입력
- **Google Gemini API**가 자동으로 표준 이름으로 변환
- 예: "청양고추 1kg", "청양 고추 1키로" → 모두 "청양고추 1kg"로 통일

**구현 위치**:

- `lib/gemini.ts`: Gemini API 호출 유틸리티
- `app/api/products/standardize/route.ts`: 상품명 표준화 API

### 2.2 익명 도매점 최저가 비교

- 소매점은 상품명만 검색하면 됨
- 결과에는 "도매점 A", "도매점 B" 이런 식으로만 표시
- 진짜 상호명, 주소, 전화번호는 절대 안 보임
- 주문하면 그때 연락처만 공유

**구현 위치**:

- `app/(main)/products/compare/page.tsx`: 가격 비교 페이지
- `app/api/products/compare/route.ts`: 가격 비교 API

### 2.3 공영도매시장 실시간 시세 조회

- **한국농수산식품유통공사 공공 API**를 활용
- 전국 공영도매시장의 실시간 경매 가격 데이터 제공
- 소매점이 검색할 때 도매점 가격과 공영시장 시세를 함께 표시

**구현 위치**:

- `lib/market-api.ts`: 공공 API 호출 유틸리티
- `app/api/market-prices/route.ts`: 시세 조회 API
- `app/(main)/market-prices/page.tsx`: 시세 조회 페이지

### 2.4 간편 주문하기

- 소매점이 최저가 상품을 선택해서 주문서 작성
- 도매점에게 알림 전송 (이메일 또는 대시보드 알림)
- 실제 거래는 전화/문자로 진행 (웹 밖에서)

**구현 위치**:

- `app/api/orders/route.ts`: 주문 생성 API
- `components/orders/OrderModal.tsx`: 주문 모달 컴포넌트

---

## 3. 기술 스택

### 3.1 프론트엔드

#### Next.js 15.5.6

- **App Router**: 최신 Next.js 라우팅 시스템
- **Server Components**: 서버 사이드 렌더링 최적화
- **API Routes**: 백엔드 API 엔드포인트 구현

#### React 19

- 최신 React 기능 활용
- Server Components 지원

#### TypeScript

- 타입 안정성 보장
- `lib/types.ts`에 모든 타입 정의

#### Tailwind CSS v4

- 유틸리티 우선 CSS 프레임워크
- `app/globals.css`에 설정

#### shadcn/ui

- 재사용 가능한 UI 컴포넌트
- `components/ui/` 디렉토리

### 3.2 백엔드/데이터베이스

#### Supabase (PostgreSQL)

- PostgreSQL 데이터베이스
- Storage (파일 저장소)
- Row Level Security (RLS) - 개발 중 비활성화

**주요 파일**:

- `lib/supabase/clerk-client.ts`: 클라이언트 컴포넌트용
- `lib/supabase/server.ts`: 서버 컴포넌트용
- `lib/supabase/service-role.ts`: 관리자 권한용
- `lib/supabase/client.ts`: 공개 데이터용

#### Clerk

- 사용자 인증 및 관리
- Google, 이메일 등 다양한 로그인 방식 지원
- 한국어 UI 지원
- Supabase와 네이티브 통합

**주요 파일**:

- `middleware.ts`: Clerk 미들웨어
- `app/layout.tsx`: ClerkProvider 설정
- `app/api/webhooks/clerk/route.ts`: Clerk 웹훅

### 3.3 AI & 공공 데이터

#### Google Gemini API

- **모델**: Gemini 2.5 Flash (다양한 모델 자동 폴백 지원)
- **용도**: 상품명 자동 표준화
- **무료 할당량**: 월 1,500회
- **한국어 처리**: 우수

**구현 파일**:

- `lib/gemini.ts`: Gemini API 호출 유틸리티

#### 공공데이터포털 API

- **서비스**: 한국농수산식품유통공사 전국 공영도매시장 실시간 경매정보
- **용도**: 실시간 시세 조회
- **무료**: 공공데이터포털 API 키 발급

**구현 파일**:

- `lib/market-api.ts`: 공공 API 호출 유틸리티

### 3.4 개발 도구

#### 패키지 매니저

- **pnpm**: 권장 패키지 매니저

#### 코드 품질

- **ESLint**: 코드 린팅
- **Prettier**: 코드 포맷팅
- **TypeScript**: 타입 검사

---

## 4. 프로젝트 구조

```
geniemarket/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 관련 페이지
│   │   ├── sign-in/              # 로그인
│   │   └── sign-up/              # 회원가입
│   ├── (main)/                   # 메인 페이지 (소매점용)
│   │   ├── chat/                 # 챗봇
│   │   ├── market-prices/         # 시세 조회
│   │   ├── orders/                # 주문 내역
│   │   ├── products/              # 상품 검색/비교
│   │   └── profile/               # 프로필
│   ├── (vendor)/                 # 도매점 페이지
│   │   └── vendor/
│   │       ├── market-prices/     # 시세 참고
│   │       ├── orders/            # 주문 관리
│   │       └── products/          # 상품 관리
│   ├── api/                       # API Routes
│   │   ├── chat/                  # 챗봇 API
│   │   ├── market-prices/         # 시세 API
│   │   ├── orders/                # 주문 API
│   │   ├── products/              # 상품 API
│   │   ├── sync-user/             # 사용자 동기화
│   │   ├── user/                  # 사용자 API
│   │   └── webhooks/              # 웹훅
│   ├── layout.tsx                 # Root Layout
│   └── page.tsx                   # 홈페이지
│
├── components/                    # React 컴포넌트
│   ├── chat/                      # 챗봇 컴포넌트
│   │   ├── ChatBot.tsx
│   │   └── FloatingChatBot.tsx
│   ├── layout/                    # 레이아웃 컴포넌트
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MobileNav.tsx
│   │   └── SearchBar.tsx
│   ├── market-prices/             # 시세 컴포넌트
│   │   └── MarketPriceCard.tsx
│   ├── orders/                    # 주문 컴포넌트
│   │   ├── OrderCard.tsx
│   │   └── OrderModal.tsx
│   ├── products/                  # 상품 컴포넌트
│   │   ├── PriceCompareCard.tsx
│   │   ├── ProductCard.tsx
│   │   └── ProductForm.tsx
│   ├── providers/                  # Context 프로바이더
│   │   └── sync-user-provider.tsx
│   └── ui/                        # shadcn/ui 컴포넌트
│
├── lib/                           # 유틸리티 및 설정
│   ├── constants/                 # 상수
│   │   └── regions.ts
│   ├── supabase/                  # Supabase 클라이언트들
│   │   ├── clerk-client.ts
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── service-role.ts
│   ├── gemini.ts                  # Gemini API 유틸리티
│   ├── market-api.ts              # 공공 API 유틸리티
│   ├── types.ts                   # TypeScript 타입 정의
│   └── utils.ts                   # 공통 유틸리티
│
├── hooks/                         # Custom React Hooks
│   └── use-sync-user.ts
│
├── supabase/                      # Supabase 관련 파일
│   ├── config.toml                 # Supabase 설정
│   └── migrations/                 # 데이터베이스 마이그레이션
│       ├── geniemarket.sql
│       ├── setup_schema.sql
│       └── setup_storage.sql
│
├── docs/                           # 문서
│   ├── PRD.md                      # 제품 요구사항 문서
│   ├── TODO.md                     # 작업 목록
│   ├── Design.md                   # 디자인 문서
│   └── PROJECT_OVERVIEW.md         # 이 문서
│
├── .cursor/                        # Cursor AI 규칙
│   └── rules/                      # 개발 규칙
│
├── AGENTS.md                       # AI 에이전트 가이드
├── CLAUDE.md                       # Claude 설정
├── README.md                       # 프로젝트 README
├── package.json                    # 패키지 의존성
├── tsconfig.json                   # TypeScript 설정
├── next.config.ts                  # Next.js 설정
└── middleware.ts                   # Clerk 미들웨어
```

---

## 5. 데이터베이스 설계

### 5.1 주요 테이블

#### users (사용자)

```sql
- id: UUID (Primary Key, Clerk user ID)
- clerk_id: TEXT (Unique, Clerk User ID)
- email: TEXT
- name: TEXT
- nickname: TEXT (Unique, 선택적)
- user_type: TEXT ('vendor' | 'retailer')
- business_name: TEXT
- phone: TEXT
- region: TEXT (지역)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### products_raw (도매점이 등록한 원본 상품)

```sql
- id: UUID (Primary Key)
- vendor_id: UUID (Foreign Key → users.id)
- original_name: TEXT (도매점이 입력한 상품명)
- price: DECIMAL(10, 2)
- unit: TEXT
- stock: INTEGER
- image_url: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### products_standard (AI가 정리한 표준 상품)

```sql
- id: UUID (Primary Key)
- standard_name: TEXT (표준화된 상품명)
- category: TEXT
- unit: TEXT (표준 단위)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### product_mapping (원본-표준 연결)

```sql
- id: UUID (Primary Key)
- raw_product_id: UUID (Foreign Key → products_raw.id)
- standard_product_id: UUID (Foreign Key → products_standard.id)
- is_verified: BOOLEAN (도매점이 확인했는지)
- created_at: TIMESTAMP
```

#### market_prices (공영시장 시세)

```sql
- id: UUID (Primary Key)
- standard_product_id: UUID (Foreign Key → products_standard.id)
- market_name: TEXT (시장명: 가락, 강서 등)
- price: DECIMAL(10, 2) (경매가)
- grade: TEXT (등급: 상품/중품/하품)
- date: DATE (경매일자)
- created_at: TIMESTAMP
```

#### orders (주문)

```sql
- id: UUID (Primary Key)
- buyer_id: UUID (Foreign Key → users.id, 소매점)
- vendor_id: UUID (Foreign Key → users.id, 도매점)
- product_id: UUID (Foreign Key → products_raw.id)
- quantity: INTEGER
- total_price: DECIMAL(10, 2)
- status: TEXT ('pending' | 'confirmed' | 'cancelled')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 5.2 뷰 (Views)

#### v_product_prices

- 상품 가격 비교용 뷰
- 표준 상품별로 모든 도매점 가격 조회

#### v_lowest_prices

- 최저가 상품 정보 뷰
- 표준 상품별 최저가 도매점 정보

#### v_order_details

- 주문 상세 정보 뷰
- 주문, 상품, 사용자 정보 통합

### 5.3 Storage 버킷

#### uploads

- 사용자 파일 저장소
- 경로 구조: `{clerk_user_id}/{filename}`
- RLS 정책: 인증된 사용자만 자신의 폴더에 접근 가능

---

## 6. 주요 API 엔드포인트

### 6.1 인증 관련

#### POST /api/sync-user

- Clerk 사용자를 Supabase에 동기화
- 로그인 시 자동 호출

#### POST /api/webhooks/clerk

- Clerk 웹훅 처리
- user.created, user.updated, user.deleted 이벤트

### 6.2 상품 관련

#### GET /api/products

- 상품 목록 조회
- 쿼리 파라미터: `search`, `category`, `limit`, `offset`

#### POST /api/products

- 상품 등록 (도매점만)
- Body: `original_name`, `price`, `unit`, `stock`, `image_url`

#### GET /api/products/[productId]

- 상품 상세 조회

#### PATCH /api/products/[productId]

- 상품 수정 (도매점만)

#### DELETE /api/products/[productId]

- 상품 삭제 (도매점만)

#### POST /api/products/standardize

- AI 상품명 표준화
- Body: `original_name`
- Response: `standard_name`

#### GET /api/products/compare

- 가격 비교
- 쿼리 파라미터: `product` (표준 상품명)

### 6.3 시세 관련

#### GET /api/market-prices

- 공영시장 시세 조회
- 쿼리 파라미터: `productName`, `region`, `date`

### 6.4 주문 관련

#### GET /api/orders

- 주문 목록 조회
- 쿼리 파라미터: `type` ('buyer' | 'vendor')

#### POST /api/orders

- 주문 생성 (소매점만)
- Body: `product_id`, `quantity`, `total_price`

#### GET /api/orders/[orderId]

- 주문 상세 조회

#### PATCH /api/orders/[orderId]

- 주문 상태 변경
- Body: `status`

### 6.5 사용자 관련

#### GET /api/user/check-nickname

- 닉네임 중복 확인
- 쿼리 파라미터: `nickname`

#### POST /api/user/update-metadata

- Clerk publicMetadata 업데이트
- Body: `user_type`, `business_name`, `phone`

#### POST /api/user/update-profile

- 프로필 정보 업데이트

### 6.6 챗봇 관련

#### POST /api/chat

- 챗봇 메시지 처리
- Body: `message`, `conversation_id`
- Response: `response`, `conversation_id`

---

## 7. 인증 및 보안

### 7.1 Clerk 인증

#### 인증 흐름

1. Clerk가 사용자 인증 처리
2. `SyncUserProvider`가 로그인 시 자동으로 Clerk 사용자를 Supabase `users` 테이블에 동기화
3. Supabase 클라이언트가 Clerk 토큰을 사용하여 인증 (JWT 템플릿 불필요)

#### Supabase 클라이언트 종류

- **clerk-client.ts**: Client Component용 (`useClerkSupabaseClient` hook)
- **server.ts**: Server Component/Server Action용 (`createClerkSupabaseClient`)
- **service-role.ts**: 관리자 권한 작업용 (RLS 우회)
- **client.ts**: 인증 불필요한 공개 데이터용

### 7.2 Row Level Security (RLS)

- **개발 환경**: RLS 비활성화 (권한 에러 방지)
- **프로덕션 환경**: RLS 활성화 필수
- RLS 정책은 `auth.jwt()->>'sub'` (Clerk user ID)로 사용자 확인

### 7.3 API 보안

- 클라이언트에서 직접 API 호출 금지
- API Routes에서 인증 확인 (`auth()` 함수)
- 민감한 정보 (도매점 연락처) 별도 처리

---

## 8. 개발 환경 설정

### 8.1 필수 요구사항

- Node.js v18 이상
- pnpm (권장 패키지 매니저)
- Git

### 8.2 설치 및 실행

```bash
# 1. 저장소 클론
git clone <repository-url>
cd geniemarket

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
# .env.local 파일 생성 및 다음 변수 설정:
# - Clerk API 키
# - Supabase URL 및 키
# - Gemini API 키
# - 공공데이터포털 API 키

# 4. 개발 서버 실행
pnpm dev
```

### 8.3 환경 변수

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
AT_MARKET_API_KEY=xxxxx
# 또는
PUBLIC_DATA_API_KEY=xxxxx
AT_MARKET_API_URL=https://apis.data.go.kr/...
```

### 8.4 개발 명령어

```bash
# 개발 서버 실행 (Turbopack)
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 린팅
pnpm lint

# 코드 포맷팅
pnpm format
```

---

## 9. 배포 및 운영

### 9.1 배포 플랫폼

#### Vercel (권장)

- Next.js 최적화
- 자동 배포 (GitHub 연동)
- 환경 변수 설정 간편

### 9.2 배포 전 체크리스트

- [ ] 환경 변수 모두 설정
- [ ] Supabase RLS 정책 활성화 (프로덕션)
- [ ] Clerk 웹훅 URL 업데이트 (프로덕션 도메인)
- [ ] API 키 유효성 확인
- [ ] 데이터베이스 마이그레이션 완료

### 9.3 비용

- **Supabase**: 무료 플랜 (충분)
- **Clerk**: 무료 플랜 (월 10,000 MAU)
- **Gemini API**: 무료 할당량 (월 1,500회)
- **공공데이터 API**: 무료
- **Vercel**: Hobby 플랜 (무료)

**총 비용**: $0 (도메인 제외)

---

## 10. 참고 문서

### 10.1 프로젝트 문서

- `README.md`: 프로젝트 소개 및 시작 가이드
- `AGENTS.md`: AI 에이전트 가이드
- `docs/PRD.md`: 제품 요구사항 문서
- `docs/TODO.md`: 작업 목록
- `docs/Design.md`: 디자인 문서

### 10.2 외부 문서

- [Next.js 15 문서](https://nextjs.org/docs)
- [React 19 문서](https://react.dev)
- [Clerk 문서](https://clerk.com/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Gemini API 문서](https://ai.google.dev/gemini-api/docs?hl=ko)
- [공공데이터포털](https://www.data.go.kr/)

---

## 부록: 주요 파일 설명

### A. 핵심 유틸리티 파일

#### lib/gemini.ts

- Google Gemini API를 사용한 상품명 표준화
- 여러 모델 자동 폴백 지원
- 에러 처리 및 로깅

#### lib/market-api.ts

- 공공데이터포털 API를 사용한 시세 조회
- 여러 페이지 데이터 수집
- 지역 필터링 지원

#### lib/types.ts

- 모든 TypeScript 타입 정의
- 데이터베이스 스키마와 일치

### B. 주요 컴포넌트

#### components/chat/FloatingChatBot.tsx

- 플로팅 챗봇 컴포넌트
- Gemini API를 사용한 대화형 챗봇

#### components/providers/sync-user-provider.tsx

- Clerk → Supabase 사용자 동기화
- RootLayout에서 자동 실행

### C. 데이터베이스 마이그레이션

#### supabase/migrations/geniemarket.sql

- 모든 테이블 생성
- 인덱스 및 트리거 설정
- 뷰 생성

#### supabase/migrations/setup_storage.sql

- Storage 버킷 생성
- RLS 정책 설정

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025년 11월  
**작성자**: 오즈 프로젝트팀
