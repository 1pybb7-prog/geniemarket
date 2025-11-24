/**
 * @file market-api.ts
 * @description 공공데이터포털 API를 사용한 공영도매시장 실시간 시세 조회 유틸리티
 *
 * 이 파일은 공공데이터포털의 "한국농수산식품유통공사_전국 공영도매시장 실시간 경매정보" API를 사용하여
 * 전국 공영도매시장의 실시간 경매 가격 정보를 조회하는 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 상품명으로 실시간 경매 가격 조회
 * 2. JSON 응답 파싱
 * 3. 에러 처리 및 로깅
 *
 * 핵심 구현 로직:
 * - 공공데이터포털 API 엔드포인트 호출 (실시간 경매정보 조회)
 * - 최신 날짜의 시세만 필터링하여 반환
 * - API 호출 실패 시 빈 배열 반환 (안전한 폴백)
 *
 * @dependencies
 * - 공공데이터포털 API 인증 정보 (PUBLIC_DATA_API_KEY 또는 AT_MARKET_API_KEY)
 *
 * @see {@link /docs/TODO.md} - 공공 API 연동 요구사항
 * @see {@link https://www.data.go.kr/data/15141808/openapi.do} - 공공데이터포털 API 문서
 */

/**
 * 공영도매시장 시세 정보 타입
 */
export interface MarketPrice {
  marketName: string; // 시장명 (예: "가락시장", "강서시장")
  productName: string; // 상품명
  grade: string; // 등급 (예: "상품", "중품", "하품")
  price: number; // 가격 (원)
  unit: string; // 단위 (예: "1kg", "1개")
  date: string; // 조회일자
}

/**
 * 공영도매시장 실시간 경매 가격을 조회합니다.
 *
 * 공공데이터포털 API를 사용하여
 * 오늘 날짜의 실시간 경매 가격 정보를 조회합니다.
 *
 * @param productName - 조회할 상품명 (예: "청양고추", "배추", "사과")
 * @param region - 선택적 지역 필터 (예: "서울", "경기", "강원")
 * @returns 시세 정보 배열 (실패 시 빈 배열 반환)
 *
 * @example
 * ```ts
 * const prices = await getPublicDataMarketPrices("청양고추");
 * ```
 */
export async function getPublicDataMarketPrices(
  productName: string,
  region?: string,
): Promise<MarketPrice[]> {
  // API 키 확인
  const apiKey =
    process.env.PUBLIC_DATA_API_KEY || process.env.AT_MARKET_API_KEY;
  const BASE_URL =
    process.env.AT_MARKET_API_URL ||
    "http://apis.data.go.kr/B552845/katRealTime/trades";

  if (!apiKey) {
    console.error("❌ API 키가 설정되지 않았습니다.");
    console.error(
      "💡 .env.local 파일에 PUBLIC_DATA_API_KEY 또는 AT_MARKET_API_KEY를 설정하세요.",
    );
    return [];
  }

  console.group("📊 공공데이터포털 API: 시세 조회 시작");
  console.log("🔍 상품명:", productName);
  if (region) console.log("📍 지역:", region);

  try {
    // API 요청 파라미터 구성
    const queryParams = new URLSearchParams({
      serviceKey: apiKey,
      numOfRows: "100", // 한 번에 가져올 데이터 수
      pageNo: "1",
      format: "json", // JSON 형식 요청
      p_productname: productName, // 상품명
    });

    // 지역 필터가 있으면 추가 (API 지원 여부 확인 필요, 여기서는 클라이언트 필터링을 위해 로깅만)
    // 참고: 실제 API 문서를 확인하여 지역 파라미터가 있는지 확인해야 함.
    // 현재 문서상으로는 p_countyname(군구명), p_marketname(시장명) 등이 있을 수 있음.

    const url = `${BASE_URL}?${queryParams.toString()}`;
    // console.log("🔗 요청 URL:", url); // 보안상 API 키가 포함된 URL은 로깅 제외

    // API 호출
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 }, // 1분 캐시
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 응답 텍스트 확인 (JSON 파싱 전)
    const responseText = await response.text();
    // console.log("📄 응답 본문 (처음 200자):", responseText.substring(0, 200));

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("❌ JSON 파싱 실패. 응답이 XML일 수 있습니다.");
      // XML 파싱 로직이 필요할 수 있음. 현재는 JSON만 처리.
      throw new Error("JSON 파싱 실패");
    }

    // 데이터 구조 확인 및 추출
    // 응답 구조는 API 버전에 따라 다를 수 있음.
    // 예상 구조 1: { response: { body: { items: { item: [...] } } } }
    // 예상 구조 2: { items: [...] }
    let items: any[] = [];

    if (data.response?.body?.items?.item) {
      items = data.response.body.items.item;
    } else if (data.response?.body?.items) {
      items = data.response.body.items;
    } else if (data.items) {
      items = data.items;
    } else if (Array.isArray(data)) {
      items = data;
    }

    // 배열이 아닌 경우 (단일 객체인 경우) 배열로 변환
    if (items && !Array.isArray(items)) {
      items = [items];
    }

    console.log(`📦 수신된 데이터 개수: ${items.length}`);

    // 데이터 매핑
    const prices: MarketPrice[] = [];
    let lastError: any = null;

    try {
      items.forEach((item: any) => {
        // 필수 필드 확인 (API 필드명에 따라 조정 필요)
        // 공공데이터포털 API 필드명 예시:
        // marketname: 시장명
        // productname: 상품명
        // grade: 등급
        // price: 가격
        // unit: 단위
        // date: 날짜

        // 대소문자 무시하고 필드 찾기 위한 헬퍼 함수
        const getValue = (val: any) => (val ? String(val).trim() : "");

        // 가격: 공공데이터포털 API 필드명 (price, p_price, cost, amt 등)
        const priceStr =
          getValue(item.price) ||
          getValue(item.p_price) ||
          getValue(item.cost) ||
          getValue(item.amt) ||
          getValue(item.sbid_pric); // 낙찰가 (공공데이터포털)

        // 가격이 없으면 스킵
        if (!priceStr) return;

        const price = parseInt(priceStr.replace(/,/g, ""), 10);

        if (!isNaN(price) && price > 0) {
          // 시장명: 공공데이터포털 API 필드명
          const marketName =
            getValue(item.marketname) ||
            getValue(item.p_marketname) ||
            getValue(item.marketName) ||
            getValue(item.whsal_mrkt_nm); // 도매시장명 (공공데이터포털)

          // 등급: 공공데이터포털 API 필드명
          const grade =
            getValue(item.grade) ||
            getValue(item.p_grade) ||
            getValue(item.grade_nm) || // 등급명 (공공데이터포털)
            "일반";

          // 단위: 공공데이터포털 API 필드명
          const unit =
            getValue(item.unit) ||
            getValue(item.p_unit) ||
            getValue(item.std_unit_new_nm) || // 규격단위명 (공공데이터포털)
            getValue(item.delng_qy) || // 거래량 (단위가 아닐 수 있음)
            "1kg";

          // 상품명 (API 응답에서 확인)
          const itemNameValue =
            getValue(item.item_nm) ||
            getValue(item.prdlst_nm) ||
            getValue(item.productName);

          // 가격 필드 확인용 로그 (디버깅)
          // if (prices.length < 1) {
          //   console.log("🔍 첫 번째 아이템 데이터:", JSON.stringify(item, null, 2));
          // }

          // 단위 처리 로직 개선
          // 1. 가격이 비정상적으로 낮은 경우 (100원 미만) -> kg 단위가 아닐 수 있음
          // 2. 단위에 'kg'이 포함되어 있는지 확인
          let finalPrice = price;
          let finalUnit = unit;

          // 단위 정규화
          if (unit.includes("kg")) {
            // "20kg" 등의 문자열에서 숫자만 추출
            const unitWeightMatch = unit.match(/(\d+(?:\.\d+)?)\s*kg/i);
            if (unitWeightMatch) {
              const weight = parseFloat(unitWeightMatch[1]);
              if (weight > 0 && weight !== 1) {
                // 1kg 당 가격으로 환산 (선택 사항: 원본 단위를 유지할지, 환산할지 결정)
                // 여기서는 원본 단위를 유지하되, 사용자에게 명확히 보여주는 방향으로
                // finalPrice = Math.round(price / weight);
                // finalUnit = "1kg";
              }
            }
          }

          // 특이 케이스 처리: "개", "포기" 등의 단위
          // 배추, 무 등은 '개' 또는 '포기' 단위로 거래될 수 있음
          if (
            (productName.includes("배추") ||
              productName.includes("무") ||
              productName.includes("파")) &&
            (unit.includes("포기") || unit.includes("개"))
          ) {
            // 포기, 개 단위는 그대로 사용
            finalPrice = price;
            finalUnit = unit;

            // console.log(
            //   `💰 가격 (포기/개 단위): ${itemNameValue} - ${price}원/${finalUnit}`,
            // );
          } else {
            // 기타 경우
            finalPrice = price;
            finalUnit = unit || "1kg";
          }

          // 날짜: 공공데이터포털 API 필드명
          const dateStr =
            getValue(item.trd_clcln_ymd) || // 거래결정연월일 (공공데이터포털, 우선, YYYY-MM-DD 형식)
            getValue(item.scsbd_dt) || // 성사일시 (YYYY-MM-DD HH:mm:ss 형식)
            getValue(item.lastest_day) || // KAMIS 최신 날짜 필드
            getValue(item.p_regday) ||
            getValue(item.regday) ||
            getValue(item.baseDate) ||
            getValue(item.date);
          let date = new Date().toISOString().split("T")[0]; // 기본값: 오늘 날짜
          if (dateStr && dateStr !== "-" && dateStr !== "") {
            // YYYY-MM-DD 형식인 경우 (공공데이터포털 표준)
            if (dateStr.includes("-") && dateStr.length >= 10) {
              date = dateStr.substring(0, 10); // "YYYY-MM-DD" 부분만 추출
            }
            // YYYYMMDD 형식인 경우
            else if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
              date = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
            }
            // "MM/DD" 형식인 경우
            else if (dateStr.includes("/") && !dateStr.includes("-")) {
              const year = String(new Date().getFullYear());
              const [month, day] = dateStr.split("/");
              date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
            }
          }

          // 상품명: 공공데이터포털 API 필드명
          const productNameFromItem =
            itemNameValue ||
            getValue(item.corp_gds_item_nm) || // 공공데이터포털 필드명 (우선)
            getValue(item.p_itemname) ||
            getValue(item.p_productname) ||
            getValue(item.productname) ||
            getValue(item.productName) ||
            getValue(item.prdlstNm) ||
            productName;

          prices.push({
            marketName:
              typeof marketName === "string" ? marketName : "알 수 없음",
            productName: productNameFromItem,
            grade,
            price: finalPrice, // 변환된 가격 사용
            unit: finalUnit, // 변환된 단위 사용
            date,
          });
        }
      });

      console.log(`✅ 최종 파싱된 시세: ${prices.length}개`);
    } catch (parseError) {
      console.error("❌ 데이터 파싱 중 오류 발생");
      console.error(
        "에러 타입:",
        parseError instanceof Error
          ? parseError.constructor.name
          : typeof parseError,
      );
      console.error(
        "에러 메시지:",
        parseError instanceof Error ? parseError.message : String(parseError),
      );
      if (parseError instanceof Error && parseError.stack) {
        console.error("에러 스택:", parseError.stack);
      }
      if (parseError instanceof Error) {
        lastError = parseError;
      }
    }

    // 결과가 있으면 최신 거래순으로 정렬하여 반환
    if (prices.length > 0) {
      console.log(`✅ 총 ${prices.length}개의 시세 데이터 수집 완료`);

      // 날짜 기준으로 정렬 (최신 날짜가 먼저), 같은 날짜면 시장명 > 등급 > 가격 순으로 정렬
      prices.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();

        // 날짜가 다르면 날짜 기준 정렬 (최신이 먼저)
        if (dateB !== dateA) {
          return dateB - dateA;
        }

        // 같은 날짜면 시장명 기준 정렬 (가나다순)
        const marketCompare = a.marketName.localeCompare(b.marketName, "ko");
        if (marketCompare !== 0) {
          return marketCompare;
        }

        // 같은 시장이면 등급 기준 정렬 (상품 > 중품 > 하품 > 일반)
        const gradeOrder: Record<string, number> = {
          상품: 1,
          중품: 2,
          하품: 3,
          일반: 4,
        };
        const gradeA = gradeOrder[a.grade] || 4;
        const gradeB = gradeOrder[b.grade] || 4;
        if (gradeA !== gradeB) {
          return gradeA - gradeB;
        }

        // 같은 등급이면 가격 기준 정렬 (높은 가격이 먼저)
        return b.price - a.price;
      });

      console.log(`📊 최신 거래순으로 정렬 완료: ${prices.length}개`);
      console.log(
        `📅 날짜 범위: ${prices[prices.length - 1]?.date} ~ ${prices[0]?.date}`,
      );

      // 모든 거래를 반환 (중복 제거하지 않음 - 같은 시장에서도 등급별로 여러 거래 표시)
      console.groupEnd();
      return prices;
    }

    // 데이터를 찾지 못한 경우
    if (lastError) {
      console.error("❌ 시세 조회 실패");
      console.error("마지막 에러:", lastError);
    } else {
      console.warn("⚠️ 시세 정보를 찾을 수 없습니다.");
    }
    console.groupEnd();
    return [];
  } catch (error) {
    console.error("❌ 공공데이터포털 API 호출 실패:", error);
    console.error(
      "❌ 에러 타입:",
      error instanceof Error ? error.constructor.name : typeof error,
    );
    console.error(
      "❌ 에러 메시지:",
      error instanceof Error ? error.message : String(error),
    );
    if (error instanceof Error && error.stack) {
      console.error("❌ 에러 스택:", error.stack);
    }
    console.error("💡 빈 배열을 반환합니다.");

    // 에러 발생 시 빈 배열 반환 (안전한 폴백)
    console.groupEnd();
    return [];
  }
}

/**
 * KAMIS Open API를 사용하여 실시간 경매 가격을 조회합니다.
 *
 * @param productName - 조회할 상품명
 * @param region - 선택적 지역 필터
 * @returns 시세 정보 배열
 */
export async function getKamisMarketPrices(
  productName: string,
  region?: string,
): Promise<MarketPrice[]> {
  console.group("📊 KAMIS Open API: 시세 조회 시작");
  console.log("🔍 상품명:", productName);

  try {
    // KAMIS API 인증 정보
    const certKey = process.env.KAMIS_CERT_KEY;
    const certId = process.env.KAMIS_CERT_ID;

    if (!certKey || !certId) {
      console.error("❌ KAMIS API 인증 정보가 설정되지 않았습니다.");
      console.error("💡 .env.local 파일에 다음 환경변수를 추가하세요:");
      console.error("   - KAMIS_CERT_KEY: KAMIS Open API 인증키");
      console.error("   - KAMIS_CERT_ID: KAMIS Open API 아이디");
      throw new Error("KAMIS API 인증 정보가 설정되지 않았습니다.");
    }

    // KAMIS API 엔드포인트 (일일 도매 시세)
    const BASE_URL = "http://www.kamis.or.kr/service/price/xml.do";

    // 오늘 날짜 (YYYY-MM-DD)
    const today = new Date();

    // 카테고리 코드 매핑 (간단한 매핑)
    // 100: 식량작물, 200: 채소류, 300: 특용작물, 400: 과일류, 500: 축산물, 600: 수산물
    let categoryCode = "200"; // 기본값: 채소류
    if (
      productName.includes("사과") ||
      (productName.includes("배") && !productName.includes("배추")) ||
      productName.includes("포도") ||
      productName.includes("복숭아") ||
      productName.includes("감귤") ||
      productName.includes("단감")
    ) {
      categoryCode = "400"; // 과일류
    } else if (
      productName.includes("쌀") ||
      productName.includes("콩") ||
      productName.includes("팥") ||
      productName.includes("감자") ||
      productName.includes("고구마")
    ) {
      categoryCode = "100"; // 식량작물
    } else if (
      productName.includes("소고기") ||
      productName.includes("돼지고기") ||
      productName.includes("닭고기")
    ) {
      categoryCode = "500"; // 축산물
    } else if (
      productName.includes("대추") ||
      productName.includes("밤") ||
      productName.includes("호두") ||
      productName.includes("버섯") ||
      productName.includes("참깨") ||
      productName.includes("들깨") ||
      productName.includes("땅콩") ||
      productName.includes("깨")
    ) {
      categoryCode = "300"; // 특용작물
    }
    
    // 최근 7일간의 데이터를 조회하여 가장 최신 데이터를 반환
    // (주말이나 공휴일 등으로 데이터가 없는 경우를 대비)
    const MAX_LOOKBACK_DAYS = 7;
    
    for (let i = 0; i < MAX_LOOKBACK_DAYS; i += 2) {
      // i일 전 날짜 계산
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - i);
      const dateStr = targetDate.toISOString().split("T")[0];

      console.log(`📅 시세 조회 시도: ${dateStr} (D-${i})`);

      // API 요청 파라미터
      const queryParams = new URLSearchParams({
        action: "dailyPriceByCategoryList",
        p_product_cls_code: "02", // 02: 도매
        p_country_code: "1101", // 1101: 서울 (대표 지역)
        p_regday: dateStr,
        p_convert_kg_yn: "N",
        p_item_category_code: categoryCode,
        p_cert_key: certKey,
        p_cert_id: certId,
        p_returntype: "json",
      });

      const url = `${BASE_URL}?${queryParams.toString()}`;
      
      try {
        const response = await fetch(url, {
          method: "GET",
          next: { revalidate: 3600 }, // 1시간 캐시
        });

        if (!response.ok) {
          console.warn(`⚠️ API 호출 실패 (${dateStr}): ${response.status}`);
          continue;
        }

        const responseText = await response.text();
        let data: any;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error(`❌ JSON 파싱 실패 (${dateStr})`);
          continue;
        }

        // 데이터 구조 확인
        if (!data.data || !Array.isArray(data.data.item)) {
          // 데이터가 없으면 다음 날짜(더 과거)로 시도
          continue;
        }

        const items = data.data.item;
        const prices: MarketPrice[] = [];

        items.forEach((item: any) => {
          // 상품명 필터링
          if (!item.item_name.includes(productName)) {
            return;
          }

          // 가격 파싱 ("-" 또는 숫자)
          // dpr1: 조회일 기준 당일 시세
          // dpr2: 조회일 기준 1일전 시세
          let priceStr = item.dpr1;
          let priceDate = dateStr;

          // 당일 시세가 없으면 1일전 시세 사용
          if (!priceStr || priceStr === "-") {
            priceStr = item.dpr2;
            if (priceStr && priceStr !== "-") {
              const yesterday = new Date(targetDate);
              yesterday.setDate(yesterday.getDate() - 1);
              priceDate = yesterday.toISOString().split("T")[0];
            }
          }

          if (!priceStr || priceStr === "-") {
            return;
          }

          const price = parseInt(priceStr.replace(/,/g, ""), 10);
          if (isNaN(price) || price <= 0) {
            return;
          }

          prices.push({
            marketName: "KAMIS (서울)",
            productName: item.item_name,
            grade: item.rank || "보통",
            price: price,
            unit: item.unit || "1kg",
            date: priceDate,
          });
        });

        // 유효한 시세 데이터가 있으면 반환
        if (prices.length > 0) {
          console.log(`✅ KAMIS 시세 조회 성공 (${dateStr}): ${prices.length}개 항목`);
          return prices;
        }
        
      } catch (loopError) {
        console.error(`❌ 루프 중 에러 발생 (${dateStr}):`, loopError);
        // 계속 시도
      }
    }

    console.warn("⚠️ 최근 7일간 유효한 시세 데이터를 찾을 수 없습니다.");
    return [];

  } catch (error) {
    console.error("❌ KAMIS API 호출 중 오류 발생:", error);
    console.groupEnd();
    return [];
  } finally {
    console.groupEnd();
  }
}

/**
 * 기존 getMarketPrices 함수 (하위 호환성 유지)
 * @deprecated getPublicDataMarketPrices 사용 권장
 */
export const getMarketPrices = getPublicDataMarketPrices;

/**
 * 평균 시세를 계산합니다.
 *
 * @param prices - 시세 정보 배열
 * @returns 평균 가격 (원)
 *
 * @example
 * ```ts
 * const prices = await getMarketPrices("청양고추");
 * const avgPrice = calculateAveragePrice(prices);
 * console.log(avgPrice); // 9050
 * ```
 */
export function calculateAveragePrice(prices: MarketPrice[]): number {
  if (prices.length === 0) {
    return 0;
  }

  const sum = prices.reduce((acc, price) => acc + price.price, 0);
  return Math.round(sum / prices.length);
}
