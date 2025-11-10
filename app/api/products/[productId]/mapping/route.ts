import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * @file app/api/products/[productId]/mapping/route.ts
 * @description 상품 표준화 결과 확인/수정 API (PATCH)
 *
 * 이 API는 도매점이 AI 표준화 결과를 확인하거나 수정할 때 사용합니다.
 *
 * 주요 기능:
 * 1. PATCH: 표준화 결과 확인 (is_verified = true)
 * 2. 표준 상품명 수정 (선택 사항)
 *
 * 핵심 구현 로직:
 * - Clerk auth() 함수로 사용자 인증 확인
 * - Supabase에서 product_mapping 조회
 * - 본인이 등록한 상품인지 확인
 * - is_verified 업데이트 또는 표준 상품명 수정
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 *
 * @see {@link docs/PRD.md} - product_mapping 테이블 스키마
 * @see {@link docs/TODO.md} - TODO 639-642 라인
 */

/**
 * PATCH /api/products/[productId]/mapping
 * 표준화 결과 확인/수정
 *
 * Request Body:
 * {
 *   is_verified?: boolean;
 *   standard_name?: string; // 표준 상품명 수정 (선택 사항)
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   message: string;
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    console.group("✅ 표준화 결과 확인/수정 API 시작");
    const { productId } = await params;

    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증되지 않은 사용자");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ 인증된 사용자 ID:", userId);
    console.log("📦 상품 ID:", productId);

    // 요청 본문 파싱
    const body = await request.json();
    console.log("📝 요청 데이터:", body);

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // 상품 정보 조회 (vendor_id 확인)
    const { data: product, error: productError } = await supabase
      .from("products_raw")
      .select("id, vendor_id")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      console.error("❌ 상품 조회 실패:", productError);
      console.groupEnd();
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 본인이 등록한 상품인지 확인
    if (product.vendor_id !== userId) {
      console.error("❌ 권한 없음: 본인이 등록한 상품이 아닙니다.");
      console.groupEnd();
      return NextResponse.json(
        { error: "본인이 등록한 상품만 수정할 수 있습니다." },
        { status: 403 },
      );
    }

    console.log("✅ 권한 확인 완료");

    // product_mapping 조회
    const { data: mapping, error: mappingError } = await supabase
      .from("product_mapping")
      .select("*")
      .eq("raw_product_id", productId)
      .single();

    if (mappingError || !mapping) {
      console.error("❌ 매핑 조회 실패:", mappingError);
      console.groupEnd();
      return NextResponse.json(
        { error: "표준화 결과를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    console.log("✅ 매핑 조회 성공:", mapping);

    // 표준 상품명 수정이 있는 경우
    if (body.standard_name && body.standard_name.trim()) {
      console.log("📝 표준 상품명 수정 시작...");

      // 표준 상품 업데이트 또는 새로 생성
      const { data: existingStandard, error: standardError } = await supabase
        .from("products_standard")
        .select("id")
        .eq("standard_name", body.standard_name.trim())
        .single();

      let standardProductId = mapping.standard_product_id;

      if (standardError && standardError.code === "PGRST116") {
        // 표준 상품이 없으면 새로 생성
        const { data: newStandard, error: createError } = await supabase
          .from("products_standard")
          .insert({
            standard_name: body.standard_name.trim(),
            category: null,
            unit: null,
          })
          .select()
          .single();

        if (createError) {
          console.error("❌ 표준 상품 생성 실패:", createError);
          console.groupEnd();
          return NextResponse.json(
            {
              error: "표준 상품 생성에 실패했습니다.",
              details: createError.message,
            },
            { status: 500 },
          );
        }

        standardProductId = newStandard.id;
        console.log("✅ 새 표준 상품 생성:", standardProductId);
      } else if (existingStandard) {
        // 기존 표준 상품 사용
        standardProductId = existingStandard.id;
        console.log("✅ 기존 표준 상품 사용:", standardProductId);
      }

      // 매핑 업데이트
      const { error: updateMappingError } = await supabase
        .from("product_mapping")
        .update({
          standard_product_id: standardProductId,
          is_verified:
            body.is_verified !== undefined
              ? body.is_verified
              : mapping.is_verified,
        })
        .eq("id", mapping.id);

      if (updateMappingError) {
        console.error("❌ 매핑 업데이트 실패:", updateMappingError);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "표준화 결과 수정에 실패했습니다.",
            details: updateMappingError.message,
          },
          { status: 500 },
        );
      }

      console.log("✅ 표준화 결과 수정 성공");
    } else if (body.is_verified !== undefined) {
      // is_verified만 업데이트
      const { error: updateError } = await supabase
        .from("product_mapping")
        .update({ is_verified: body.is_verified })
        .eq("id", mapping.id);

      if (updateError) {
        console.error("❌ 매핑 업데이트 실패:", updateError);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "표준화 결과 확인에 실패했습니다.",
            details: updateError.message,
          },
          { status: 500 },
        );
      }

      console.log("✅ 표준화 결과 확인 성공");
    }

    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: body.is_verified
        ? "표준화 결과가 확인되었습니다."
        : "표준화 결과가 수정되었습니다.",
    });
  } catch (error) {
    console.error("❌ 표준화 결과 확인/수정 API 에러:", error);
    return NextResponse.json(
      {
        error: "표준화 결과 확인/수정 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
