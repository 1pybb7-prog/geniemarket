# 도소매 가격비교 플랫폼 - Mermaid 다이어그램

## 📋 목차

1. [ERD (데이터베이스 구조)](#1-erd-데이터베이스-구조)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [사용자 플로우 - 도매점](#3-사용자-플로우---도매점)
4. [사용자 플로우 - 소매점](#4-사용자-플로우---소매점)
5. [AI 표준화 프로세스](#5-ai-표준화-프로세스)
6. [주문 처리 시퀀스](#6-주문-처리-시퀀스)
7. [가격 비교 프로세스](#7-가격-비교-프로세스)
8. [컴포넌트 구조](#8-컴포넌트-구조)

---

## 1. ERD (데이터베이스 구조)

```mermaid
erDiagram
    users ||--o{ products_raw : "등록"
    users ||--o{ orders : "구매(buyer)"
    users ||--o{ orders : "판매(vendor)"
    products_raw ||--|| product_mapping : "매핑"
    products_standard ||--|| product_mapping : "표준화"
    products_standard ||--o{ market_prices : "시세"
    products_raw ||--o{ orders : "주문"

    users {
        uuid id PK
        text email UK
        text user_type "vendor/retailer"
        text business_name
        text phone
        timestamptz created_at
        timestamptz updated_at
    }

    products_raw {
        uuid id PK
        uuid vendor_id FK
        text original_name
        integer price
        text unit
        integer stock
        text image_url
        timestamptz created_at
        timestamptz updated_at
    }

    products_standard {
        uuid id PK
        text standard_name UK
        text category
        text unit
        timestamptz created_at
        timestamptz updated_at
    }

    product_mapping {
        uuid id PK
        uuid raw_product_id FK
        uuid standard_product_id FK
        boolean is_verified
        timestamptz created_at
    }

    market_prices {
        uuid id PK
        uuid standard_product_id FK
        text market_name
        integer price
        text grade
        date date
        timestamptz created_at
    }

    orders {
        uuid id PK
        uuid buyer_id FK
        uuid vendor_id FK
        uuid product_id FK
        integer quantity
        integer total_price
        text status "pending/confirmed/cancelled"
        text delivery_address
        text notes
        timestamptz created_at
        timestamptz updated_at
    }
```

---

## 2. 시스템 아키텍처

```mermaid
graph TB
    subgraph "클라이언트"
        A[Next.js 15 App Router]
        A1[React Components]
        A2[Tailwind CSS]
        A3[shadcn/ui]
    end

    subgraph "인증"
        B[Clerk]
        B1[회원가입/로그인]
        B2[사용자 관리]
        B3[웹훅]
    end

    subgraph "백엔드 API"
        C[Next.js API Routes]
        C1[/api/products]
        C2[/api/orders]
        C3[/api/market-prices]
        C4[/api/webhooks/clerk]
    end

    subgraph "AI 서비스"
        D[Google Gemini API]
        D1[상품명 표준화]
        D2[Gemini 1.5 Flash]
    end

    subgraph "데이터베이스"
        E[Supabase PostgreSQL]
        E1[6개 테이블]
        E2[Storage 이미지]
    end

    subgraph "외부 API"
        F[공공데이터 API]
        F1[농수산식품유통공사]
        F2[실시간 경매 시세]
    end

    subgraph "배포"
        G[Vercel]
        G1[자동 배포]
        G2[프로덕션 환경]
    end

    A --> B
    A --> C
    B --> B3
    B3 --> C4
    C --> D
    C --> E
    C --> F
    C1 --> D1
    C3 --> F1
    G --> A

    style A fill:#10b981,stroke:#059669,color:#fff
    style D fill:#4285f4,stroke:#1967d2,color:#fff
    style E fill:#3ecf8e,stroke:#2da771,color:#fff
    style F fill:#f59e0b,stroke:#d97706,color:#fff
```

---

## 3. 사용자 플로우 - 도매점

```mermaid
flowchart TD
    Start([도매점 시작]) --> Login[로그인/회원가입]
    Login --> CheckType{사용자 유형}
    CheckType -->|도매점| Dashboard[도매점 대시보드]
    CheckType -->|소매점| Error[접근 불가]

    Dashboard --> Choice{원하는 작업}

    Choice -->|상품 등록| NewProduct[상품 등록 페이지]
    NewProduct --> InputProduct[상품 정보 입력]
    InputProduct --> UploadImage[이미지 업로드]
    UploadImage --> AIPreview[AI 표준화 미리보기]
    AIPreview --> ConfirmAI{표준화 결과 확인}
    ConfirmAI -->|수정 필요| EditStandard[표준명 직접 수정]
    ConfirmAI -->|확인| SaveProduct[상품 저장]
    EditStandard --> SaveProduct
    SaveProduct --> Success1[등록 완료]

    Choice -->|상품 관리| ProductList[내 상품 목록]
    ProductList --> SelectProduct[상품 선택]
    SelectProduct --> ProductAction{작업 선택}
    ProductAction -->|수정| EditProduct[상품 수정]
    ProductAction -->|삭제| DeleteProduct[상품 삭제]
    ProductAction -->|표준화 수정| VerifyStandard[표준명 확인/수정]

    Choice -->|시세 참고| MarketPrice[공영시장 시세]
    MarketPrice --> ViewPrice[내 상품 시세 비교]

    Choice -->|주문 관리| OrderManage[주문 목록]
    OrderManage --> ViewOrder[주문 상세 보기]
    ViewOrder --> OrderAction{주문 처리}
    OrderAction -->|확인| ConfirmOrder[주문 확인]
    OrderAction -->|취소| CancelOrder[주문 취소]
    ConfirmOrder --> ContactBuyer[소매점 연락처 확인]

    Success1 --> Dashboard
    EditProduct --> Dashboard
    DeleteProduct --> Dashboard
    VerifyStandard --> Dashboard
    ViewPrice --> Dashboard
    ContactBuyer --> Dashboard
    CancelOrder --> Dashboard

    style Start fill:#10b981,stroke:#059669,color:#fff
    style Dashboard fill:#3b82f6,stroke:#2563eb,color:#fff
    style Success1 fill:#22c55e,stroke:#16a34a,color:#fff
```

---

## 4. 사용자 플로우 - 소매점

```mermaid
flowchart TD
    Start([소매점 시작]) --> Login[로그인/회원가입]
    Login --> CheckType{사용자 유형}
    CheckType -->|소매점| Dashboard[소매점 대시보드]
    CheckType -->|도매점| Error[접근 불가]

    Dashboard --> Choice{원하는 작업}

    Choice -->|상품 검색| Search[상품 검색 페이지]
    Search --> InputKeyword[검색어 입력]
    InputKeyword --> ApplyFilter{필터 적용?}
    ApplyFilter -->|예| SelectFilter[카테고리/가격 필터]
    ApplyFilter -->|아니오| ShowResults[검색 결과 표시]
    SelectFilter --> ShowResults
    ShowResults --> SelectProduct[상품 선택]

    SelectProduct --> ComparePage[가격 비교 페이지]
    ComparePage --> ViewVendors[도매점별 가격 확인]
    ViewVendors --> ViewMarket[공영시장 시세 확인]
    ViewMarket --> SelectVendor[최저가 도매점 선택]

    SelectVendor --> OrderModal[주문 모달]
    OrderModal --> InputQuantity[수량 입력]
    InputQuantity --> InputAddress[배송지 입력]
    InputAddress --> InputNotes[요청사항 입력]
    InputNotes --> SubmitOrder[주문서 전송]
    SubmitOrder --> OrderSuccess[주문 완료]

    Choice -->|시세 조회| MarketPrice[실시간 시세 페이지]
    MarketPrice --> FilterPrice{필터 선택}
    FilterPrice -->|날짜별| DateFilter[날짜 필터]
    FilterPrice -->|상품별| ProductFilter[상품 필터]
    FilterPrice -->|시장별| MarketFilter[시장 필터]
    DateFilter --> ViewChart[시세 조회]
    ProductFilter --> ViewChart
    MarketFilter --> ViewChart

    Choice -->|주문 내역| OrderHistory[주문 목록]
    OrderHistory --> FilterStatus{상태별 필터}
    FilterStatus --> ViewOrderDetail[주문 상세 보기]
    ViewOrderDetail --> CheckStatus{주문 상태}
    CheckStatus -->|확인됨| ViewContact[도매점 연락처 확인]
    CheckStatus -->|대기중| CancelOption[주문 취소 가능]
    CheckStatus -->|취소됨| ViewReason[취소 사유 확인]

    OrderSuccess --> Dashboard
    ViewChart --> Dashboard
    ViewContact --> Dashboard
    CancelOption --> Dashboard
    ViewReason --> Dashboard

    style Start fill:#10b981,stroke:#059669,color:#fff
    style Dashboard fill:#3b82f6,stroke:#2563eb,color:#fff
    style OrderSuccess fill:#22c55e,stroke:#16a34a,color:#fff
```

---

## 5. AI 표준화 프로세스

```mermaid
sequenceDiagram
    participant V as 도매점
    participant UI as 상품 등록 폼
    participant API as API Route
    participant Gemini as Gemini API
    participant DB as Supabase

    V->>UI: 상품 정보 입력
    Note over V,UI: 청양고추 1키로<br/>가격: 8,500원

    V->>UI: "미리보기" 클릭
    UI->>API: POST /api/products/standardize
    Note over UI,API: { original_name: "청양고추 1키로" }

    API->>Gemini: 상품명 표준화 요청
    Note over API,Gemini: 프롬프트:<br/>"청양고추 1키로를<br/>표준화해주세요"

    Gemini-->>API: 표준화 결과
    Note over Gemini,API: "청양고추 1kg"

    API->>DB: 표준 상품 조회
    Note over API,DB: SELECT * FROM products_standard<br/>WHERE standard_name = '청양고추 1kg'

    alt 표준 상품 존재
        DB-->>API: 기존 표준 상품 ID
    else 표준 상품 없음
        API->>DB: 새 표준 상품 생성
        DB-->>API: 새 표준 상품 ID
    end

    API-->>UI: 표준화 결과 반환
    Note over API,UI: { standard_name: "청양고추 1kg",<br/>standard_id: "xxx" }

    UI-->>V: 결과 표시

    alt 결과 확인
        V->>UI: "확인" 클릭
        UI->>API: 상품 저장 (is_verified: true)
    else 결과 수정
        V->>UI: 표준명 직접 수정
        UI->>API: 상품 저장 (is_verified: true)
    end

    API->>DB: 원본 상품 저장 (products_raw)
    API->>DB: 매핑 저장 (product_mapping)
    DB-->>API: 저장 완료
    API-->>UI: 성공 응답
    UI-->>V: 등록 완료 메시지
```

---

## 6. 주문 처리 시퀀스

```mermaid
sequenceDiagram
    participant R as 소매점
    participant UI as 가격 비교 페이지
    participant API as API Route
    participant DB as Supabase
    participant V as 도매점

    R->>UI: 최저가 상품 "주문하기" 클릭
    UI->>R: 주문 모달 표시

    R->>UI: 수량, 배송지, 요청사항 입력
    R->>UI: "주문서 전송" 클릭

    UI->>API: POST /api/orders
    Note over UI,API: { product_id, quantity,<br/>total_price, delivery_address,<br/>notes }

    API->>API: Clerk auth() 인증 확인
    API->>API: user_type = 'retailer' 확인

    API->>DB: 상품 정보 조회
    Note over API,DB: vendor_id 확인

    DB-->>API: 상품 정보 반환

    API->>DB: 주문 생성
    Note over API,DB: INSERT INTO orders<br/>status = 'pending'

    DB-->>API: 주문 ID 반환

    opt 이메일 알림 (선택 사항)
        API->>V: 주문 알림 전송
        Note over API,V: 이메일: 새 주문이<br/>들어왔습니다
    end

    API-->>UI: 주문 성공 응답
    UI-->>R: 주문 완료 메시지

    Note over R,V: === 도매점 주문 확인 ===

    V->>UI: 주문 관리 페이지 접속
    UI->>API: GET /api/orders?type=vendor
    API->>DB: 주문 목록 조회
    DB-->>API: 주문 목록 반환
    API-->>UI: 주문 목록 표시
    UI-->>V: 주문 목록 표시

    V->>UI: 주문 상세 보기
    V->>UI: "주문 확인" 클릭

    UI->>API: PATCH /api/orders/[orderId]
    Note over UI,API: { status: 'confirmed' }

    API->>DB: 주문 상태 업데이트
    DB-->>API: 업데이트 완료
    API-->>UI: 성공 응답
    UI-->>V: 주문 확인 완료

    Note over R,V: === 소매점 연락처 확인 ===

    V->>UI: 소매점 연락처 확인
    UI-->>V: 상호명, 전화번호 표시

    Note over V,R: 실제 거래는<br/>전화/문자로 진행
```

---

## 7. 가격 비교 프로세스

```mermaid
flowchart TD
    Start([소매점 검색]) --> Search[상품명 입력]
    Search --> SearchAPI[GET /api/products?search=청양고추]

    SearchAPI --> QueryDB[(products_standard<br/>테이블 검색)]
    QueryDB --> GetStandard[표준 상품 조회]

    GetStandard --> ShowList[검색 결과 리스트]
    ShowList --> SelectProduct[청양고추 1kg 선택]

    SelectProduct --> CompareAPI[GET /api/products/compare?product=청양고추1kg]

    CompareAPI --> Process1[원본 상품 조회]
    CompareAPI --> Process2[공영시장 시세 조회]

    Process1 --> DB1[(product_mapping +<br/>products_raw +<br/>users)]
    DB1 --> Anonymous[도매점 정보 익명화]
    Anonymous --> VendorList[도매점별 가격 리스트]

    Process2 --> CacheCheck{캐시 확인}
    CacheCheck -->|있음| CachedData[(market_prices<br/>테이블)]
    CacheCheck -->|없음| PublicAPI[공공 API 호출]
    PublicAPI --> SaveCache[(캐시 저장)]
    SaveCache --> MarketData[시세 데이터]
    CachedData --> MarketData

    VendorList --> Merge[데이터 병합]
    MarketData --> Merge

    Merge --> ComparePage[가격 비교 페이지]

    ComparePage --> Display1[도매점 가격 표시]
    ComparePage --> Display2[공영시장 시세 표시]
    ComparePage --> Display3[최저가 강조]

    Display1 --> Section1["도매점 A: 8,500원<br/>도매점 B: 9,000원<br/>도매점 C: 8,800원"]
    Display2 --> Section2["가락시장: 9,200원<br/>강서시장: 8,900원<br/>평균: 9,050원"]
    Display3 --> Lowest[도매점 A가 최저가!]

    Section1 --> Order[주문하기 버튼]
    Section2 --> Compare[가격 협상 기준]

    style Start fill:#10b981,stroke:#059669,color:#fff
    style ComparePage fill:#3b82f6,stroke:#2563eb,color:#fff
    style Lowest fill:#22c55e,stroke:#16a34a,color:#fff
```

---

## 8. 컴포넌트 구조

```mermaid
graph TB
    subgraph "App Router"
        A[app/]
        A --> A1["(auth)/"]
        A --> A2["(main)/"]
        A --> A3["(vendor)/"]
        A --> A4["api/"]

        A1 --> A11["sign-in/"]
        A1 --> A12["sign-up/"]

        A2 --> A21["page.tsx (홈)"]
        A2 --> A22["products/"]
        A2 --> A23["market-prices/"]
        A2 --> A24["orders/"]

        A3 --> A31["vendor/products/"]
        A3 --> A32["vendor/orders/"]
        A3 --> A33["vendor/market-prices/"]

        A4 --> A41["products/"]
        A4 --> A42["orders/"]
        A4 --> A43["market-prices/"]
        A4 --> A44["webhooks/clerk/"]
    end

    subgraph "Components"
        B[components/]
        B --> B1["layout/"]
        B --> B2["products/"]
        B --> B3["orders/"]
        B --> B4["market-prices/"]
        B --> B5["ui/ (shadcn)"]

        B1 --> B11["Header.tsx"]
        B1 --> B12["Sidebar.tsx"]
        B1 --> B13["MobileNav.tsx"]
        B1 --> B14["SearchBar.tsx"]

        B2 --> B21["ProductCard.tsx"]
        B2 --> B22["ProductList.tsx"]
        B2 --> B23["ProductForm.tsx"]
        B2 --> B24["ProductFilters.tsx"]
        B2 --> B25["PriceCompareCard.tsx"]

        B3 --> B31["OrderCard.tsx"]
        B3 --> B32["OrderList.tsx"]
        B3 --> B33["OrderModal.tsx"]
        B3 --> B34["OrderStatusBadge.tsx"]

        B4 --> B41["MarketPriceCard.tsx"]
        B4 --> B42["MarketPriceList.tsx"]
        B4 --> B43["PriceChart.tsx"]

        B5 --> B51["button.tsx"]
        B5 --> B52["card.tsx"]
        B5 --> B53["dialog.tsx"]
        B5 --> B54["input.tsx"]
        B5 --> B55["skeleton.tsx"]
    end

    subgraph "Libraries"
        C[lib/]
        C --> C1["supabase.ts"]
        C --> C2["gemini.ts"]
        C --> C3["market-api.ts"]
        C --> C4["types.ts"]
    end

    A --> B
    A --> C
    B --> C

    style A fill:#10b981,stroke:#059669,color:#fff
    style B fill:#3b82f6,stroke:#2563eb,color:#fff
    style C fill:#8b5cf6,stroke:#7c3aed,color:#fff
```

---

## 9. 기술 스택 다이어그램

```mermaid
mindmap
  root((도소매 가격비교<br/>플랫폼))
    Frontend
      Next.js 15
        App Router
        Server Components
        API Routes
      TypeScript
      Tailwind CSS
      shadcn/ui
    Backend
      Supabase
        PostgreSQL
        Storage
        RLS 사용 안 함
      Clerk
        인증/회원가입
        웹훅
        사용자 관리
    AI & API
      Google Gemini
        Gemini 1.5 Flash
        상품명 표준화
        무료 할당량
      공공데이터
        농수산식품유통공사
        실시간 경매 시세
        REST API
    배포
      Vercel
        자동 배포
        무료 호스팅
        환경변수 관리
```

---

## 10. 데이터 흐름도 (전체 시스템)

```mermaid
flowchart LR
    subgraph "사용자"
        U1[도매점]
        U2[소매점]
    end

    subgraph "프론트엔드"
        F1[Next.js Web App]
        F2[반응형 UI]
    end

    subgraph "인증"
        Auth[Clerk]
        AuthWebhook[Webhook]
    end

    subgraph "API Layer"
        API1[상품 API]
        API2[주문 API]
        API3[시세 API]
        API4[표준화 API]
    end

    subgraph "AI 서비스"
        AI[Gemini API]
    end

    subgraph "외부 API"
        Ext[공공데이터 API]
    end

    subgraph "데이터베이스"
        DB1[(users)]
        DB2[(products_raw)]
        DB3[(products_standard)]
        DB4[(product_mapping)]
        DB5[(market_prices)]
        DB6[(orders)]
        DB7[(Storage)]
    end

    U1 --> F1
    U2 --> F1
    F1 --> Auth
    F1 --> F2

    Auth --> AuthWebhook
    AuthWebhook --> DB1

    F1 --> API1
    F1 --> API2
    F1 --> API3

    API1 --> API4
    API4 --> AI

    API1 --> DB2
    API1 --> DB3
    API1 --> DB4
    API1 --> DB7

    API2 --> DB6
    API2 --> DB2
    API2 --> DB1

    API3 --> Ext
    API3 --> DB5

    style U1 fill:#10b981,stroke:#059669,color:#fff
    style U2 fill:#3b82f6,stroke:#2563eb,color:#fff
    style AI fill:#4285f4,stroke:#1967d2,color:#fff
    style Ext fill:#f59e0b,stroke:#d97706,color:#fff
```

---

## 11. 주요 기능별 상태 다이어그램

### 11.1 상품 등록 상태

```mermaid
stateDiagram-v2
    [*] --> 입력대기
    입력대기 --> 정보입력중: 상품 정보 입력
    정보입력중 --> 이미지업로드: 이미지 선택
    이미지업로드 --> AI처리중: 미리보기 클릭
    AI처리중 --> 표준화완료: Gemini 응답
    표준화완료 --> 수정중: 표준명 수정
    표준화완료 --> 저장중: 확인 클릭
    수정중 --> 저장중: 저장 클릭
    저장중 --> 등록완료: DB 저장 성공
    등록완료 --> [*]

    AI처리중 --> 에러: API 실패
    저장중 --> 에러: DB 에러
    에러 --> 정보입력중: 재시도
```

### 11.2 주문 상태

```mermaid
stateDiagram-v2
    [*] --> 대기중
    대기중 --> 확인됨: 도매점 확인
    대기중 --> 취소됨: 취소 요청
    확인됨 --> 거래진행: 연락처 공유
    거래진행 --> 완료: 거래 종료
    취소됨 --> [*]
    완료 --> [*]

    note right of 대기중
        소매점이 주문서 전송
        도매점 확인 대기
    end note

    note right of 확인됨
        도매점이 주문 확인
        소매점이 연락처 확인 가능
    end note

    note right of 거래진행
        실제 전화/문자 거래
        플랫폼 외부에서 진행
    end note
```

---

## 12. 반응형 레이아웃 구조

```mermaid
flowchart TD
    subgraph "Desktop (1024px+)"
        D1[Header: 로고, 검색, 프로필]
        D2[Sidebar 240px: 메뉴]
        D3[Main Content: 나머지 공간]
        D1 --- D2
        D2 --- D3
    end

    subgraph "Tablet (768px-1024px)"
        T1[Header: 로고, 검색, 프로필]
        T2[Sidebar 축소: 아이콘만]
        T3[Main Content: 넓어짐]
        T1 --- T2
        T2 --- T3
    end

    subgraph "Mobile (< 768px)"
        M1[Header: 로고, 검색, 프로필]
        M2[Main Content: 전체 너비]
        M3[Bottom Nav: 5개 아이콘]
        M1 --- M2
        M2 --- M3
    end

    style D1 fill:#10b981,stroke:#059669,color:#fff
    style T1 fill:#3b82f6,stroke:#2563eb,color:#fff
    style M1 fill:#8b5cf6,stroke:#7c3aed,color:#fff
```

---

## 13. 개발 일정 간트 차트

```mermaid
gantt
    title 8주 개발 일정
    dateFormat  YYYY-MM-DD
    section Week 1-2: 기초 세팅
    환경 세팅               :done,    w1, 2025-01-01, 2d
    Supabase 설정           :done,    w2, 2025-01-03, 1d
    Clerk 설정              :done,    w3, 2025-01-04, 1d
    API 키 발급             :done,    w4, 2025-01-04, 1d
    기본 레이아웃           :active,  w5, 2025-01-05, 2d
    Git 협업 세팅           :active,  w6, 2025-01-05, 2d

    section Week 3-4: 핵심 기능
    회원가입/로그인         :         w7, 2025-01-08, 3d
    상품 등록 페이지        :         w8, 2025-01-08, 4d
    Gemini AI 표준화        :         w9, 2025-01-10, 4d
    공공 API 연동           :         w10, 2025-01-12, 3d
    도매점 상품 목록        :         w11, 2025-01-13, 2d

    section Week 5-6: 검색 및 비교
    소매점 상품 검색        :         w12, 2025-01-15, 4d
    가격 비교 페이지        :         w13, 2025-01-17, 4d
    실시간 시세 페이지      :         w14, 2025-01-19, 3d
    주문하기 기능           :         w15, 2025-01-20, 3d
    주문 관리 페이지        :         w16, 2025-01-22, 3d

    section Week 7: 통합 및 테스트
    E2E 테스트              :         w17, 2025-01-25, 2d
    버그 수정               :         w18, 2025-01-27, 2d
    반응형 디자인 테스트    :         w19, 2025-01-28, 1d
    UI/UX 개선              :         w20, 2025-01-29, 2d
    성능 최적화             :         w21, 2025-01-30, 1d

    section Week 8: 마무리 및 발표
    샘플 데이터 입력        :         w22, 2025-02-01, 1d
    Vercel 배포             :         w23, 2025-02-02, 1d
    시연 영상 촬영          :         w24, 2025-02-03, 1d
    발표 자료 작성          :         w25, 2025-02-04, 2d
    최종 점검 및 연습       :         w26, 2025-02-06, 2d
```

---

## 📝 사용 방법

### GitHub, Notion, Confluence 등에서 Mermaid 사용하기:

1. **GitHub README.md**

   ````markdown
   ```mermaid
   graph TD
       A[Start] --> B[End]
   ```
   ````

   ```

   ```

2. **Mermaid Live Editor**

   - https://mermaid.live
   - 위 코드를 복사하여 붙여넣기
   - 실시간으로 다이어그램 확인 가능

3. **VS Code Extension**

   - "Markdown Preview Mermaid Support" 설치
   - Markdown 미리보기에서 Mermaid 렌더링

4. **Notion**
   - 코드 블록에 언어를 "mermaid"로 설정
   - 자동으로 다이어그램 렌더링

---

## 📋 다이어그램 설명

| 번호 | 다이어그램명       | 용도                             |
| ---- | ------------------ | -------------------------------- |
| 1    | ERD                | 데이터베이스 테이블 관계 시각화  |
| 2    | 시스템 아키텍처    | 전체 기술 스택 및 연결 구조      |
| 3    | 도매점 플로우      | 도매점 사용자의 작업 흐름        |
| 4    | 소매점 플로우      | 소매점 사용자의 작업 흐름        |
| 5    | AI 표준화 프로세스 | Gemini API 상품명 표준화 상세    |
| 6    | 주문 처리 시퀀스   | 주문 생성부터 확인까지 전체 과정 |
| 7    | 가격 비교 프로세스 | 검색부터 가격 비교까지 프로세스  |
| 8    | 컴포넌트 구조      | Next.js 파일/폴더 구조           |
| 9    | 기술 스택          | 사용 기술 마인드맵               |
| 10   | 데이터 흐름도      | 전체 시스템 데이터 흐름          |
| 11   | 상태 다이어그램    | 주요 기능의 상태 전환            |
| 12   | 반응형 레이아웃    | 기기별 레이아웃 구조             |
| 13   | 개발 일정          | 8주 간트 차트                    |

---

**문서 버전:** 1.0  
**작성일:** 2025-11-10  
**기반:** PRD1_1_web.md, SQL1_1_web.sql
