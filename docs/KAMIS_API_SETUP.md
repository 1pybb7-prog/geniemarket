# KAMIS Open API 환경변수 설정 가이드

## 개요

공공데이터포털 API와 aT 도매시장 API에서 발생하던 검색 문제를 해결하기 위해 KAMIS Open API로 변경했습니다.

KAMIS(한국농수산식품유통공사)는 농수축산물 가격정보를 제공하는 공식 시스템입니다.

## 환경변수 설정

### 1. `.env.local` 파일에 추가

프로젝트 루트의 `.env.local` 파일에 다음 환경변수를 추가하세요:

```bash
# KAMIS Open API 인증 정보 (필수)
KAMIS_CERT_ID=your_kamis_id_here
KAMIS_CERT_KEY=your_kamis_api_key_here

# API 엔드포인트 URL (선택 사항, 기본값 사용 시 생략 가능)
# 기본값: https://www.kamis.or.kr/service/price/xml.do
KAMIS_API_URL=https://www.kamis.or.kr/service/price/xml.do
```

### 2. KAMIS API 키 발급 방법

1. **KAMIS 웹사이트 접속**: [https://www.kamis.or.kr](https://www.kamis.or.kr)
2. **회원가입 및 로그인**
3. **Open API 신청 페이지 이동**: [https://www.kamis.or.kr/customer/mypage/my_openapi/my_openapi.do](https://www.kamis.or.kr/customer/mypage/my_openapi/my_openapi.do)
4. **Open API 이용안내 확인**: Open API 이용안내 페이지에서 API 사용 방법 확인
5. **인증키 신청**: 마이페이지에서 Open API 인증키 신청
6. **인증키 확인**: 발급받은 `cert_id`(회원 아이디)와 `cert_key`(인증키) 복사

### 3. 환경변수 우선순위

코드는 다음 순서로 환경변수를 확인합니다:

1. `KAMIS_CERT_ID` / `KAMIS_CERT_KEY` (우선)
2. `AT_MARKET_API_KEY` (하위 호환성, cert_id와 cert_key 모두에 사용)
3. `PUBLIC_DATA_API_KEY` (하위 호환성, cert_id와 cert_key 모두에 사용)

**권장**: `KAMIS_CERT_ID`와 `KAMIS_CERT_KEY`를 명시적으로 설정하세요.

## API 엔드포인트 설정

### 기본 엔드포인트

기본적으로 다음 엔드포인트를 사용합니다:

```
https://www.kamis.or.kr/service/price/xml.do
```

### 커스텀 엔드포인트 사용

다른 KAMIS API 엔드포인트를 사용하려면 `.env.local`에 `KAMIS_API_URL`을 설정하세요:

```bash
KAMIS_API_URL=https://www.kamis.or.kr/service/price/xml.do
```

## API 파라미터

현재 코드에서 사용하는 파라미터:

- `action`: API 액션 (기본값: `dailySalesList` - 일일 도매가격 조회)
- `p_cert_id`: KAMIS 회원 아이디 (환경변수에서 자동 설정)
- `p_cert_key`: KAMIS API 인증키 (환경변수에서 자동 설정)
- `p_returntype`: 응답 형식 (기본값: `json`)
- `p_productname`: 상품명 (검색어)
- `p_itemname`: 품목명 (검색어, 상품명과 동일하게 설정)
- `p_countycode`: 지역코드 (전체: 빈 문자열)
- `p_convert_kg_yn`: kg 단위 변환 여부 (기본값: `Y`)

## 응답 구조

KAMIS API는 일반적으로 다음 구조로 응답합니다:

```json
{
  "data": {
    "error_code": "000",
    "error_msg": "정상처리",
    "item": [
      {
        "p_marketname": "가락시장",
        "p_itemname": "청양고추",
        "p_price": "9200",
        "p_unitname": "1kg",
        "p_grade": "상품",
        "p_regday": "20250115"
      }
    ]
  }
}
```

## 테스트 방법

1. 환경변수 설정 후 개발 서버 재시작:

   ```bash
   pnpm dev
   ```

2. 브라우저에서 테스트:

   ```
   http://localhost:3000/api/market-prices?productName=청양고추
   ```

3. 콘솔 로그 확인:
   - 개발 서버 콘솔에서 API 호출 로그 확인
   - 응답 데이터 구조 확인
   - 필드명이 다르면 코드 수정 필요

## 문제 해결

### API 인증 오류

- **증상**: "KAMIS API 인증 정보가 설정되지 않았습니다" 에러
- **해결**: `.env.local` 파일에 `KAMIS_CERT_ID`와 `KAMIS_CERT_KEY` 추가

### 응답 파싱 오류

- **증상**: "응답 파싱 실패" 에러
- **해결**:
  1. 콘솔에서 실제 응답 구조 확인
  2. `lib/market-api.ts`의 응답 파싱 로직 수정
  3. 필드명이 다르면 필드명 매핑 추가

### 데이터가 없음

- **증상**: 빈 배열 반환
- **해결**:
  1. KAMIS 웹사이트에서 해당 상품명으로 데이터가 있는지 확인
  2. API 파라미터 확인 (상품명, 날짜 등)
  3. 다른 상품명으로 테스트
  4. KAMIS API 문서에서 정확한 상품명 확인

## 참고 자료

- [KAMIS 홈페이지](https://www.kamis.or.kr)
- [KAMIS Open API 신청 페이지](https://www.kamis.or.kr/customer/mypage/my_openapi/my_openapi.do)
- [KAMIS Open API 이용안내](https://www.kamis.or.kr/customer/reference/openapi_list.do)
