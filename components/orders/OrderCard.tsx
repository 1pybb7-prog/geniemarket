"use client";

/**
 * @file components/orders/OrderCard.tsx
 * @description 주문 카드 컴포넌트
 *
 * 이 컴포넌트는 주문 목록에서 주문 정보를 표시하는 카드입니다.
 *
 * 주요 기능:
 * 1. 주문 번호 표시
 * 2. 상품명 표시
 * 3. 수량, 총 금액 표시
 * 4. 주문 상태 표시 (뱃지)
 * 5. 주문 날짜 표시
 *
 * 핵심 구현 로직:
 * - 주문 정보를 카드 형태로 표시
 * - 상태별 색상 구분
 * - 클릭 시 주문 상세 페이지로 이동
 *
 * @dependencies
 * - @/components/ui: shadcn/ui 컴포넌트
 * - @/lib/types: Order
 * - lucide-react: 아이콘
 *
 * @see {@link docs/PRD.md} - 주문 내역 페이지 명세
 * @see {@link docs/TODO.md} - TODO 824-829 라인
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Package, DollarSign } from "lucide-react";
import type { Order } from "@/lib/types";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  // 상태별 색상 및 텍스트
  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
            대기중
          </span>
        );
      case "confirmed":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
            확인됨
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
            취소
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-50 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            주문 #{order.id.slice(0, 8)}
          </CardTitle>
          {getStatusBadge(order.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 상품 정보 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="w-4 h-4" />
          <span>상품 ID: {order.product_id.slice(0, 8)}</span>
        </div>

        {/* 수량 및 총 금액 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>수량: {order.quantity}개</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-lg font-bold">
              {order.total_price.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 주문 날짜 */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(order.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
