/**
 * @file lib/types.ts
 * @description TypeScript 타입 정의
 *
 * 이 파일은 프로젝트에서 사용하는 모든 TypeScript 타입 정의를 포함합니다.
 * PRD.md에 명시된 데이터베이스 스키마를 기반으로 작성되었습니다.
 *
 * 주요 타입:
 * 1. User - 사용자 정보
 * 2. ProductRaw - 도매점이 등록한 원본 상품
 * 3. ProductStandard - AI가 정리한 표준 상품
 * 4. ProductMapping - 원본-표준 상품 매핑
 * 5. MarketPrice - 공영시장 시세
 * 6. Order - 주문 정보
 *
 * @see {@link docs/PRD.md} - 데이터베이스 설계 참고
 * @see {@link supabase/migrations/geniemarket.sql} - 실제 스키마 참고
 */

/**
 * 사용자 유형
 * - vendor: 도매점만
 * - retailer: 소매점만
 * - vendor/retailer: 도매점과 소매점 둘 다
 */
export type UserType = "vendor" | "retailer" | "vendor/retailer";

/**
 * 사용자 유형 체크 헬퍼 함수
 * @param userType - 사용자 유형 문자열
 * @param type - 확인할 유형
 * @returns 해당 유형을 가지고 있는지 여부
 */
export function hasUserType(
  userType: string,
  type: "vendor" | "retailer",
): boolean {
  return userType === type || userType === "vendor/retailer";
}

/**
 * 사용자 유형을 배열로 변환
 * @param userType - 사용자 유형 문자열
 * @returns 유형 배열
 */
export function getUserTypes(userType: string): ("vendor" | "retailer")[] {
  if (userType === "vendor/retailer") {
    return ["vendor", "retailer"];
  }
  if (userType === "vendor" || userType === "retailer") {
    return [userType as "vendor" | "retailer"];
  }
  return [];
}

/**
 * 사용자 유형 배열을 문자열로 변환
 * @param types - 유형 배열
 * @returns 유형 문자열
 */
export function combineUserTypes(types: ("vendor" | "retailer")[]): UserType {
  // 중복 제거 및 정렬
  const uniqueTypes = Array.from(new Set(types)).sort();

  if (uniqueTypes.length === 2) {
    return "vendor/retailer";
  }
  if (uniqueTypes.length === 1) {
    return uniqueTypes[0] as "vendor" | "retailer";
  }
  throw new Error("최소 하나의 유형이 필요합니다.");
}

/**
 * 주문 상태
 * - pending: 대기중
 * - confirmed: 확인됨
 * - cancelled: 취소
 */
export type OrderStatus = "pending" | "confirmed" | "cancelled";

/**
 * 사용자 정보
 * @see {@link docs/PRD.md} - users 테이블
 */
export interface User {
  /** Clerk user ID (UUID) */
  id: string;
  /** 이메일 주소 */
  email: string;
  /** 사용자 유형 (도매점/소매점) */
  user_type: UserType;
  /** 닉네임 (중복 불가, 2-20자) */
  nickname?: string;
  /** 상호명 */
  business_name: string;
  /** 전화번호 (선택 사항) */
  phone?: string;
  /** 시/도 (예: 서울, 경기, 부산 등) */
  region?: string;
  /** 시/군/구 (예: 강남구, 서초구 등) */
  city?: string;
  /** 생성 일시 */
  created_at: string;
  /** 수정 일시 */
  updated_at: string;
}

/**
 * 도매점이 등록한 원본 상품
 * @see {@link docs/PRD.md} - products_raw 테이블
 */
export interface ProductRaw {
  /** 상품 ID (UUID) */
  id: string;
  /** 도매점 사용자 ID (UUID) */
  vendor_id: string;
  /** 원본 상품명 (도매점이 입력한 그대로) */
  original_name: string;
  /** 가격 (원) */
  price: number;
  /** 단위 (kg, g, 개 등) */
  unit: string;
  /** 재고 수량 */
  stock: number;
  /** 상품 이미지 URL (선택 사항) */
  image_url?: string;
  /** 시/도 (예: 서울, 경기, 부산 등) */
  region?: string;
  /** 시/군/구 (예: 강남구, 서초구 등) */
  city?: string;
  /** 생성 일시 */
  created_at: string;
  /** 수정 일시 */
  updated_at: string;
}

/**
 * AI가 정리한 표준 상품
 * @see {@link docs/PRD.md} - products_standard 테이블
 */
export interface ProductStandard {
  /** 표준 상품 ID (UUID) */
  id: string;
  /** 표준화된 상품명 */
  standard_name: string;
  /** 카테고리 (채소, 과일, 수산물 등, 선택 사항) */
  category?: string;
  /** 표준 단위 (선택 사항) */
  unit?: string;
  /** 생성 일시 */
  created_at: string;
  /** 수정 일시 */
  updated_at: string;
}

/**
 * 원본-표준 상품 매핑
 * @see {@link docs/PRD.md} - product_mapping 테이블
 */
export interface ProductMapping {
  /** 매핑 ID (UUID) */
  id: string;
  /** 원본 상품 ID (UUID) */
  raw_product_id: string;
  /** 표준 상품 ID (UUID) */
  standard_product_id: string;
  /** 도매점 확인 여부 */
  is_verified: boolean;
  /** 생성 일시 */
  created_at: string;
}

/**
 * 공영시장 시세
 * @see {@link docs/PRD.md} - market_prices 테이블
 */
export interface MarketPrice {
  /** 시세 ID (UUID) */
  id: string;
  /** 표준 상품 ID (UUID, 선택 사항) */
  standard_product_id?: string;
  /** 시장명 (가락시장, 강서시장 등) */
  market_name: string;
  /** 경매가 (원) */
  price: number;
  /** 등급 (상품, 중품, 하품, 선택 사항) */
  grade?: string;
  /** 경매 날짜 */
  date: string;
  /** 데이터 저장 일시 */
  created_at: string;
}

/**
 * 주문 정보
 * @see {@link docs/PRD.md} - orders 테이블
 */
export interface Order {
  /** 주문 ID (UUID) */
  id: string;
  /** 구매자(소매점) ID (UUID) */
  buyer_id: string;
  /** 판매자(도매점) ID (UUID) */
  vendor_id: string;
  /** 상품 ID (UUID) */
  product_id: string;
  /** 주문 수량 */
  quantity: number;
  /** 총 금액 (원) */
  total_price: number;
  /** 주문 상태 */
  status: OrderStatus;
  /** 배송지 주소 (선택 사항) */
  delivery_address?: string;
  /** 요청사항 (선택 사항) */
  notes?: string;
  /** 주문 일시 */
  created_at: string;
  /** 수정 일시 */
  updated_at: string;
}

/**
 * 가격 비교를 위한 상품 정보 (뷰 기반)
 * @see {@link supabase/migrations/geniemarket.sql} - v_product_prices 뷰
 */
export interface ProductPrice {
  /** 표준 상품 ID */
  standard_product_id: string;
  /** 표준화된 상품명 */
  standard_name: string;
  /** 카테고리 */
  category?: string;
  /** 원본 상품 ID */
  raw_product_id: string;
  /** 원본 상품명 */
  original_name: string;
  /** 가격 (원) */
  price: number;
  /** 단위 */
  unit: string;
  /** 재고 수량 */
  stock: number;
  /** 상품 이미지 URL */
  image_url?: string;
  /** 도매점 ID */
  vendor_id: string;
  /** 도매점 상호명 */
  vendor_name: string;
  /** 도매점 확인 여부 */
  is_verified: boolean;
}

/**
 * 최저가 상품 정보 (뷰 기반)
 * @see {@link supabase/migrations/geniemarket.sql} - v_lowest_prices 뷰
 */
export interface LowestPrice {
  /** 표준 상품 ID */
  standard_product_id: string;
  /** 표준화된 상품명 */
  standard_name: string;
  /** 카테고리 */
  category?: string;
  /** 최저가 (원) */
  lowest_price: number;
  /** 최저가 상품 수 */
  product_count: number;
  /** 상품 이미지 URL (최저가인 상품의 이미지) */
  image_url?: string;
}
