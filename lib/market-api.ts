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
    // 공공데이터포털 API 인증 정보
    const apiKey =
      process.env.PUBLIC_DATA_API_KEY || process.env.AT_MARKET_API_KEY;

    if (!apiKey) {
      console.error("❌ 공공데이터포털 API 인증 정보가 설정되지 않았습니다.");
      console.error("💡 .env.local 파일에 다음 환경변수를 추가하세요:");
      console.error("   - PUBLIC_DATA_API_KEY: 공공데이터포털 API 키");
      console.error("   또는");
      console.error("   - AT_MARKET_API_KEY: 공공데이터포털 API 키");
      console.error(
        "💡 공공데이터포털 API 신청: https://www.data.go.kr/data/15141808/openapi.do",
      );
      throw new Error(
        "공공데이터포털 API 인증 정보가 설정되지 않았습니다. .env.local 파일에 PUBLIC_DATA_API_KEY 또는 AT_MARKET_API_KEY를 추가하세요.",
      );
    }

    // 공공데이터포털 API 엔드포인트
    const BASE_URL =
      process.env.AT_MARKET_API_URL ||
      "http://apis.data.go.kr/B552845/katRealTime/trades";

    console.log("📤 실시간 경매정보 조회 API 호출 중...");
    console.log("🔍 상품명:", productName);
    console.log("🔑 API 키 설정 여부:", apiKey ? "✅ 설정됨" : "❌ 없음");
    console.log("🔗 API 엔드포인트:", BASE_URL);

    // 오늘 날짜 (YYYYMMDD 형식)
    const today = new Date();
    const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    console.log("📅 기준일자:", todayStr);

    // 공공데이터포털 API 파라미터 구성
    const params = new URLSearchParams({
      serviceKey: apiKey, // 공공데이터포털 API 키
      pageNo: "1", // 페이지 번호
      numOfRows: "100", // 한 번에 가져올 데이터 수
      dataType: "JSON", // JSON 형식
      trgDate: todayStr, // 조회 날짜 (YYYYMMDD)
    });

    const url = `${BASE_URL}?${params.toString()}`;
    console.log("🔗 API 호출 URL (인증키 마스킹):", url.replace(apiKey, "***"));
    console.log("📋 요청 파라미터:", {
      pageNo: "1",
      numOfRows: "100",
      dataType: "JSON",
      trgDate: todayStr,
    });

    let allPrices: MarketPrice[] = [];
    let lastError: Error | null = null;

    try {
      console.log("🚀 API 호출 시작...");
      const startTime = Date.now();

      // API 호출
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json, application/xml, text/xml, */*",
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`⏱️ API 호출 완료 (소요 시간: ${duration}ms)`);
      console.log("📥 API 응답 상태:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn("⚠️ API 호출 실패:", errorText.substring(0, 500));
        throw new Error(
          `API 호출 실패: ${response.status} ${response.statusText}`,
        );
      }

      // 응답 Content-Type 확인
      const contentType = response.headers.get("content-type") || "";
      console.log("📄 Content-Type:", contentType);

      // 응답 본문 읽기
      const responseText = await response.text();
      console.log(
        "📄 응답 본문 (처음 1000자):",
        responseText.substring(0, 1000),
      );

      let data: any;

      // JSON 파싱 시도
      try {
        data = JSON.parse(responseText);
        console.log("✅ JSON 응답 수신");
        console.log(
          "📊 응답 구조:",
          JSON.stringify(data, null, 2).substring(0, 2000),
        );
      } catch (parseError) {
        // JSON 파싱 실패 시 XML인지 확인
        if (contentType.includes("xml") || contentType.includes("text/xml")) {
          console.warn("⚠️ XML 응답 (XML 파싱은 추후 구현 필요)");
          console.warn(
            "💡 공공데이터포털 API에서 resultType=json 파라미터를 확인하세요.",
          );
        } else {
          console.error("❌ JSON 파싱 실패:", parseError);
          console.warn("📄 원본 응답:", responseText.substring(0, 1000));
        }
        throw new Error("응답 파싱 실패");
      }

      // 공공데이터포털 API 응답 구조 파싱
      // 공공데이터포털 API 응답 구조: { response: { body: { items: { item: [...] } } } }
      const prices: MarketPrice[] = [];

      // 응답 구조 확인 및 로깅
      console.log(
        "🔍 응답 데이터 구조 분석:",
        JSON.stringify(data, null, 2).substring(0, 2000),
      );

      // 공공데이터포털 API 응답 구조 확인
      let items: any[] = [];
      let resultCode = "";
      let errorMsg = "";

      // 응답 구조: response.body.items.item (공공데이터포털 표준 형식)
      if (data?.response?.body?.items?.item) {
        items = Array.isArray(data.response.body.items.item)
          ? data.response.body.items.item
          : [data.response.body.items.item];
        resultCode = data.response?.header?.resultCode || "";
        errorMsg = data.response?.header?.resultMsg || "";
        console.log(`📦 공공데이터포털 형식에서 ${items.length}개 아이템 발견`);
      }
      // 하위 호환성: 다른 응답 구조도 지원
      else if (data?.body?.items?.item) {
        items = Array.isArray(data.body.items.item)
          ? data.body.items.item
          : [data.body.items.item];
        resultCode = data.header?.resultCode || "";
        errorMsg = data.header?.resultMsg || "";
        console.log(`📦 body.items.item에서 ${items.length}개 아이템 발견`);
      }
      // 하위 호환성: KAMIS 형식도 지원
      else if (data?.data?.item) {
        items = Array.isArray(data.data.item)
          ? data.data.item
          : [data.data.item];
        resultCode = data.data.error_code || "";
        errorMsg = data.data.error_msg || "";
        console.log(`📦 KAMIS data.item에서 ${items.length}개 아이템 발견`);
      } else if (Array.isArray(data?.item)) {
        items = data.item;
        console.log(`📦 item 배열에서 ${items.length}개 아이템 발견`);
      }

      // 결과 코드 확인 (공공데이터포털: "0"이 정상)
      if (
        resultCode &&
        resultCode !== "00" &&
        resultCode !== "000" &&
        resultCode !== "0" &&
        resultCode !== ""
      ) {
        console.warn("⚠️ API 에러 코드:", resultCode, errorMsg || "알 수 없음");
        if (
          errorMsg.includes("no data") ||
          errorMsg.includes("데이터 없음") ||
          errorMsg.includes("NODATA") ||
          errorMsg.includes("조회된 데이터가 없습니다") ||
          errorMsg.includes("결과가 없습니다")
        ) {
          console.log("📭 데이터 없음");
          console.groupEnd();
          return [];
        }
      }

      if (items.length === 0) {
        console.warn("⚠️ 응답에 데이터가 없습니다.");
        console.warn("💡 가능한 원인:");
        console.warn("  1. 해당 상품명으로 시세 데이터가 없음");
        console.warn("  2. API 파라미터가 잘못됨 (상품명, 날짜 등)");
        console.warn("  3. API 엔드포인트가 잘못됨");
        console.warn("  4. API 키가 유효하지 않음");
        console.groupEnd();
        return [];
      }

      console.log(`📦 응답 데이터: ${items.length}개 아이템 발견`);

      // 첫 번째 아이템의 실제 필드명 확인 (디버깅용)
      if (items.length > 0) {
        const firstItem = items[0];
        console.log(
          "📊 첫 번째 아이템 샘플 (전체):",
          JSON.stringify(firstItem, null, 2),
        );
        console.log("📋 첫 번째 아이템의 모든 필드명:", Object.keys(firstItem));

        // 모든 필드의 값 출력 (상세 디버깅)
        console.log("📋 모든 필드 값:");
        Object.keys(firstItem).forEach((key) => {
          const value = firstItem[key];
          console.log(
            `  - ${key}: ${JSON.stringify(value)} (타입: ${typeof value})`,
          );
        });

        // 가격 관련 필드 확인
        const priceFields = Object.keys(firstItem).filter(
          (key) =>
            key.toLowerCase().includes("price") ||
            key.toLowerCase().includes("dpr") ||
            key.toLowerCase().includes("auction") ||
            key.toLowerCase().includes("trade") ||
            key.toLowerCase().includes("amt") ||
            key.toLowerCase().includes("단가"),
        );
        if (priceFields.length > 0) {
          console.log("💰 가격 관련 필드:", priceFields);
          priceFields.forEach((field) => {
            console.log(`  - ${field}: ${firstItem[field]}`);
          });
        }

        // 시장/지역 관련 필드 확인
        const marketFields = Object.keys(firstItem).filter(
          (key) =>
            key.toLowerCase().includes("market") ||
            key.toLowerCase().includes("시장") ||
            key.toLowerCase().includes("county") ||
            key.toLowerCase().includes("region") ||
            key.toLowerCase().includes("area") ||
            key.toLowerCase().includes("지역"),
        );
        if (marketFields.length > 0) {
          console.log("🏪 시장/지역 관련 필드:", marketFields);
          marketFields.forEach((field) => {
            console.log(`  - ${field}: ${firstItem[field]}`);
          });
        }

        // 등급 관련 필드 확인
        const gradeFields = Object.keys(firstItem).filter(
          (key) =>
            key.toLowerCase().includes("grade") ||
            key.toLowerCase().includes("등급") ||
            key.toLowerCase().includes("rank") ||
            key.toLowerCase().includes("quality"),
        );
        if (gradeFields.length > 0) {
          console.log("⭐ 등급 관련 필드:", gradeFields);
          gradeFields.forEach((field) => {
            console.log(`  - ${field}: ${firstItem[field]}`);
          });
        }
      }

      // item 배열에서 데이터 추출
      // 공공데이터포털 API 응답 필드명:
      // - 시장명: whsl_mrkt_nm
      // - 상품명: corp_gds_item_nm
      // - 가격: scsbd_prc (성사단가)
      // - 등급: gds_sclsf_nm (상세분류명) 또는 grade
      // - 단위: unit_nm, unit_qty
      // - 날짜: trd_clcln_ymd (거래결정연월일), scsbd_dt (성사일시)
      items.forEach((item: any) => {
        if (item) {
          // 배열에서 값 추출 헬퍼 함수
          const getValue = (value: any, fallback: string = ""): string => {
            if (Array.isArray(value)) {
              // 배열인 경우 첫 번째 요소 사용 (빈 배열이면 fallback)
              return value.length > 0 ? String(value[0]) : fallback;
            }
            return value ? String(value) : fallback;
          };

          // 상품명 필터링: 검색한 상품명과 일치하는 것만
          const itemNameValue =
            getValue(item.corp_gds_item_nm) || // 공공데이터포털 필드명 (우선)
            getValue(item.productName) ||
            getValue(item.item_name) ||
            getValue(item.p_itemname) ||
            getValue(item.itemname) ||
            getValue(item.itemName) ||
            getValue(item.prdlstNm) ||
            getValue(item.prdltNm);

          // 상품명이 검색어와 일치하는지 확인 (부분 일치 허용)
          const normalizedItemName = itemNameValue
            .toLowerCase()
            .replace(/\s+/g, "");
          const normalizedProductName = productName
            .toLowerCase()
            .replace(/\s+/g, "");
          if (
            !normalizedItemName.includes(normalizedProductName) &&
            !normalizedProductName.includes(normalizedItemName)
          ) {
            // 상품명이 일치하지 않으면 건너뛰기
            return;
          }

          // 시장명: 공공데이터포털 API 필드명
          const marketName =
            getValue(item.whsl_mrkt_nm) || // 공공데이터포털 필드명 (우선)
            getValue(item.p_marketname) ||
            getValue(item.marketname) ||
            getValue(item.marketName) ||
            getValue(item.whsalMrktNm) ||
            getValue(item.mrktNm) ||
            getValue(item.countyname) ||
            getValue(item.p_countyname) ||
            "전국 평균"; // 시장명이 없으면 "전국 평균"으로 표시

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
            const unitMatch = kindNameValue.match(/(\d+)kg\s*\((\d+)kg\)/);
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

          // 단위: 공공데이터포털 API 필드명
          const unitNm = getValue(item.unit_nm); // 단위명 (예: "kg")
          const unitQty = getValue(item.unit_qty); // 단위 수량 (예: "1.000")

          // 단위 필드가 있으면 우선 사용
          if (unitNm) {
            if (unitQty && unitQty !== "1.000" && unitQty !== "1") {
              unit = `${unitQty}${unitNm}`;
            } else {
              unit = `1${unitNm}`;
            }
          } else {
            // 하위 호환성: KAMIS 필드명도 지원
            const unitField =
              getValue(item.unit) ||
              getValue(item.p_unitname) ||
              getValue(item.unitname) ||
              getValue(item.stdUnit) ||
              getValue(item.stdQtt) ||
              getValue(item.p_unit);
            if (unitField && unitField !== unit) {
              unit = unitField;
            }
          }

          // 등급: 공공데이터포털 API 필드명
          let grade =
            getValue(item.gds_sclsf_nm) || // 상세분류명 (공공데이터포털, 우선)
            getValue(item.p_grade) ||
            getValue(item.grade) ||
            getValue(item.rank) ||
            getValue(item.stdPrdlstNm) ||
            getValue(item.productrank) ||
            "";

          // 등급이 없으면 상품명이나 상세분류명에서 추출 시도
          if (!grade || grade === "") {
            const productNameForGrade =
              getValue(item.corp_gds_item_nm) ||
              getValue(item.productName) ||
              getValue(item.item_name) ||
              "";
            // "사과/부사", "사과/후지" 등에서 등급 추출
            if (productNameForGrade.includes("/")) {
              const parts = productNameForGrade.split("/");
              if (parts.length > 1) {
                grade = parts[1].trim(); // "/" 뒤의 부분을 등급으로 사용
              }
            }
            // kindname에서 "상품", "중품", "하품" 추출
            if ((!grade || grade === "") && kindNameValue) {
              if (kindNameValue.includes("상품")) {
                grade = "상품";
              } else if (kindNameValue.includes("중품")) {
                grade = "중품";
              } else if (kindNameValue.includes("하품")) {
                grade = "하품";
              }
            }
            // 기본값
            if (!grade || grade === "") {
              grade = "일반";
            }
          }

          // 가격: 공공데이터포털 API 필드명
          // 우선순위: scsbd_prc(성사단가, 공공데이터포털) > 기타 필드
          let price = 0;
          let usedPriceField = "";
          const priceFields = [
            { name: "scsbd_prc", value: getValue(item.scsbd_prc) }, // 공공데이터포털 성사단가 (우선)
            { name: "dpr1", value: getValue(item.dpr1) }, // KAMIS 당일 가격
            { name: "p_price", value: getValue(item.p_price) }, // KAMIS 표준 필드
            { name: "price", value: getValue(item.price) },
            { name: "amt", value: getValue(item.amt) },
            { name: "dpr2", value: getValue(item.dpr2) }, // 1일전 가격
            { name: "dpr3", value: getValue(item.dpr3) }, // 1개월전 가격
            { name: "auction_price", value: getValue(item.auction_price) },
            { name: "trade_price", value: getValue(item.trade_price) },
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

      allPrices = prices;
      console.log(`✅ 최종 파싱된 시세: ${allPrices.length}개`);
    } catch (error) {
      console.error("❌ API 처리 중 오류 발생");
      console.error(
        "에러 타입:",
        error instanceof Error ? error.constructor.name : typeof error,
      );
      console.error(
        "에러 메시지:",
        error instanceof Error ? error.message : String(error),
      );
      if (error instanceof Error && error.stack) {
        console.error("에러 스택:", error.stack);
      }
      if (error instanceof Error) {
        lastError = error;
      }
    }

    // 결과가 있으면 최신 거래순으로 정렬하여 반환
    if (allPrices.length > 0) {
      console.log(`✅ 총 ${allPrices.length}개의 시세 데이터 수집 완료`);

      // 날짜 기준으로 정렬 (최신 날짜가 먼저), 같은 날짜면 시장명 > 등급 > 가격 순으로 정렬
      allPrices.sort((a, b) => {
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

      console.log(`📊 최신 거래순으로 정렬 완료: ${allPrices.length}개`);
      console.log(
        `📅 날짜 범위: ${allPrices[allPrices.length - 1]?.date} ~ ${allPrices[0]?.date}`,
      );

      // 모든 거래를 반환 (중복 제거하지 않음 - 같은 시장에서도 등급별로 여러 거래 표시)
      console.groupEnd();
      return allPrices;
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
