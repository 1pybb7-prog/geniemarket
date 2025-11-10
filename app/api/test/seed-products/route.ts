import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * @file app/api/test/seed-products/route.ts
 * @description 테스트용 상품 등록 API
 *
 * 이 API는 개발 환경에서 테스트 데이터를 생성하기 위한 엔드포인트입니다.
 * 프로덕션 환경에서는 사용하지 마세요.
 *
 * 주요 기능:
 * 1. 테스트 도매점 사용자 생성
 * 2. 농수산물 10개 등록 (이미지 포함)
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 *
 * @see {@link docs/TODO.md} - TODO 510-538 라인
 */

/**
 * POST /api/test/seed-products
 * 테스트 상품 등록
 *
 * Response:
 * {
 *   success: boolean;
 *   vendor: { id, email, business_name };
 *   products: ProductRaw[];
 * }
 */
export async function POST() {
  try {
    console.group("🌱 테스트 상품 등록 시작");

    const supabase = getServiceRoleClient();

    // 1. 테스트 도매점 사용자 생성
    console.log("👤 테스트 도매점 사용자 생성 중...");
    const { data: vendor, error: vendorError } = await supabase
      .from("users")
      .upsert(
        {
          id: "vendor_test_001",
          email: "vendor@example.com",
          user_type: "vendor",
          business_name: "테스트 도매점",
          phone: "010-1234-5678",
        },
        {
          onConflict: "id",
        },
      )
      .select()
      .single();

    if (vendorError) {
      console.error("❌ 도매점 사용자 생성 실패:", vendorError);
      console.groupEnd();
      return NextResponse.json(
        { error: "도매점 사용자 생성 실패", details: vendorError.message },
        { status: 500 },
      );
    }

    console.log("✅ 도매점 사용자 생성 성공:", vendor);

    // 2. 농수산물 10개 등록
    console.log("📦 농수산물 10개 등록 중...");
    const productsData = [
      {
        vendor_id: vendor.id,
        original_name: "사과",
        price: 5000,
        unit: "kg",
        stock: 100,
        image_url:
          "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop",
      },
      {
        vendor_id: vendor.id,
        original_name: "배추",
        price: 3000,
        unit: "포기",
        stock: 80,
        image_url:
          "https://images.unsplash.com/photo-1594282418426-62d45f3ea6f5?w=400&h=400&fit=crop",
      },
      {
        vendor_id: vendor.id,
        original_name: "고등어",
        price: 8000,
        unit: "마리",
        stock: 50,
        image_url:
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop",
      },
      {
        vendor_id: vendor.id,
        original_name: "오징어",
        price: 12000,
        unit: "kg",
        stock: 40,
        image_url:
          "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=400&fit=crop",
      },
      {
        vendor_id: vendor.id,
        original_name: "당근",
        price: 2500,
        unit: "kg",
        stock: 90,
        image_url:
          "https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400&h=400&fit=crop",
      },
      {
        vendor_id: vendor.id,
        original_name: "양파",
        price: 2000,
        unit: "kg",
        stock: 120,
        image_url:
          "https://images.unsplash.com/photo-1618512496249-3f41b8ec5f9e?w=400&h=400&fit=crop",
      },
      {
        vendor_id: vendor.id,
        original_name: "감자",
        price: 3500,
        unit: "kg",
        stock: 70,
        image_url:
          "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400&h=400&fit=crop",
      },
      {
        vendor_id: vendor.id,
        original_name: "연어",
        price: 25000,
        unit: "kg",
        stock: 30,
        image_url:
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop",
      },
      {
        vendor_id: vendor.id,
        original_name: "새우",
        price: 15000,
        unit: "kg",
        stock: 35,
        image_url:
          "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=400&fit=crop",
      },
      {
        vendor_id: vendor.id,
        original_name: "브로콜리",
        price: 4500,
        unit: "포기",
        stock: 60,
        image_url:
          "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400&h=400&fit=crop",
      },
    ];

    const { data: products, error: productsError } = await supabase
      .from("products_raw")
      .insert(productsData)
      .select();

    if (productsError) {
      console.error("❌ 상품 등록 실패:", productsError);
      console.groupEnd();
      return NextResponse.json(
        { error: "상품 등록 실패", details: productsError.message },
        { status: 500 },
      );
    }

    console.log("✅ 농수산물 등록 성공:", products);
    console.groupEnd();

    return NextResponse.json(
      {
        success: true,
        vendor: {
          id: vendor.id,
          email: vendor.email,
          business_name: vendor.business_name,
        },
        products: products,
        message: "농수산물 10개가 성공적으로 등록되었습니다.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ 테스트 상품 등록 API 에러:", error);
    return NextResponse.json(
      {
        error: "상품 등록 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
