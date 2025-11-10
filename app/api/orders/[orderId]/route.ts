import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { Order, OrderStatus } from "@/lib/types";

/**
 * @file app/api/orders/[orderId]/route.ts
 * @description 주문 상세 조회/수정 API (GET/PATCH)
 *
 * 이 API는 주문 상세 정보를 조회하거나 주문 상태를 변경할 때 사용합니다.
 *
 * 주요 기능:
 * 1. GET: 주문 상세 정보 조회
 * 2. PATCH: 주문 상태 변경 (확인, 취소)
 *    - Clerk 인증 확인
 *    - 본인의 주문만 조회/수정 가능
 *    - 주문 상태 변경
 *
 * 핵심 구현 로직:
 * - Clerk auth() 함수로 사용자 인증 확인
 * - Supabase에서 주문 정보 조회
 * - 본인의 주문인지 확인 (buyer_id 또는 vendor_id)
 * - 주문 상태 변경
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/types: Order, OrderStatus
 *
 * @see {@link docs/PRD.md} - orders 테이블 스키마
 * @see {@link docs/TODO.md} - TODO 839-844, 865-870 라인
 */

/**
 * GET /api/orders/[orderId]
 * 주문 상세 조회
 *
 * Response:
 * {
 *   id: string;
 *   buyer_id: string;
 *   vendor_id: string;
 *   product_id: string;
 *   quantity: number;
 *   total_price: number;
 *   status: OrderStatus;
 *   delivery_address?: string;
 *   notes?: string;
 *   created_at: string;
 *   updated_at: string;
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    console.group("📋 주문 상세 조회 API 시작");
    const { orderId } = await params;

    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증되지 않은 사용자");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ 인증된 사용자 ID:", userId);
    console.log("📦 주문 ID:", orderId);

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // 주문 상세 정보 조회 (v_order_details 뷰 사용)
    const { data: orderDetail, error: selectError } = await supabase
      .from("v_order_details")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (selectError || !orderDetail) {
      console.error("❌ 주문 조회 실패:", selectError);
      console.groupEnd();
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 본인의 주문인지 확인 (buyer_id 또는 vendor_id)
    if (orderDetail.buyer_id !== userId && orderDetail.vendor_id !== userId) {
      console.error("❌ 권한 없음: 본인의 주문이 아닙니다.");
      console.groupEnd();
      return NextResponse.json(
        { error: "본인의 주문만 조회할 수 있습니다." },
        { status: 403 },
      );
    }

    // 응답 데이터 구성
    const orderData = {
      id: orderDetail.order_id,
      buyer_id: orderDetail.buyer_id,
      buyer_name: orderDetail.buyer_name,
      buyer_phone: orderDetail.buyer_phone,
      vendor_id: orderDetail.vendor_id,
      vendor_name: orderDetail.vendor_name,
      vendor_phone: orderDetail.vendor_phone,
      product_id: orderDetail.product_id,
      product_name: orderDetail.product_name,
      product_image: orderDetail.product_image,
      quantity: orderDetail.quantity,
      total_price: orderDetail.total_price,
      status: orderDetail.status,
      delivery_address: orderDetail.delivery_address,
      notes: orderDetail.notes,
      created_at: orderDetail.created_at,
      updated_at: orderDetail.updated_at,
    };

    console.log("✅ 주문 조회 성공:", orderData);
    console.groupEnd();

    return NextResponse.json(orderData);
  } catch (error) {
    console.error("❌ 주문 상세 조회 API 에러:", error);
    return NextResponse.json(
      {
        error: "주문 상세 조회 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/orders/[orderId]
 * 주문 상태 변경
 *
 * Request Body:
 * {
 *   status: "confirmed" | "cancelled";
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
 *   status: OrderStatus;
 *   delivery_address?: string;
 *   notes?: string;
 *   created_at: string;
 *   updated_at: string;
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    console.group("📝 주문 상태 변경 API 시작");
    const { orderId } = await params;

    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증되지 않은 사용자");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ 인증된 사용자 ID:", userId);
    console.log("📦 주문 ID:", orderId);

    // 요청 본문 파싱
    const body = await request.json();
    console.log("📝 요청 데이터:", body);

    // 입력 검증
    if (!body.status || !["confirmed", "cancelled"].includes(body.status)) {
      console.error("❌ 유효하지 않은 상태:", body.status);
      console.groupEnd();
      return NextResponse.json(
        { error: "유효하지 않은 주문 상태입니다." },
        { status: 400 },
      );
    }

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // 주문 정보 조회
    const { data: order, error: selectError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (selectError || !order) {
      console.error("❌ 주문 조회 실패:", selectError);
      console.groupEnd();
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 도매점(vendor)만 주문 상태 변경 가능
    if (order.vendor_id !== userId) {
      console.error("❌ 권한 없음: 본인이 판매한 상품의 주문이 아닙니다.");
      console.groupEnd();
      return NextResponse.json(
        { error: "본인이 판매한 상품의 주문만 상태를 변경할 수 있습니다." },
        { status: 403 },
      );
    }

    // pending 상태가 아니면 변경 불가
    if (order.status !== "pending") {
      console.error("❌ 상태 변경 불가: 이미 처리된 주문입니다.");
      console.groupEnd();
      return NextResponse.json(
        { error: "이미 처리된 주문은 상태를 변경할 수 없습니다." },
        { status: 400 },
      );
    }

    console.log("✅ 권한 확인 완료");

    // 주문 상태 변경
    const newStatus: OrderStatus = body.status;
    const updateData: Partial<Order> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    console.log("💾 수정할 데이터:", updateData);

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ 주문 상태 변경 실패:", updateError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "주문 상태 변경에 실패했습니다.",
          details: updateError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ 주문 상태 변경 성공:", updatedOrder);
    console.groupEnd();

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("❌ 주문 상태 변경 API 에러:", error);
    return NextResponse.json(
      {
        error: "주문 상태 변경 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
