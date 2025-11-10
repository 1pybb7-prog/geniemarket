import { NextResponse } from "next/server";
import { standardizeProductName } from "@/lib/gemini";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { ProductStandard } from "@/lib/types";

/**
 * @file app/api/products/standardize/route.ts
 * @description AI 상품명 표준화 API (POST)
 *
 * 이 API는 Gemini AI를 사용하여 농수산물 상품명을 표준화합니다.
 *
 * 주요 기능:
 * 1. 원본 상품명을 Gemini API로 표준화
 * 2. 표준 상품이 이미 있는지 확인
 * 3. 없으면 새로 생성, 있으면 기존 ID 사용
 * 4. 표준화 결과 반환
 *
 * 핵심 구현 로직:
 * - Gemini API로 상품명 표준화
 * - products_standard 테이블에서 표준 상품 조회
 * - 없으면 새로 생성
 * - 표준화 결과 반환
 *
 * @dependencies
 * - @/lib/gemini: standardizeProductName
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/types: ProductStandard
 *
 * @see {@link docs/PRD.md} - AI 표준화 기능 명세
 * @see {@link docs/TODO.md} - TODO 555-582 라인
 */

/**
 * POST /api/products/standardize
 * 상품명 표준화
 *
 * Request Body:
 * {
 *   original_name: string;
 * }
 *
 * Response:
 * {
 *   standard_name: string;
 *   standard_product_id: string;
 *   category?: string;
 *   unit?: string;
 * }
 */
export async function POST(request: Request) {
  try {
    console.group("🤖 AI 상품명 표준화 API 시작");

    // 요청 본문 파싱
    const body = await request.json();
    const { original_name } = body;

    if (!original_name || typeof original_name !== "string") {
      console.error("❌ original_name 필드가 누락되었거나 유효하지 않습니다.");
      console.groupEnd();
      return NextResponse.json(
        { error: "original_name 필드가 필요합니다." },
        { status: 400 },
      );
    }

    console.log("📝 원본 상품명:", original_name);

    // Gemini API로 상품명 표준화
    const standardizedName = await standardizeProductName(original_name);
    console.log("✅ 표준화된 상품명:", standardizedName);

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // 표준 상품이 이미 있는지 확인
    const { data: existingStandard, error: selectError } = await supabase
      .from("products_standard")
      .select("id, standard_name, category, unit")
      .eq("standard_name", standardizedName)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116은 "no rows returned" 에러 (정상적인 경우)
      console.error("❌ 표준 상품 조회 실패:", selectError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "표준 상품 조회에 실패했습니다.",
          details: selectError.message,
        },
        { status: 500 },
      );
    }

    let standardProduct: ProductStandard;

    if (existingStandard) {
      // 기존 표준 상품이 있으면 사용
      console.log("✅ 기존 표준 상품 발견:", existingStandard.id);
      standardProduct = existingStandard as ProductStandard;
    } else {
      // 없으면 새로 생성
      console.log("📦 새 표준 상품 생성 중...");

      // 표준 상품명에서 단위 추출 시도 (예: "청양고추 1kg" → unit: "kg")
      const unitMatch = standardizedName.match(
        /(\d+)\s*(kg|g|개|박스|팩|봉|포기|단|마리|근)/,
      );
      const extractedUnit = unitMatch ? unitMatch[2] : null;

      const { data: newStandard, error: insertError } = await supabase
        .from("products_standard")
        .insert({
          standard_name: standardizedName,
          unit: extractedUnit || null,
          category: null, // 카테고리는 나중에 추가 가능
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ 표준 상품 생성 실패:", insertError);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "표준 상품 생성에 실패했습니다.",
            details: insertError.message,
          },
          { status: 500 },
        );
      }

      console.log("✅ 표준 상품 생성 성공:", newStandard.id);
      standardProduct = newStandard as ProductStandard;
    }

    console.log("📊 표준화 결과:", {
      standard_name: standardProduct.standard_name,
      standard_product_id: standardProduct.id,
      category: standardProduct.category,
      unit: standardProduct.unit,
    });
    console.groupEnd();

    return NextResponse.json({
      standard_name: standardProduct.standard_name,
      standard_product_id: standardProduct.id,
      category: standardProduct.category || null,
      unit: standardProduct.unit || null,
    });
  } catch (error) {
    console.error("❌ AI 상품명 표준화 API 에러:", error);
    return NextResponse.json(
      {
        error: "상품명 표준화 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
