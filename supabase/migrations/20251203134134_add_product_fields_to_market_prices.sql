-- ============================================
-- market_prices 테이블에 product_name과 unit 컬럼 추가
-- ============================================
-- 설명: KAMIS API 기간별 가격 조회 시 상품명과 단위 정보를 저장하기 위해 추가
-- 작성일: 2025-12-03
-- ============================================

-- market_prices 테이블에 product_name과 unit 컬럼 추가
ALTER TABLE market_prices
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT;

-- 인덱스 추가 (상품명으로 검색 시 성능 향상)
CREATE INDEX IF NOT EXISTS idx_market_prices_product_name ON market_prices(product_name);
CREATE INDEX IF NOT EXISTS idx_market_prices_date_product_name ON market_prices(date DESC, product_name);

-- 복합 인덱스 (날짜 + 상품명 + 시장명으로 자주 조회)
CREATE INDEX IF NOT EXISTS idx_market_prices_date_product_market ON market_prices(date DESC, product_name, market_name);

-- Unique constraint 추가 (중복 데이터 방지)
-- 같은 날짜, 같은 시장, 같은 등급, 같은 상품명은 하나만 저장
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'market_prices_unique_key'
  ) THEN
    ALTER TABLE market_prices
    ADD CONSTRAINT market_prices_unique_key 
    UNIQUE (date, market_name, grade, product_name);
  END IF;
END $$;

-- 주석 추가
COMMENT ON COLUMN market_prices.product_name IS '상품명';
COMMENT ON COLUMN market_prices.unit IS '단위 (예: 1kg, 1개)';

