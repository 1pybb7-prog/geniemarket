-- ============================================
-- user_type CHECK 제약 조건 강제 수정
-- ============================================
-- 문제: 기존 제약 조건이 'vendor/retailer'를 허용하지 않음
-- 해결: 제약 조건을 강제로 삭제하고 재생성
-- ============================================

-- 기존 CHECK 제약조건 강제 삭제 (CASCADE 사용)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check CASCADE;

-- 새로운 CHECK 제약조건 추가 (vendor, retailer, vendor/retailer 허용)
ALTER TABLE users ADD CONSTRAINT users_user_type_check 
  CHECK (user_type IN ('vendor', 'retailer', 'vendor/retailer'));

-- 주석 업데이트
COMMENT ON COLUMN users.user_type IS '사용자 유형 (vendor: 도매점만, retailer: 소매점만, vendor/retailer: 둘 다)';

