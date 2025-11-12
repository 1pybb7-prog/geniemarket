"use client";

/**
 * @file components/products/ProductCard.tsx
 * @description 상품 카드 컴포넌트
 *
 * 이 컴포넌트는 소매점이 상품을 검색할 때 표시되는 상품 카드입니다.
 *
 * 주요 기능:
 * 1. 상품 이미지 표시 (썸네일)
 * 2. 표준 상품명 표시
 * 3. 최저가 표시
 * 4. "가격 비교하기" 버튼
 *
 * 핵심 구현 로직:
 * - 상품 정보를 카드 형태로 표시
 * - 최저가 강조 표시
 * - 가격 비교 페이지로 이동
 *
 * @dependencies
 * - @/components/ui: shadcn/ui 컴포넌트
 * - @/lib/types: LowestPrice
 * - next/navigation: 라우팅
 * - lucide-react: 아이콘
 *
 * @see {@link docs/PRD.md} - 상품 검색 페이지 명세
 * @see {@link docs/TODO.md} - TODO 673-679 라인
 */

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, ShoppingCart, TrendingDown } from "lucide-react";
import type { LowestPrice } from "@/lib/types";

interface ProductCardProps {
  product: LowestPrice;
  imageUrl?: string;
}

export function ProductCard({ product, imageUrl }: ProductCardProps) {
  const compareUrl = `/products/compare?product=${encodeURIComponent(
    product.standard_name,
  )}`;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        {/* 상품 이미지 */}
        {imageUrl ? (
          <div className="relative w-full h-48 overflow-hidden">
            {(() => {
              console.group("🖼️ 상품 카드 이미지 렌더링");
              console.log("상품명:", product.standard_name);
              console.log("이미지 URL:", imageUrl);
              console.groupEnd();
              return null;
            })()}
            <Image
              src={imageUrl}
              alt={product.standard_name}
              fill
              className="object-cover"
              unoptimized
              priority={false}
            />
          </div>
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-gray-100">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {/* 상품명 */}
        <CardTitle className="text-lg line-clamp-2 min-h-[3.5rem]">
          {product.standard_name}
        </CardTitle>

        {/* 최저가 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">최저가</p>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {product.lowest_price.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* 상품 개수 */}
        {product.product_count > 1 && (
          <p className="text-sm text-gray-500">
            {product.product_count}개 도매점에서 판매 중
          </p>
        )}

        {/* 가격 비교하기 버튼 */}
        <Link href={compareUrl} className="block">
          <Button className="w-full" size="lg">
            <ShoppingCart className="w-4 h-4 mr-2" />
            가격 비교하기
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
