import { NextRequest, NextResponse } from "next/server";
import {
  getKamisMarketPrices,
  calculateAveragePrice,
  type MarketPrice as ApiMarketPrice,
} from "@/lib/market-api";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * @file app/api/market-prices/kamis/route.ts
 * @description KAMIS Open API 실시간 경매 가격 조회 API (GET)
 *
 * 이 API는 KAMIS Open API를 사용하여 전국 공영도매시장의 실시간 경매 가격 정보를 조회합니다.
 */

export async function GET(request: NextRequest) {
  try {
    console.group("📊 KAMIS 시세 조회 API 시작");

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

    // KAMIS API 호출
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let apiMarketPrices: ApiMarketPrice[] = [];

    try {
      console.log("📤 getKamisMarketPrices 함수 호출 시작...");
      apiMarketPrices = await getKamisMarketPrices(
        productName,
        region || undefined,
      );
      clearTimeout(timeoutId);
      console.log(
        `📊 getKamisMarketPrices 결과: ${apiMarketPrices.length}개 시세 조회됨`,
      );
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("⚠️ API 호출 타임아웃 (30초 초과)");
      } else {
        console.error("❌ KAMIS API 호출 실패:", error);
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

    // Supabase 클라이언트 생성 (필요 시 캐싱 로직 추가 가능)
    // 현재는 KAMIS 데이터는 별도로 캐싱하지 않음 (또는 market_prices 테이블 공유)

    // 평균 가격 계산
    const averagePrice = calculateAveragePrice(apiMarketPrices);

    console.log("📊 시세 통계:", {
      count: apiMarketPrices.length,
      averagePrice,
      minPrice: Math.min(...apiMarketPrices.map((p) => p.price)),
      maxPrice: Math.max(...apiMarketPrices.map((p) => p.price)),
    });
    console.groupEnd();

    // API 응답을 클라이언트용 형식으로 변환
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
    console.error("❌ KAMIS 시세 조회 API 에러:", error);
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
