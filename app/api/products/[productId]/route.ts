import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ProductFormData } from "@/components/products/ProductForm";
import type { ProductRaw } from "@/lib/types";

/**
 * @file app/api/products/[productId]/route.ts
 * @description 상품 수정/삭제 API (PATCH/DELETE)
 *
 * 이 API는 도매점이 등록한 상품을 수정하거나 삭제할 때 사용합니다.
 *
 * 주요 기능:
 * 1. PATCH: 상품 정보 수정
 * 2. DELETE: 상품 삭제
 *    - Clerk 인증 확인
 *    - 도매점(vendor)만 수정/삭제 가능하도록 체크
 *    - 본인이 등록한 상품만 수정/삭제 가능
 *
 * 핵심 구현 로직:
 * - Clerk auth() 함수로 사용자 인증 확인
 * - Supabase에서 상품 정보 조회하여 vendor_id 확인
 * - 본인이 등록한 상품인지 확인
 * - 상품 정보 수정 또는 삭제
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/types: ProductRaw
 * - @/components/products/ProductForm: ProductFormData
 *
 * @see {@link docs/PRD.md} - products_raw 테이블 스키마
 * @see {@link docs/TODO.md} - TODO 644-649 라인
 */

/**
 * PATCH /api/products/[productId]
 * 상품 정보 수정
 *
 * Request Body:
 * {
 *   original_name?: string;
 *   price?: number;
 *   unit?: string;
 *   stock?: number;
 *   image_url?: string;
 * }
 *
 * Response:
 * {
 *   id: string;
 *   vendor_id: string;
 *   original_name: string;
 *   price: number;
 *   unit: string;
 *   stock: number;
 *   image_url?: string;
 *   created_at: string;
 *   updated_at: string;
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    console.group("📝 상품 수정 API 시작");
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
    const body: Partial<ProductFormData> = await request.json();
    console.log("📝 수정할 데이터:", body);

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // 상품 정보 조회
    const { data: product, error: selectError } = await supabase
      .from("products_raw")
      .select("id, vendor_id")
      .eq("id", productId)
      .single();

    if (selectError || !product) {
      console.error("❌ 상품 조회 실패:", selectError);
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

    // 수정할 데이터 준비
    const updateData: Partial<ProductRaw> = {};

    if (body.original_name !== undefined) {
      updateData.original_name = body.original_name;
    }
    if (body.price !== undefined) {
      updateData.price = body.price;
    }
    if (body.unit !== undefined) {
      updateData.unit = body.unit;
    }
    if (body.stock !== undefined) {
      updateData.stock = body.stock;
    }
    if (body.image_url !== undefined) {
      updateData.image_url = body.image_url || null;
    }

    // updated_at 자동 업데이트
    updateData.updated_at = new Date().toISOString();

    console.log("💾 수정할 데이터:", updateData);

    // 상품 정보 수정
    const { data: updatedProduct, error: updateError } = await supabase
      .from("products_raw")
      .update(updateData)
      .eq("id", productId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ 상품 수정 실패:", updateError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "상품 수정에 실패했습니다.",
          details: updateError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ 상품 수정 성공:", updatedProduct);
    console.groupEnd();

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("❌ 상품 수정 API 에러:", error);
    return NextResponse.json(
      {
        error: "상품 수정 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/products/[productId]
 * 상품 삭제
 *
 * Response:
 * {
 *   success: boolean;
 *   message: string;
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    console.group("🗑️ 상품 삭제 API 시작");
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

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // 상품 정보 조회
    const { data: product, error: selectError } = await supabase
      .from("products_raw")
      .select("id, vendor_id")
      .eq("id", productId)
      .single();

    if (selectError || !product) {
      console.error("❌ 상품 조회 실패:", selectError);
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
        { error: "본인이 등록한 상품만 삭제할 수 있습니다." },
        { status: 403 },
      );
    }

    console.log("✅ 권한 확인 완료");

    // 상품 삭제 (CASCADE로 product_mapping도 자동 삭제됨)
    const { error: deleteError } = await supabase
      .from("products_raw")
      .delete()
      .eq("id", productId);

    if (deleteError) {
      console.error("❌ 상품 삭제 실패:", deleteError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "상품 삭제에 실패했습니다.",
          details: deleteError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ 상품 삭제 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "상품이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("❌ 상품 삭제 API 에러:", error);
    return NextResponse.json(
      {
        error: "상품 삭제 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
