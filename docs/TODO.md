# 🎯 도소매 가격비교 플랫폼 TODO 리스트

## 📌 프로젝트 정보

- **프로젝트명**: AI 기반 B2B 도소매 가격 비교 플랫폼 (Web)
- **기간**: 8주
- **팀원**: 5명
- **기술 스택**: Next.js 15, TypeScript, Tailwind CSS, Supabase, Clerk, Gemini API

---

## 📅 Week 1-2: 기초 세팅 및 학습 (2주)

### 🔧 환경 세팅 (Day 1-2)

#### 프로젝트 초기화

- [x] Next.js 15 프로젝트 생성
  ```bash
  npx create-next-app@latest price-compare-web --typescript --tailwind --app
  ```
  > ✅ 이미 완료됨 (프로젝트가 생성되어 있음)
- [ ] Git 저장소 생성 및 초기 커밋
  > ⚠️ Git 저장소는 있지만 파일들이 아직 커밋되지 않음. 다음 명령어로 초기 커밋 필요:
  >
  > ```bash
  > git add .
  > git commit -m "Initial commit: Next.js 15 프로젝트 초기화"
  > ```
- [x] `.gitignore` 파일 확인 (.env.local 포함 확인)
  > ✅ 완료됨 (.env.local\* 포함되어 있음)
- [x] README.md 작성 (프로젝트 소개, 실행 방법)
  > ✅ 완료됨 (PRD에 맞게 업데이트 완료)

#### 패키지 설치

- [ ] 필수 패키지 설치
  ```bash
  npm install @clerk/nextjs @supabase/supabase-js
  npm install @google/generative-ai
  npm install lucide-react class-variance-authority clsx tailwind-merge
  ```
- [ ] shadcn/ui 초기화
  ```bash
  npx shadcn-ui@latest init
  ```
- [ ] 기본 컴포넌트 설치 (button, card, dialog, input, select, skeleton, toast)
  ```bash
  npx shadcn-ui@latest add button card dialog input select skeleton toast
  ```

#### 개발 환경 설정

- [ ] VS Code 또는 선호하는 IDE 설정
- [ ] ESLint, Prettier 설정 (팀 코딩 컨벤션)
- [ ] 각자 로컬에서 `npm run dev` 실행 확인
- [ ] 브라우저에서 localhost:3000 접속 확인

### 🗄️ Supabase 세팅 (Day 3)

#### Supabase 프로젝트 생성

- [ ] Supabase 계정 생성 (1명 대표)
- [ ] 새 프로젝트 생성 (프로젝트명: price-compare-web)
- [ ] 프로젝트 URL 및 API 키 복사
- [ ] 팀원들에게 Supabase 대시보드 접근 권한 공유

#### 데이터베이스 테이블 생성

- [ ] `users` 테이블 생성

  ```sql
  CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('vendor', 'retailer')),
    business_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] `products_raw` 테이블 생성

  ```sql
  CREATE TABLE products_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_name TEXT NOT NULL,
    price INTEGER NOT NULL,
    unit TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] `products_standard` 테이블 생성

  ```sql
  CREATE TABLE products_standard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_name TEXT UNIQUE NOT NULL,
    category TEXT,
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] `product_mapping` 테이블 생성

  ```sql
  CREATE TABLE product_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_product_id UUID REFERENCES products_raw(id) ON DELETE CASCADE,
    standard_product_id UUID REFERENCES products_standard(id) ON DELETE CASCADE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] `market_prices` 테이블 생성

  ```sql
  CREATE TABLE market_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_product_id UUID REFERENCES products_standard(id) ON DELETE CASCADE,
    market_name TEXT NOT NULL,
    price INTEGER NOT NULL,
    grade TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] `orders` 테이블 생성
  ```sql
  CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products_raw(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

#### Supabase Storage 설정

- [ ] Storage 버킷 생성 (`product-images`)
- [ ] 버킷 공개 설정 (Public bucket)
- [ ] 이미지 업로드 테스트

### 🔐 Clerk 세팅 (Day 4)

#### Clerk 프로젝트 생성

- [ ] Clerk 계정 생성 (https://clerk.com)
- [ ] 새 애플리케이션 생성
- [ ] API 키 복사 (Publishable Key, Secret Key)

#### Clerk Next.js 연동

- [ ] 환경변수 설정 (.env.local)

  ```bash
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
  CLERK_SECRET_KEY=sk_test_xxxxx
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
  ```

- [ ] `middleware.ts` 생성 (Clerk 인증 미들웨어)
- [ ] `app/layout.tsx`에 ClerkProvider 추가
- [ ] 회원가입 페이지 라우트 생성 (`app/(auth)/sign-up/[[...sign-up]]/page.tsx`)
- [ ] 로그인 페이지 라우트 생성 (`app/(auth)/sign-in/[[...sign-in]]/page.tsx`)
- [ ] 로그인/로그아웃 기능 테스트

#### Clerk 웹훅 설정

- [ ] Clerk 대시보드에서 웹훅 엔드포인트 추가
- [ ] `app/api/webhooks/clerk/route.ts` 생성
- [ ] 사용자 생성 시 Supabase `users` 테이블에 자동 저장
- [ ] 웹훅 테스트 (새 사용자 가입 → Supabase 확인)

### 🔑 API 키 발급 (Day 4)

#### Google Gemini API

- [ ] Google AI Studio 접속 (https://aistudio.google.com)
- [ ] API 키 생성
- [ ] 환경변수에 추가 (`GEMINI_API_KEY=xxxxx`)
- [ ] 간단한 테스트 (브라우저에서 프롬프트 입력 확인)

#### 공공데이터포털 API

- [ ] 공공데이터포털 회원가입 (https://www.data.go.kr)
- [ ] "한국농수산식품유통공사\_전국 공영도매시장 실시간 경매정보" 검색
- [ ] 활용 신청 (승인까지 1-2일 소요)
- [ ] API 키 발급 확인
- [ ] 환경변수에 추가 (`PUBLIC_DATA_API_KEY=xxxxx`)
- [ ] Postman으로 API 호출 테스트

### 🎨 기본 레이아웃 구조 (Day 5)

#### 폴더 구조 생성

- [ ] `components/layout` 폴더 생성
- [ ] `components/ui` 폴더 확인 (shadcn)
- [ ] `lib` 폴더 생성
- [ ] `app/api` 폴더 생성

#### 공통 레이아웃 컴포넌트

- [ ] `components/layout/Header.tsx` 생성
  - 로고, 검색창, 마이페이지, 로그인 버튼
  - UserButton (Clerk) 연동
- [ ] `components/layout/Sidebar.tsx` 생성 (Desktop)
  - 홈, 상품, 시세, 주문 메뉴
  - 현재 페이지 하이라이트
- [ ] `components/layout/MobileNav.tsx` 생성 (Mobile)
  - 하단 네비게이션 (5개 아이콘)
- [ ] `components/layout/SearchBar.tsx` 생성
  - 검색 입력창
  - 검색 아이콘

#### 메인 레이아웃 적용

- [ ] `app/(main)/layout.tsx` 생성
  - Header + Sidebar + Main Content 구조
  - 반응형 레이아웃 (Desktop: Sidebar 표시, Mobile: 하단 네비)
- [ ] Tailwind CSS로 반응형 스타일링
- [ ] 브라우저에서 레이아웃 확인 (Desktop, Tablet, Mobile)

### 📚 Git 협업 세팅 (Day 5)

#### Git Branch 전략

- [ ] `main` 브랜치 보호 설정
- [ ] `dev` 브랜치 생성
- [ ] Feature 브랜치 네이밍 규칙 정하기 (`feature/기능명`)
- [ ] Pull Request 템플릿 작성

#### 협업 규칙

- [ ] 코드 리뷰 규칙 정하기
- [ ] 커밋 메시지 컨벤션 정하기
- [ ] 일일 스탠드업 미팅 시간 정하기 (10분)
- [ ] Notion 또는 Trello로 할 일 관리 보드 생성

### ✅ Week 1-2 완료 체크리스트

- [ ] 모든 팀원이 로컬에서 프로젝트 실행 가능
- [ ] Supabase 데이터베이스 테이블 6개 생성 완료
- [ ] Clerk 로그인/회원가입 작동 확인
- [ ] Gemini API 키 발급 완료
- [ ] 공공 API 키 발급 및 테스트 완료
- [ ] 기본 레이아웃 화면 확인 (Header, Sidebar, MobileNav)
- [ ] Git 협업 환경 구축 완료

---

## 📅 Week 3-4: 핵심 기능 개발 (2주)

### 👤 회원가입/로그인 완성 (팀원 A)

#### Clerk 회원가입 페이지

- [ ] 회원 유형 선택 추가 (도매점/소매점)
- [ ] 사업자 정보 입력 폼 (상호명, 전화번호)
- [ ] `publicMetadata`에 user_type 저장
- [ ] 회원가입 완료 후 홈으로 리다이렉트

#### 프로필 정보 페이지

- [ ] `/profile` 페이지 생성
- [ ] 사용자 정보 표시 (이메일, 상호명, 전화번호)
- [ ] 정보 수정 기능 (Clerk UserProfile 활용)

### 🔌 Supabase 클라이언트 설정 (팀원 B)

#### Supabase 유틸리티 함수

- [ ] `lib/supabase.ts` 생성

  ```typescript
  import { createClient } from "@supabase/supabase-js";

  export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  ```

#### TypeScript 타입 정의

- [ ] `lib/types.ts` 생성

  - User, ProductRaw, ProductStandard, Order 등 타입 정의

  ```typescript
  export interface User {
    id: string;
    email: string;
    user_type: "vendor" | "retailer";
    business_name: string;
    phone?: string;
    created_at: string;
    updated_at: string;
  }

  export interface ProductRaw {
    id: string;
    vendor_id: string;
    original_name: string;
    price: number;
    unit: string;
    stock: number;
    image_url?: string;
    created_at: string;
    updated_at: string;
  }

  // ... 기타 타입
  ```

#### Clerk 웹훅 API 완성

- [ ] `app/api/webhooks/clerk/route.ts` 완성
- [ ] 사용자 생성 시 Supabase에 저장
- [ ] user_type, business_name, phone 정보 함께 저장
- [ ] 에러 핸들링 추가

### 📦 도매점 상품 등록 페이지 (팀원 C)

#### 상품 등록 폼 UI

- [ ] `app/(vendor)/vendor/products/new/page.tsx` 생성
- [ ] `components/products/ProductForm.tsx` 생성
  - 상품명 입력
  - 가격 입력 (숫자만)
  - 단위 선택 (kg, g, 개 등)
  - 재고 입력
  - 이미지 업로드 (Supabase Storage)

#### 이미지 업로드 기능

- [ ] 이미지 파일 선택 (input type="file")
- [ ] 이미지 미리보기
- [ ] Supabase Storage에 업로드
- [ ] 업로드된 이미지 URL 받아오기
- [ ] 용량 제한 (5MB)

#### 상품 등록 API

- [ ] `app/api/products/route.ts` 생성 (POST)
- [ ] Clerk `auth()` 함수로 사용자 인증 확인
- [ ] 도매점(vendor)만 등록 가능하도록 체크
- [ ] `products_raw` 테이블에 저장
- [ ] AI 표준화 API 호출 (다음 단계)
- [ ] 성공 시 상품 목록으로 리다이렉트

### 🤖 Gemini AI 상품명 표준화 (팀원 D)

#### Gemini API 유틸리티

- [ ] `lib/gemini.ts` 생성

  ```typescript
  import { GoogleGenerativeAI } from "@google/generative-ai";

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  export async function standardizeProductName(originalName: string) {
    // 프롬프트 작성 및 호출
  }
  ```

#### AI 표준화 API

- [ ] `app/api/products/standardize/route.ts` 생성 (POST)
- [ ] 요청 body: `{ original_name: string }`
- [ ] Gemini API 호출
- [ ] 프롬프트 작성:

  ```
  다음 농수산물 상품명을 표준화해주세요.
  규칙:
  1. 상품명과 단위만 포함
  2. 띄어쓰기 일관성
  3. 단위 통일 (kg, g, 개 등)

  예시:
  입력: "청양고추 1키로"
  출력: "청양고추 1kg"

  입력: "{원본 상품명}"
  출력:
  ```

#### 표준화 결과 저장

- [ ] 표준 상품이 이미 있는지 확인 (`products_standard` 테이블)
- [ ] 없으면 새로 생성, 있으면 기존 ID 사용
- [ ] `product_mapping` 테이블에 연결 정보 저장
- [ ] 표준화 결과 반환

#### 표준화 결과 미리보기

- [ ] 상품 등록 폼에 "미리보기" 버튼 추가
- [ ] 버튼 클릭 시 AI 표준화 API 호출
- [ ] 결과 표시
- [ ] 도매점이 결과 확인 후 수정 가능

### 📊 공공 API 연동 (팀원 E)

#### 공공 API 유틸리티

- [ ] `lib/market-api.ts` 생성

  ```typescript
  const BASE_URL = "http://www.kamis.or.kr/service/price/xml.do";

  export async function getMarketPrices(productName: string) {
    // API 호출
  }
  ```

#### 시세 조회 API

- [ ] `app/api/market-prices/route.ts` 생성 (GET)
- [ ] 쿼리 파라미터: `productName`
- [ ] 공공 API 호출
- [ ] 응답 데이터 파싱 (XML → JSON)
- [ ] 필요한 필드만 추출:
  - 시장명 (market_name)
  - 가격 (price)
  - 등급 (grade)
  - 날짜 (date)
- [ ] `market_prices` 테이블에 저장 (캐싱)
- [ ] 결과 반환

#### 에러 처리

- [ ] API 호출 실패 시 빈 배열 반환
- [ ] 타임아웃 처리 (5초)
- [ ] 데이터 없을 시 "시세 정보 없음" 표시

### 📋 도매점 상품 목록 페이지 (팀원 C)

#### 상품 목록 UI

- [ ] `app/(vendor)/vendor/products/page.tsx` 생성
- [ ] 등록한 상품 목록 표시
- [ ] 상품 카드 형태로 표시
  - 상품 이미지
  - 원본 상품명
  - 표준 상품명 (AI 결과)
  - 가격, 단위, 재고

#### 표준화 결과 확인 및 수정

- [ ] AI 표준화 결과 표시
- [ ] "확인" 버튼 → `is_verified` = true
- [ ] "수정" 버튼 → 표준 상품명 직접 수정 가능
- [ ] 수정 후 `product_mapping` 업데이트

#### 상품 수정/삭제

- [ ] 상품 카드에 "수정" 버튼
- [ ] 수정 페이지 (`/vendor/products/[productId]/edit`)
- [ ] 삭제 버튼 (확인 모달)
- [ ] 삭제 API (`app/api/products/[productId]/route.ts` DELETE)

### ✅ Week 3-4 완료 체크리스트

- [ ] 회원가입/로그인 완전 작동 (user_type, business_name 저장)
- [ ] 도매점이 상품 등록 가능 (이미지 포함)
- [ ] AI 표준화 API 작동 (Gemini API 호출)
- [ ] 표준화 성공률 70% 이상 확인 (10개 테스트)
- [ ] 공공 API 시세 조회 작동
- [ ] 도매점 상품 목록 페이지 완성

---

## 📅 Week 5-6: 검색 및 비교 기능 (2주)

### 🔍 소매점 상품 검색 페이지 (팀원 C + D)

#### 상품 검색 UI

- [ ] `app/(main)/products/page.tsx` 생성
- [ ] `components/products/ProductList.tsx` 생성
- [ ] 검색창 (Header의 SearchBar 활용)
- [ ] 검색 결과 표시 (카드 그리드)

#### 상품 카드 컴포넌트

- [ ] `components/products/ProductCard.tsx` 생성
  - 상품 이미지 (썸네일)
  - 표준 상품명
  - 최저가 표시
  - "가격 비교하기" 버튼

#### 검색 API

- [ ] `app/api/products/route.ts` 수정 (GET)
- [ ] 쿼리 파라미터:
  - `search`: 검색어 (표준 상품명)
  - `category`: 카테고리 필터
  - `limit`: 페이지당 개수 (기본 12개)
  - `offset`: 페이지네이션
- [ ] `products_standard` 테이블에서 검색
- [ ] 각 표준 상품의 최저가 계산
- [ ] 결과 반환

#### 필터 기능

- [ ] `components/products/ProductFilters.tsx` 생성
- [ ] 카테고리 필터 (채소, 과일, 수산물 등)
- [ ] 가격 범위 필터 (선택 사항)
- [ ] 필터 적용 시 API 재호출

#### 무한 스크롤

- [ ] Intersection Observer 활용
- [ ] 하단 도달 시 다음 페이지 로드
- [ ] 로딩 스켈레톤 UI

### 💰 가격 비교 페이지 (팀원 D + E)

#### 가격 비교 UI

- [ ] `app/(main)/products/compare/page.tsx` 생성
- [ ] URL 쿼리: `?product=[표준상품명]`
- [ ] 표준 상품명 표시 (제목)

#### 도매점 가격 리스트

- [ ] `components/products/PriceCompareCard.tsx` 생성
  - 도매점 익명 표시 ("도매점 A", "도매점 B")
  - 가격 표시
  - 단위
  - "주문하기" 버튼
- [ ] 가격 낮은 순으로 정렬
- [ ] 최저가 강조 (뱃지)

#### 공영시장 시세 섹션

- [ ] `components/market-prices/MarketPriceCard.tsx` 생성
  - 시장명
  - 가격
  - 등급 (상품, 중품, 하품)
  - 날짜
- [ ] "오늘의 공영시장 시세" 제목
- [ ] 평균 경매가 계산 및 표시

#### 가격 비교 API

- [ ] `app/api/products/compare/route.ts` 생성 (GET)
- [ ] 쿼리 파라미터: `product` (표준 상품명)
- [ ] 해당 표준 상품의 모든 원본 상품 조회
- [ ] 도매점 정보 익명화 (ID만 전달)
- [ ] 공영시장 시세 함께 조회
- [ ] 결과 반환

#### 반응형 레이아웃

- [ ] Desktop: 좌우 분할 (도매점 가격 vs 공영시장 시세)
- [ ] Mobile: 세로 스택

### 📊 실시간 시세 조회 페이지 (팀원 E)

#### 시세 목록 UI

- [ ] `app/(main)/market-prices/page.tsx` 생성
- [ ] `components/market-prices/MarketPriceList.tsx` 생성
- [ ] 시세 카드 그리드 형태

#### 필터 기능

- [ ] 날짜별 필터 (오늘, 어제, 최근 7일)
- [ ] 상품별 필터 (검색)
- [ ] 시장별 필터 (가락시장, 강서시장 등)

#### 시세 조회 API

- [ ] `app/api/market-prices/route.ts` 수정 (GET)
- [ ] 쿼리 파라미터:
  - `date`: 날짜 (YYYY-MM-DD)
  - `product`: 상품명
  - `market`: 시장명
- [ ] `market_prices` 테이블에서 조회
- [ ] 캐시된 데이터 우선 반환
- [ ] 없으면 공공 API 호출 → 저장 → 반환

#### 시세 그래프 (선택 사항)

- [ ] Chart.js 또는 Recharts 설치
- [ ] 날짜별 가격 변화 그래프
- [ ] 시장별 비교 그래프

### 🛒 주문하기 기능 (팀원 A + B)

#### 주문 모달 UI

- [ ] `components/orders/OrderModal.tsx` 생성
- [ ] 가격 비교 페이지의 "주문하기" 버튼 클릭 시 모달 열림
- [ ] 주문 정보 표시:
  - 상품명
  - 단가
  - 수량 입력
  - 총 금액 계산
- [ ] 배송지 입력 (선택 사항)
- [ ] 요청사항 입력
- [ ] "주문서 전송" 버튼

#### 주문 생성 API

- [ ] `app/api/orders/route.ts` 생성 (POST)
- [ ] Clerk `auth()` 함수로 사용자 인증
- [ ] 소매점(retailer)만 주문 가능하도록 체크
- [ ] 요청 body:
  ```typescript
  {
    product_id: string;
    quantity: number;
    total_price: number;
  }
  ```
- [ ] `orders` 테이블에 저장
- [ ] vendor_id 자동으로 가져오기 (product_raw → vendor_id)
- [ ] 상태: 'pending'
- [ ] 성공 시 주문 ID 반환

#### 주문 알림 (선택 사항)

- [ ] 이메일 알림 (Resend 또는 SendGrid)
- [ ] 도매점에게 주문 알림 전송
- [ ] 알림 내용: 상품명, 수량, 소매점 정보

### 📋 소매점 주문 내역 페이지 (팀원 A)

#### 주문 목록 UI

- [ ] `app/(main)/orders/page.tsx` 생성
- [ ] `components/orders/OrderList.tsx` 생성
- [ ] 주문 카드 형태로 표시
  - 주문 번호
  - 상품명
  - 수량, 총 금액
  - 주문 상태 (대기중, 확인됨, 취소)
  - 주문 날짜

#### 주문 조회 API

- [ ] `app/api/orders/route.ts` 수정 (GET)
- [ ] Clerk `auth()` 함수로 사용자 인증
- [ ] 본인의 주문만 조회 (buyer_id = 현재 사용자)
- [ ] 최신 순으로 정렬
- [ ] 상태별 필터 가능

#### 주문 상세 페이지

- [ ] `app/(main)/orders/[orderId]/page.tsx` 생성
- [ ] 주문 상세 정보 표시
- [ ] 도매점 연락처 표시 (주문 확인 후)
- [ ] 주문 취소 버튼 (상태가 'pending'일 때만)

### 📦 도매점 주문 관리 페이지 (팀원 B)

#### 주문 관리 UI

- [ ] `app/(vendor)/vendor/orders/page.tsx` 생성
- [ ] 들어온 주문 목록 표시
- [ ] 주문 카드 형태
  - 주문 번호
  - 상품명
  - 수량, 총 금액
  - 소매점 정보 (상호명, 전화번호)
  - 주문 상태

#### 주문 조회 API

- [ ] `app/api/orders/route.ts` 수정 (GET)
- [ ] 쿼리 파라미터: `type=vendor`
- [ ] 본인이 판매한 상품의 주문만 조회 (vendor_id = 현재 사용자)

#### 주문 상태 변경

- [ ] "주문 확인" 버튼 → 상태 'confirmed'
- [ ] "주문 취소" 버튼 → 상태 'cancelled'
- [ ] 상태 변경 API (`app/api/orders/[orderId]/route.ts` PATCH)
- [ ] 상태 뱃지 색상 변경

#### 주문 상세 페이지

- [ ] `app/(vendor)/vendor/orders/[orderId]/page.tsx` 생성
- [ ] 소매점 연락처 표시
- [ ] 배송지 정보 표시
- [ ] 요청사항 표시

### ✅ Week 5-6 완료 체크리스트

- [ ] 소매점이 상품 검색 가능
- [ ] 가격 비교 페이지 작동 (도매점 익명화)
- [ ] 공영시장 시세 함께 표시
- [ ] 실시간 시세 조회 페이지 완성
- [ ] 주문하기 기능 작동
- [ ] 소매점 주문 내역 확인 가능
- [ ] 도매점 주문 관리 가능

---

## 📅 Week 7: 통합 및 테스트 (1주)

### 🧪 전체 시나리오 테스트

#### E2E 테스트 (도매점 플로우)

- [ ] 회원가입 (도매점으로)
- [ ] 상품 10개 등록
- [ ] AI 표준화 결과 확인
- [ ] 표준화 수정 테스트
- [ ] 상품 목록 확인
- [ ] 상품 수정/삭제 테스트
- [ ] 시장 시세 참고 페이지 확인

#### E2E 테스트 (소매점 플로우)

- [ ] 회원가입 (소매점으로)
- [ ] 상품 검색
- [ ] 필터 적용
- [ ] 가격 비교 페이지 이동
- [ ] 공영시장 시세 확인
- [ ] 주문하기
- [ ] 주문 내역 확인
- [ ] 주문 상세 보기

#### E2E 테스트 (주문 전체 플로우)

- [ ] 소매점: 주문 생성
- [ ] 도매점: 주문 알림 확인
- [ ] 도매점: 주문 확인 (상태 변경)
- [ ] 소매점: 도매점 연락처 확인
- [ ] 도매점: 주문 취소 테스트

### 🐛 버그 수정

#### 기능 버그

- [ ] API 에러 발생 시 적절한 에러 메시지 표시
- [ ] 로딩 상태 추가 (Skeleton UI)
- [ ] 빈 데이터 상태 처리 ("결과가 없습니다")
- [ ] 이미지 업로드 실패 시 처리
- [ ] AI 표준화 실패 시 원본 이름 유지

#### UI/UX 버그

- [ ] 버튼 클릭 시 로딩 표시
- [ ] 폼 검증 (빈 값, 숫자 형식 등)
- [ ] 모달 닫기 시 상태 초기화
- [ ] Toast 메시지 추가 (성공, 실패)
- [ ] 에러 경계 (Error Boundary) 추가

### 📱 반응형 디자인 테스트

#### Desktop (1024px+)

- [ ] 모든 페이지 레이아웃 확인
- [ ] Sidebar 정상 표시
- [ ] 상품 그리드 3-4열
- [ ] 가격 비교 페이지 좌우 분할

#### Tablet (768px-1024px)

- [ ] 모든 페이지 레이아웃 확인
- [ ] Sidebar 축소형 표시
- [ ] 상품 그리드 2열
- [ ] 터치 인터랙션 확인

#### Mobile (< 768px)

- [ ] 모든 페이지 레이아웃 확인
- [ ] 하단 네비게이션 표시
- [ ] 상품 그리드 1열
- [ ] 검색창 전체 너비
- [ ] 모달 전체 화면

### 🎨 UI/UX 개선

#### 시각적 개선

- [ ] 컬러 일관성 확인 (Primary: #10b981)
- [ ] 타이포그래피 일관성 확인
- [ ] 버튼 스타일 통일
- [ ] 카드 스타일 통일
- [ ] 아이콘 일관성 (lucide-react)

#### 사용성 개선

- [ ] 로딩 상태 명확히
- [ ] 에러 메시지 사용자 친화적으로
- [ ] 빈 상태 UI 개선
- [ ] 툴팁 추가 (도움말)
- [ ] 포커스 상태 스타일링

### ⚡ 성능 최적화

#### 이미지 최적화

- [ ] Next.js Image 컴포넌트 사용
- [ ] `next.config.ts`에 외부 도메인 추가 (Supabase)
- [ ] 이미지 lazy loading
- [ ] 썸네일 크기 최적화

#### 코드 최적화

- [ ] 불필요한 리렌더링 방지 (React.memo)
- [ ] API 호출 최소화 (캐싱)
- [ ] 번들 크기 확인 (Next.js Bundle Analyzer)
- [ ] 사용하지 않는 패키지 제거

#### SEO 최적화

- [ ] 메타태그 추가 (각 페이지)
- [ ] Open Graph 태그
- [ ] `robots.txt` 생성
- [ ] `sitemap.xml` 생성 (선택 사항)

### ✅ Week 7 완료 체크리스트

- [ ] 전체 플로우 테스트 통과
- [ ] 주요 버그 모두 수정
- [ ] 반응형 디자인 모든 기기에서 확인
- [ ] 로딩 및 에러 상태 처리 완료
- [ ] UI/UX 일관성 확보
- [ ] 성능 최적화 완료

---

## 📅 Week 8: 마무리 및 발표 준비 (1주)

### 📊 샘플 데이터 입력

#### 도매점 계정 생성

- [ ] 도매점 계정 10개 생성
- [ ] 각 도매점 상호명, 전화번호 입력

#### 상품 데이터 입력

- [ ] 상품 50개 등록 (도매점 10개 × 5개씩)
- [ ] 다양한 카테고리 (채소, 과일, 수산물 등)
- [ ] 가격 범위 다양하게
- [ ] 이미지 첨부 (Unsplash 또는 샘플 이미지)
- [ ] AI 표준화 결과 확인 및 수정

#### 주문 데이터 생성

- [ ] 소매점 계정 5개 생성
- [ ] 주문 20개 생성 (다양한 상태)
- [ ] 주문 확인된 것, 대기중인 것 섞어서

### 🚀 Vercel 배포

#### 배포 준비

- [ ] `package.json` 확인 (빌드 스크립트)
- [ ] 환경변수 정리 (`.env.example` 생성)
- [ ] 불필요한 파일 제거
- [ ] README.md 업데이트

#### Vercel 프로젝트 생성

- [ ] Vercel 계정 생성 (https://vercel.com)
- [ ] GitHub 저장소 연결
- [ ] 프로젝트 import

#### 환경변수 설정

- [ ] Vercel 대시보드에서 환경변수 입력
  - Clerk API 키
  - Supabase URL 및 키
  - Gemini API 키
  - 공공데이터 API 키
- [ ] Production, Preview 환경 모두 설정

#### 배포 및 확인

- [ ] 배포 실행 (자동 배포)
- [ ] 배포 완료 확인
- [ ] 프로덕션 URL 접속 테스트
- [ ] 모든 기능 작동 확인

#### Clerk 설정 업데이트

- [ ] Clerk 대시보드에서 프로덕션 도메인 추가
- [ ] Redirect URL 업데이트
- [ ] 웹훅 URL 업데이트 (Vercel URL)

### 🎬 발표 시연 영상 촬영

#### 시연 시나리오 작성

- [ ] 프로젝트 소개 (30초)
- [ ] 도매점 플로우 (2분)
  - 회원가입 → 상품 등록 → AI 표준화 → 주문 확인
- [ ] 소매점 플로우 (2분)
  - 회원가입 → 상품 검색 → 가격 비교 → 주문하기
- [ ] 핵심 기능 강조 (1분)
  - AI 표준화
  - 공영시장 시세
  - 익명화

#### 영상 촬영

- [ ] 화면 녹화 (OBS 또는 QuickTime)
- [ ] 음성 녹음 (마이크 사용)
- [ ] 자막 추가 (선택 사항)
- [ ] 영상 편집 (불필요한 부분 제거)
- [ ] 5분 이내로 편집

### 📊 발표 자료 (PPT) 작성

#### 슬라이드 구성

- [ ] 표지 (프로젝트명, 팀 이름, 팀원)
- [ ] 목차
- [ ] 문제 정의 (2-3 슬라이드)
  - 도소매 가격 비교의 어려움
  - 도매점 정보 노출 우려
- [ ] 솔루션 제시 (3-4 슬라이드)
  - AI 상품명 표준화
  - 익명화된 가격 비교
  - 공영시장 시세 제공
  - 간편 주문
- [ ] 기술 스택 (1 슬라이드)
- [ ] 시스템 구조 (1-2 슬라이드)
- [ ] 주요 기능 시연 (5-6 슬라이드)
  - 스크린샷 포함
- [ ] 핵심 차별점 (1 슬라이드)
- [ ] 어려웠던 점과 해결 방법 (2-3 슬라이드)
- [ ] 배운 점 (1-2 슬라이드)
- [ ] 향후 계획 (V2 기능) (1 슬라이드)
- [ ] Q&A

#### 디자인

- [ ] 일관된 디자인 템플릿
- [ ] 프로젝트 컬러 (녹색 계열) 적용
- [ ] 폰트 크기 적절히 (최소 24pt)
- [ ] 이미지/스크린샷 고화질

### 📝 문서 정리

#### README.md 완성

- [ ] 프로젝트 소개
- [ ] 주요 기능
- [ ] 기술 스택
- [ ] 설치 및 실행 방법
- [ ] 환경변수 설정 가이드
- [ ] 스크린샷
- [ ] 팀원 소개
- [ ] 라이선스

#### 기타 문서

- [ ] API 문서 (선택 사항)
- [ ] 데이터베이스 스키마 문서
- [ ] 개발 일지 (배운 점, 어려웠던 점)

### 🎯 최종 점검

#### 기능 체크리스트

- [ ] P0 기능 8가지 모두 작동 확인
  1. 회원가입/로그인 (Clerk)
  2. 상품 등록 (이미지 포함)
  3. AI 상품명 표준화
  4. 상품 검색 및 필터링
  5. 가격 비교 (익명)
  6. 공영시장 시세 조회
  7. 주문서 작성 및 전송
  8. 주문 알림 및 관리

#### 성공 기준 확인

- [ ] 웹사이트가 모든 기기에서 정상 작동
- [ ] 도매점 10개, 상품 50개 이상
- [ ] AI 표준화 성공률 70% 이상
- [ ] 소매점이 검색→주문까지 완료 가능
- [ ] 큰 버그 없이 시연 가능
- [ ] Lighthouse 점수 70점 이상

#### 발표 준비

- [ ] 발표 대본 작성 및 연습
- [ ] 시연 리허설 (3회 이상)
- [ ] 예상 질문 준비
- [ ] 발표 자료 최종 확인
- [ ] 시연 영상 백업

### ✅ Week 8 완료 체크리스트

- [ ] 샘플 데이터 입력 완료 (도매점 10개, 상품 50개)
- [ ] Vercel 배포 완료 및 작동 확인
- [ ] 발표 시연 영상 촬영 완료
- [ ] 발표 자료(PPT) 작성 완료
- [ ] README.md 완성
- [ ] 최종 점검 완료
- [ ] 발표 연습 완료

---

## 📋 팀원별 역할 분담 (예시)

### 팀원 A: 인증 및 주문 관리

- 회원가입/로그인 페이지
- 프로필 페이지
- 주문하기 모달
- 소매점 주문 내역
- 주문 상세 페이지

### 팀원 B: 백엔드 및 Supabase

- Supabase 클라이언트 설정
- Clerk 웹훅 API
- 데이터베이스 타입 정의
- 도매점 주문 관리
- API 에러 핸들링

### 팀원 C: 상품 관리

- 도매점 상품 등록 페이지
- 상품 등록 폼
- 도매점 상품 목록
- 소매점 상품 검색
- 상품 카드 컴포넌트

### 팀원 D: AI 및 가격 비교

- Gemini API 연동
- AI 표준화 API
- 가격 비교 페이지
- 표준화 결과 미리보기
- 검색 및 필터 기능

### 팀원 E: 공공 API 및 시세

- 공공 API 연동
- 시세 조회 API
- 실시간 시세 페이지
- 시세 캐싱
- 시세 그래프 (선택 사항)

---

## 🎯 중요 체크포인트

### Week 2 종료 시점

- [ ] 모든 팀원이 개발 환경 구축 완료
- [ ] Supabase, Clerk, API 키 모두 발급 완료
- [ ] 기본 레이아웃 완성

### Week 4 종료 시점

- [ ] 도매점이 상품 등록 가능
- [ ] AI 표준화 작동
- [ ] 공공 API 연동 완료

### Week 6 종료 시점

- [ ] 소매점이 검색 및 가격 비교 가능
- [ ] 주문 기능 작동
- [ ] 모든 핵심 기능 구현 완료

### Week 7 종료 시점

- [ ] 전체 시나리오 테스트 통과
- [ ] 주요 버그 수정 완료
- [ ] 반응형 디자인 확인

### Week 8 종료 시점

- [ ] Vercel 배포 완료
- [ ] 발표 자료 준비 완료
- [ ] 발표 연습 완료

---

## 💪 팀 협업 가이드

### 일일 스탠드업 (매일 아침 10분)

- [ ] 어제 뭐 했나요?
- [ ] 오늘 뭐 할 건가요?
- [ ] 막힌 부분이 있나요?

### 주간 회고 (매주 금요일 30분)

- [ ] 이번 주 잘한 점
- [ ] 어려웠던 점
- [ ] 다음 주 목표

### 코드 리뷰 규칙

- [ ] PR(Pull Request)은 최대 300줄 이내
- [ ] 최소 1명의 Approve 필요
- [ ] 주석과 설명 충분히
- [ ] 테스트 후 머지

### 커밋 메시지 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
docs: 문서 수정
test: 테스트 코드
chore: 기타 변경사항

예시:
feat: 상품 등록 페이지 구현
fix: 가격 비교 API 에러 수정
```

---

## 🚨 주의사항

### 개발 시 주의할 점

- [ ] 환경변수 절대 커밋하지 말 것 (.gitignore 확인)
- [ ] API 키 노출 주의 (클라이언트에서 호출 금지)
- [ ] 데이터베이스 비밀번호 보안
- [ ] Supabase RLS 사용 안 함 (API Routes에서 검증)

### 시간 관리

- [ ] 완벽함보다 완성도 우선
- [ ] P0 기능 먼저, P1은 시간 남으면
- [ ] 막히면 30분 안에 팀원 도움 요청
- [ ] 일주일에 1번은 전체 진행 상황 점검

### 에러 대응

- [ ] 에러 메시지 구글링
- [ ] ChatGPT/Claude 활용
- [ ] 공식 문서 확인
- [ ] 팀원 도움 요청
- [ ] 안 되면 다른 방법 시도 (완벽하지 않아도 OK!)

---

## 📚 참고 자료

### 공식 문서

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [Clerk 공식 문서](https://clerk.com/docs)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Gemini API 문서](https://ai.google.dev/gemini-api/docs?hl=ko)

### 학습 자료

- YouTube: "Next.js 15 입문"
- YouTube: "코딩애플 Next.js"
- YouTube: "Supabase 입문"
- YouTube: "Gemini API 사용법"

### 커뮤니티

- Next.js Discord
- Clerk Discord
- Supabase Discord

---

## 🎉 완료 후 목표

### 최소 목표

- [ ] 실제 작동하는 웹사이트 완성
- [ ] 친구/가족에게 시연

### 이상적 목표

- [ ] 실제 소상공인 5명 피드백
- [ ] 팀 포트폴리오 활용
- [ ] GitHub 오픈소스 공개

### 학습 목표

- [ ] Next.js 웹 개발 경험
- [ ] 데이터베이스 설계 능력
- [ ] API 연동 능력
- [ ] AI API 활용 경험
- [ ] 팀 협업 경험
- [ ] **무언가를 끝까지 완성해본 경험!**

---

**화이팅! 8주 후에 멋진 웹사이트를 완성할 수 있습니다! 🚀**

---

**문서 버전:** 1.0  
**작성일:** 2025-11-10  
**기반:** PRD1_1_web.md

```

```
