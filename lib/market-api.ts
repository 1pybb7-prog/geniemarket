/**
 * @file market-api.ts
 * @description 공공데이터포털 API를 사용한 공영도매시장 실시간 시세 조회 유틸리티
 *
 * 이 파일은 한국농수산식품유통공사(KAMIS) 공공 API를 사용하여
 * 전국 공영도매시장의 실시간 경매 가격 정보를 조회하는 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 상품명으로 실시간 경매 가격 조회 (dailyPriceByCategoryList 액션 사용)
 * 2. JSON 응답 파싱
 * 3. 에러 처리 및 로깅
 *
 * 핵심 구현 로직:
 * - KAMIS API 엔드포인트 호출 (실시간 경매 가격 조회)
 * - 여러 카테고리 코드로 시도하여 검색 범위 확대
 * - 최신 날짜의 시세만 필터링하여 반환
 * - API 호출 실패 시 빈 배열 반환 (안전한 폴백)
 *
 * @dependencies
 * - 공공데이터포털 API 키 (PUBLIC_DATA_API_KEY)
 *
 * @see {@link /docs/TODO.md} - 공공 API 연동 요구사항
 * @see {@link https://www.data.go.kr} - 공공데이터포털
 * @see {@link https://www.kamis.or.kr} - KAMIS 공식 사이트
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
 * KAMIS API의 dailyPriceByCategoryList 액션을 사용하여
 * 오늘 날짜의 실시간 경매 가격 정보를 조회합니다.
 *
 * @param productName - 조회할 상품명 (예: "청양고추", "배추", "사과")
 * @returns 시세 정보 배열 (실패 시 빈 배열 반환)
 *
 * @example
 * ```ts
 * const prices = await getMarketPrices("청양고추");
 * console.log(prices); // [{ marketName: "가락시장", price: 9200, date: "2025-01-15", ... }, ...]
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
    // KAMIS API: 실시간 경매 가격 조회용
    const BASE_URL = "http://www.kamis.or.kr/service/price/xml.do";

    // API 호출 파라미터 구성
    // 카테고리 코드를 선택적으로 설정하여 더 넓은 범위로 검색
    // 채소류(100), 과일류(200), 곡물류(300) 등 여러 카테고리를 시도
    const categoryCodes = ["100", "200", "300", "400", "500"]; // 채소, 과일, 곡물, 기타 등

    console.log("📤 실시간 경매 가격 조회 API 호출 중...");
    console.log("🔍 상품명:", productName);
    console.log("🔑 API 키 길이:", apiKey.length, "자");

    // 여러 카테고리 코드로 시도
    let allPrices: MarketPrice[] = [];
    let lastError: Error | null = null;

    // 오늘 날짜 (YYYYMMDD 형식)
    const today = new Date();
    const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

    // 여러 액션을 시도 (fallback 로직)
    // 실제 경매 가격을 우선 조회하도록 순서 변경
    // 1. dailyPriceByCategoryList: 일일 가격 조회 (실시간 경매 가격) - 우선 시도
    // 2. dailyPriceList: 일일 가격 목록 (실시간 경매 가격)
    // 3. periodProductList: 기간별 상품 목록 (평균 가격일 수 있음) - 마지막 시도
    const actions = [
      {
        name: "dailyPriceByCategoryList",
        paramName: "p_itemname",
        needsDate: true,
      },
      { name: "dailyPriceList", paramName: "p_itemname", needsDate: true },
      {
        name: "periodProductList",
        paramName: "p_productname",
        needsDate: false,
      },
    ];

    for (const categoryCode of categoryCodes) {
      for (const actionConfig of actions) {
        try {
          // API 파라미터 구성
          const params = new URLSearchParams({
            action: actionConfig.name,
            p_productclscode: "01", // 농산물 코드
            p_itemcategorycode: categoryCode,
            [actionConfig.paramName]: productName, // 상품명 파라미터
            p_convert_kg_yn: "Y", // kg 단위로 변환
            p_cert_key: apiKey,
            p_cert_id: "geniemarket",
            p_returntype: "json", // JSON 형식으로 응답 받기
          });

          // 날짜 파라미터가 필요한 액션의 경우 오늘 날짜 추가
          if (actionConfig.needsDate) {
            params.append("p_regday", todayStr);
          }

          const url = `${BASE_URL}?${params.toString()}`;
          console.log(
            `🔗 카테고리 ${categoryCode}, 액션 ${actionConfig.name}로 시도:`,
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
            `📥 카테고리 ${categoryCode}, 액션 ${actionConfig.name} 응답 상태:`,
            response.status,
            response.statusText,
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.warn(
              `⚠️ 카테고리 ${categoryCode}, 액션 ${actionConfig.name} API 호출 실패:`,
              errorText.substring(0, 200),
            );
            continue; // 다음 액션 시도
          }

          // 응답 Content-Type 확인
          const contentType = response.headers.get("content-type") || "";
          console.log(
            `📄 카테고리 ${categoryCode}, 액션 ${actionConfig.name} Content-Type:`,
            contentType,
          );

          // 응답 본문 읽기 (한 번만 읽기 - response.text()는 한 번만 호출 가능)
          const responseText = await response.text();
          console.log(
            `📄 카테고리 ${categoryCode}, 액션 ${actionConfig.name} 응답 본문 (처음 1000자):`,
            responseText.substring(0, 1000),
          );

          let data: any;

          // Content-Type과 관계없이 JSON 파싱 시도
          try {
            data = JSON.parse(responseText);
            console.log(
              `✅ 카테고리 ${categoryCode}, 액션 ${actionConfig.name} JSON 응답 수신`,
            );
            console.log(
              `📊 카테고리 ${categoryCode}, 액션 ${actionConfig.name} 응답 구조:`,
              JSON.stringify(data, null, 2).substring(0, 2000),
            );
          } catch (parseError) {
            // JSON 파싱 실패
            if (
              contentType.includes("xml") ||
              contentType.includes("text/xml")
            ) {
              console.warn(
                `⚠️ 카테고리 ${categoryCode}, 액션 ${actionConfig.name} XML 응답 (아직 파싱 미지원)`,
              );
              console.warn(
                "⚠️ XML 응답은 아직 파싱되지 않았습니다. JSON으로 변환 필요.",
              );
            } else {
              console.error(
                `❌ 카테고리 ${categoryCode}, 액션 ${actionConfig.name} JSON 파싱 실패:`,
                parseError,
              );
              console.warn(`📄 원본 응답:`, responseText.substring(0, 1000));
            }
            continue; // 다음 액션 시도
          }

          // 응답 데이터 파싱 및 변환
          // 공공데이터포털 API 응답 구조: { condition: [...], data: { error_code: '000', item: [...] } }
          const prices: MarketPrice[] = [];

          // 에러 응답 확인
          if (data?.error) {
            console.warn(
              `⚠️ 카테고리 ${categoryCode}, 액션 ${actionConfig.name} API 응답에 에러:`,
              data.error,
            );
            continue; // 다음 액션 시도
          }

          // 응답 구조 확인 및 로깅
          if (data?.data) {
            if (data.data.error_code) {
              if (
                data.data.error_code !== "000" &&
                data.data.error_code !== "0"
              ) {
                const errorMsg =
                  data.data.error_message ||
                  data.data.error_msg ||
                  "알 수 없음";
                console.warn(
                  `⚠️ 카테고리 ${categoryCode}, 액션 ${actionConfig.name} API 에러 코드:`,
                  data.data.error_code,
                  errorMsg,
                );
                // "no data" 같은 에러는 데이터가 없는 것이므로 다음 액션 시도
                if (
                  errorMsg.includes("no data") ||
                  errorMsg.includes("데이터 없음")
                ) {
                  console.log(
                    `📭 카테고리 ${categoryCode}, 액션 ${actionConfig.name}에서 데이터 없음 - 다음 액션 시도`,
                  );
                }
                continue; // 다음 액션 시도
              }
            }
          }

          // 응답 구조 확인 및 상세 로깅
          console.log(
            `🔍 카테고리 ${categoryCode}, 액션 ${actionConfig.name} 응답 데이터 구조 분석:`,
            JSON.stringify(data, null, 2).substring(0, 2000),
          );

          if (
            data &&
            data.data &&
            data.data.item &&
            Array.isArray(data.data.item)
          ) {
            console.log(
              `📦 카테고리 ${categoryCode}, 액션 ${actionConfig.name} 응답 데이터:`,
              {
                errorCode: data.data.error_code,
                itemCount: data.data.item.length,
              },
            );

            // 첫 번째 아이템의 실제 필드명 확인 (디버깅용)
            if (data.data.item.length > 0) {
              const firstItem = data.data.item[0];
              console.log(
                `📊 카테고리 ${categoryCode}, 액션 ${actionConfig.name} 첫 번째 아이템 샘플:`,
                JSON.stringify(firstItem, null, 2),
              );
              console.log(
                `📋 카테고리 ${categoryCode}, 액션 ${actionConfig.name} 첫 번째 아이템의 필드명:`,
                Object.keys(firstItem),
              );

              // 가격 관련 필드 확인
              const priceFields = Object.keys(firstItem).filter(
                (key) =>
                  key.toLowerCase().includes("price") ||
                  key.toLowerCase().includes("dpr") ||
                  key.toLowerCase().includes("auction") ||
                  key.toLowerCase().includes("trade"),
              );
              if (priceFields.length > 0) {
                console.log(
                  `💰 카테고리 ${categoryCode}, 액션 ${actionConfig.name} 가격 관련 필드:`,
                  priceFields,
                );
                priceFields.forEach((field) => {
                  console.log(`  - ${field}: ${firstItem[field]}`);
                });
              }
            }

            // item 배열에서 데이터 추출
            // 실제 KAMIS API 응답 필드명: itemname(상품명), countyname(지역명), marketname(시장명), price(가격), regday(등록일), kindname(종류명)
            // 주의: itemname, kindname, marketname이 배열로 올 수 있음 (빈 배열 [] 또는 값이 있는 배열)
            data.data.item.forEach((item: any) => {
              if (item) {
                // 배열에서 값 추출 헬퍼 함수
                const getValue = (
                  value: any,
                  fallback: string = "",
                ): string => {
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

                // 상품명: itemname (배열일 수 있음)
                const itemNameValue = getValue(item.itemname);

                // 상품명이 없거나 빈 문자열인 경우 건너뛰기 (유효한 상품명만 표시)
                if (!itemNameValue || itemNameValue.trim() === "") {
                  return;
                }

                // 등급: kindname에서 추출하거나 기본값
                const kindNameValue = getValue(item.kindname);

                // 단위 파싱: kindname에서 추출 (예: "20kg(1kg)" -> 박스: 20kg, 단위: 1kg)
                // 또는 "1포기", "1개" 등
                let unit = "1kg";
                let boxSize = 1; // 박스 크기 (kg 단위)

                if (kindNameValue) {
                  // "20kg(1kg)" 형태 파싱
                  const unitMatch = kindNameValue.match(
                    /(\d+)kg\s*\((\d+)kg\)/,
                  );
                  if (unitMatch) {
                    boxSize = Number(unitMatch[1]) || 1; // 박스 크기
                    unit = `${unitMatch[2]}kg`; // 표시 단위
                  } else {
                    // "1포기", "1개" 등 다른 단위
                    const otherUnitMatch =
                      kindNameValue.match(/(\d+)(포기|개|박스|망|봉)/);
                    if (otherUnitMatch) {
                      unit = `${otherUnitMatch[1]}${otherUnitMatch[2]}`;
                      boxSize = 1; // 포기/개 단위는 변환하지 않음
                    } else {
                      // kg 단위만 있는 경우
                      const kgMatch = kindNameValue.match(/(\d+)kg/);
                      if (kgMatch) {
                        boxSize = Number(kgMatch[1]) || 1;
                        unit = "1kg";
                      }
                    }
                  }
                }

                // 단위 필드에서도 확인
                const unitField =
                  getValue(item.p_unitname) ||
                  getValue(item.p_unit) ||
                  getValue(item.unit);
                if (unitField && unitField !== unit) {
                  // 단위 필드가 있으면 우선 사용
                  unit = unitField;
                }

                const grade =
                  getValue(item.grade) ||
                  getValue(item.p_grade) ||
                  getValue(item.productrank) ||
                  (kindNameValue && kindNameValue.includes("상품")
                    ? "상품"
                    : "일반");

                // 가격: 실제 경매 가격을 우선적으로 사용
                // 우선순위: auction_price(경매가) > trade_price(거래가) > price(현재가) > dpr1(1일전가) > dpr2(2일전가) > dpr3(3일전가)
                let price = 0;
                let usedPriceField = "";
                const priceFields = [
                  {
                    name: "auction_price",
                    value: getValue(item.auction_price),
                  },
                  { name: "trade_price", value: getValue(item.trade_price) },
                  { name: "price", value: getValue(item.price) },
                  { name: "p_price", value: getValue(item.p_price) },
                  { name: "dpr1", value: getValue(item.dpr1) },
                  { name: "dpr2", value: getValue(item.dpr2) },
                  { name: "dpr3", value: getValue(item.dpr3) },
                ];

                for (const field of priceFields) {
                  if (
                    field.value &&
                    field.value !== "-" &&
                    field.value !== "" &&
                    field.value !== "0"
                  ) {
                    // 쉼표 제거 후 숫자로 변환
                    const cleanedPrice = String(field.value).replace(/,/g, "");
                    price = Number(cleanedPrice) || 0;
                    if (price > 0) {
                      usedPriceField = field.name;
                      break;
                    }
                  }
                }

                // 가격이 0이거나 "-"인 경우 건너뛰기 (유효한 시세만 표시)
                if (price === 0) {
                  return;
                }

                // 단위 변환: 박스 단위 가격을 kg 단위로 변환
                // 주의: p_convert_kg_yn: "Y"를 사용했지만, 실제 응답은 다를 수 있음
                // kindname에 "20kg(1kg)" 형태가 있으면 가격이 20kg 기준일 수 있음
                let finalPrice = price;
                let finalUnit = unit;

                // 가격이 비정상적으로 높은지 확인 (1kg 기준으로는 보통 10만원 이하)
                // 박스 단위 가격은 보통 10만원 이상일 수 있음
                const isPriceTooHigh = price > 100000;

                // kindname에서 박스 크기 정보가 있고, 가격이 비정상적으로 높은 경우
                if (boxSize > 1 && isPriceTooHigh) {
                  // 박스 가격을 kg 가격으로 변환
                  finalPrice = Math.round(price / boxSize);
                  finalUnit = "1kg";

                  console.log(
                    `💰 가격 변환 (박스→kg): ${itemNameValue} - 원본: ${price}원 (${boxSize}kg 박스, 필드: ${usedPriceField}) → 변환: ${finalPrice}원/${finalUnit}`,
                  );
                } else if (boxSize > 1 && !isPriceTooHigh) {
                  // 가격이 정상 범위면 이미 kg 단위로 변환된 것으로 간주
                  finalPrice = price;
                  finalUnit = "1kg";

                  console.log(
                    `💰 가격 (이미 kg 단위): ${itemNameValue} - ${price}원/${finalUnit} (필드: ${usedPriceField}, kindname: ${kindNameValue})`,
                  );
                } else if (
                  !unit.includes("kg") &&
                  (unit.includes("포기") || unit.includes("개"))
                ) {
                  // 포기, 개 단위는 그대로 사용
                  finalPrice = price;
                  finalUnit = unit;

                  console.log(
                    `💰 가격 (포기/개 단위): ${itemNameValue} - ${price}원/${finalUnit} (필드: ${usedPriceField})`,
                  );
                } else {
                  // 기타 경우
                  finalPrice = price;
                  finalUnit = unit || "1kg";
                }

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
                  price: finalPrice, // 변환된 가격 사용
                  unit: finalUnit, // 변환된 단위 사용
                  date,
                });
              }
            });

            // 이 카테고리와 액션에서 데이터를 찾았으면 결과에 추가하고 다음 카테고리로
            if (prices.length > 0) {
              console.log(
                `✅ 카테고리 ${categoryCode}, 액션 ${actionConfig.name}에서 ${prices.length}개 시세 발견`,
              );
              allPrices = allPrices.concat(prices);
              // 데이터를 찾았으면 이 카테고리에서는 더 이상 다른 액션 시도하지 않음
              break; // 다음 카테고리로
            }
          } else {
            console.log(
              `📭 카테고리 ${categoryCode}, 액션 ${actionConfig.name}에서 데이터 없음`,
            );
          }
        } catch (error) {
          console.warn(
            `⚠️ 카테고리 ${categoryCode}, 액션 ${actionConfig.name} 처리 중 오류:`,
            error,
          );
          if (error instanceof Error) {
            lastError = error;
          }
          continue; // 다음 액션 시도
        }
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
