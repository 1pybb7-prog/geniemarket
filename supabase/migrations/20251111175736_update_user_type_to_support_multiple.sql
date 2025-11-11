-- ============================================
-- user_type에 vendor/retailer 조합 지원 추가
-- ============================================
-- 설명: 사용자가 도매점과 소매점을 동시에 사용할 수 있도록 지원
-- 작성일: 2025-11-11
-- ============================================

-- 기존 CHECK 제약조건 삭제
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;

-- 새로운 CHECK 제약조건 추가 (vendor, retailer, vendor/retailer 허용)
ALTER TABLE users ADD CONSTRAINT users_user_type_check 
  CHECK (user_type IN ('vendor', 'retailer', 'vendor/retailer'));

-- 주석 업데이트
COMMENT ON COLUMN users.user_type IS '사용자 유형 (vendor: 도매점만, retailer: 소매점만, vendor/retailer: 둘 다)';

