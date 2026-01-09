"use client";

/**
 * @file app/(main)/orders/page.tsx
 * @description 소매점 주문 내역 페이지
 *
 * 이 페이지는 소매점이 주문한 내역을 확인하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 주문 목록 표시
 * 2. 주문 카드 형태로 표시 (주문 번호, 상품명, 수량, 총 금액, 주문 상태, 주문 날짜)
 * 3. 상태별 필터 (대기중, 확인됨, 취소)
 * 4. 주문 상세 보기
 *
 * 핵심 구현 로직:
 * - Clerk useUser 훅으로 사용자 인증 확인
 * - API Route로 주문 목록 조회
 * - OrderCard 컴포넌트로 표시
 * - 상태별 필터링
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증
 * - next/navigation: 라우팅
 * - @/components/orders/OrderCard: 주문 카드 컴포넌트
 * - @/lib/types: Order
 *
 * @see {@link docs/PRD.md} - 주문 내역 페이지 명세
 * @see {@link docs/TODO.md} - TODO 818-844 라인
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/lib/types";
import { OrderCard } from "@/components/orders/OrderCard";

type OrderStatus = "pending" | "confirmed" | "cancelled";

export default function OrdersPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

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

        const response = await fetch("/api/orders?type=retailer");
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

  // 필터링된 주문 목록
  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

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
          <h1 className="text-3xl font-bold">주문 내역</h1>
        </div>
        <p className="text-gray-600">주문한 상품의 내역을 확인하세요.</p>
      </div>

      {/* 필터 */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
        >
          전체
        </Button>
        <Button
          variant={statusFilter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("pending")}
        >
          대기중
        </Button>
        <Button
          variant={statusFilter === "confirmed" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("confirmed")}
        >
          확인됨
        </Button>
        <Button
          variant={statusFilter === "cancelled" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("cancelled")}
        >
          취소
        </Button>
      </div>

      {/* 주문 목록 */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              {statusFilter === "all"
                ? "주문 내역이 없습니다."
                : "해당 상태의 주문이 없습니다."}
            </p>
            {statusFilter !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                전체 보기
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <OrderCard order={order} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
