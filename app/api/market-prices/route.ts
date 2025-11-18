import { NextRequest, NextResponse } from "next/server";
import {
  getMarketPrices,
  calculateAveragePrice,
  type MarketPrice as ApiMarketPrice,
} from "@/lib/market-api";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * @file app/api/market-prices/route.ts
 * @description 공영도매시장 실시간 경매 가격 조회 API (GET)
 *
 * 이 API는 KAMIS API를 사용하여 전국 공영도매시장의 실시간 경매 가격 정보를 조회합니다.
 * dailyPriceByCategoryList 액션을 사용하여 오늘 날짜의 실시간 경매 가격을 조회합니다.
 *
 * 주요 기능:
 * 1. 상품명으로 실시간 경매 가격 조회 (KAMIS API 호출)
 * 2. JSON 응답 데이터 파싱
 * 3. 필요한 필드만 추출
 * 4. market_prices 테이블에 저장 (캐싱)
 * 5. 결과 반환
 *
 * 핵심 구현 로직:
 * - KAMIS API 호출 (dailyPriceByCategoryList 액션)
 * - 응답 데이터 파싱 및 변환
 * - market_prices 테이블에 저장 (캐싱)
 * - 에러 처리 (실패 시 빈 배열 반환)
 *
 * @dependencies
 * - @/lib/market-api: getMarketPrices, calculateAveragePrice
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/types: MarketPrice
 *
 * @see {@link docs/PRD.md} - 공공 API 연동 명세
 * @see {@link docs/TODO.md} - TODO 605-623 라인
 */

/**
 * GET /api/market-prices?productName={상품명}&region={지역}
 * 공영도매시장 실시간 경매 가격 조회
 *
 * 공공데이터포털 API를 사용하여
 * 오늘 날짜의 실시간 경매 가격 정보를 조회합니다.
 *
 * Query Parameters:
 * - productName: 조회할 상품명 (필수, 예: "청양고추", "배추", "사과")
 * - region: 지역 필터 (선택, 예: "서울", "경기", "강원")
 *
 * Response:
 * {
 *   prices: MarketPrice[];
 *   averagePrice: number;
 *   count: number;
 * }
 */
export async function GET(request: NextRequest) {
  try {
    console.group("📊 공영시장 시세 조회 API 시작");

    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const productName = searchParams.get("productName");
    const region = searchParams.get("region"); // 선택적 지역 필터

    if (!productName || typeof productName !== "string") {
      console.error("❌ productName 쿼리 파라미터가 누락되었습니다.");
      console.groupEnd();
      return NextResponse.json(
        { error: "productName 쿼리 파라미터가 필요합니다." },
        { status: 400 },
      );
    }

    console.log("🔍 조회할 상품명:", productName);
    if (region) {
      console.log("📍 지역 필터:", region);
    }
    console.log(
      "🔑 API 키 확인:",
      process.env.AT_MARKET_API_KEY || process.env.PUBLIC_DATA_API_KEY
        ? "✅ 설정됨"
        : "❌ 없음",
    );

    // 공공 API 호출 (타임아웃 30초 - 여러 카테고리 시도하므로 시간 필요)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let apiMarketPrices: ApiMarketPrice[] = [];

    try {
      console.log("📤 getMarketPrices 함수 호출 시작...");
      apiMarketPrices = await getMarketPrices(
        productName,
        region || undefined,
      );
      clearTimeout(timeoutId);
      console.log(
        `📊 getMarketPrices 결과: ${apiMarketPrices.length}개 시세 조회됨`,
      );
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("⚠️ API 호출 타임아웃 (30초 초과)");
      } else {
        console.error("❌ 공공 API 호출 실패:", error);
        console.error(
          "❌ 에러 상세:",
          error instanceof Error ? error.stack : error,
        );
      }
      // 에러 발생 시 빈 배열 반환
      apiMarketPrices = [];
    }

    if (apiMarketPrices.length === 0) {
      console.log("📭 시세 정보 없음");
      console.groupEnd();
      return NextResponse.json({
        prices: [],
        averagePrice: 0,
        count: 0,
        message: "시세 정보가 없습니다.",
      });
    }

    console.log(`✅ ${apiMarketPrices.length}개의 시세 정보 조회 성공`);

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // market_prices 테이블에 저장 (캐싱)
    // 주의: 표준 상품 ID는 나중에 매핑할 수 있도록 null로 저장
    const pricesToInsert = apiMarketPrices.map((price) => ({
      standard_product_id: null, // 나중에 매핑 가능
      market_name: price.marketName,
      price: price.price,
      grade: price.grade || null,
      date: price.date,
    }));

    const { error: insertError } = await supabase
      .from("market_prices")
      .insert(pricesToInsert);

    if (insertError) {
      console.warn("⚠️ 시세 데이터 저장 실패 (조회는 성공):", insertError);
      // 저장 실패는 치명적이지 않으므로 경고만 출력
    } else {
      console.log("✅ 시세 데이터 저장 성공 (캐싱)");
    }

    // 평균 가격 계산
    const averagePrice = calculateAveragePrice(apiMarketPrices);

    console.log("📊 시세 통계:", {
      count: apiMarketPrices.length,
      averagePrice,
      minPrice: Math.min(...apiMarketPrices.map((p) => p.price)),
      maxPrice: Math.max(...apiMarketPrices.map((p) => p.price)),
    });
    console.groupEnd();

    // API 응답을 클라이언트용 형식으로 변환 (marketName -> market_name)
    const clientMarketPrices = apiMarketPrices.map((price) => ({
      market_name: price.marketName,
      price: price.price,
      grade: price.grade,
      date: price.date,
      product_name: price.productName,
      unit: price.unit,
    }));

    return NextResponse.json({
      prices: clientMarketPrices,
      averagePrice,
      count: clientMarketPrices.length,
    });
  } catch (error) {
    console.error("❌ 공영시장 시세 조회 API 에러:", error);
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

    // 에러 응답 반환 (항상 JSON 형식으로 반환)
    try {
      return NextResponse.json(
        {
          error: "시세 조회 중 오류가 발생했습니다.",
          details: error instanceof Error ? error.message : "Unknown error",
          prices: [],
          averagePrice: 0,
          count: 0,
        },
        { status: 500 },
      );
    } catch (responseError) {
      // JSON 응답 생성 실패 시에도 로그만 남기고 빈 응답 반환
      console.error("❌ 에러 응답 생성 실패:", responseError);
      return new NextResponse(
        JSON.stringify({
          error: "시세 조회 중 오류가 발생했습니다.",
          prices: [],
          averagePrice: 0,
          count: 0,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }
}
