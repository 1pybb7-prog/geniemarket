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

    console.log("📤 실시간 경매정보 조회 API 호출 중...");
    console.log("🔍 상품명:", productName);
    console.log("🔑 API 키 설정 여부:", apiKey ? "✅ 설정됨" : "❌ 없음");
    console.log("🔗 API 엔드포인트:", BASE_URL);

    // 오늘 날짜 (YYYYMMDD 형식) - 한국 시간대 기준
    const today = new Date();
    // 한국 시간대(KST, UTC+9) 기준으로 날짜 계산
    const kstOffset = 9 * 60; // 한국은 UTC+9
    const kstDate = new Date(
      today.getTime() + (kstOffset - today.getTimezoneOffset()) * 60000,
    );
    const todayStr = `${kstDate.getFullYear()}${String(kstDate.getMonth() + 1).padStart(2, "0")}${String(kstDate.getDate()).padStart(2, "0")}`;
    console.log("📅 기준일자 (KST):", todayStr);
    console.log("📅 현재 시간 (로컬):", today.toLocaleString("ko-KR"));

    // 공공데이터포털 API 파라미터 구성
    // 여러 페이지를 조회하여 더 많은 데이터를 가져옴 (최대 5페이지, 각 500개 = 최대 2500개)
    const MAX_PAGES = 5;
    const ROWS_PER_PAGE = 500;

    let allItems: any[] = [];
    let lastError: Error | null = null;
    let totalCount = 0;

    // 여러 페이지를 순회하며 데이터 수집
    for (let pageNo = 1; pageNo <= MAX_PAGES; pageNo++) {
      try {
        const params = new URLSearchParams({
          serviceKey: apiKey, // 공공데이터포털 API 키
          pageNo: String(pageNo), // 페이지 번호
          numOfRows: String(ROWS_PER_PAGE), // 한 번에 가져올 데이터 수
          dataType: "JSON", // JSON 형식
          trgDate: todayStr, // 조회 날짜 (YYYYMMDD)
        });

        const url = `${BASE_URL}?${params.toString()}`;

        if (pageNo === 1) {
          console.log(
            "🔗 API 호출 URL (인증키 마스킹):",
            url.replace(apiKey, "***"),
          );
          console.log("📋 요청 파라미터:", {
            pageNo: "1~" + MAX_PAGES,
            numOfRows: ROWS_PER_PAGE,
            dataType: "JSON",
            trgDate: todayStr,
          });
        }

        console.log(`🚀 API 호출 시작... (페이지 ${pageNo}/${MAX_PAGES})`);
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
          console.log(
            `📦 공공데이터포털 형식에서 ${items.length}개 아이템 발견`,
          );
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
          console.warn(
            "⚠️ API 에러 코드:",
            resultCode,
            errorMsg || "알 수 없음",
          );
          if (
            errorMsg.includes("no data") ||
            errorMsg.includes("데이터 없음") ||
            errorMsg.includes("NODATA") ||
            errorMsg.includes("조회된 데이터가 없습니다") ||
            errorMsg.includes("결과가 없습니다")
          ) {
            if (pageNo === 1) {
              console.log("📭 데이터 없음");
              console.groupEnd();
              return [];
            }
            break; // 첫 페이지가 아니면 중단
          }
        }

        if (items.length === 0) {
          if (pageNo === 1) {
            console.warn("⚠️ 응답에 데이터가 없습니다.");
            console.groupEnd();
            return [];
          }
          break; // 첫 페이지가 아니면 중단
        }

        // 아이템을 전체 배열에 추가
        allItems = allItems.concat(items);

        // 더 이상 데이터가 없으면 중단
        if (items.length < ROWS_PER_PAGE) {
          console.log(`✅ 모든 데이터 수집 완료 (총 ${allItems.length}개)`);
          break;
        }
      } catch (error) {
        console.error(`❌ 페이지 ${pageNo} 처리 중 오류 발생:`, error);
        if (pageNo === 1) {
          lastError = error instanceof Error ? error : new Error(String(error));
        }
        // 첫 페이지가 아니면 계속 진행
        if (pageNo === 1) {
          throw error;
        }
        break;
      }
    }

    // allItems를 items로 설정
    const items = allItems;

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
          { name: "sbid_pric", value: getValue(item.sbid_pric) }, // 낙찰가 (공공데이터포털)
          { name: "cost", value: getValue(item.cost) },
          { name: "dpr2", value: getValue(item.dpr2) }, // 1일전 가격
          { name: "dpr3", value: getValue(item.dpr3) }, // 1개월전 가격
          { name: "auction_price", value: getValue(item.auction_price) },
          { name: "trade_price", value: getValue(item.trade_price) },
        ];

        // 가격 필드에서 유효한 값 찾기
        for (const field of priceFields) {
          if (field.value && field.value !== "-" && field.value !== "") {
            const parsedPrice = parseInt(field.value.replace(/,/g, ""), 10);
            if (!isNaN(parsedPrice) && parsedPrice > 0) {
              price = parsedPrice;
              usedPriceField = field.name;
              break;
            }
          }
        }

        // 가격이 없으면 스킵
        if (price === 0) {
          return;
        }

        if (price > 0) {
          // 시장명: 공공데이터포털 API 필드명
          const marketName =
            getValue(item.marketname) ||
            getValue(item.p_marketname) ||
            getValue(item.marketName) ||
            getValue(item.whsal_mrkt_nm) || // 도매시장명 (공공데이터포털)
            getValue(item.whsalMrktNm) ||
            getValue(item.mrktNm) ||
            getValue(item.countyname) ||
            getValue(item.p_countyname) ||
            "전국 평균"; // 시장명이 없으면 "전국 평균"으로 표시

          // 상품명 (API 응답에서 확인)
          const itemNameValue =
            getValue(item.item_nm) ||
            getValue(item.prdlst_nm) ||
            getValue(item.productName) ||
            getValue(item.corp_gds_item_nm) ||
            getValue(item.p_itemname) ||
            getValue(item.p_productname) ||
            getValue(item.productname) ||
            getValue(item.prdlstNm) ||
            productName;

          // 상품명이 없거나 빈 문자열인 경우 건너뛰기 (유효한 상품명만 표시)
          if (!itemNameValue || itemNameValue.trim() === "") {
            return;
          }

          // 지역 필터링: region이 지정된 경우 시장명에서 지역 확인
          if (region && region.trim() !== "") {
            const normalizedRegion = region.trim();
            // 시장명에서 "시장", "도매시장", "공영시장" 등의 단어 제거 후 비교
            const cleanedMarketName = marketName
              .replace(/시장|도매시장|공영시장|농수산시장|청과시장/gi, "")
              .trim();
            const normalizedMarketName = cleanedMarketName.toLowerCase();

            // 시장명-지역 매핑 (주요 시장 기준, 시장명에서 "시장" 단어 제거 후 비교)
            const marketRegionMap: Record<string, string[]> = {
              서울: ["가락", "강서", "청과", "농수산", "서울", "송파", "강동"],
              부산: ["부산", "서부산", "동부산", "북부산", "남부산"],
              대구: ["대구", "서문", "북대구", "남대구"],
              인천: ["인천", "남인천", "북인천", "서인천"],
              광주: ["광주", "무등", "광주시"],
              대전: ["대전", "유성", "서대전"],
              울산: ["울산", "남울산"],
              경기: [
                "수원",
                "안양",
                "고양",
                "성남",
                "용인",
                "부천",
                "안산",
                "평택",
                "시흥",
                "김포",
                "광명",
                "하남",
                "이천",
                "오산",
                "의정부",
                "안성",
                "구리",
                "남양주",
                "화성",
                "양주",
                "포천",
                "여주",
                "연천",
                "가평",
                "양평",
                "경기",
                "과천",
                "군포",
                "의왕",
                "동두천",
              ],
              강원: [
                "강릉",
                "춘천",
                "원주",
                "속초",
                "삼척",
                "태백",
                "동해",
                "영월",
                "평창",
                "정선",
                "철원",
                "화천",
                "양구",
                "인제",
                "고성",
                "양양",
                "홍천",
                "횡성",
                "강원",
              ],
              충북: [
                "청주",
                "충주",
                "제천",
                "보은",
                "옥천",
                "증평",
                "진천",
                "괴산",
                "음성",
                "단양",
                "충북",
              ],
              충남: [
                "천안",
                "아산",
                "서산",
                "당진",
                "공주",
                "보령",
                "계룡",
                "논산",
                "부여",
                "서천",
                "청양",
                "홍성",
                "예산",
                "태안",
                "금산",
                "충남",
              ],
              전북: [
                "전주",
                "익산",
                "정읍",
                "남원",
                "김제",
                "완주",
                "진안",
                "무주",
                "장수",
                "임실",
                "순창",
                "고창",
                "부안",
                "전북",
              ],
              전남: [
                "목포",
                "여수",
                "순천",
                "나주",
                "광양",
                "담양",
                "곡성",
                "구례",
                "고흥",
                "보성",
                "화순",
                "장흥",
                "강진",
                "해남",
                "영암",
                "무안",
                "함평",
                "영광",
                "장성",
                "완도",
                "진도",
                "신안",
                "전남",
              ],
              경북: [
                "포항",
                "경주",
                "김천",
                "안동",
                "구미",
                "영주",
                "영천",
                "상주",
                "문경",
                "경산",
                "군위",
                "의성",
                "청송",
                "영양",
                "영덕",
                "청도",
                "고령",
                "성주",
                "칠곡",
                "예천",
                "봉화",
                "울진",
                "울릉",
                "경북",
              ],
              경남: [
                "창원",
                "마산",
                "진해",
                "진주",
                "통영",
                "사천",
                "김해",
                "밀양",
                "거제",
                "양산",
                "의령",
                "함안",
                "창녕",
                "고성",
                "남해",
                "하동",
                "산청",
                "함양",
                "거창",
                "합천",
                "경남",
              ],
              제주: ["제주", "서귀포"],
            };

            // 지역에 해당하는 시장명 키워드 확인
            const regionKeywords = marketRegionMap[normalizedRegion] || [
              normalizedRegion,
            ];

            // 시장명에 지역 키워드가 포함되어 있는지 확인
            // 정확한 매칭을 위해 키워드가 시장명의 시작 부분에 있는지도 확인
            const matchesRegion = regionKeywords.some((keyword) => {
              const lowerKeyword = keyword.toLowerCase();
              // 시장명이 키워드로 시작하거나, 키워드가 시장명에 포함되어 있는지 확인
              return (
                normalizedMarketName.startsWith(lowerKeyword) ||
                normalizedMarketName.includes(lowerKeyword)
              );
            });

            if (!matchesRegion) {
              // 지역이 일치하지 않으면 건너뛰기
              console.log(
                `🚫 지역 필터링: "${marketName}" (정리: "${cleanedMarketName}")는 "${normalizedRegion}" 지역이 아님 - 제외`,
              );
              return;
            } else {
              console.log(
                `✅ 지역 필터링: "${marketName}" (정리: "${cleanedMarketName}")는 "${normalizedRegion}" 지역 - 포함`,
              );
            }
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
          // 여러 필드에서 등급 정보를 찾음
          let grade =
            getValue(item.gds_sclsf_nm) || // 상세분류명 (공공데이터포털, 우선)
            getValue(item.gds_mclsf_nm) || // 중분류명 (공공데이터포털)
            getValue(item.corp_gds_vrty_nm) || // 품종명 (공공데이터포털)
            getValue(item.kindname) || // 품종명 (KAMIS)
            getValue(item.p_grade) ||
            getValue(item.grade) ||
            getValue(item.rank) ||
            getValue(item.stdPrdlstNm) ||
            getValue(item.productrank) ||
            getValue(item.quality) ||
            getValue(item.품질) ||
            "";

          // 등급이 없으면 상품명이나 상세분류명에서 추출 시도
          if (!grade || grade === "" || grade === "-" || grade === "null") {
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
            // kindname에서 "특상", "상품", "중품", "하품" 추출
            if ((!grade || grade === "" || grade === "-") && kindNameValue) {
              const normalizedKindName = kindNameValue.toLowerCase();
              if (
                normalizedKindName.includes("특상") ||
                normalizedKindName.includes("특등")
              ) {
                grade = "특상";
              } else if (
                normalizedKindName.includes("상품") ||
                normalizedKindName === "상" ||
                normalizedKindName.includes("상등")
              ) {
                grade = "상품";
              } else if (
                normalizedKindName.includes("중품") ||
                normalizedKindName === "중" ||
                normalizedKindName.includes("중등")
              ) {
                grade = "중품";
              } else if (
                normalizedKindName.includes("하품") ||
                normalizedKindName === "하" ||
                normalizedKindName.includes("하등")
              ) {
                grade = "하품";
              }
            }
            // 상세분류명에서도 등급 추출 시도
            const detailCategoryName = getValue(item.gds_sclsf_nm) || getValue(item.gds_mclsf_nm);
            if (
              (!grade || grade === "" || grade === "-") &&
              detailCategoryName
            ) {
              const normalizedDetailCategory = detailCategoryName.toLowerCase();
              if (
                normalizedDetailCategory.includes("특상") ||
                normalizedDetailCategory.includes("특등")
              ) {
                grade = "특상";
              } else if (
                normalizedDetailCategory.includes("상품") ||
                normalizedDetailCategory === "상" ||
                normalizedDetailCategory.includes("상등")
              ) {
                grade = "상품";
              } else if (
                normalizedDetailCategory.includes("중품") ||
                normalizedDetailCategory === "중" ||
                normalizedDetailCategory.includes("중등")
              ) {
                grade = "중품";
              } else if (
                normalizedDetailCategory.includes("하품") ||
                normalizedDetailCategory === "하" ||
                normalizedDetailCategory.includes("하등")
              ) {
                grade = "하품";
              }
            }
            // 기본값
            if (!grade || grade === "" || grade === "-") {
              grade = "일반";
            }
          }

          // 등급 정보 로깅 (디버깅용 - 처음 몇 개만)
          // 주의: prices 배열에 추가되기 전이므로 인덱스로 확인
          const currentIndex = prices.length;
          if (currentIndex < 3) {
            console.log(
              `⭐ 등급 추출 [${currentIndex + 1}]: ${itemNameValue} - 등급: "${grade}" (kindname: "${kindNameValue}", gds_sclsf_nm: "${getValue(item.gds_sclsf_nm)}", gds_mclsf_nm: "${getValue(item.gds_mclsf_nm)}")`,
            );
          }

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

          // 기본값: 오늘 날짜 (한국 시간대 기준)
          const now = new Date();
          const kstOffset = 9 * 60; // 한국은 UTC+9
          const kstNow = new Date(
            now.getTime() + (kstOffset - now.getTimezoneOffset()) * 60000,
          );
          let date = `${kstNow.getFullYear()}-${String(kstNow.getMonth() + 1).padStart(2, "0")}-${String(kstNow.getDate()).padStart(2, "0")}`;

          if (dateStr && dateStr !== "-" && dateStr !== "") {
            // YYYY-MM-DD 형식인 경우 (공공데이터포털 표준)
            if (dateStr.includes("-") && dateStr.length >= 10) {
              const parsedDate = dateStr.substring(0, 10); // "YYYY-MM-DD" 부분만 추출
              // API 응답 날짜가 오늘보다 미래인 경우 로깅
              const parsedDateObj = new Date(parsedDate);
              const todayDateObj = new Date(date);
              if (parsedDateObj > todayDateObj) {
                console.warn(
                  `⚠️ 날짜 경고: API 응답 날짜(${parsedDate})가 오늘(${date})보다 미래입니다.`,
                );
              }
              date = parsedDate;
            }
            // YYYYMMDD 형식인 경우
            else if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
              const parsedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
              // API 응답 날짜가 오늘보다 미래인 경우 로깅
              const parsedDateObj = new Date(parsedDate);
              const todayDateObj = new Date(date);
              if (parsedDateObj > todayDateObj) {
                console.warn(
                  `⚠️ 날짜 경고: API 응답 날짜(${parsedDate})가 오늘(${date})보다 미래입니다.`,
                );
              }
              date = parsedDate;
            }
            // "MM/DD" 형식인 경우
            else if (dateStr.includes("/") && !dateStr.includes("-")) {
              const year = String(kstNow.getFullYear());
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
