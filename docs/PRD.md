# 오즈 8주 프로젝트 PRD v1.1 - Web Version

## 🎯 AI 기반 B2B 도소매 가격 비교 플랫폼

### 📱 프로젝트 개요

**제품명:** 도소매 가격비교 (가칭)

**핵심 가치:**

- 도매점들의 다양한 상품명을 AI가 자동으로 정리해서, 소매점이 **진짜 최저가**를 쉽게 찾을 수 있게 해줍니다
- **공영도매시장의 실시간 경매 시세**를 함께 보여줘서 가격 협상의 기준점을 제공합니다
- 도매점 정보는 익명으로 보호되어 안심하고 거래할 수 있습니다

**타겟 사용자:**

- 소매점: 여러 도매점 가격을 일일이 비교하기 힘든 분들
- 도매점: 더 많은 소매점에게 상품을 알리고 싶은 분들

**한 줄 요약:** "여러 도매점의 상품을 AI가 정리해서 최저가를 한눈에 비교할 수 있는 웹 플랫폼"

---

## 🎓 우리 팀 현실 체크

### 우리가 가진 것

- ✅ 2달간 AI 활용 학습 경험
- ✅ 바이브코딩으로 3~4개 프로젝트 경험
- ✅ 5명 팀원 (8주 = 약 200시간/인)
- ✅ 열정과 아이디어!

### 우리가 조심해야 할 것

- ⚠️ 복잡한 금융 연동 (PG사, 정산)
- ⚠️ 고급 보안 시스템
- ⚠️ 완벽한 AI 모델 구축
- ⚠️ 대규모 데이터 처리

**전략:** 핵심 가치는 지키되, 8주 안에 **"작동하는 웹 서비스"**를 완성하는 것이 목표!

---

## 💡 해결하려는 문제 (단순화)

### 문제 1: 가격 비교가 너무 어려워요

- 도매점마다 상품명이 달라요: "청양고추 1kg", "청양 고추 1키로", "청양고추(1000g)"
- 소매점 사장님이 일일이 전화해서 가격 물어봐야 해요
- 시간도 오래 걸리고, 정말 최저가인지 확신도 없어요

### 문제 2: 도매점 정보가 노출되는 게 걱정돼요

- 소매점에 직접 연락처를 주면, 나중에 플랫폼 거치지 않고 직거래할까봐 걱정
- 그렇다고 정보를 아예 안 주면 소매점이 불안해해요

---

## 🎯 우리의 해결책 (8주 완성 가능!)

### 핵심 기능 4가지

#### 1️⃣ AI 자동 상품명 정리

**어떻게:**

- 도매점이 상품 등록할 때 상품명을 자유롭게 입력
- **Google Gemini API**가 자동으로 표준 이름으로 변환
- 예: "청양고추 1kg", "청양 고추 1키로" → 모두 "청양고추 1kg"로 통일

**초보자 팀에 맞게:**

- Gemini는 무료 할당량이 많아서 부담 없이 테스트 가능!
- 한국어 이해도가 높아서 농수산물 이름 인식에 유리
- 처음부터 완벽하지 않아도 OK!
- 틀린 것은 도매점이 직접 수정할 수 있게 하기
- 목표: 70% 정도만 맞춰도 충분히 유용함

#### 2️⃣ 익명 도매점 최저가 비교

**어떻게:**

- 소매점은 상품명만 검색하면 됨
- 결과에는 "도매점 A", "도매점 B" 이런 식으로만 표시
- 진짜 상호명, 주소, 전화번호는 절대 안 보임
- 주문하면 그때 연락처만 공유

**초보자 팀에 맞게:**

- 복잡한 RLS 대신, API Routes에서 간단한 필터링으로 처리
- 중요한 정보는 별도 테이블에 분리

#### 3️⃣ 공영도매시장 실시간 시세 조회 ⭐ NEW!

**어떻게:**

- **한국농수산식품유통공사 공공 API**를 활용
- 전국 공영도매시장의 실시간 경매 가격 데이터 제공
- 소매점이 검색할 때 도매점 가격과 공영시장 시세를 함께 표시

**예시 화면:**

```
🥬 청양고추 1kg

[도매점 가격]
- 도매점 A: 8,500원
- 도매점 B: 9,000원
- 도매점 C: 8,800원

[오늘의 공영시장 시세] 📊
- 가락시장: 9,200원 (상품)
- 강서시장: 8,900원 (중품)
- 평균 경매가: 9,050원
```

**초보자 팀에 맞게:**

- 공공데이터포털에서 API 키 무료 발급 (5분 소요)
- REST API 단순 호출만으로 사용 가능
- 데이터가 안 오면 "시세 정보 없음"으로 표시 (에러 처리 간단)

**이 기능의 장점:**

- 💰 소매점: 도매점 가격이 공정한지 판단 가능
- 📈 도매점: 시장 시세 대비 경쟁력 있는 가격 설정 가능
- 🎯 실제 데이터 활용으로 프로젝트의 실용성 UP!

#### 4️⃣ 간편 주문하기

**어떻게:**

- 소매점이 최저가 상품을 선택해서 주문서 작성
- 도매점에게 알림 전송 (이메일 또는 대시보드 알림)
- 실제 거래는 전화/문자로 진행 (웹 밖에서)

**초보자 팀에 맞게:**

- 실제 결제 연동은 하지 않음 (너무 복잡!)
- 주문서를 전달하는 것에 집중
- V2에서 결제 기능 추가 검토

---

## 🛠 기술 스택 (초보자 친화적)

### 프론트엔드

**Next.js 15 (App Router)**

```
이유:
✅ React 기반으로 익숙함
✅ Server Components로 빠른 초기 로딩
✅ API Routes로 백엔드 없이 API 구현 가능
✅ 이미지 최적화 기본 제공
✅ TypeScript 완벽 지원
✅ 배포 쉬움 (Vercel)
```

**스타일링: Tailwind CSS**

```
✅ 빠른 개발 속도
✅ 반응형 디자인 쉬움
✅ 일관된 디자인 시스템
✅ 러닝 커브 낮음
```

### 백엔드/데이터베이스

**Supabase**

```
✅ PostgreSQL 데이터베이스
✅ Storage (상품 이미지)
✅ 무료 플랜 충분함
✅ RLS 사용 안 함 (API Routes에서 검증)
```

**Clerk (인증/회원관리)**

```
✅ 회원가입/로그인 자동 처리
✅ 이메일, 소셜 로그인 지원
✅ 사용자 관리 대시보드 제공
✅ Next.js 완벽 호환
✅ 무료 플랜으로 시작 가능
```

### AI 기능

**Google Gemini API (Gemini 1.5 Flash)**

```
✅ 무료 할당량이 매우 많음 (월 1,500회 무료!)
✅ 한국어 처리 성능이 뛰어남
✅ 농수산물 이름 인식에 특화
✅ 간단한 API 호출로 사용 가능
✅ 테스트 기간 거의 $0
```

### 공공 데이터

**한국농수산식품유통공사 공공 API**

```
✅ 전국 공영도매시장 실시간 경매 정보
✅ 무료 사용 (공공데이터포털 API 키 발급)
✅ REST API로 간단하게 호출
✅ 프로젝트에 실용성 추가
```

### 알림 기능 (선택 사항)

**이메일 알림: Resend 또는 SendGrid**

```
✅ Next.js API Routes에서 쉽게 연동
✅ 무료 플랜 제공
✅ 주문 알림 전송
```

---

## 📊 데이터베이스 설계 (단순화)

### 주요 테이블 6개!

#### 1. users (사용자)

```sql
- id (UUID, Clerk userId)
- email
- user_type (도매점/소매점)
- business_name (상호명)
- phone
- created_at
- updated_at
```

#### 2. products_raw (도매점이 등록한 원본 상품)

```sql
- id
- vendor_id (도매점 ID)
- original_name (도매점이 입력한 상품명)
- price
- unit (단위)
- stock (재고)
- image_url (상품 이미지)
- created_at
- updated_at
```

#### 3. products_standard (AI가 정리한 표준 상품)

```sql
- id
- standard_name (표준화된 상품명)
- category (카테고리)
- unit (표준 단위)
- created_at
- updated_at
```

#### 4. product_mapping (원본-표준 연결)

```sql
- id
- raw_product_id
- standard_product_id
- is_verified (도매점이 확인했는지)
- created_at
```

#### 5. market_prices (공영시장 시세) ⭐ NEW!

```sql
- id
- standard_product_id (표준 상품 ID)
- market_name (시장명: 가락, 강서 등)
- price (경매가)
- grade (등급: 상품/중품/하품)
- date (경매일자)
- created_at
```

**용도:** 공공 API에서 받아온 시세를 저장해서 빠르게 조회

#### 6. orders (주문)

```sql
- id
- buyer_id (소매점 ID)
- vendor_id (도매점 ID)
- product_id
- quantity
- total_price
- status (대기중/확인됨/취소)
- created_at
- updated_at
```

**이게 전부입니다!** 나중에 필요하면 더 추가하면 됩니다.

---

## 🎨 화면 구성 (웹 반응형)

### 레이아웃 구조

#### Desktop (1024px+)

```
┌────────────────────────────────────────────────────────┐
│ ┌────────────────────────────────────────────────────┐ │
│ │  Header: 로고 | 검색 | 마이페이지 | 로그인          │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌──────────┬─────────────────────────────────────────┐ │
│ │          │                                         │ │
│ │ Sidebar  │         Main Content                    │ │
│ │ (240px)  │         (나머지 공간)                    │ │
│ │          │                                         │ │
│ │ 🏠 홈    │                                         │ │
│ │ 📦 상품  │                                         │ │
│ │ 📊 시세  │                                         │ │
│ │ 📋 주문  │                                         │ │
│ │          │                                         │ │
│ └──────────┴─────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

#### Mobile (< 768px)

```
┌──────────────────────────┐
│ ┌──────────────────────┐ │ ← Header
│ │ 로고      🔍 👤     │ │
│ └──────────────────────┘ │
│                          │
│ ┌────────────────────┐   │
│ │   Main Content     │   │
│ │                    │   │
│ └────────────────────┘   │
│                          │
│ ┌──────────────────────┐ │ ← Bottom Nav
│ │ 🏠  📦  📊  📋  👤  │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### 주요 페이지 (소매점용)

#### 1. 홈 (`/`)

- 최근 등록된 상품
- 인기 상품
- 공영시장 시세 요약

#### 2. 상품 검색 (`/products`)

- 검색창 (상단 고정)
- 필터 (카테고리, 지역)
- 상품 카드 그리드 (3-4열)
- 무한 스크롤

#### 3. 가격 비교 페이지 (`/products/compare?product=[표준상품명]`)

**레이아웃:**

```
┌─────────────────────────────────────────┐
│ 🥬 청양고추 1kg                          │
│                                         │
│ [도매점 가격 비교]                       │
│ ┌─────────────────────────────────────┐ │
│ │ 도매점 A     8,500원    [주문하기]   │ │
│ │ 도매점 B     9,000원    [주문하기]   │ │
│ │ 도매점 C     8,800원    [주문하기]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [오늘의 공영시장 시세] 📊                │
│ ┌─────────────────────────────────────┐ │
│ │ 가락시장     9,200원 (상품)           │ │
│ │ 강서시장     8,900원 (중품)           │ │
│ │ 평균 경매가  9,050원                 │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### 4. 실시간 시세 조회 (`/market-prices`)

- 공영도매시장 시세 목록
- 날짜별 필터
- 상품별 필터
- 시세 그래프 (선택 사항)

#### 5. 주문하기 모달

- 수량 입력
- 배송지 입력
- 요청사항
- 주문서 전송

#### 6. 내 주문 내역 (`/orders`)

- 주문 목록
- 상태별 필터 (대기중/확인됨/완료/취소)
- 주문 상세 보기

### 주요 페이지 (도매점용)

#### 1. 상품 등록 (`/vendor/products/new`)

- 상품명 입력
- 가격, 단위, 재고 입력
- 이미지 업로드
- AI 표준화 미리보기
- 저장

#### 2. 내 상품 목록 (`/vendor/products`)

- 등록한 상품 목록
- AI 표준화 결과 확인
- 수정/삭제
- 재고 관리

#### 3. 시장 시세 참고 (`/vendor/market-prices`)

- 내 상품의 공영시장 시세 비교
- 가격 경쟁력 분석

#### 4. 주문 관리 (`/vendor/orders`)

- 들어온 주문 목록
- 주문 확인/취소
- 소매점 연락처 확인

---

## 🎨 컴포넌트 구조

```
app/
├── (auth)/
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx              # Clerk 로그인
│   └── sign-up/
│       └── [[...sign-up]]/
│           └── page.tsx              # Clerk 회원가입
├── (main)/
│   ├── layout.tsx                   # Sidebar + Header
│   ├── page.tsx                     # 홈
│   ├── products/
│   │   ├── page.tsx                 # 상품 검색
│   │   └── compare/
│   │       └── page.tsx             # 가격 비교
│   ├── market-prices/
│   │   └── page.tsx                 # 실시간 시세
│   └── orders/
│       ├── page.tsx                 # 주문 내역
│       └── [orderId]/
│           └── page.tsx             # 주문 상세
├── (vendor)/
│   ├── layout.tsx                   # 도매점 레이아웃
│   └── vendor/
│       ├── products/
│       │   ├── page.tsx             # 상품 목록
│       │   ├── new/
│       │   │   └── page.tsx         # 상품 등록
│       │   └── [productId]/
│       │       └── edit/
│       │           └── page.tsx     # 상품 수정
│       ├── orders/
│       │   ├── page.tsx             # 주문 관리
│       │   └── [orderId]/
│       │       └── page.tsx         # 주문 상세
│       └── market-prices/
│           └── page.tsx             # 시세 참고
└── api/
    ├── products/
    │   ├── route.ts                 # GET: 상품 목록
    │   ├── [productId]/
    │   │   └── route.ts             # GET/PATCH/DELETE: 상품 상세
    │   └── standardize/
    │       └── route.ts             # POST: AI 표준화
    ├── market-prices/
    │   └── route.ts                 # GET: 공영시장 시세
    ├── orders/
    │   ├── route.ts                 # GET/POST: 주문 목록/생성
    │   └── [orderId]/
    │       └── route.ts             # GET/PATCH: 주문 상세/수정
    └── webhooks/
        └── clerk/
            └── route.ts             # Clerk 웹훅

components/
├── layout/
│   ├── Header.tsx                   # 헤더
│   ├── Sidebar.tsx                  # 사이드바 (Desktop)
│   ├── MobileNav.tsx                # 하단 네비 (Mobile)
│   └── SearchBar.tsx                # 검색창
├── products/
│   ├── ProductCard.tsx              # 상품 카드
│   ├── ProductList.tsx              # 상품 목록
│   ├── ProductFilters.tsx           # 필터
│   ├── PriceCompareCard.tsx         # 가격 비교 카드
│   └── ProductForm.tsx              # 상품 등록/수정 폼
├── market-prices/
│   ├── MarketPriceCard.tsx          # 시세 카드
│   ├── MarketPriceList.tsx          # 시세 목록
│   └── PriceChart.tsx               # 시세 그래프 (선택 사항)
├── orders/
│   ├── OrderCard.tsx                # 주문 카드
│   ├── OrderList.tsx                # 주문 목록
│   ├── OrderModal.tsx               # 주문 모달
│   └── OrderStatusBadge.tsx         # 상태 뱃지
└── ui/                              # shadcn/ui 컴포넌트
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── input.tsx
    ├── select.tsx
    ├── skeleton.tsx
    └── toast.tsx

lib/
├── supabase.ts                      # Supabase 클라이언트
├── gemini.ts                        # Gemini API 호출
├── market-api.ts                    # 공공 API 호출
└── types.ts                         # TypeScript 타입
```

---

## 📅 8주 개발 일정 (현실적)

### Week 1-2: 기초 세팅 및 학습 (2주)

**목표:** 개발 환경 구축 및 기본 개념 이해

- [ ] Next.js 15 프로젝트 생성 (App Router)
- [ ] Tailwind CSS 설정
- [ ] Supabase 프로젝트 생성 및 테이블 만들기
- [ ] Clerk 프로젝트 생성 및 Next.js 연동
- [ ] 기본 레이아웃 구조 (Header, Sidebar, MobileNav)
- [ ] Git/GitHub 협업 방법 익히기

**팁:** 처음이라 느릴 수 있어요. 서로 도와가며 천천히!

### Week 3-4: 핵심 기능 개발 (2주)

**목표:** 로그인, 상품 등록, AI 표준화, 공공 API 연동

- [ ] 회원가입/로그인 페이지 (Clerk 연동)
- [ ] Clerk 웹훅 설정 (Supabase에 사용자 정보 저장)
- [ ] 도매점 상품 등록 페이지
- [ ] **Gemini API로 상품명 표준화 기능** (API Route)
- [ ] 표준 상품 목록 보기
- [ ] **공공데이터포털 API 키 발급 및 연동 테스트**

**분담 예시:**

- 팀원 A: 로그인/회원가입 페이지
- 팀원 B: Clerk 웹훅 + Supabase 연동
- 팀원 C: 상품 등록 페이지
- 팀원 D: **Gemini API 연동** (API Route)
- 팀원 E: **공공 API 연동** (시세 조회 API Route)

### Week 5-6: 검색 및 비교 기능 (2주)

**목표:** 소매점이 상품 찾고 비교하기 + 실시간 시세 통합

- [ ] 상품 검색 페이지
- [ ] 상품 필터링 (카테고리, 지역)
- [ ] 가격 비교 페이지 (도매점 익명화 + **공영시장 시세 함께 표시**)
- [ ] **실시간 시세 조회 페이지 완성**
- [ ] 주문하기 모달
- [ ] 도매점 주문 관리 페이지

### Week 7: 통합 및 테스트 (1주)

**목표:** 모든 기능 연결하고 버그 수정

- [ ] 전체 시나리오 테스트 (가입→등록→검색→주문)
- [ ] 버그 찾아서 수정하기
- [ ] 반응형 디자인 테스트 (모바일/태블릿/데스크톱)
- [ ] 로딩 상태 및 에러 처리 개선
- [ ] UI/UX 개선

### Week 8: 마무리 및 발표 준비 (1주)

**목표:** 완성도 높이고 발표 준비

- [ ] 샘플 데이터 입력 (도매점 10개, 상품 50개)
- [ ] SEO 최적화 (메타태그)
- [ ] 발표 시연 영상 촬영
- [ ] 발표 자료(PPT) 작성
- [ ] Vercel 배포
- [ ] 최종 점검

---

## ✅ MVP 범위 (꼭 해야 할 것 vs 나중에 할 것)

### 🟢 꼭 완성해야 할 기능 (P0)

1. ✅ 도매점/소매점 회원가입 및 로그인 (Clerk)
2. ✅ 도매점: 상품 등록 (이미지 포함)
3. ✅ **Gemini AI: 상품명 자동 표준화 (70% 정도 성공하면 OK)**
4. ✅ 소매점: 표준 상품 검색 및 필터링
5. ✅ 소매점: 도매점별 가격 비교 (익명)
6. ✅ **소매점: 공영도매시장 실시간 시세 조회**
7. ✅ 소매점: 주문서 작성 및 전송
8. ✅ 도매점: 주문 알림 받기 (대시보드)

### 🟡 있으면 좋은 기능 (P1)

- 상품 카테고리 분류
- 지역별 필터
- 주문 히스토리
- 간단한 통계 대시보드
- 시세 그래프

### 🔴 일단 제외할 기능 (V2에서)

- ❌ 실제 결제 연동 (너무 복잡)
- ❌ PG사 분할 정산 (법인 필요)
- ❌ 고급 RLS 보안 (시간 많이 걸림)
- ❌ 배송 추적
- ❌ 재고 실시간 연동
- ❌ 채팅 기능
- ❌ 리뷰/평점 시스템

**중요:** 8주 안에 P0만 완성해도 **대성공**입니다! 욕심내지 마세요! 😊

---

## 🎯 성공 기준 (현실적)

### 기술적 목표

- [ ] 웹사이트가 모든 기기에서 정상 작동
- [ ] 도매점 5개가 상품 50개 등록
- [ ] AI 표준화 성공률 70% 이상
- [ ] 소매점이 검색해서 주문까지 완료 가능
- [ ] 큰 버그 없이 시연 가능
- [ ] Lighthouse 점수 70점 이상

### 학습 목표

- [ ] Next.js 웹 개발 경험
- [ ] 데이터베이스 설계 및 사용
- [ ] API Routes 구현
- [ ] 팀 협업 및 Git 사용
- [ ] AI API 활용 경험
- [ ] 공공 API 연동 경험

### 발표 목표

- [ ] 실제 작동하는 웹사이트 시연
- [ ] 문제→해결→결과 스토리 명확히
- [ ] 어려웠던 점과 배운 점 공유

---

## ⚠️ 예상 어려움과 해결책

### 어려움 1: Next.js App Router가 처음이에요

**해결책:**

- Next.js 공식 문서의 튜토리얼부터 시작 (2-3일)
- YouTube "Next.js 15 입문" 강의 함께 보기
- Server Components vs Client Components 개념 이해
- 간단한 페이지부터 하나씩 만들기
- 모르면 ChatGPT/Claude에게 물어보기!

### 어려움 2: API Routes 구현이 어려워요

**해결책:**

- Next.js API Routes는 일반 함수처럼 작성
- `export async function GET(request)` 형태로 시작
- Supabase 쿼리는 공식 문서 예제 참고
- Postman이나 Thunder Client로 API 테스트
- 에러는 `try-catch`로 잡아서 처리

### 어려움 3: AI API 호출이 어려워요

**해결책:**

- **Google AI Studio**에서 Gemini 먼저 테스트 (무료, 회원가입만!)
- 단순한 프롬프트부터 시작: "다음 상품명을 표준화해줘: {상품명}"
- API Route에서 호출하면 API 키 노출 안 됨
- 실패해도 원본 상품명 그대로 보여주기
- Gemini는 한국어 잘 이해해서 초보자가 사용하기 쉬움!

### 어려움 4: 공공 API 연동이 복잡해요

**해결책:**

- 공공데이터포털에서 API 키 발급 (5분이면 완료)
- Postman이나 Thunder Client로 먼저 API 호출 테스트
- 응답 데이터가 복잡하면 필요한 필드만 추출
- 데이터가 없어도 에러 안 나게 방어 코드 작성
- API Route에서 호출하면 CORS 문제 없음

### 어려움 5: 팀 협업이 꼬여요

**해결책:**

- 매일 아침 10분 스탠드업 미팅 (어제 뭐 했고, 오늘 뭐 할지)
- Git Branch 전략: main(최종) / dev(개발) / feature/기능명
- 코드 합칠 때는 꼭 다른 팀원이 리뷰
- Notion이나 Trello로 할 일 관리

### 어려움 6: 막혔을 때 어떻게 하죠?

**해결책:**

1. 에러 메시지 구글링 (보통 30분 안에 해결)
2. ChatGPT/Claude에게 전체 에러 복사해서 물어보기
3. 팀원들에게 도움 요청
4. 안 되면 다른 방법 시도 (완벽하지 않아도 작동하면 OK!)

---

## 💰 예상 비용 (완전 무료! 🎉)

| 항목               | 비용     | 비고                                  |
| ------------------ | -------- | ------------------------------------- |
| Supabase           | **무료** | Free 플랜으로 충분                    |
| **Clerk**          | **무료** | Free 플랜 (월 10,000 MAU)             |
| **Gemini API**     | **무료** | 월 1,500회 무료 (충분히 테스트 가능!) |
| **공공데이터 API** | **무료** | 한국농수산식품유통공사 공공 API       |
| Vercel 배포        | **무료** | Hobby 플랜                            |
| 도메인 (선택)      | $10/년   | 나중에 필요하면                       |
| **총계**           | **$0!**  | 도메인 제외하면 완전 무료! 😊         |

**초보자 팀에게 큰 장점:**

- 💰 비용 걱정 없이 마음껏 테스트 가능
- 🚀 팀원 5명 모두 자유롭게 API 호출 테스트
- 📚 실패해도 비용 부담 없어서 학습에 최적

---

## 🚀 8주 후 목표

### 최소 목표 (이것만 되어도 성공!)

"실제 작동하는 웹사이트를 완성해서 친구/가족에게 보여줄 수 있다"

### 이상적 목표

- 실제 소상공인 5명이 사용해보고 피드백 받기
- 팀 포트폴리오로 활용
- 오픈소스로 공개해서 GitHub 스타 받기

### 학습 목표

- 웹 개발 전체 과정 경험
- 데이터베이스 설계 능력
- AI API 활용 능력
- 팀 프로젝트 협업 경험
- **가장 중요:** 무언가를 끝까지 완성해본 경험!

---

## 📝 다음 단계 (바로 시작하기)

### 1주차에 해야 할 구체적 작업

#### Day 1-2: 환경 세팅

```bash
# 프로젝트 생성
npx create-next-app@latest price-compare-web --typescript --tailwind --app

# 필요한 패키지 설치
npm install @clerk/nextjs @supabase/supabase-js
npm install @google/generative-ai
npm install lucide-react class-variance-authority clsx tailwind-merge

# shadcn/ui 초기화
npx shadcn-ui@latest init
```

#### Day 3-4: Supabase, Clerk 세팅 및 API 키 발급

```
1. Supabase 계정 생성 (1명이 대표로)
2. 새 프로젝트 만들기
3. 위의 6개 테이블 생성 (SQL Editor)
4. Storage 버킷 생성 (product-images)
5. 팀원 모두에게 접근 권한 공유
6. Clerk 계정 생성 및 애플리케이션 생성
7. Clerk Next.js 설정 (환경변수)
8. Google AI Studio에서 Gemini API 키 발급 (무료)
9. 공공데이터포털에서 농수산식품 API 키 신청
```

#### Day 5: 역할 분담

```
예시:
- 팀원 A: 로그인/회원가입 페이지
- 팀원 B: 상품 등록 페이지
- 팀원 C: 상품 검색 페이지
- 팀원 D: 가격 비교 페이지
- 팀원 E: 주문 기능

(유동적으로 서로 도와가며 진행)
```

---

## 🎓 추천 학습 자료

### Next.js 시작하기

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Next.js 15 튜토리얼](https://nextjs.org/learn)
- YouTube: "코딩애플 Next.js" (한글)
- YouTube: "Next.js 15 입문" 검색

### Clerk 시작하기

- [Clerk 공식 문서](https://clerk.com/docs)
- [Clerk Next.js 가이드](https://clerk.com/docs/quickstarts/nextjs)
- Clerk 대시보드에서 직관적인 사용자 관리 가능

### Supabase 시작하기

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Next.js 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- YouTube: "Supabase 입문" 검색

### **Gemini API** (한국어 자료 많음!)

- [Google AI Studio](https://aistudio.google.com/) - 브라우저에서 바로 테스트
- [Gemini API 공식 문서 (한글)](https://ai.google.dev/gemini-api/docs?hl=ko)
- YouTube: "Gemini API 사용법" 검색
- 무료 할당량이 많아서 초보자에게 완벽!

### 공공데이터 API

- [공공데이터포털](https://www.data.go.kr/) - 회원가입 및 API 키 발급
- 검색: "한국농수산식품유통공사\_전국 공영도매시장 실시간 경매정보"
- API 사용 가이드 문서 다운로드 가능
- Postman으로 먼저 테스트해보기 추천

---

## 💪 팀에게 전하는 메시지

**초보자라는 것은 약점이 아닙니다!**

- 완벽하지 않아도 괜찮아요
- 막히면 서로 도와가며 해결하면 돼요
- 작은 기능부터 하나씩 완성하는 게 중요해요
- **8주 후에 "우리가 만든 웹사이트"를 친구들에게 자랑할 수 있다면 대성공입니다!**

**원래 PRD의 비전은 유지하되, 현실적으로 완성 가능한 범위로 시작하세요.**
나중에 V2, V3로 계속 발전시킬 수 있습니다! 🚀

---

## 📋 반응형 브레이크포인트

```css
/* Mobile */
@media (max-width: 767px) {
  - Bottom Navigation 표시
  - Sidebar 숨김
  - 1열 상품 그리드
  - 검색창 전체 너비
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  - Sidebar 표시 (축소형)
  - 2열 상품 그리드
  - 검색창 고정
}

/* Desktop */
@media (min-width: 1024px) {
  - Full Sidebar (240px)
  - 3-4열 상품 그리드
  - 가격 비교 페이지: 좌우 분할 레이아웃
}
```

---

## 🎨 컬러 & 타이포그래피

### 주요 컬러

```css
/* 브랜드 */
--primary: #10b981; /* 녹색 계열 (농수산물 이미지) */
--primary-dark: #059669;

/* 배경 */
--background: #f9fafb;
--card-background: #ffffff;
--border: #e5e7eb;

/* 텍스트 */
--text-primary: #111827;
--text-secondary: #6b7280;

/* 상태 */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

### 타이포그래피

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

/* 크기 */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */

/* 굵기 */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## 🔒 보안 및 환경변수

### 필수 환경변수

```bash
# .env.local

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Google Gemini API
GEMINI_API_KEY=xxxxx

# 공공데이터 API
PUBLIC_DATA_API_KEY=xxxxx
```

### API 보안 원칙

- ✅ 클라이언트에서 직접 API 호출 금지
- ✅ API Routes에서 인증 확인
- ✅ Clerk `auth()` 함수로 사용자 확인
- ✅ 민감한 정보 (도매점 연락처) 별도 처리
- ✅ Rate Limiting 고려 (추후)

---

## 버전 정보

- **버전:** 1.1 (Web Version - Next.js 15)
- **작성일:** 2025년 11월 10일
- **기반:** PRD v1.1 (Flutter App Version)
- **주요 변경사항:**
  - Flutter → **Next.js 15 (App Router)** 변경
  - 웹 반응형 디자인 구조 추가
  - API Routes 기반 백엔드 구조
  - Clerk 인증 (웹 버전)
  - Vercel 배포 최적화
  - 완전 무료 구조 유지

## 📋 핵심 차별화 포인트 요약

1. 🤖 **Gemini AI 상품명 표준화** - 도매점별 다른 이름을 자동 정리
2. 📊 **실시간 공영시장 시세** - 가격 협상의 기준점 제공
3. 🔒 **도매점 익명화** - 안심하고 거래할 수 있는 환경
4. 💰 **완전 무료** - 초보자 팀도 부담 없이 개발 가능
5. 🌐 **웹 기반** - 설치 없이 바로 사용 가능, 크로스 플랫폼

---

**이제 시작할 준비가 되었습니다! 화이팅! 🚀**
