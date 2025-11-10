import { NextRequest, NextResponse } from "next/server";
import {
  getMarketPrices,
  calculateAveragePrice,
  type MarketPrice as ApiMarketPrice,
} from "@/lib/market-api";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { MarketPrice } from "@/lib/types";

/**
 * @file app/api/market-prices/route.ts
 * @description 공영도매시장 실시간 시세 조회 API (GET)
 *
 * 이 API는 공공데이터포털 API를 사용하여 전국 공영도매시장의 실시간 경매 가격 정보를 조회합니다.
 *
 * 주요 기능:
 * 1. 상품명으로 공공 API 호출
 * 2. 응답 데이터 파싱 (XML → JSON)
 * 3. 필요한 필드만 추출
 * 4. market_prices 테이블에 저장 (캐싱)
 * 5. 결과 반환
 *
 * 핵심 구현 로직:
 * - 공공데이터포털 API 호출
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
 * GET /api/market-prices?productName={상품명}
 * 공영도매시장 실시간 시세 조회
 *
 * Query Parameters:
 * - productName: 조회할 상품명 (필수)
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

    if (!productName || typeof productName !== "string") {
      console.error("❌ productName 쿼리 파라미터가 누락되었습니다.");
      console.groupEnd();
      return NextResponse.json(
        { error: "productName 쿼리 파라미터가 필요합니다." },
        { status: 400 },
      );
    }

    console.log("🔍 조회할 상품명:", productName);

    // 공공 API 호출 (타임아웃 5초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let apiMarketPrices: ApiMarketPrice[] = [];

    try {
      apiMarketPrices = await getMarketPrices(productName);
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("⚠️ API 호출 타임아웃 (5초 초과)");
      } else {
        console.error("❌ 공공 API 호출 실패:", error);
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

    // API 응답을 DB 타입으로 변환
    const marketPrices: MarketPrice[] = apiMarketPrices.map((price) => ({
      id: "", // DB에 저장될 때 생성됨
      standard_product_id: undefined,
      market_name: price.marketName,
      price: price.price,
      grade: price.grade || undefined,
      date: price.date,
      created_at: new Date().toISOString(),
    }));

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

    return NextResponse.json({
      prices: apiMarketPrices,
      averagePrice,
      count: apiMarketPrices.length,
    });
  } catch (error) {
    console.error("❌ 공영시장 시세 조회 API 에러:", error);
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
  }
}
