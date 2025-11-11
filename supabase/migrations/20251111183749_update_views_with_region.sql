-- ============================================
-- v_product_prices 뷰에 지역 정보 필드 추가
-- ============================================
-- 설명: 지역 필터링을 위해 v_product_prices 뷰에 region과 city 필드 추가
-- 작성일: 2025-11-11
-- ============================================

-- 기존 뷰 삭제 (CASCADE로 v_lowest_prices도 함께 삭제됨)
DROP VIEW IF EXISTS v_lowest_prices CASCADE;
DROP VIEW IF EXISTS v_product_prices CASCADE;

-- v_product_prices 뷰 재생성 (지역 정보 포함)
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
  pr.region,
  pr.city,
  u.business_name AS vendor_name,
  pm.is_verified
FROM products_standard ps
JOIN product_mapping pm ON ps.id = pm.standard_product_id
JOIN products_raw pr ON pm.raw_product_id = pr.id
JOIN users u ON pr.vendor_id = u.id
WHERE u.user_type = 'vendor' AND pr.stock > 0;

COMMENT ON VIEW v_product_prices IS '가격 비교를 위한 상품 정보 뷰 (재고 있는 상품만, 지역 정보 포함)';

-- v_lowest_prices 뷰 재생성
CREATE OR REPLACE VIEW v_lowest_prices AS
SELECT 
  standard_product_id,
  standard_name,
  category,
  MIN(price) AS lowest_price,
  COUNT(*) AS product_count
FROM v_product_prices
GROUP BY standard_product_id, standard_name, category;

COMMENT ON VIEW v_lowest_prices IS '표준 상품별 최저가 정보';

