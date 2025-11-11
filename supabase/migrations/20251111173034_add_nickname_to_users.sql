-- ============================================
-- users 테이블에 nickname 컬럼 추가
-- ============================================
-- 설명: 사용자 닉네임 필드 추가 (중복 불가)
-- 작성일: 2025-11-11
-- ============================================

-- nickname 컬럼 추가 (UNIQUE 제약 조건 포함)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nickname TEXT UNIQUE;

-- 인덱스 생성 (중복 확인 성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- 주석 추가
COMMENT ON COLUMN users.nickname IS '사용자 닉네임 (중복 불가, 2-20자)';

