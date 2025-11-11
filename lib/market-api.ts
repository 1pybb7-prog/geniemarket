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
    // 카테고리 코드를 선택적으로 설정하여 더 넓은 범위로 검색
    // 채소류(100), 과일류(200), 곡물류(300) 등 여러 카테고리를 시도
    const categoryCodes = ["100", "200", "300", "400", "500"]; // 채소, 과일, 곡물, 기타 등

    console.log("📤 API 호출 중...");
    console.log("🔍 상품명:", productName);
    console.log("🔑 API 키 길이:", apiKey.length, "자");

    // 여러 카테고리 코드로 시도
    let allPrices: MarketPrice[] = [];
    let lastError: Error | null = null;

    for (const categoryCode of categoryCodes) {
      try {
        const params = new URLSearchParams({
          action: "periodProductList",
          p_productclscode: "01", // 농산물 코드
          p_itemcategorycode: categoryCode,
          p_productname: productName,
          p_convert_kg_yn: "Y", // kg 단위로 변환
          p_cert_key: apiKey,
          p_cert_id: "geniemarket",
          p_returntype: "json", // JSON 형식으로 응답 받기
        });

        const url = `${BASE_URL}?${params.toString()}`;
        console.log(
          `🔗 카테고리 ${categoryCode}로 시도:`,
          url.replace(apiKey, "***"),
        );

        // API 호출
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json, application/xml, text/xml, */*",
          },
        });

        console.log(
          `📥 카테고리 ${categoryCode} 응답 상태:`,
          response.status,
          response.statusText,
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(
            `⚠️ 카테고리 ${categoryCode} API 호출 실패:`,
            errorText.substring(0, 200),
          );
          continue; // 다음 카테고리 시도
        }

        // 응답 Content-Type 확인
        const contentType = response.headers.get("content-type") || "";
        console.log(`📄 카테고리 ${categoryCode} Content-Type:`, contentType);

        // 응답 본문 읽기 (한 번만 읽기 - response.text()는 한 번만 호출 가능)
        const responseText = await response.text();
        console.log(
          `📄 카테고리 ${categoryCode} 응답 본문 (처음 1000자):`,
          responseText.substring(0, 1000),
        );

        let data: any;

        // Content-Type과 관계없이 JSON 파싱 시도
        try {
          data = JSON.parse(responseText);
          console.log(`✅ 카테고리 ${categoryCode} JSON 응답 수신`);
          console.log(
            `📊 카테고리 ${categoryCode} 응답 구조:`,
            JSON.stringify(data, null, 2).substring(0, 2000),
          );
        } catch (parseError) {
          // JSON 파싱 실패
          if (contentType.includes("xml") || contentType.includes("text/xml")) {
            console.warn(
              `⚠️ 카테고리 ${categoryCode} XML 응답 (아직 파싱 미지원)`,
            );
            console.warn(
              "⚠️ XML 응답은 아직 파싱되지 않았습니다. JSON으로 변환 필요.",
            );
          } else {
            console.error(
              `❌ 카테고리 ${categoryCode} JSON 파싱 실패:`,
              parseError,
            );
            console.warn(`📄 원본 응답:`, responseText.substring(0, 1000));
          }
          continue; // 다음 카테고리 시도
        }

        // 응답 데이터 파싱 및 변환
        // 공공데이터포털 API 응답 구조: { condition: [...], data: { error_code: '000', item: [...] } }
        const prices: MarketPrice[] = [];

        // 에러 응답 확인
        if (data?.error) {
          console.warn(
            `⚠️ 카테고리 ${categoryCode} API 응답에 에러:`,
            data.error,
          );
          continue; // 다음 카테고리 시도
        }

        // 응답 구조 확인 및 로깅
        if (data?.data) {
          if (data.data.error_code) {
            if (
              data.data.error_code !== "000" &&
              data.data.error_code !== "0"
            ) {
              console.warn(
                `⚠️ 카테고리 ${categoryCode} API 에러 코드:`,
                data.data.error_code,
                data.data.error_message || data.data.error_msg || "알 수 없음",
              );
              continue; // 다음 카테고리 시도
            }
          }
        }

        // 응답 구조 확인 및 상세 로깅
        console.log(
          `🔍 카테고리 ${categoryCode} 응답 데이터 구조 분석:`,
          JSON.stringify(data, null, 2).substring(0, 2000),
        );

        if (
          data &&
          data.data &&
          data.data.item &&
          Array.isArray(data.data.item)
        ) {
          console.log(`📦 카테고리 ${categoryCode} 응답 데이터:`, {
            errorCode: data.data.error_code,
            itemCount: data.data.item.length,
          });

          // 첫 번째 아이템의 실제 필드명 확인
          if (data.data.item.length > 0) {
            const firstItem = data.data.item[0];
            console.log(
              `📊 카테고리 ${categoryCode} 첫 번째 아이템 샘플:`,
              JSON.stringify(firstItem, null, 2),
            );
            console.log(
              `📋 카테고리 ${categoryCode} 첫 번째 아이템의 필드명:`,
              Object.keys(firstItem),
            );

            // 배추 관련 아이템이 있는지 확인
            const baechuItems = data.data.item.filter(
              (item: any) =>
                item.itemname &&
                (item.itemname.includes("배추") ||
                  item.itemname.includes("포기배추") ||
                  item.itemname.includes("절임배추")),
            );
            if (baechuItems.length > 0) {
              console.log(
                `✅ 카테고리 ${categoryCode}에서 배추 관련 아이템 ${baechuItems.length}개 발견!`,
              );
            }
          }

          // item 배열에서 데이터 추출
          // 실제 KAMIS API 응답 필드명: itemname(상품명), countyname(지역명), marketname(시장명), price(가격), regday(등록일), kindname(종류명)
          // 주의: itemname, kindname, marketname이 배열로 올 수 있음 (빈 배열 [] 또는 값이 있는 배열)
          data.data.item.forEach((item: any) => {
            if (item) {
              // 배열에서 값 추출 헬퍼 함수
              const getValue = (value: any, fallback: string = ""): string => {
                if (Array.isArray(value)) {
                  // 배열인 경우 첫 번째 요소 사용 (빈 배열이면 fallback)
                  return value.length > 0 ? String(value[0]) : fallback;
                }
                return value ? String(value) : fallback;
              };

              // 시장명: marketname 또는 countyname (배열일 수 있음)
              const marketName =
                getValue(item.marketname) ||
                getValue(item.marketName) ||
                getValue(item.p_marketname) ||
                getValue(item.p_countyname) ||
                getValue(item.countyname) ||
                "알 수 없음";

              // 가격: price (문자열 형식, 쉼표 포함 예: "3,295" 또는 "-")
              let price = 0;
              const priceStr =
                getValue(item.price) ||
                getValue(item.p_price) ||
                getValue(item.dpr1) ||
                getValue(item.dpr2) ||
                getValue(item.dpr3);
              if (priceStr && priceStr !== "-" && priceStr !== "") {
                // 쉼표 제거 후 숫자로 변환
                const cleanedPrice = String(priceStr).replace(/,/g, "");
                price = Number(cleanedPrice) || 0;
              }

              // 가격이 0이거나 "-"인 경우 건너뛰기 (유효한 시세만 표시)
              if (price === 0) {
                return;
              }

              // 상품명: itemname (배열일 수 있음)
              const itemNameValue = getValue(item.itemname);

              // 상품명이 없거나 빈 문자열인 경우 건너뛰기 (유효한 상품명만 표시)
              if (!itemNameValue || itemNameValue.trim() === "") {
                return;
              }

              // 등급: kindname에서 추출하거나 기본값
              const kindNameValue = getValue(item.kindname);
              const grade =
                getValue(item.grade) ||
                getValue(item.p_grade) ||
                getValue(item.productrank) ||
                (kindNameValue && kindNameValue.includes("상품")
                  ? "상품"
                  : "일반");

              // 단위: kindname에서 추출 (예: "20kg(1kg)" -> "1kg") 또는 기본값
              let unit = "1kg";
              if (kindNameValue) {
                const unitMatch = kindNameValue.match(/\((\d+kg)\)/);
                if (unitMatch) {
                  unit = unitMatch[1];
                }
              }
              unit =
                getValue(item.p_unitname) ||
                getValue(item.p_unit) ||
                getValue(item.unit) ||
                unit;

              // 날짜: regday (형식: "MM/DD")와 yyyy (연도) 조합
              const dateStr =
                getValue(item.regday) ||
                getValue(item.p_regday) ||
                getValue(item.date);
              const year =
                getValue(item.yyyy) || String(new Date().getFullYear());
              let date = new Date().toISOString().split("T")[0]; // 기본값: 오늘 날짜
              if (dateStr && dateStr !== "-" && dateStr !== "") {
                // "MM/DD" 형식을 "YYYY-MM-DD"로 변환
                if (dateStr.includes("/")) {
                  const [month, day] = dateStr.split("/");
                  date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
                } else {
                  date = dateStr;
                }
              }

              // 상품명: itemname 또는 productName
              const productNameFromItem =
                itemNameValue ||
                getValue(item.p_itemname) ||
                getValue(item.p_productname) ||
                getValue(item.productname) ||
                getValue(item.productName) ||
                productName;

              prices.push({
                marketName:
                  typeof marketName === "string" ? marketName : "알 수 없음",
                productName: productNameFromItem,
                grade,
                price,
                unit,
                date,
              });
            }
          });

          // 이 카테고리에서 데이터를 찾았으면 결과에 추가
          if (prices.length > 0) {
            console.log(
              `✅ 카테고리 ${categoryCode}에서 ${prices.length}개 시세 발견`,
            );
            allPrices = allPrices.concat(prices);
          }
        } else {
          console.log(`📭 카테고리 ${categoryCode}에서 데이터 없음`);
        }
      } catch (error) {
        console.warn(`⚠️ 카테고리 ${categoryCode} 처리 중 오류:`, error);
        if (error instanceof Error) {
          lastError = error;
        }
        continue; // 다음 카테고리 시도
      }
    }

    // 결과가 있으면 최신 시세만 필터링하여 반환
    if (allPrices.length > 0) {
      console.log(`✅ 총 ${allPrices.length}개의 시세 데이터 수집 완료`);

      // 날짜 기준으로 정렬 (최신 날짜가 먼저)
      allPrices.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // 내림차순 (최신이 먼저)
      });

      // 가장 최근 날짜 찾기
      const latestDate = allPrices[0]?.date;
      console.log(`📅 가장 최근 날짜: ${latestDate}`);

      // 가장 최근 날짜의 데이터만 필터링
      const latestPrices = allPrices.filter(
        (price) => price.date === latestDate,
      );
      console.log(`📊 최신 날짜의 시세: ${latestPrices.length}개`);

      // 시장명 기준으로 중복 제거 (같은 시장명이면 하나만 유지 - 첫 번째 것)
      const uniqueMarketPrices: MarketPrice[] = [];
      const seenMarkets = new Set<string>();

      for (const price of latestPrices) {
        const marketKey = `${price.marketName}_${price.grade || "일반"}`;
        if (!seenMarkets.has(marketKey)) {
          seenMarkets.add(marketKey);
          uniqueMarketPrices.push(price);
        }
      }

      console.log(`🔍 중복 제거 후 최신 시세: ${uniqueMarketPrices.length}개`);
      console.groupEnd();
      return uniqueMarketPrices;
    }

    // 모든 카테고리에서 데이터를 찾지 못한 경우
    if (lastError) {
      console.error("❌ 모든 카테고리에서 시세 조회 실패");
      console.error("마지막 에러:", lastError);
    } else {
      console.warn("⚠️ 모든 카테고리에서 시세 정보를 찾을 수 없습니다.");
    }
    console.groupEnd();
    return [];
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
