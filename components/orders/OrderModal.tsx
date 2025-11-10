"use client";

/**
 * @file components/orders/OrderModal.tsx
 * @description 주문하기 모달 컴포넌트
 *
 * 이 컴포넌트는 소매점이 상품을 주문할 때 사용하는 모달입니다.
 *
 * 주요 기능:
 * 1. 주문 정보 표시 (상품명, 단가)
 * 2. 수량 입력
 * 3. 총 금액 계산
 * 4. 배송지 입력 (선택 사항)
 * 5. 요청사항 입력
 * 6. 주문서 전송
 *
 * 핵심 구현 로직:
 * - React Hook Form + Zod로 폼 검증
 * - 수량 변경 시 총 금액 자동 계산
 * - 주문 생성 API 호출
 * - 성공 시 모달 닫기 및 주문 내역 페이지로 이동
 *
 * @dependencies
 * - react-hook-form: 폼 관리 및 유효성 검사
 * - zod: 스키마 검증
 * - @/components/ui: shadcn/ui 컴포넌트
 * - @/lib/types: 타입 정의
 *
 * @see {@link docs/PRD.md} - 주문하기 기능 명세
 * @see {@link docs/TODO.md} - TODO 779-792 라인
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

// 주문 폼 스키마
const orderFormSchema = z.object({
  quantity: z
    .number()
    .min(1, "수량은 1개 이상이어야 합니다.")
    .max(999999, "수량은 999,999개 이하여야 합니다."),
  delivery_address: z.string().optional(),
  notes: z.string().optional(),
});

export type OrderFormData = z.infer<typeof orderFormSchema>;

interface VendorPrice {
  raw_product_id: string;
  vendor_id: string;
  vendor_name: string;
  original_name: string;
  price: number;
  unit: string;
  stock: number;
  image_url?: string;
}

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorPrice: VendorPrice | null;
}

export function OrderModal({
  open,
  onOpenChange,
  vendorPrice,
}: OrderModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      quantity: 1,
      delivery_address: "",
      notes: "",
    },
  });

  const quantity = watch("quantity");

  // 수량 변경 시 총 금액 계산
  useEffect(() => {
    if (vendorPrice && quantity) {
      const calculatedTotal = vendorPrice.price * quantity;
      setTotalPrice(calculatedTotal);
      console.log("💰 총 금액 계산:", {
        단가: vendorPrice.price,
        수량: quantity,
        총금액: calculatedTotal,
      });
    }
  }, [vendorPrice, quantity]);

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (open && vendorPrice) {
      reset({
        quantity: 1,
        delivery_address: "",
        notes: "",
      });
      setTotalPrice(vendorPrice.price);
    }
  }, [open, vendorPrice, reset]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setTotalPrice(0);
    }
    onOpenChange(newOpen);
  };

  // 폼 제출
  const onSubmit = async (data: OrderFormData) => {
    if (!vendorPrice) {
      toast.error("상품 정보가 없습니다.");
      return;
    }

    // 재고 확인
    if (vendorPrice.stock < data.quantity) {
      toast.error("재고가 부족합니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      console.group("🛒 주문 생성 시작");
      console.log("상품 ID:", vendorPrice.raw_product_id);
      console.log("수량:", data.quantity);
      console.log("총 금액:", totalPrice);
      console.log("배송지:", data.delivery_address);
      console.log("요청사항:", data.notes);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: vendorPrice.raw_product_id,
          quantity: data.quantity,
          total_price: totalPrice,
          delivery_address: data.delivery_address || undefined,
          notes: data.notes || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ 주문 생성 실패:", result);
        throw new Error(result.error || "주문 생성에 실패했습니다.");
      }

      console.log("✅ 주문 생성 성공:", result);
      console.groupEnd();

      toast.success("주문이 완료되었습니다.");
      handleOpenChange(false);
      router.push("/orders");
      router.refresh();
    } catch (error) {
      console.error("❌ 주문 생성 에러:", error);
      toast.error(
        error instanceof Error ? error.message : "주문 생성에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!vendorPrice) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>주문하기</DialogTitle>
          <DialogDescription>
            주문 정보를 확인하고 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 상품 정보 */}
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <p className="font-semibold">{vendorPrice.original_name}</p>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                단가: {vendorPrice.price.toLocaleString()}원 /{" "}
                {vendorPrice.unit}
              </span>
              <span>재고: {vendorPrice.stock}개</span>
            </div>
          </div>

          {/* 수량 입력 */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              수량 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={vendorPrice.stock}
              {...register("quantity", { valueAsNumber: true })}
              className={errors.quantity ? "border-red-500" : ""}
            />
            {errors.quantity && (
              <p className="text-sm text-red-500">{errors.quantity.message}</p>
            )}
          </div>

          {/* 총 금액 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-900">
                총 금액
              </span>
              <span className="text-2xl font-bold text-blue-600">
                {totalPrice.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 배송지 입력 */}
          <div className="space-y-2">
            <Label htmlFor="delivery_address">
              배송지 <span className="text-gray-500">(선택 사항)</span>
            </Label>
            <Textarea
              id="delivery_address"
              {...register("delivery_address")}
              placeholder="배송지를 입력해주세요"
              rows={2}
            />
          </div>

          {/* 요청사항 입력 */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              요청사항 <span className="text-gray-500">(선택 사항)</span>
            </Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="요청사항을 입력해주세요"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  주문 중...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  주문하기
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
