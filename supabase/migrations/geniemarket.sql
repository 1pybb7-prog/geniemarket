-- ============================================
-- 도소매 가격비교 플랫폼 - 데이터베이스 스키마
-- ============================================
-- 버전: 1.0
-- 작성일: 2025-11-10
-- 기반: PRD1_1_web.md
-- 데이터베이스: PostgreSQL (Supabase)
-- ============================================

-- ============================================
-- 0. PostgreSQL 확장 활성화
-- ============================================
-- 전체 텍스트 검색을 위한 pg_trgm 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 1. users (사용자)
-- ============================================
-- 설명: Clerk 인증과 연동되는 사용자 정보 테이블
-- 도매점(vendor)과 소매점(retailer)을 구분하여 저장

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('vendor', 'retailer')),
  business_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);

-- 주석
COMMENT ON TABLE users IS '사용자 정보 테이블 (도매점/소매점)';
COMMENT ON COLUMN users.id IS 'Clerk userId (UUID)';
COMMENT ON COLUMN users.email IS '이메일 주소';
COMMENT ON COLUMN users.user_type IS '사용자 유형 (vendor: 도매점, retailer: 소매점)';
COMMENT ON COLUMN users.business_name IS '상호명';
COMMENT ON COLUMN users.phone IS '전화번호';
COMMENT ON COLUMN users.created_at IS '생성 일시';
COMMENT ON COLUMN users.updated_at IS '수정 일시';


-- ============================================
-- 2. products_raw (도매점이 등록한 원본 상품)
-- ============================================
-- 설명: 도매점이 직접 등록한 원본 상품 정보
-- AI 표준화 전의 데이터

CREATE TABLE products_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  unit TEXT NOT NULL,
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_products_raw_vendor_id ON products_raw(vendor_id);
CREATE INDEX idx_products_raw_original_name ON products_raw(original_name);
CREATE INDEX idx_products_raw_created_at ON products_raw(created_at DESC);

-- 주석
COMMENT ON TABLE products_raw IS '도매점이 등록한 원본 상품 정보';
COMMENT ON COLUMN products_raw.id IS '상품 ID';
COMMENT ON COLUMN products_raw.vendor_id IS '도매점 사용자 ID';
COMMENT ON COLUMN products_raw.original_name IS '원본 상품명 (도매점이 입력한 그대로)';
COMMENT ON COLUMN products_raw.price IS '가격 (원)';
COMMENT ON COLUMN products_raw.unit IS '단위 (kg, g, 개 등)';
COMMENT ON COLUMN products_raw.stock IS '재고 수량';
COMMENT ON COLUMN products_raw.image_url IS '상품 이미지 URL (Supabase Storage)';
COMMENT ON COLUMN products_raw.created_at IS '생성 일시';
COMMENT ON COLUMN products_raw.updated_at IS '수정 일시';


-- ============================================
-- 3. products_standard (AI가 정리한 표준 상품)
-- ============================================
-- 설명: Gemini AI가 표준화한 상품명
-- 여러 도매점의 비슷한 상품을 하나로 묶는 기준

CREATE TABLE products_standard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_name TEXT UNIQUE NOT NULL,
  category TEXT,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_products_standard_standard_name ON products_standard(standard_name);
CREATE INDEX idx_products_standard_category ON products_standard(category);

-- 전체 텍스트 검색을 위한 인덱스 (선택 사항)
CREATE INDEX idx_products_standard_standard_name_trgm ON products_standard USING gin(standard_name gin_trgm_ops);

-- 주석
COMMENT ON TABLE products_standard IS 'AI가 표준화한 상품 정보';
COMMENT ON COLUMN products_standard.id IS '표준 상품 ID';
COMMENT ON COLUMN products_standard.standard_name IS '표준화된 상품명';
COMMENT ON COLUMN products_standard.category IS '카테고리 (채소, 과일, 수산물 등)';
COMMENT ON COLUMN products_standard.unit IS '표준 단위';
COMMENT ON COLUMN products_standard.created_at IS '생성 일시';
COMMENT ON COLUMN products_standard.updated_at IS '수정 일시';


-- ============================================
-- 4. product_mapping (원본-표준 연결)
-- ============================================
-- 설명: 원본 상품과 표준 상품을 연결하는 매핑 테이블
-- AI 표준화 결과를 도매점이 확인했는지 여부 저장

CREATE TABLE product_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_product_id UUID NOT NULL REFERENCES products_raw(id) ON DELETE CASCADE,
  standard_product_id UUID NOT NULL REFERENCES products_standard(id) ON DELETE CASCADE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(raw_product_id)
);

-- 인덱스 생성
CREATE INDEX idx_product_mapping_raw_product_id ON product_mapping(raw_product_id);
CREATE INDEX idx_product_mapping_standard_product_id ON product_mapping(standard_product_id);
CREATE INDEX idx_product_mapping_is_verified ON product_mapping(is_verified);

-- 주석
COMMENT ON TABLE product_mapping IS '원본 상품과 표준 상품 매핑 테이블';
COMMENT ON COLUMN product_mapping.id IS '매핑 ID';
COMMENT ON COLUMN product_mapping.raw_product_id IS '원본 상품 ID';
COMMENT ON COLUMN product_mapping.standard_product_id IS '표준 상품 ID';
COMMENT ON COLUMN product_mapping.is_verified IS '도매점 확인 여부';
COMMENT ON COLUMN product_mapping.created_at IS '생성 일시';


-- ============================================
-- 5. market_prices (공영시장 시세)
-- ============================================
-- 설명: 공공 API에서 받아온 공영도매시장 경매 시세
-- 캐싱 목적으로 저장

CREATE TABLE market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_product_id UUID REFERENCES products_standard(id) ON DELETE CASCADE,
  market_name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  grade TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_market_prices_standard_product_id ON market_prices(standard_product_id);
CREATE INDEX idx_market_prices_date ON market_prices(date DESC);
CREATE INDEX idx_market_prices_market_name ON market_prices(market_name);

-- 복합 인덱스 (날짜 + 상품으로 자주 조회)
CREATE INDEX idx_market_prices_date_product ON market_prices(date DESC, standard_product_id);

-- 주석
COMMENT ON TABLE market_prices IS '공영도매시장 경매 시세 정보';
COMMENT ON COLUMN market_prices.id IS '시세 ID';
COMMENT ON COLUMN market_prices.standard_product_id IS '표준 상품 ID';
COMMENT ON COLUMN market_prices.market_name IS '시장명 (가락시장, 강서시장 등)';
COMMENT ON COLUMN market_prices.price IS '경매가 (원)';
COMMENT ON COLUMN market_prices.grade IS '등급 (상품, 중품, 하품)';
COMMENT ON COLUMN market_prices.date IS '경매 날짜';
COMMENT ON COLUMN market_prices.created_at IS '데이터 저장 일시';


-- ============================================
-- 6. orders (주문)
-- ============================================
-- 설명: 소매점이 도매점에게 보낸 주문 정보
-- 실제 결제는 포함하지 않고 주문서 전달만 처리

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products_raw(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price INTEGER NOT NULL CHECK (total_price >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- 복합 인덱스 (소매점의 주문 내역 조회 최적화)
CREATE INDEX idx_orders_buyer_status ON orders(buyer_id, status, created_at DESC);

-- 복합 인덱스 (도매점의 주문 관리 조회 최적화)
CREATE INDEX idx_orders_vendor_status ON orders(vendor_id, status, created_at DESC);

-- 주석
COMMENT ON TABLE orders IS '주문 정보';
COMMENT ON COLUMN orders.id IS '주문 ID';
COMMENT ON COLUMN orders.buyer_id IS '구매자(소매점) ID';
COMMENT ON COLUMN orders.vendor_id IS '판매자(도매점) ID';
COMMENT ON COLUMN orders.product_id IS '상품 ID';
COMMENT ON COLUMN orders.quantity IS '주문 수량';
COMMENT ON COLUMN orders.total_price IS '총 금액 (원)';
COMMENT ON COLUMN orders.status IS '주문 상태 (pending: 대기중, confirmed: 확인됨, cancelled: 취소)';
COMMENT ON COLUMN orders.delivery_address IS '배송지 주소 (선택 사항)';
COMMENT ON COLUMN orders.notes IS '요청사항';
COMMENT ON COLUMN orders.created_at IS '주문 일시';
COMMENT ON COLUMN orders.updated_at IS '수정 일시';


-- ============================================
-- 7. 트리거 함수 (자동 업데이트)
-- ============================================
-- 설명: updated_at 필드를 자동으로 업데이트하는 트리거

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users 테이블에 트리거 적용
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- products_raw 테이블에 트리거 적용
CREATE TRIGGER update_products_raw_updated_at
  BEFORE UPDATE ON products_raw
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- products_standard 테이블에 트리거 적용
CREATE TRIGGER update_products_standard_updated_at
  BEFORE UPDATE ON products_standard
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- orders 테이블에 트리거 적용
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 8. 유용한 뷰 (View) - 선택 사항
-- ============================================

-- 8.1 가격 비교를 위한 뷰
CREATE OR REPLACE VIEW v_product_prices AS
SELECT 
  ps.id AS standard_product_id,
  ps.standard_name,
  ps.category,
  pr.id AS raw_product_id,
  pr.original_name,
  pr.price,
  pr.unit,
  pr.stock,
  pr.image_url,
  pr.vendor_id,
  u.business_name AS vendor_name,
  pm.is_verified
FROM products_standard ps
JOIN product_mapping pm ON ps.id = pm.standard_product_id
JOIN products_raw pr ON pm.raw_product_id = pr.id
JOIN users u ON pr.vendor_id = u.id
WHERE u.user_type = 'vendor' AND pr.stock > 0;

COMMENT ON VIEW v_product_prices IS '가격 비교를 위한 상품 정보 뷰 (재고 있는 상품만)';


-- 8.2 최저가 상품 뷰
CREATE OR REPLACE VIEW v_lowest_prices AS
SELECT 
  standard_product_id,
  standard_name,
  category,
  MIN(price) AS lowest_price,
  COUNT(*) AS vendor_count
FROM v_product_prices
GROUP BY standard_product_id, standard_name, category;

COMMENT ON VIEW v_lowest_prices IS '표준 상품별 최저가 정보';


-- 8.3 주문 상세 정보 뷰
CREATE OR REPLACE VIEW v_order_details AS
SELECT 
  o.id AS order_id,
  o.buyer_id,
  buyer.business_name AS buyer_name,
  buyer.phone AS buyer_phone,
  o.vendor_id,
  vendor.business_name AS vendor_name,
  vendor.phone AS vendor_phone,
  o.product_id,
  pr.original_name AS product_name,
  pr.image_url AS product_image,
  o.quantity,
  o.total_price,
  o.status,
  o.delivery_address,
  o.notes,
  o.created_at,
  o.updated_at
FROM orders o
JOIN users buyer ON o.buyer_id = buyer.id
JOIN users vendor ON o.vendor_id = vendor.id
JOIN products_raw pr ON o.product_id = pr.id;

COMMENT ON VIEW v_order_details IS '주문 상세 정보 (구매자, 판매자, 상품 정보 포함)';


-- ============================================
-- 9. 샘플 데이터 (개발/테스트용) - 선택 사항
-- ============================================

-- 주의: 실제 운영 환경에서는 이 섹션을 제거하거나 주석 처리하세요!

-- 샘플 사용자 데이터 (도매점 2개, 소매점 1개)
/*
INSERT INTO users (id, email, user_type, business_name, phone) VALUES
  ('11111111-1111-1111-1111-111111111111', 'vendor1@example.com', 'vendor', '서울청과도매', '02-1234-5678'),
  ('22222222-2222-2222-2222-222222222222', 'vendor2@example.com', 'vendor', '부산수산도매', '051-8765-4321'),
  ('33333333-3333-3333-3333-333333333333', 'retailer1@example.com', 'retailer', '강남슈퍼마켓', '02-9999-8888');

-- 샘플 표준 상품 데이터
INSERT INTO products_standard (id, standard_name, category, unit) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '청양고추 1kg', '채소', 'kg'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '대파 1단', '채소', '단'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '고등어 1마리', '수산물', '마리');

-- 샘플 원본 상품 데이터
INSERT INTO products_raw (id, vendor_id, original_name, price, unit, stock) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', '청양고추 1키로', 8500, 'kg', 100),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', '청양고추 1kg', 9000, 'kg', 80),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111', '대파 한단', 3000, '단', 50);

-- 샘플 매핑 데이터
INSERT INTO product_mapping (raw_product_id, standard_product_id, is_verified) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', false);

-- 샘플 시세 데이터
INSERT INTO market_prices (standard_product_id, market_name, price, grade, date) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '가락시장', 9200, '상품', CURRENT_DATE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '강서시장', 8900, '중품', CURRENT_DATE),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '가락시장', 3500, '상품', CURRENT_DATE);
*/


-- ============================================
-- 10. 유용한 쿼리 예시
-- ============================================

-- 10.1 특정 표준 상품의 가격 비교 (도매점 익명화)
/*
SELECT 
  ps.standard_name,
  pr.price,
  pr.unit,
  pr.stock,
  ROW_NUMBER() OVER (ORDER BY pr.price) AS vendor_rank
FROM products_standard ps
JOIN product_mapping pm ON ps.id = pm.standard_product_id
JOIN products_raw pr ON pm.raw_product_id = pr.id
WHERE ps.standard_name = '청양고추 1kg'
  AND pr.stock > 0
ORDER BY pr.price ASC;
*/

-- 10.2 소매점의 주문 내역 조회
/*
SELECT 
  o.id,
  pr.original_name AS product_name,
  o.quantity,
  o.total_price,
  o.status,
  o.created_at
FROM orders o
JOIN products_raw pr ON o.product_id = pr.id
WHERE o.buyer_id = '33333333-3333-3333-3333-333333333333'
ORDER BY o.created_at DESC;
*/

-- 10.3 도매점의 주문 관리 조회
/*
SELECT 
  o.id,
  u.business_name AS buyer_name,
  u.phone AS buyer_phone,
  pr.original_name AS product_name,
  o.quantity,
  o.total_price,
  o.status,
  o.created_at
FROM orders o
JOIN users u ON o.buyer_id = u.id
JOIN products_raw pr ON o.product_id = pr.id
WHERE o.vendor_id = '11111111-1111-1111-1111-111111111111'
ORDER BY o.created_at DESC;
*/

-- 10.4 인기 상품 조회 (주문 횟수 기준)
/*
SELECT 
  ps.standard_name,
  COUNT(o.id) AS order_count,
  SUM(o.quantity) AS total_quantity,
  SUM(o.total_price) AS total_revenue
FROM products_standard ps
JOIN product_mapping pm ON ps.id = pm.standard_product_id
JOIN products_raw pr ON pm.raw_product_id = pr.id
JOIN orders o ON pr.id = o.product_id
WHERE o.status = 'confirmed'
GROUP BY ps.id, ps.standard_name
ORDER BY order_count DESC
LIMIT 10;
*/


-- ============================================
-- 11. 성능 최적화를 위한 추가 설정
-- ============================================

-- PostgreSQL의 pg_trgm 확장 활성화 (전체 텍스트 검색 성능 향상)
-- Supabase에서는 기본적으로 활성화되어 있을 수 있음
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 통계 정보 업데이트 (쿼리 플래너 최적화)
-- ANALYZE users;
-- ANALYZE products_raw;
-- ANALYZE products_standard;
-- ANALYZE product_mapping;
-- ANALYZE market_prices;
-- ANALYZE orders;


-- ============================================
-- 12. 데이터 정합성 체크 쿼리
-- ============================================

-- 12.1 매핑되지 않은 원본 상품 확인
/*
SELECT pr.id, pr.original_name, pr.vendor_id
FROM products_raw pr
LEFT JOIN product_mapping pm ON pr.id = pm.raw_product_id
WHERE pm.id IS NULL;
*/

-- 12.2 재고가 없는데 주문이 들어온 경우 확인
/*
SELECT o.id, pr.original_name, pr.stock, o.quantity
FROM orders o
JOIN products_raw pr ON o.product_id = pr.id
WHERE pr.stock < o.quantity AND o.status = 'pending';
*/

-- 12.3 중복된 표준 상품명 확인 (UNIQUE 제약조건으로 방지되지만 확인용)
/*
SELECT standard_name, COUNT(*) 
FROM products_standard
GROUP BY standard_name
HAVING COUNT(*) > 1;
*/


-- ============================================
-- 완료!
-- ============================================
-- 
-- 이 스크립트 실행 방법:
-- 1. Supabase 대시보드 → SQL Editor
-- 2. 위 스크립트 전체 복사 → 붙여넣기
-- 3. Run 클릭
-- 
-- 주의사항:
-- - 샘플 데이터 섹션(9번)은 개발/테스트용입니다
-- - 실제 운영 환경에서는 주석 처리하거나 제거하세요
-- - 트리거 함수는 자동으로 updated_at을 업데이트합니다
-- 
-- ============================================

