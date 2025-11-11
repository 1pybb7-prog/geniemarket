-- ============================================
-- users와 products_raw 테이블에 지역 정보 필드 추가
-- ============================================
-- 설명: 지역 필터링 기능을 위한 region(시/도)과 city(시/군/구) 필드 추가
-- 작성일: 2025-11-11
-- ============================================

-- users 테이블에 지역 정보 필드 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;

-- products_raw 테이블에 지역 정보 필드 추가
ALTER TABLE products_raw ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE products_raw ADD COLUMN IF NOT EXISTS city TEXT;

-- 인덱스 생성 (지역 필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_products_raw_region ON products_raw(region);
CREATE INDEX IF NOT EXISTS idx_products_raw_city ON products_raw(city);

-- 복합 인덱스 (지역 + 도시로 검색할 때 성능 향상)
CREATE INDEX IF NOT EXISTS idx_products_raw_region_city ON products_raw(region, city);

-- 주석 추가
COMMENT ON COLUMN users.region IS '시/도 (예: 서울, 경기, 부산 등)';
COMMENT ON COLUMN users.city IS '시/군/구 (예: 강남구, 서초구 등)';
COMMENT ON COLUMN products_raw.region IS '상품 판매 지역 - 시/도 (예: 서울, 경기, 부산 등)';
COMMENT ON COLUMN products_raw.city IS '상품 판매 지역 - 시/군/구 (예: 강남구, 서초구 등)';

