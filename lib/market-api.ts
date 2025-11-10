/**
 * @file market-api.ts
 * @description 공공데이터포털 API를 사용한 공영도매시장 실시간 시세 조회 유틸리티
 *
 * 이 파일은 한국농수산식품유통공사(KAMIS) 공공 API를 사용하여
 * 전국 공영도매시장의 실시간 경매 가격 정보를 조회하는 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 상품명으로 시세 조회
 * 2. XML 응답을 JSON으로 변환
 * 3. 에러 처리 및 로깅
 *
 * 핵심 구현 로직:
 * - 공공데이터포털 API 엔드포인트 호출
 * - XML 응답 파싱 (향후 구현)
 * - API 호출 실패 시 빈 배열 반환 (안전한 폴백)
 *
 * @dependencies
 * - 공공데이터포털 API 키 (PUBLIC_DATA_API_KEY)
 *
 * @see {@link /docs/TODO.md} - 공공 API 연동 요구사항
 * @see {@link https://www.data.go.kr} - 공공데이터포털
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
 * 공영도매시장 실시간 시세를 조회합니다.
 *
 * @param productName - 조회할 상품명 (예: "청양고추")
 * @returns 시세 정보 배열 (실패 시 빈 배열 반환)
 *
 * @example
 * ```ts
 * const prices = await getMarketPrices("청양고추");
 * console.log(prices); // [{ marketName: "가락시장", price: 9200, ... }, ...]
 * ```
 */
export async function getMarketPrices(
  productName: string,
): Promise<MarketPrice[]> {
  console.group("📊 공공데이터포털 API: 시세 조회 시작");
  console.log("🔍 상품명:", productName);

  try {
    const apiKey = process.env.PUBLIC_DATA_API_KEY;

    if (!apiKey) {
      console.error("❌ PUBLIC_DATA_API_KEY 환경변수가 설정되지 않았습니다.");
      console.error("💡 .env.local 파일에 PUBLIC_DATA_API_KEY를 추가하세요.");
      throw new Error(
        "PUBLIC_DATA_API_KEY 환경변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.",
      );
    }

    // 공공데이터포털 API 엔드포인트
    // 참고: 실제 API 엔드포인트는 공공데이터포털에서 제공하는 정확한 URL을 사용해야 합니다
    const BASE_URL = "http://www.kamis.or.kr/service/price/xml.do";

    // API 호출 파라미터 구성
    // 참고: 실제 파라미터는 API 문서에 따라 조정이 필요합니다
    const params = new URLSearchParams({
      action: "periodProductList", // 예시 파라미터
      p_productclscode: "01", // 예시: 농산물 코드
      p_itemcategorycode: "100", // 예시: 채소류 코드
      p_productname: productName,
      p_convert_kg_yn: "Y", // kg 단위로 변환
      p_cert_key: apiKey,
      p_cert_id: "geniemarket", // 서비스 ID (예시)
      p_returntype: "json", // JSON 형식으로 응답 받기
    });

    const url = `${BASE_URL}?${params.toString()}`;

    console.log("📤 API 호출 중...");
    console.log("🔗 URL:", url.replace(apiKey, "***"));

    // API 호출
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `API 호출 실패: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    console.log(
      "✅ API 응답 수신:",
      JSON.stringify(data).substring(0, 500) + "...",
    );

    // 응답 데이터 파싱 및 변환
    // 공공데이터포털 API 응답 구조: { condition: [...], data: { error_code: '000', item: [...] } }
    const prices: MarketPrice[] = [];

    // 응답 구조 확인
    if (data && data.data && data.data.item && Array.isArray(data.data.item)) {
      console.log("📦 응답 데이터 구조 확인:", {
        errorCode: data.data.error_code,
        itemCount: data.data.item.length,
      });

      // 첫 번째 아이템의 실제 필드명 확인
      if (data.data.item.length > 0) {
        const firstItem = data.data.item[0];
        console.log(
          "📊 첫 번째 아이템 샘플 (전체):",
          JSON.stringify(firstItem, null, 2),
        );
        console.log("📋 첫 번째 아이템의 필드명:", Object.keys(firstItem));
      }

      // item 배열에서 데이터 추출
      // KAMIS API 일반 필드명: p_countyname(시장명), p_itemname(상품명), dpr1(상품가격), p_grade(등급), p_unitname(단위), p_regday(등록일)
      data.data.item.forEach((item: any) => {
        if (item) {
          // 시장명: p_countyname 또는 p_marketname
          const marketName =
            item.p_countyname ||
            item.p_marketname ||
            item.marketname ||
            item.marketName ||
            (Array.isArray(item.p_countyname) ? item.p_countyname[0] : null) ||
            "알 수 없음";

          // 가격: dpr1(상품), dpr2(중품), dpr3(하품) 또는 p_price
          const price =
            Number(item.dpr1) ||
            Number(item.dpr2) ||
            Number(item.dpr3) ||
            Number(item.p_price) ||
            Number(item.price) ||
            0;

          // 등급: p_grade 또는 productrank
          const grade =
            item.p_grade ||
            item.grade ||
            item.productrank ||
            (price === Number(item.dpr1)
              ? "상품"
              : price === Number(item.dpr2)
                ? "중품"
                : price === Number(item.dpr3)
                  ? "하품"
                  : "일반");

          // 단위: p_unitname 또는 p_unit
          const unit = item.p_unitname || item.p_unit || item.unit || "1kg";

          // 날짜: p_regday (형식: "MM/DD")
          const dateStr = item.p_regday || item.regday || item.date;
          let date = new Date().toISOString().split("T")[0]; // 기본값: 오늘 날짜
          if (dateStr) {
            // "MM/DD" 형식을 "YYYY-MM-DD"로 변환
            if (dateStr.includes("/")) {
              const [month, day] = dateStr.split("/");
              const currentYear = new Date().getFullYear();
              date = `${currentYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
            } else {
              date = dateStr;
            }
          }

          prices.push({
            marketName:
              typeof marketName === "string" ? marketName : "알 수 없음",
            productName:
              item.p_itemname ||
              item.p_productname ||
              item.productname ||
              item.productName ||
              productName,
            grade,
            price,
            unit,
            date,
          });
        }
      });
    } else {
      console.warn("⚠️ 응답 데이터 구조가 예상과 다릅니다.");
      console.log("📋 응답 구조:", Object.keys(data || {}));
      if (data?.data) {
        console.log("📋 data 구조:", Object.keys(data.data));
      }
    }

    console.log("📊 파싱된 시세 데이터:", prices);
    console.groupEnd();

    return prices;
  } catch (error) {
    console.error("❌ 공공데이터포털 API 호출 실패:", error);
    console.error("💡 빈 배열을 반환합니다.");

    // 에러 발생 시 빈 배열 반환 (안전한 폴백)
    console.groupEnd();
    return [];
  }
}

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
