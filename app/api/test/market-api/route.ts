/**
 * @file app/api/test/market-api/route.ts
 * @description 공공데이터포털 API 테스트용 엔드포인트
 *
 * 이 엔드포인트는 공공데이터포털 API가 정상적으로 작동하는지 테스트하기 위한 것입니다.
 * 브라우저에서 상품명을 입력하고 시세 정보를 확인할 수 있습니다.
 *
 * 사용 방법:
 * GET /api/test/market-api?productName=청양고추
 * 또는
 * POST /api/test/market-api
 * Body: { productName: "청양고추" }
 */

import { NextRequest, NextResponse } from "next/server";
import { getMarketPrices, calculateAveragePrice } from "@/lib/market-api";

export async function GET(request: NextRequest) {
  console.group("🧪 공공데이터포털 API 테스트 (GET)");

  try {
    const searchParams = request.nextUrl.searchParams;
    const productName = searchParams.get("productName") || "청양고추";

    console.log("🔍 테스트 상품명:", productName);

    // 공공데이터포털 API 호출
    const prices = await getMarketPrices(productName);
    const averagePrice = calculateAveragePrice(prices);

    console.log("✅ 테스트 완료");
    console.log("📊 조회된 시세 개수:", prices.length);
    console.log("💰 평균 가격:", averagePrice);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      productName,
      prices,
      averagePrice,
      count: prices.length,
      timestamp: new Date().toISOString(),
    });
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

export async function POST(request: NextRequest) {
  console.group("🧪 공공데이터포털 API 테스트 (POST)");

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

    console.log("🔍 테스트 상품명:", productName);

    // 공공데이터포털 API 호출
    const prices = await getMarketPrices(productName);
    const averagePrice = calculateAveragePrice(prices);

    console.log("✅ 테스트 완료");
    console.log("📊 조회된 시세 개수:", prices.length);
    console.log("💰 평균 가격:", averagePrice);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      productName,
      prices,
      averagePrice,
      count: prices.length,
      timestamp: new Date().toISOString(),
    });
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
