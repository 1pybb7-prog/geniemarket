"use client";

/**
 * @file app/(vendor)/vendor/orders/page.tsx
 * @description 도매점 주문 관리 페이지
 *
 * 이 페이지는 도매점이 들어온 주문을 관리하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 들어온 주문 목록 표시
 * 2. 주문 카드 형태로 표시 (주문 번호, 상품명, 수량, 총 금액, 소매점 정보, 주문 상태)
 * 3. 주문 상태 변경 (확인, 취소)
 * 4. 주문 상세 보기
 *
 * 핵심 구현 로직:
 * - Clerk useUser 훅으로 사용자 인증 확인
 * - API Route로 주문 목록 조회 (type=vendor)
 * - OrderCard 컴포넌트로 표시
 * - 주문 상태 변경 API 호출
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증
 * - next/navigation: 라우팅
 * - @/components/orders/OrderCard: 주문 카드 컴포넌트
 * - @/lib/types: Order
 *
 * @see {@link docs/PRD.md} - 도매점 주문 관리 페이지 명세
 * @see {@link docs/TODO.md} - TODO 846-877 라인
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/lib/types";
import { OrderCard } from "@/components/orders/OrderCard";

export default function VendorOrdersPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // 인증 확인
  useEffect(() => {
    if (isLoaded && !user) {
      console.log("❌ 로그인이 필요합니다.");
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

  // 주문 목록 조회
  useEffect(() => {
    if (!user || !isLoaded) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        console.group("📋 주문 목록 조회 시작");

        const response = await fetch("/api/orders?type=vendor");
        const result = await response.json();

        if (!response.ok) {
          console.error("❌ 주문 목록 조회 실패:", result);
          throw new Error(result.error || "주문 목록 조회에 실패했습니다.");
        }

        console.log("✅ 주문 목록 조회 성공:", result);
        console.groupEnd();

        setOrders(result.orders || []);
      } catch (error) {
        console.error("❌ 주문 목록 조회 에러:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "주문 목록 조회에 실패했습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, isLoaded]);

  // 주문 상태 변경
  const handleStatusChange = async (
    orderId: string,
    status: "confirmed" | "cancelled",
  ) => {
    try {
      setUpdatingOrderId(orderId);
      console.group(`📝 주문 상태 변경 시작: ${status}`);
      console.log("주문 ID:", orderId);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ 주문 상태 변경 실패:", result);
        throw new Error(result.error || "주문 상태 변경에 실패했습니다.");
      }

      console.log("✅ 주문 상태 변경 성공:", result);
      console.groupEnd();

      toast.success(
        status === "confirmed"
          ? "주문이 확인되었습니다."
          : "주문이 취소되었습니다.",
      );

      // 목록 새로고침
      router.refresh();
      const refreshResponse = await fetch("/api/orders?type=vendor");
      const refreshResult = await refreshResponse.json();
      if (refreshResponse.ok) {
        setOrders(refreshResult.orders || []);
      }
    } catch (error) {
      console.error("❌ 주문 상태 변경 에러:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "주문 상태 변경에 실패했습니다.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // 로딩 중
  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 로그인 안 됨
  if (!user) {
    return null; // useEffect에서 리다이렉트 처리
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">주문 관리</h1>
        </div>
        <p className="text-gray-600">들어온 주문을 확인하고 관리하세요.</p>
      </div>

      {/* 주문 목록 */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">들어온 주문이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/vendor/orders/${order.id}`}>
                      <OrderCard order={order} />
                    </Link>
                  </div>
                  {/* 주문 상태 변경 버튼 */}
                  {order.status === "pending" && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(order.id, "confirmed")
                        }
                        disabled={updatingOrderId === order.id}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        확인
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(order.id, "cancelled")
                        }
                        disabled={updatingOrderId === order.id}
                      >
                        <X className="w-4 h-4 mr-2" />
                        취소
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
