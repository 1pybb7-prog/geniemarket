# 공공데이터포털 API 환경변수 설정 가이드

## 개요

공공데이터포털의 "한국농수산식품유통공사\_전국 공영도매시장 실시간 경매정보" API를 사용하여 실시간 시세 정보를 조회합니다.

## 환경변수 설정

### 1. `.env.local` 파일에 추가

프로젝트 루트의 `.env.local` 파일에 다음 환경변수를 추가하세요:

```bash
# 공공데이터포털 API 키 (필수)
PUBLIC_DATA_API_KEY=your_api_key_here

# 또는 AT_MARKET_API_KEY 사용 (하위 호환성)
AT_MARKET_API_KEY=your_api_key_here

# API 엔드포인트 URL (선택 사항)
# 기본값: http://apis.data.go.kr/B552845/katRealTime/trades
AT_MARKET_API_URL=http://apis.data.go.kr/B552845/katRealTime/trades
```

### 2. API 키 발급 방법

1. **공공데이터포털 접속**: [https://www.data.go.kr](https://www.data.go.kr)
2. **회원가입 및 로그인**
3. **API 검색**: "한국농수산식품유통공사\_전국 공영도매시장 실시간 경매정보" 검색
4. **API 신청**: 원하는 API 선택 후 활용 신청
5. **승인 대기**: 승인까지 1-2일 소요될 수 있음
6. **API 키 확인**: 마이페이지 > 활용신청 > 인증키(Decoding) 복사
   - **중요**: Encoding 키를 사용해야 합니다 (일반 인증키)

### 3. 환경변수 우선순위

코드는 다음 순서로 환경변수를 확인합니다:

1. `AT_MARKET_API_KEY` (우선)
2. `PUBLIC_DATA_API_KEY` (하위 호환성)

둘 중 하나만 설정하면 됩니다.

## API 엔드포인트 설정

### 기본 엔드포인트

기본적으로 다음 엔드포인트를 사용합니다:

```
http://apis.data.go.kr/B552845/katRealTime/trades
```

### 커스텀 엔드포인트 사용

공공데이터포털에서 다른 API를 사용하려면 `.env.local`에 `AT_MARKET_API_URL`을 설정하세요:

```bash
AT_MARKET_API_URL=https://apis.data.go.kr/.../your-custom-endpoint
```

## API 파라미터

현재 코드에서 사용하는 파라미터:

- `serviceKey`: API 키 (환경변수에서 자동 설정)
- `numOfRows`: 한 번에 가져올 데이터 수 (기본값: 100)
- `pageNo`: 페이지 번호 (기본값: 1)
- `dataType`: 응답 형식 (기본값: JSON)
- `trgDate`: 조회 날짜 (YYYYMMDD 형식, 오늘 날짜 자동 설정)

**참고**: 상품명으로 필터링은 API 응답을 받은 후 클라이언트 측에서 수행합니다.

## 응답 구조

공공데이터포털 API는 다음 구조로 응답합니다:

```json
{
  "response": {
    "header": {
      "resultCode": "0",
      "resultMsg": "정상"
    },
    "body": {
      "items": {
        "item": [
          {
            "whsl_mrkt_nm": "강릉",
            "corp_gds_item_nm": "깻잎",
            "scsbd_prc": "6800.000",
            "unit_nm": "kg",
            "unit_qty": "1.000",
            "trd_clcln_ymd": "2025-11-19",
            "scsbd_dt": "2025-11-18 18:28:21"
          }
        ]
      },
      "numOfRows": 10,
      "pageNo": 1,
      "totalCount": 84004
    }
  }
}
```

### 주요 필드 설명

- `whsl_mrkt_nm`: 시장명 (예: "강릉", "가락시장")
- `corp_gds_item_nm`: 상품명 (예: "깻잎", "배추")
- `scsbd_prc`: 성사단가 (가격, 원)
- `unit_nm`: 단위명 (예: "kg")
- `unit_qty`: 단위 수량 (예: "1.000")
- `trd_clcln_ymd`: 거래결정연월일 (YYYY-MM-DD 형식)
- `scsbd_dt`: 성사일시 (YYYY-MM-DD HH:mm:ss 형식)

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

### API 키 오류

- **증상**: "API 키 환경변수가 설정되지 않았습니다" 에러
- **해결**: `.env.local` 파일에 `AT_MARKET_API_KEY` 또는 `PUBLIC_DATA_API_KEY` 추가

### 응답 파싱 오류

- **증상**: "응답 파싱 실패" 에러
- **해결**:
  1. 콘솔에서 실제 응답 구조 확인
  2. `lib/market-api.ts`의 응답 파싱 로직 수정
  3. 필드명이 다르면 필드명 매핑 추가

### 데이터가 없음

- **증상**: 빈 배열 반환
- **해결**:
  1. 공공데이터포털에서 해당 상품명으로 데이터가 있는지 확인
  2. API 파라미터 확인 (상품명, 날짜 등)
  3. 다른 상품명으로 테스트

## 참고 자료

- [공공데이터포털](https://www.data.go.kr)
- [aT 도매시장 홈페이지](https://at.agromarket.kr)
- [공공데이터포털 OpenAPI 이용안내](https://at.agromarket.kr/openApiUser/apiInfo.do)
