"use client";

/**
 * @file components/products/PriceCompareCard.tsx
 * @description 가격 비교 카드 컴포넌트
 *
 * 이 컴포넌트는 가격 비교 페이지에서 도매점별 가격을 표시하는 카드입니다.
 *
 * 주요 기능:
 * 1. 도매점 익명 표시 ("도매점 A", "도매점 B" 등)
 * 2. 가격 표시
 * 3. 단위 표시
 * 4. 재고 표시
 * 5. "주문하기" 버튼
 *
 * 핵심 구현 로직:
 * - 도매점 정보 익명화 표시
 * - 가격 낮은 순으로 정렬
 * - 최저가 강조 표시
 * - 주문하기 모달 열기
 *
 * @dependencies
 * - @/components/ui: shadcn/ui 컴포넌트
 * - lucide-react: 아이콘
 *
 * @see {@link docs/PRD.md} - 가격 비교 페이지 명세
 * @see {@link docs/TODO.md} - TODO 714-722 라인
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, TrendingDown, Package } from "lucide-react";

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

interface PriceCompareCardProps {
  vendorPrice: VendorPrice;
  isLowest: boolean;
  onOrder: (vendorPrice: VendorPrice) => void;
}

export function PriceCompareCard({
  vendorPrice,
  isLowest,
  onOrder,
}: PriceCompareCardProps) {
  return (
    <Card
      className={`overflow-hidden transition-shadow hover:shadow-lg ${
        isLowest ? "border-green-500 border-2" : ""
      }`}
    >
      <CardContent className="p-4 space-y-3">
        {/* 도매점 이름 및 최저가 뱃지 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{vendorPrice.vendor_name}</h3>
            {isLowest && (
              <span className="px-2 py-1 text-xs font-semibold text-white bg-green-600 rounded-full">
                최저가
              </span>
            )}
          </div>
        </div>

        {/* 원본 상품명 */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {vendorPrice.original_name}
        </p>

        {/* 가격 */}
        <div className="flex items-center gap-2">
          <TrendingDown
            className={`w-5 h-5 ${isLowest ? "text-green-600" : "text-gray-400"}`}
          />
          <span
            className={`text-2xl font-bold ${
              isLowest ? "text-green-600" : "text-gray-900"
            }`}
          >
            {vendorPrice.price.toLocaleString()}원
          </span>
          <span className="text-sm text-gray-600">/{vendorPrice.unit}</span>
        </div>

        {/* 재고 */}
        <div className="flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-gray-400" />
          <span
            className={
              vendorPrice.stock > 0 ? "text-green-600" : "text-red-600"
            }
          >
            {vendorPrice.stock > 0
              ? `재고 ${vendorPrice.stock}개`
              : "재고 없음"}
          </span>
        </div>

        {/* 주문하기 버튼 */}
        <Button
          className="w-full"
          size="lg"
          onClick={() => onOrder(vendorPrice)}
          disabled={vendorPrice.stock === 0}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          주문하기
        </Button>
      </CardContent>
    </Card>
  );
}
