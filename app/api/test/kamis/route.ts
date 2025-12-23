import { NextRequest, NextResponse } from "next/server";

/**
 * @file app/api/test/kamis/route.ts
 * @description KAMIS Open API 테스트용 엔드포인트
 *
 * 이 엔드포인트는 KAMIS Open API가 정상적으로 작동하는지 테스트하기 위한 것입니다.
 * 브라우저에서 상품명을 입력하고 시세 정보를 확인할 수 있습니다.
 *
 * 사용 방법:
 * GET /api/test/kamis?productName=사과
 * 또는
 * POST /api/test/kamis
 * Body: { productName: "사과" }
 */

export async function GET(request: NextRequest) {
  console.group("🧪 KAMIS API 테스트 엔드포인트 호출 (GET)");

  try {
    const searchParams = request.nextUrl.searchParams;
    const productName = searchParams.get("productName") || "사과";
    const regionCode = searchParams.get("regionCode") || ""; // 지역 코드 (선택 사항)
    const dateParam = searchParams.get("date"); // 날짜 파라미터 (선택 사항, YYYYMMDD 형식)

    console.log("📝 테스트 상품명:", productName);
    if (regionCode) {
      console.log("📍 지역 코드:", regionCode);
    }
    if (dateParam) {
      console.log("📅 조회 날짜:", dateParam);
    }

    // KAMIS API 인증 정보 확인
    const certId = process.env.KAMIS_CERT_ID;
    const certKey = process.env.KAMIS_CERT_KEY;

    if (!certId || !certKey) {
      console.error("❌ KAMIS API 인증 정보가 설정되지 않았습니다.");
      return NextResponse.json(
        {
          success: false,
          error:
            "KAMIS API 인증 정보가 설정되지 않았습니다. .env.local 파일에 KAMIS_CERT_ID와 KAMIS_CERT_KEY를 설정하세요.",
        },
        { status: 500 },
      );
    }

    const BASE_URL =
      process.env.KAMIS_API_URL ||
      "https://www.kamis.or.kr/service/price/xml.do";

    // 한국 시간대 기준 날짜 계산 함수
    function getKSTDate(date: Date): string {
      const kstOffset = 9 * 60; // 한국은 UTC+9
      const kstDate = new Date(
        date.getTime() + (kstOffset - date.getTimezoneOffset()) * 60000,
      );
      return `${kstDate.getFullYear()}${String(kstDate.getMonth() + 1).padStart(2, "0")}${String(kstDate.getDate()).padStart(2, "0")}`;
    }

    // 조회할 날짜 결정 (date 파라미터가 있으면 사용, 없으면 오늘)
    const queryDate = dateParam || getKSTDate(new Date());

    // KAMIS API 파라미터 구성
    // 주의: KAMIS API는 날짜 파라미터를 지원하지 않을 수 있으므로,
    // date 파라미터가 있어도 API에는 전달하지 않고, 응답 데이터에 날짜 정보를 추가만 함
    const params = new URLSearchParams({
      action: "dailySalesList", // 일일 도매가격 조회
      p_cert_id: certId,
      p_cert_key: certKey,
      p_returntype: "json", // JSON 형식
      p_productname: productName, // 상품명
      p_itemname: productName, // 품목명
      p_countycode: regionCode || "", // 지역코드 (전체: 빈 문자열)
      p_convert_kg_yn: "Y", // kg 단위 변환 여부
    });

    const url = `${BASE_URL}?${params.toString()}`;
    console.log("🔗 요청 URL (인증키 마스킹):", url.replace(certKey, "***"));

    // API 호출
    console.log("🚀 API 호출 시작...");
    const startTime = Date.now();

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, application/xml, text/xml, */*",
      },
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`⏱️ API 호출 완료 (소요 시간: ${duration}ms)`);
    console.log("📥 응답 상태:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API 호출 실패");
      console.error("응답 본문:", errorText.substring(0, 500));
      return NextResponse.json(
        {
          success: false,
          error: `API 호출 실패: ${response.status} ${response.statusText}`,
          responseText: errorText.substring(0, 500),
        },
        { status: response.status },
      );
    }

    // 응답 본문 읽기
    const responseText = await response.text();
    console.log("📄 응답 본문 (처음 1000자):", responseText.substring(0, 1000));

    // JSON 파싱
    let data: any;
    try {
      data = JSON.parse(responseText);
      console.log("✅ JSON 파싱 성공");
    } catch (parseError) {
      console.error("❌ JSON 파싱 실패:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "응답 파싱 실패",
          responseText: responseText.substring(0, 1000),
        },
        { status: 500 },
      );
    }

    // 에러 코드 확인 (실제 응답 구조: 최상위에 error_code)
    const errorCode = data?.error_code;

    if (errorCode && errorCode !== "000" && errorCode !== "00") {
      console.warn("⚠️ KAMIS API 에러 코드:", errorCode);
      return NextResponse.json({
        success: false,
        error: `KAMIS API 에러: ${errorCode}`,
        errorCode,
        rawResponse: data,
      });
    }

    // 아이템 배열 추출 (실제 응답 구조: 최상위에 price 배열)
    let items: any[] = [];
    if (data?.price && Array.isArray(data.price)) {
      items = data.price;
      console.log(`📦 price 배열에서 ${items.length}개 아이템 발견`);
    } else if (data?.price && !Array.isArray(data.price)) {
      items = [data.price];
      console.log(`📦 price 단일 객체에서 1개 아이템 발견`);
    } else if (data?.data?.item) {
      // 하위 호환성: 기존 구조도 지원
      items = Array.isArray(data.data.item) ? data.data.item : [data.data.item];
      console.log(`📦 KAMIS data.item에서 ${items.length}개 아이템 발견`);
    } else if (data?.item) {
      items = Array.isArray(data.item) ? data.item : [data.item];
      console.log(`📦 item 배열에서 ${items.length}개 아이템 발견`);
    }

    // 검색어로 필터링 (KAMIS API가 파라미터를 무시하고 전체 목록을 반환하는 경우 대비)
    if (productName && productName.trim().length > 0) {
      const searchTerm = productName.trim().toLowerCase();
      const originalCount = items.length;

      items = items.filter((item) => {
        const productNameMatch = item.productName
          ?.toLowerCase()
          .includes(searchTerm);
        const itemNameMatch = item.item_name
          ?.toLowerCase()
          .includes(searchTerm);
        return productNameMatch || itemNameMatch;
      });

      console.log(
        `🔍 필터링: ${originalCount}개 → ${items.length}개 (검색어: "${productName}")`,
      );
    }

    // date 파라미터가 있으면 각 아이템에 조회 날짜 추가 (그래프용)
    if (dateParam) {
      items = items.map((item) => ({
        ...item,
        queryDate: queryDate,
      }));
    }

    console.log("✅ 테스트 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      productName,
      regionCode: regionCode || null,
      itemCount: items.length,
      items: items.slice(0, 50), // 최대 50개 반환
      rawResponse: data, // 전체 응답도 포함
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
    });
  } catch (error) {
    console.error("❌ 테스트 실패:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// POST 요청도 지원
export async function POST(request: NextRequest) {
  console.group("🧪 KAMIS API 테스트 엔드포인트 호출 (POST)");

  try {
    const body = await request.json();
    const { productName } = body;

    if (!productName || typeof productName !== "string") {
      console.error("❌ 잘못된 요청: productName이 필요합니다.");
      return NextResponse.json(
        { error: "productName (문자열)이 필요합니다." },
        { status: 400 },
      );
    }

    // GET 요청과 동일한 로직 사용
    const url = new URL(request.url);
    url.searchParams.set("productName", productName);
    const getRequest = new NextRequest(url, {
      method: "GET",
      headers: request.headers,
    });

    return GET(getRequest);
  } catch (error) {
    console.error("❌ 테스트 실패:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    );
  }
}
