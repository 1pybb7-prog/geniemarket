import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { hasUserType } from "@/lib/types";
import type { Order } from "@/lib/types";

/**
 * @file app/api/orders/route.ts
 * @description 주문 목록 조회/생성 API (GET/POST)
 *
 * 이 API는 소매점이 주문을 생성하거나 조회할 때 사용합니다.
 *
 * 주요 기능:
 * 1. GET: 주문 목록 조회 (소매점/도매점 구분)
 * 2. POST: 새로운 주문 생성
 *    - Clerk 인증 확인
 *    - 소매점(retailer)만 주문 가능하도록 체크
 *    - orders 테이블에 저장
 *    - vendor_id 자동으로 가져오기 (product_raw → vendor_id)
 *
 * 핵심 구현 로직:
 * - Clerk auth() 함수로 사용자 인증 확인
 * - Supabase에서 사용자 정보 조회하여 user_type 확인
 * - 주문 생성 시 product_raw에서 vendor_id 가져오기
 * - 주문 조회 시 user_type에 따라 buyer_id 또는 vendor_id로 필터링
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/types: Order
 *
 * @see {@link docs/PRD.md} - orders 테이블 스키마
 * @see {@link docs/TODO.md} - TODO 794-810, 831-837, 859-863 라인
 */

/**
 * GET /api/orders
 * 주문 목록 조회
 *
 * Query Parameters:
 * - type: "retailer" | "vendor" (선택, 기본값: user_type에 따라 자동 결정)
 *
 * Response:
 * {
 *   orders: Order[];
 *   count: number;
 * }
 */
export async function GET(request: NextRequest) {
  try {
    console.group("📋 주문 목록 조회 API 시작");

    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증되지 않은 사용자");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ 인증된 사용자 ID:", userId);

    // 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "0", 10);

    console.log("📋 쿼리 파라미터:", { type, limit });

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // 사용자 정보 조회 (user_type 확인)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, user_type")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      console.error("❌ 사용자 정보 조회 실패:", userError);
      console.groupEnd();
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const requestedType = (type as "retailer" | "vendor") || userData.user_type;
    const userType = userData.user_type;
    console.log("👤 사용자 유형:", userType);
    console.log("👤 요청된 유형:", requestedType);

    let query = supabase.from("orders").select("*", { count: "exact" });

    // 소매점(retailer)인 경우: 본인의 주문만 조회
    if (
      hasUserType(userType, "retailer") &&
      (requestedType === "retailer" || !type)
    ) {
      query = query.eq("buyer_id", userId);
    }
    // 도매점(vendor)인 경우: 본인이 판매한 상품의 주문만 조회
    else if (
      hasUserType(userType, "vendor") &&
      (requestedType === "vendor" || !type)
    ) {
      // products_raw 테이블에서 본인의 상품 ID 목록 가져오기
      const { data: myProducts, error: productsError } = await supabase
        .from("products_raw")
        .select("id")
        .eq("vendor_id", userId);

      if (productsError) {
        console.error("❌ 상품 목록 조회 실패:", productsError);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "상품 목록 조회에 실패했습니다.",
            details: productsError.message,
          },
          { status: 500 },
        );
      }

      const productIds = myProducts?.map((p) => p.id) || [];

      if (productIds.length === 0) {
        console.log("📭 등록한 상품이 없습니다.");
        console.groupEnd();
        return NextResponse.json({
          orders: [],
          count: 0,
        });
      }

      query = query.in("product_id", productIds);
    }

    // 최신 순으로 정렬
    query = query.order("created_at", { ascending: false });

    // limit이 지정된 경우 적용
    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data: orders, error: ordersError, count } = await query;

    if (ordersError) {
      console.error("❌ 주문 목록 조회 실패:", ordersError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "주문 목록 조회에 실패했습니다.",
          details: ordersError.message,
        },
        { status: 500 },
      );
    }

    console.log(
      `✅ ${orders?.length || 0}개의 주문 조회 성공 (전체: ${count || 0}개)`,
    );
    console.groupEnd();

    return NextResponse.json({
      orders: orders || [],
      count: count || 0,
    });
  } catch (error) {
    console.error("❌ 주문 목록 조회 API 에러:", error);
    return NextResponse.json(
      {
        error: "주문 목록 조회 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/orders
 * 주문 생성
 *
 * Request Body:
 * {
 *   product_id: string;
 *   quantity: number;
 *   total_price: number;
 *   delivery_address?: string;
 *   notes?: string;
 * }
 *
 * Response:
 * {
 *   id: string;
 *   buyer_id: string;
 *   vendor_id: string;
 *   product_id: string;
 *   quantity: number;
 *   total_price: number;
 *   status: "pending";
 *   delivery_address?: string;
 *   notes?: string;
 *   created_at: string;
 *   updated_at: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.group("🛒 주문 생성 API 시작");

    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증되지 않은 사용자");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ 인증된 사용자 ID:", userId);

    // 요청 본문 파싱
    const body = await request.json();
    console.log("📝 요청 데이터:", body);

    // 입력 검증
    if (!body.product_id || !body.quantity || !body.total_price) {
      console.error("❌ 필수 필드 누락");
      console.groupEnd();
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 },
      );
    }

    // 수량 검증
    if (body.quantity < 1 || body.quantity > 999999) {
      console.error("❌ 수량 범위 오류:", body.quantity);
      console.groupEnd();
      return NextResponse.json(
        { error: "수량은 1 이상 999,999 이하여야 합니다." },
        { status: 400 },
      );
    }

    // 총 금액 검증
    if (body.total_price < 1 || body.total_price > 999999999) {
      console.error("❌ 총 금액 범위 오류:", body.total_price);
      console.groupEnd();
      return NextResponse.json(
        { error: "총 금액은 1원 이상 999,999,999원 이하여야 합니다." },
        { status: 400 },
      );
    }

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // 사용자 정보 조회 (user_type 확인)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, user_type")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      console.error("❌ 사용자 정보 조회 실패:", userError);
      console.groupEnd();
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 소매점(retailer)만 주문 가능
    if (userData.user_type !== "retailer") {
      console.error("❌ 소매점이 아닌 사용자:", userData.user_type);
      console.groupEnd();
      return NextResponse.json(
        { error: "소매점만 주문할 수 있습니다." },
        { status: 403 },
      );
    }

    console.log("✅ 소매점 확인 완료");

    // 상품 정보 조회 (vendor_id 가져오기)
    const { data: product, error: productError } = await supabase
      .from("products_raw")
      .select("id, vendor_id, price, stock")
      .eq("id", body.product_id)
      .single();

    if (productError || !product) {
      console.error("❌ 상품 조회 실패:", productError);
      console.groupEnd();
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 재고 확인
    if (product.stock < body.quantity) {
      console.error("❌ 재고 부족:", {
        stock: product.stock,
        quantity: body.quantity,
      });
      console.groupEnd();
      return NextResponse.json(
        { error: "재고가 부족합니다." },
        { status: 400 },
      );
    }

    console.log("✅ 상품 정보 확인 완료:", product);

    // 주문 데이터 준비
    const orderData: Omit<Order, "id" | "created_at" | "updated_at"> = {
      buyer_id: userId,
      vendor_id: product.vendor_id,
      product_id: body.product_id,
      quantity: body.quantity,
      total_price: body.total_price,
      status: "pending",
      delivery_address: body.delivery_address || null,
      notes: body.notes || null,
    };

    console.log("💾 저장할 주문 데이터:", orderData);

    // orders 테이블에 주문 저장
    const { data: order, error: insertError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (insertError) {
      console.error("❌ 주문 저장 실패:", insertError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "주문 생성에 실패했습니다.",
          details: insertError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ 주문 저장 성공:", order);
    console.groupEnd();

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("❌ 주문 생성 API 에러:", error);
    return NextResponse.json(
      {
        error: "주문 생성 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
