# AI 기반 B2B 공급망 최적화 및 분할 정산 플랫폼 Design.md

## 문서 정보
- **버전:** 1.0
- **최종 수정일:** 2025년 11월 8일
- **작성자:** 오즈 프로젝트팀
- **플랫폼:** Mobile Application (iOS/Android)

---

## 1. 디자인 목표 및 원칙

### 1.1 핵심 디자인 목표

**"신뢰와 투명성을 바탕으로 B2B 거래를 가장 쉽고 안전하게 만드는 직관적인 모바일 경험을 제공한다."**

본 플랫폼은 복잡한 B2B 공급망 거래를 단순화하여, 도매점과 소매점 모두가 안심하고 효율적으로 거래할 수 있는 환경을 제공하는 것을 목표로 합니다.

### 1.2 디자인 원칙

#### 원칙 1: 신뢰성 우선 (Trust-First)
- 금융 거래와 민감한 비즈니스 정보를 다루므로, 모든 디자인 요소는 신뢰감을 주어야 합니다.
- 익명화된 정보는 명확하게 표시하고, 보안 관련 정보는 항상 가시적으로 표현합니다.

#### 원칙 2: 역할별 맞춤 경험 (Role-Based Experience)
- 도매점과 소매점의 니즈가 완전히 다르므로, 각 역할에 최적화된 별도의 UI/UX를 제공합니다.
- 불필요한 정보는 철저히 숨기고, 필요한 정보만 노출합니다.

#### 원칙 3: 단순성과 명확성 (Simplicity & Clarity)
- 하나의 화면에서는 하나의 핵심 작업만 수행하도록 설계합니다.
- 복잡한 B2B 프로세스를 단계별로 나누어 사용자가 혼란스럽지 않게 합니다.

#### 원칙 4: 즉각적인 피드백 (Immediate Feedback)
- 모든 사용자 액션에 대해 즉시 시각적 피드백을 제공합니다.
- 특히 금융 거래, AI 처리 상태 등은 실시간으로 진행 상황을 보여줍니다.

#### 원칙 5: 다크 모드 최우선 (Dark Mode First)
- 장시간 사용하는 비즈니스 앱 특성을 고려하여 다크 모드를 기본으로 제공합니다.
- 라이트 모드 전환 옵션도 제공하되, 다크 모드 최적화를 우선합니다.

---

## 2. 시각 디자인 시스템

### 2.1 색상 팔레트 (Color Palette)

#### 다크 모드 (기본)

**Primary Colors (주요 색상)**
- `Primary Blue`: #2563EB
  - 용도: 주요 CTA 버튼, 활성 상태, 브랜드 포인트
  - 예시: "주문하기", "검색" 버튼
  
- `Primary Blue Hover`: #1D4ED8
  - 용도: Primary 버튼 호버/클릭 상태

**Background Colors (배경 색상)**
- `Background Dark`: #0F172A
  - 용도: 앱 전체 배경
  
- `Surface Dark`: #1E293B
  - 용도: 카드, 패널, 모달 배경
  
- `Surface Elevated`: #334155
  - 용도: 강조가 필요한 영역 (예: 선택된 항목)

**Text Colors (텍스트 색상)**
- `Text Primary`: #F8FAFC
  - 용도: 주요 텍스트, 제목
  
- `Text Secondary`: #94A3B8
  - 용도: 부가 설명, 메타 정보
  
- `Text Disabled`: #475569
  - 용도: 비활성화된 텍스트

**Status Colors (상태 색상)**
- `Success Green`: #10B981
  - 용도: 성공 메시지, 정산 완료, 주문 확정
  
- `Warning Orange`: #F59E0B
  - 용도: 경고, 대기 상태, AI 검증 대기
  
- `Error Red`: #EF4444
  - 용도: 오류 메시지, 주문 취소, 결제 실패
  
- `Info Blue`: #3B82F6
  - 용도: 정보 알림, 도움말

**Accent Colors (강조 색상)**
- `Accent Purple`: #8B5CF6
  - 용도: 프리미엄 기능, 특별 프로모션
  
- `Accent Teal`: #14B8A6
  - 용도: 새로운 기능, 업데이트 알림

#### 라이트 모드

**Primary Colors**
- `Primary Blue`: #2563EB (동일)

**Background Colors**
- `Background Light`: #FFFFFF
- `Surface Light`: #F8FAFC
- `Surface Elevated`: #E2E8F0

**Text Colors**
- `Text Primary`: #0F172A
- `Text Secondary`: #475569
- `Text Disabled`: #94A3B8

**Status Colors** (동일하게 유지)

### 2.2 타이포그래피 (Typography)

#### 기본 폰트
- **Primary Font**: Pretendard (한글 최적화)
- **Secondary Font**: Inter (영문, 숫자)
- **Monospace Font**: JetBrains Mono (코드, 주문번호)

#### 폰트 크기 및 용도

```
Display Large (디스플레이 대형)
- 크기: 32px
- 굵기: Bold (700)
- 용도: 온보딩 화면, 주요 랜딩 페이지 제목

Heading 1 (제목 1)
- 크기: 24px
- 굵기: Bold (700)
- 용도: 페이지 타이틀, 섹션 대제목

Heading 2 (제목 2)
- 크기: 20px
- 굵기: SemiBold (600)
- 용도: 카드 제목, 모달 제목

Heading 3 (제목 3)
- 크기: 18px
- 굵기: SemiBold (600)
- 용도: 리스트 아이템 제목

Body Large (본문 대형)
- 크기: 16px
- 굵기: Regular (400)
- 용도: 중요한 본문 내용, 입력 필드 텍스트

Body (본문)
- 크기: 14px
- 굵기: Regular (400)
- 용도: 일반 본문, 설명 텍스트

Body Small (본문 소형)
- 크기: 12px
- 굵기: Regular (400)
- 용도: 메타 정보, 타임스탬프, 보조 설명

Caption (캡션)
- 크기: 11px
- 굵기: Regular (400)
- 용도: 최소 정보, 법적 고지, 버전 정보
```

#### 행간 (Line Height)
- Display/Heading: 1.2배
- Body: 1.5배
- Caption: 1.4배

### 2.3 아이콘 규칙 (Iconography)

#### 아이콘 스타일
- **기본 스타일**: Outline (선형) 아이콘 사용
- **강조 시**: Filled (채워진) 아이콘으로 전환
- **아이콘 라이브러리**: Lucide Icons 사용

#### 아이콘 크기
- Small: 16px (인라인 텍스트용)
- Medium: 24px (기본 버튼, 네비게이션)
- Large: 32px (빈 상태(Empty State), 주요 액션)
- XLarge: 48px (온보딩, 성공/오류 화면)

#### 아이콘 색상 규칙
- 활성 상태: Primary Blue
- 비활성 상태: Text Disabled
- 상태별: Status Colors 사용
- 네비게이션: 선택 시 Primary Blue, 미선택 시 Text Secondary

### 2.4 그림자 및 효과 (Shadows & Effects)

#### 그림자 레벨 (다크 모드)
```css
Shadow Small (작은 그림자)
- 용도: 버튼, 작은 카드
- 값: 0 1px 2px rgba(0, 0, 0, 0.3)

Shadow Medium (중간 그림자)
- 용도: 카드, 패널
- 값: 0 4px 6px rgba(0, 0, 0, 0.4)

Shadow Large (큰 그림자)
- 용도: 모달, 드롭다운
- 값: 0 10px 15px rgba(0, 0, 0, 0.5)

Shadow XLarge (매우 큰 그림자)
- 용도: 플로팅 액션 버튼, 중요 모달
- 값: 0 20px 25px rgba(0, 0, 0, 0.6)
```

#### 테두리 반경 (Border Radius)
- Small: 4px (버튼, 태그)
- Medium: 8px (카드, 입력 필드)
- Large: 12px (모달, 바텀시트)
- XLarge: 16px (이미지, 특별한 카드)
- Full: 9999px (원형 버튼, 아바타)

---

## 3. UI 컴포넌트 (Components)

### 3.1 버튼 (Buttons)

#### Primary Button (주요 버튼)
- **용도**: 가장 중요한 액션 (주문하기, 등록하기, 확인)
- **스타일**:
  - 배경: Primary Blue
  - 텍스트: White (#FFFFFF)
  - 높이: 48px
  - 패딩: 16px 24px
  - 테두리 반경: 8px
  - 그림자: Shadow Small
- **상태**:
  - Hover: Primary Blue Hover
  - Pressed: Primary Blue Hover + Shadow None
  - Disabled: Background - Surface Elevated, Text - Text Disabled

#### Secondary Button (보조 버튼)
- **용도**: 부가적인 액션 (취소, 뒤로가기)
- **스타일**:
  - 배경: Transparent
  - 테두리: 1px solid Text Secondary
  - 텍스트: Text Primary
  - 높이: 48px
  - 패딩: 16px 24px
  - 테두리 반경: 8px

#### Text Button (텍스트 버튼)
- **용도**: 최소한의 강조가 필요한 액션 (더보기, 닫기)
- **스타일**:
  - 배경: Transparent
  - 텍스트: Primary Blue
  - 높이: 자동
  - 패딩: 8px 12px

#### Icon Button (아이콘 버튼)
- **용도**: 단일 아이콘 액션 (좋아요, 공유, 설정)
- **스타일**:
  - 배경: Transparent 또는 Surface Elevated
  - 크기: 40x40px
  - 아이콘: 24px
  - 테두리 반경: Full

### 3.2 입력 필드 (Input Fields)

#### Text Input (텍스트 입력)
- **스타일**:
  - 배경: Surface Dark
  - 테두리: 1px solid Text Disabled (기본 상태)
  - 테두리: 2px solid Primary Blue (포커스 상태)
  - 테두리: 2px solid Error Red (오류 상태)
  - 높이: 48px
  - 패딩: 12px 16px
  - 테두리 반경: 8px
  - 폰트: Body Large

#### Search Input (검색 입력)
- **특징**: 좌측에 검색 아이콘, 우측에 삭제(X) 버튼
- **스타일**: Text Input과 동일하나 아이콘 추가

#### Dropdown Select (드롭다운 선택)
- **스타일**: Text Input과 유사하나 우측에 아래 화살표 아이콘
- **드롭다운 메뉴**:
  - 배경: Surface Dark
  - 그림자: Shadow Large
  - 테두리 반경: 8px
  - 최대 높이: 300px (스크롤)

#### Checkbox & Radio
- **크기**: 20x20px
- **체크 상태**: Primary Blue 배경 + White 체크 아이콘
- **미체크 상태**: Surface Elevated 배경 + Text Disabled 테두리

#### Toggle Switch (토글 스위치)
- **용도**: 다크/라이트 모드 전환, 알림 설정
- **크기**: 48x28px
- **활성 상태**: Primary Blue 배경
- **비활성 상태**: Surface Elevated 배경

### 3.3 카드 (Cards)

#### Product Card (상품 카드)
- **용도**: 상품 리스트 표시
- **구조**:
  - 상단: 상품 이미지 또는 AI 표준화 아이콘
  - 중간: 표준 상품명 (Heading 3), 가격 (Heading 2)
  - 하단: 도매점 익명 ID (Body Small), 지역 (Body Small)
- **스타일**:
  - 배경: Surface Dark
  - 테두리 반경: 12px
  - 그림자: Shadow Medium
  - 패딩: 16px

#### Order Card (주문 카드)
- **용도**: 주문 내역 표시
- **구조**:
  - 상단: 주문 번호 (Body, Monospace), 주문 상태 태그
  - 중간: 상품 정보, 수량
  - 하단: 총 금액 (Heading 2), 주문 일자 (Body Small)
- **스타일**: Product Card와 동일

#### Settlement Card (정산 카드)
- **용도**: 정산 정보 표시 (도매점 전용)
- **구조**:
  - 상단: 정산 상태 태그, 예상 정산일
  - 중간: 정산 금액 (Heading 1), PG 수수료
  - 하단: 주문 번호, 주문 일자
- **특별 스타일**:
  - 정산 완료: Success Green 좌측 테두리 (4px)
  - 정산 대기: Warning Orange 좌측 테두리

### 3.4 네비게이션 (Navigation)

#### Bottom Navigation (하단 네비게이션)
- **위치**: 화면 하단 고정
- **높이**: 64px
- **배경**: Surface Dark
- **구조**:
  - 소매점: 홈, 검색, 주문내역, 내정보 (4개 탭)
  - 도매점: 홈, 상품관리, 주문관리, 정산관리, 내정보 (5개 탭)
- **아이콘**:
  - 선택 상태: Primary Blue, Filled 아이콘, 레이블 표시
  - 미선택 상태: Text Secondary, Outline 아이콘, 레이블 표시

#### Top App Bar (상단 앱 바)
- **높이**: 56px
- **배경**: Surface Dark
- **구조**: 좌측 (뒤로가기/메뉴), 중앙 (페이지 제목), 우측 (액션 버튼들)
- **그림자**: Shadow Small

### 3.5 모달 및 바텀시트 (Modals & Bottom Sheets)

#### Modal (모달)
- **용도**: 중요한 확인, 경고, 정보 입력
- **스타일**:
  - 배경: Surface Dark
  - 테두리 반경: 16px
  - 최대 너비: 400px (태블릿), 90% (모바일)
  - 패딩: 24px
  - 그림자: Shadow XLarge
- **백드롭**: rgba(0, 0, 0, 0.7)

#### Bottom Sheet (바텀시트)
- **용도**: 필터, 옵션 선택, 간단한 폼
- **스타일**:
  - 배경: Surface Dark
  - 상단 테두리 반경: 16px
  - 최대 높이: 70vh
  - 패딩: 24px
  - 상단 핸들바: 32x4px, Text Disabled 색상

### 3.6 알림 및 피드백 (Notifications & Feedback)

#### Toast (토스트 알림)
- **위치**: 화면 하단 (Bottom Navigation 위)
- **스타일**:
  - 배경: Surface Elevated
  - 테두리 반경: 8px
  - 그림자: Shadow Large
  - 패딩: 12px 16px
  - 아이콘 + 텍스트 조합
- **종류**:
  - Success: Success Green 아이콘
  - Error: Error Red 아이콘
  - Info: Info Blue 아이콘
  - Warning: Warning Orange 아이콘
- **자동 사라짐**: 3초 (일반), 5초 (중요)

#### Loading Indicator (로딩 표시)
- **Spinner**: Primary Blue 색상, 32px 크기
- **Skeleton Loader**: 카드 형태의 그레이 애니메이션
- **Progress Bar**: 선형 진행바 (AI 처리 등)

#### Status Badge (상태 뱃지)
- **크기**: 높이 24px, 패딩 6px 12px
- **스타일**:
  - 테두리 반경: Full
  - 폰트: Body Small, SemiBold
- **색상 (배경 + 텍스트)**:
  - 성공/완료: Success Green (반투명) + Success Green
  - 대기/진행중: Warning Orange (반투명) + Warning Orange
  - 취소/실패: Error Red (반투명) + Error Red
  - 정보: Info Blue (반투명) + Info Blue

---

## 4. 화면 레이아웃 및 그리드

### 4.1 기본 레이아웃 구조

```
┌─────────────────────────┐
│   Top App Bar (56px)    │ ← 페이지 제목, 액션 버튼
├─────────────────────────┤
│                         │
│                         │
│    Main Content Area    │ ← 스크롤 가능 영역
│                         │
│                         │
├─────────────────────────┤
│ Bottom Navigation (64px)│ ← 주요 탭 네비게이션
└─────────────────────────┘
```

### 4.2 그리드 시스템

#### 모바일 (320px ~ 767px)
- **컨테이너 패딩**: 16px (좌우)
- **그리드 컬럼**: 4 컬럼
- **거터(Gutter)**: 12px
- **최대 너비**: 100%

#### 태블릿 (768px ~ 1023px)
- **컨테이너 패딩**: 24px (좌우)
- **그리드 컬럼**: 8 컬럼
- **거터**: 16px
- **최대 너비**: 100%

#### 데스크톱 (1024px 이상)
- **컨테이너 패딩**: 32px (좌우)
- **그리드 컬럼**: 12 컬럼
- **거터**: 24px
- **최대 너비**: 1280px (중앙 정렬)

### 4.3 간격 시스템 (Spacing System)

```
4px   - XS (최소 간격, 인라인 요소)
8px   - SM (작은 간격, 아이콘-텍스트)
12px  - MD (기본 간격, 리스트 아이템)
16px  - LG (카드 내부 패딩)
24px  - XL (섹션 간격)
32px  - 2XL (큰 섹션 간격)
48px  - 3XL (페이지 상하단)
```

### 4.4 반응형 규칙

#### 모바일 우선 (Mobile First)
- 기본 디자인은 모바일 화면 (375px 기준)을 우선 설계
- 태블릿/데스크톱은 확장하는 방식

#### 주요 중단점 (Breakpoints)
- Mobile: 320px ~ 767px
- Tablet: 768px ~ 1023px
- Desktop: 1024px 이상

#### 반응형 동작
- **Bottom Navigation**: 데스크톱에서는 Left Sidebar로 전환
- **카드 레이아웃**: 모바일 1열 → 태블릿 2열 → 데스크톱 3열
- **모달**: 모바일에서는 전체 화면, 태블릿/데스크톱에서는 중앙 정렬

---

## 5. 주요 화면별 디자인 명세

### 5.1 인증 화면 (Authentication Screens)

#### 5.1.1 언어 선택 화면 (Language Selection)
- **목적**: 최초 실행 시 언어 선택
- **구조**:
  - 상단: 앱 로고 (XLarge)
  - 중앙: 언어 선택 카드 (한국어, English)
  - 하단: "계속하기" 버튼
- **기본 선택**: 시스템 언어 기반 자동 선택

#### 5.1.2 역할 선택 화면 (Role Selection)
- **목적**: 도매점/소매점 역할 선택
- **구조**:
  - 상단: "어떻게 시작하시겠어요?" (Display Large)
  - 중앙: 두 개의 큰 카드
    - 소매점 카드: 검색 아이콘, "상품을 찾고 주문합니다"
    - 도매점 카드: 판매 아이콘, "상품을 등록하고 판매합니다"
  - 하단: "다음" 버튼 (역할 선택 후 활성화)

#### 5.1.3 로그인 화면 (Login)
- **구조**:
  - 상단: 앱 로고 + "로그인" (Heading 1)
  - 중앙: 
    - 이메일 입력 필드
    - 비밀번호 입력 필드
    - "비밀번호 찾기" (Text Button)
  - 하단: 
    - "로그인" (Primary Button)
    - "계정이 없으신가요? 가입하기" (Text Button)
- **Clerk.com 통합**: OAuth 소셜 로그인 버튼 추가 가능

#### 5.1.4 회원가입 화면 (Sign Up)
- **구조**: 로그인 화면과 유사하나 추가 필드
  - 이메일, 비밀번호, 비밀번호 확인
  - 사업자 정보 (역할에 따라 다름)
- **다단계 폼**: 3단계로 나누어 진행 (Progress Bar 표시)

### 5.2 소매점 주요 화면

#### 5.2.1 홈 화면 (Retailer Home)
- **구조**:
  - 상단: "안녕하세요, [사용자명]님" (Heading 2)
  - 검색 바 (상단 고정)
  - 추천 상품 섹션 (가로 스크롤 카드)
  - 최근 주문 섹션
  - 인기 상품 섹션
- **상단 우측**: 알림 아이콘, 다크/라이트 모드 토글

#### 5.2.2 검색 화면 (Search)
- **구조**:
  - 상단: 검색 입력 필드 (자동 완성)
  - 필터 버튼 (지역, 가격, 정렬)
  - 검색 결과 리스트 (Product Card)
- **빈 상태**: "상품을 검색해보세요" + 검색 아이콘

#### 5.2.3 상품 상세 화면 (Product Detail)
- **구조**:
  - 상단: 상품 이미지/썸네일
  - 표준 상품명 (Heading 1), AI 표준화 뱃지
  - 가격 (Heading 1, Primary Blue)
  - 도매점 정보 (익명 ID, 지역)
  - 상품 설명, 규격 정보
  - 수량 선택 (+ / - 버튼)
  - 하단 고정: "주문하기" (Primary Button)

#### 5.2.4 주문 내역 화면 (Order History)
- **구조**:
  - 상단: 탭 필터 (전체, 진행중, 완료, 취소)
  - 주문 카드 리스트
  - 각 카드 클릭 시 상세 화면 이동

### 5.3 도매점 주요 화면

#### 5.3.1 홈 화면 (Wholesaler Home)
- **구조**:
  - 상단: "안녕하세요, [Vendor #ID]님" (Heading 2)
  - 대시보드 카드:
    - 이번 달 매출 (큰 숫자)
    - 진행중 주문 수
    - 예정된 정산 금액
  - 최근 주문 섹션
  - 상품 관리 바로가기

#### 5.3.2 상품 관리 화면 (Product Management)
- **구조**:
  - 상단: "상품 추가" (Primary Button)
  - 필터/정렬 (활성, 비활성, AI 검증 상태)
  - 상품 리스트:
    - 원본 상품명 + AI 표준화 상품명
    - AI 신뢰도 점수 (Progress Bar)
    - 재고, 가격
    - 편집/삭제 아이콘 버튼

#### 5.3.3 상품 등록/편집 화면
- **구조** (다단계 폼):
  1. 기본 정보: 상품명, 규격, 단위
  2. 가격 및 재고: 가격, 재고 수량
  3. AI 표준화 결과 확인: 
     - AI가 변환한 표준 상품명 표시
     - 신뢰도 점수 표시
     - 수동 수정 옵션
  4. 최종 확인 및 등록

#### 5.3.4 정산 관리 화면 (Settlement Management)
- **구조**:
  - 상단: 탭 필터 (전체, 대기, 완료)
  - 정산 요약 카드:
    - 이번 주 정산 예정 금액
    -