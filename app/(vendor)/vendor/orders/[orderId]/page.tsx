"use client";

/**
 * @file app/(vendor)/vendor/orders/[orderId]/page.tsx
 * @description 도매점 주문 상세 페이지
 *
 * 이 페이지는 도매점이 들어온 주문의 상세 정보를 확인하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 주문 상세 정보 표시
 * 2. 상품 정보 표시
 * 3. 소매점 연락처 표시
 * 4. 배송지 정보 표시
 * 5. 요청사항 표시
 * 6. 주문 상태 변경 (확인, 취소)
 *
 * 핵심 구현 로직:
 * - Clerk useUser 훅으로 사용자 인증 확인
 * - API Route로 주문 상세 조회
 * - 주문 정보 표시
 * - 주문 상태 변경 기능
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증
 * - next/navigation: 라우팅
 * - @/components/ui: shadcn/ui 컴포넌트
 * - @/lib/types: Order
 *
 * @see {@link docs/PRD.md} - 도매점 주문 상세 페이지 명세
 * @see {@link docs/TODO.md} - TODO 872-877 라인
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Package,
  DollarSign,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface OrderDetail {
  id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_phone?: string;
  vendor_id: string;
  vendor_name: string;
  vendor_phone?: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled";
  delivery_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function VendorOrderDetailPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 인증 확인
  useEffect(() => {
    if (isLoaded && !user) {
      console.log("❌ 로그인이 필요합니다.");
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

  // 주문 상세 조회
  useEffect(() => {
    if (!user || !isLoaded || !orderId) return;

    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        console.group("📋 주문 상세 조회 시작");
        console.log("주문 ID:", orderId);

        const response = await fetch(`/api/orders/${orderId}`);
        const result = await response.json();

        if (!response.ok) {
          console.error("❌ 주문 상세 조회 실패:", result);
          throw new Error(result.error || "주문 상세 조회에 실패했습니다.");
        }

        console.log("✅ 주문 상세 조회 성공:", result);
        console.groupEnd();

        setOrder(result);
      } catch (error) {
        console.error("❌ 주문 상세 조회 에러:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "주문 상세 조회에 실패했습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [user, isLoaded, orderId, router]);

  // 주문 상태 변경
  const handleStatusChange = async (status: "confirmed" | "cancelled") => {
    if (!order) return;

    const actionText = status === "confirmed" ? "확인" : "취소";
    if (!confirm(`정말로 이 주문을 ${actionText}하시겠습니까?`)) {
      return;
    }

    try {
      setUpdating(true);
      console.group(`📝 주문 ${actionText} 시작`);
      console.log("주문 ID:", order.id);
      console.log("상태:", status);

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`❌ 주문 ${actionText} 실패:`, result);
        throw new Error(result.error || `주문 ${actionText}에 실패했습니다.`);
      }

      console.log(`✅ 주문 ${actionText} 성공:`, result);
      console.groupEnd();

      toast.success(`주문이 ${actionText}되었습니다.`);
      router.push("/vendor/orders");
      router.refresh();
    } catch (error) {
      console.error(`❌ 주문 ${actionText} 에러:`, error);
      toast.error(
        error instanceof Error
          ? error.message
          : `주문 ${actionText}에 실패했습니다.`,
      );
    } finally {
      setUpdating(false);
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

  // 주문 정보가 없으면 에러
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              주문 정보를 불러올 수 없습니다.
            </p>
            <Link href="/vendor/orders">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                주문 관리로 돌아가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 상태별 색상
  const getStatusColor = (status: OrderDetail["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "confirmed":
        return "bg-green-50 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusText = (status: OrderDetail["status"]) => {
    switch (status) {
      case "pending":
        return "대기중";
      case "confirmed":
        return "확인됨";
      case "cancelled":
        return "취소";
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 헤더 */}
      <div className="mb-6">
        <Link href="/vendor/orders">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            주문 관리로 돌아가기
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">주문 상세</h1>
            <p className="text-gray-600">주문 번호: {order.id.slice(0, 8)}</p>
          </div>
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(
              order.status,
            )}`}
          >
            {getStatusText(order.status)}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* 상품 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              상품 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.product_image && (
              <div className="w-full max-w-xs">
                <img
                  src={order.product_image}
                  alt={order.product_name}
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}
            <div>
              <p className="text-lg font-semibold mb-2">{order.product_name}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>수량: {order.quantity}개</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />총 금액:{" "}
                  {order.total_price.toLocaleString()}원
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 소매점 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              소매점 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">상호명</p>
              <p className="font-semibold">{order.buyer_name}</p>
            </div>
            {order.buyer_phone && (
              <div>
                <p className="text-sm text-gray-600 mb-1">전화번호</p>
                <p className="font-semibold">{order.buyer_phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 주문 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              주문 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 w-24">주문 일시:</span>
              <span>
                {new Date(order.created_at).toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {order.delivery_address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-gray-600">배송지: </span>
                  <span>{order.delivery_address}</span>
                </div>
              </div>
            )}
            {order.notes && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-gray-600">요청사항: </span>
                  <span>{order.notes}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 주문 상태 변경 버튼 (대기중일 때만) */}
        {order.status === "pending" && (
          <div className="flex justify-end gap-2">
            <Button
              variant="destructive"
              onClick={() => handleStatusChange("cancelled")}
              disabled={updating}
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  취소 중...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  주문 취소
                </>
              )}
            </Button>
            <Button
              variant="default"
              onClick={() => handleStatusChange("confirmed")}
              disabled={updating}
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  확인 중...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  주문 확인
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
