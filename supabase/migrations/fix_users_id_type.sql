-- ============================================
-- users 테이블 id 컬럼 타입 변경 (UUID → TEXT)
-- ============================================
-- 문제: Clerk User ID는 UUID 형식이 아니므로 (예: user_35BLV2dsdSvwTNCaoEJbspbsE0l)
--       UUID 타입으로 저장할 수 없습니다.
-- 해결: id 컬럼을 TEXT 타입으로 변경하고, 관련된 외래키 컬럼들도 함께 변경합니다.
-- 
-- 주의: 뷰(view)가 users.id를 참조하고 있으므로, 먼저 뷰를 삭제하고
--       컬럼 타입을 변경한 후 뷰를 다시 생성해야 합니다.
-- ============================================

-- 1. 뷰 삭제 (users.id를 참조하는 뷰들)
DROP VIEW IF EXISTS v_order_details CASCADE;
DROP VIEW IF EXISTS v_lowest_prices CASCADE;
DROP VIEW IF EXISTS v_product_prices CASCADE;

-- 2. 외래키 제약 조건 삭제 (users.id를 참조하는 외래키들)
-- 주의: CASCADE를 사용하면 자동으로 관련된 제약 조건도 삭제됩니다
ALTER TABLE products_raw DROP CONSTRAINT IF EXISTS products_raw_vendor_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_buyer_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_vendor_id_fkey;

-- 3. users 테이블의 id 컬럼 타입 변경
ALTER TABLE users ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- 4. products_raw 테이블의 vendor_id 컬럼 타입 변경
ALTER TABLE products_raw ALTER COLUMN vendor_id TYPE TEXT USING vendor_id::TEXT;

-- 5. orders 테이블의 buyer_id, vendor_id 컬럼 타입 변경
ALTER TABLE orders ALTER COLUMN buyer_id TYPE TEXT USING buyer_id::TEXT;
ALTER TABLE orders ALTER COLUMN vendor_id TYPE TEXT USING vendor_id::TEXT;

-- 6. 외래키 제약 조건 다시 생성
ALTER TABLE products_raw 
  ADD CONSTRAINT products_raw_vendor_id_fkey 
  FOREIGN KEY (vendor_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

ALTER TABLE orders 
  ADD CONSTRAINT orders_buyer_id_fkey 
  FOREIGN KEY (buyer_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

ALTER TABLE orders 
  ADD CONSTRAINT orders_vendor_id_fkey 
  FOREIGN KEY (vendor_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- 7. 뷰 다시 생성

-- 7.1 가격 비교를 위한 뷰
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

-- 7.2 최저가 상품 뷰
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

-- 7.3 주문 상세 정보 뷰
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

-- 8. 주석 업데이트
COMMENT ON COLUMN users.id IS 'Clerk User ID (TEXT 형식, 예: user_35BLV2dsdSvwTNCaoEJbspbsE0l)';
COMMENT ON COLUMN products_raw.vendor_id IS '도매점 사용자 ID (TEXT 형식)';
COMMENT ON COLUMN orders.buyer_id IS '소매점 사용자 ID (TEXT 형식)';
COMMENT ON COLUMN orders.vendor_id IS '도매점 사용자 ID (TEXT 형식)';
