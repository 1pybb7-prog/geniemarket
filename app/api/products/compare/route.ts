import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { ProductPrice } from "@/lib/types";

/**
 * @file app/api/products/compare/route.ts
 * @description 가격 비교 API (GET)
 *
 * 이 API는 소매점이 특정 상품의 가격을 비교할 때 사용합니다.
 *
 * 주요 기능:
 * 1. 표준 상품명으로 모든 도매점의 가격 조회
 * 2. 도매점 정보 익명화 (ID만 전달)
 * 3. 공영시장 시세 함께 조회
 * 4. 가격 낮은 순으로 정렬
 *
 * 핵심 구현 로직:
 * - v_product_prices 뷰를 사용하여 가격 정보 조회
 * - 도매점 정보 익명화 (vendor_id만 전달, vendor_name은 "도매점 A", "도매점 B" 등으로 변환)
 * - 공영시장 시세 API 호출
 * - 결과 반환
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/types: ProductPrice
 *
 * @see {@link docs/PRD.md} - 가격 비교 페이지 명세
 * @see {@link docs/TODO.md} - TODO 734-741 라인
 */

/**
 * GET /api/products/compare?product={표준상품명}
 * 가격 비교 조회
 *
 * Query Parameters:
 * - product: 표준 상품명 (필수)
 *
 * Response:
 * {
 *   standard_name: string;
 *   category?: string;
 *   unit?: string;
 *   vendor_prices: Array<{
 *     raw_product_id: string;
 *     vendor_id: string;
 *     vendor_name: string; // "도매점 A", "도매점 B" 등
 *     original_name: string;
 *     price: number;
 *     unit: string;
 *     stock: number;
 *     image_url?: string;
 *   }>;
 *   market_prices: Array<{
 *     market_name: string;
 *     price: number;
 *     grade?: string;
 *     date: string;
 *   }>;
 *   average_market_price: number;
 * }
 */
export async function GET(request: NextRequest) {
  try {
    console.group("💰 가격 비교 API 시작");

    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const productName = searchParams.get("product");

    if (!productName || typeof productName !== "string") {
      console.error("❌ product 쿼리 파라미터가 누락되었습니다.");
      console.groupEnd();
      return NextResponse.json(
        { error: "product 쿼리 파라미터가 필요합니다." },
        { status: 400 },
      );
    }

    console.log("🔍 조회할 상품명:", productName);

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // v_product_prices 뷰에서 해당 표준 상품의 모든 가격 정보 조회
    const { data: productPrices, error: pricesError } = await supabase
      .from("v_product_prices")
      .select("*")
      .eq("standard_name", productName)
      .order("price", { ascending: true }); // 가격 낮은 순으로 정렬

    if (pricesError) {
      console.error("❌ 가격 정보 조회 실패:", pricesError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "가격 정보 조회에 실패했습니다.",
          details: pricesError.message,
        },
        { status: 500 },
      );
    }

    if (!productPrices || productPrices.length === 0) {
      console.log("📭 해당 상품의 가격 정보가 없습니다.");
      console.groupEnd();
      return NextResponse.json({
        standard_name: productName,
        category: null,
        unit: null,
        vendor_prices: [],
        market_prices: [],
        average_market_price: 0,
      });
    }

    console.log(`✅ ${productPrices.length}개의 도매점 가격 정보 조회 성공`);

    // 도매점 정보 익명화 (vendor_id를 "도매점 A", "도매점 B" 등으로 변환)
    const vendorMap = new Map<string, string>();
    let vendorIndex = 0;
    const vendorPrices = productPrices.map((price: ProductPrice) => {
      if (!vendorMap.has(price.vendor_id)) {
        vendorMap.set(
          price.vendor_id,
          `도매점 ${String.fromCharCode(65 + vendorIndex)}`, // A, B, C, ...
        );
        vendorIndex++;
      }

      return {
        raw_product_id: price.raw_product_id,
        vendor_id: price.vendor_id,
        vendor_name: vendorMap.get(price.vendor_id) || "도매점",
        original_name: price.original_name,
        price: price.price,
        unit: price.unit,
        stock: price.stock,
        image_url: price.image_url || null,
      };
    });

    // 표준 상품 정보 추출 (첫 번째 항목에서)
    const firstProduct = productPrices[0];
    const standardName = firstProduct.standard_name;
    const category = firstProduct.category || null;
    const unit = firstProduct.unit || null;

    // 공영시장 시세 조회
    let marketPrices: Array<{
      market_name: string;
      price: number;
      grade?: string;
      date: string;
    }> = [];
    let averageMarketPrice = 0;

    try {
      console.log("📊 공영시장 시세 조회 시작...");
      const marketResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/market-prices?productName=${encodeURIComponent(standardName)}`,
      );

      if (marketResponse.ok) {
        const marketResult = await marketResponse.json();
        marketPrices = marketResult.prices || [];
        averageMarketPrice = marketResult.averagePrice || 0;
        console.log(`✅ ${marketPrices.length}개의 공영시장 시세 조회 성공`);
      } else {
        console.warn("⚠️ 공영시장 시세 조회 실패 (가격 비교는 계속 진행)");
      }
    } catch (marketError) {
      console.warn(
        "⚠️ 공영시장 시세 조회 중 오류 발생 (가격 비교는 계속 진행):",
        marketError,
      );
    }

    console.log("📊 가격 비교 결과:", {
      standard_name: standardName,
      vendor_count: vendorPrices.length,
      market_count: marketPrices.length,
      average_market_price: averageMarketPrice,
    });
    console.groupEnd();

    return NextResponse.json({
      standard_name: standardName,
      category,
      unit,
      vendor_prices: vendorPrices,
      market_prices: marketPrices,
      average_market_price: averageMarketPrice,
    });
  } catch (error) {
    console.error("❌ 가격 비교 API 에러:", error);
    return NextResponse.json(
      {
        error: "가격 비교 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
