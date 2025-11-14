"use client";

/**
 * @file components/market-prices/MarketPriceCard.tsx
 * @description 공영시장 시세 카드 컴포넌트
 *
 * 이 컴포넌트는 가격 비교 페이지에서 공영시장 시세를 표시하는 카드입니다.
 *
 * 주요 기능:
 * 1. 시장명 표시
 * 2. 가격 표시
 * 3. 등급 표시 (상품, 중품, 하품)
 * 4. 날짜 표시
 *
 * 핵심 구현 로직:
 * - 공영시장 시세 정보 표시
 * - 등급별 색상 구분
 *
 * @dependencies
 * - @/components/ui: shadcn/ui 컴포넌트
 * - lucide-react: 아이콘
 *
 * @see {@link docs/PRD.md} - 가격 비교 페이지 명세
 * @see {@link docs/TODO.md} - TODO 724-732 라인
 */

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface MarketPrice {
  market_name: string;
  price: number;
  grade?: string;
  date: string;
  unit?: string; // 단위 정보
  product_name?: string; // 상품명
}

interface MarketPriceCardProps {
  marketPrice: MarketPrice;
}

export function MarketPriceCard({ marketPrice }: MarketPriceCardProps) {
  // 등급별 색상
  const getGradeColor = (grade?: string) => {
    if (!grade) return "text-gray-600";
    if (grade.includes("상품")) return "text-green-600";
    if (grade.includes("중품")) return "text-yellow-600";
    if (grade.includes("하품")) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent className="p-4 space-y-2">
        {/* 시장명 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{marketPrice.market_name}</h3>
          {marketPrice.grade && (
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${getGradeColor(
                marketPrice.grade,
              )} bg-opacity-10`}
            >
              {marketPrice.grade}
            </span>
          )}
        </div>

        {/* 상품명 */}
        {marketPrice.product_name && (
          <p className="text-sm text-gray-700 font-medium">
            {marketPrice.product_name}
          </p>
        )}

        {/* 가격 및 단위 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              {marketPrice.price.toLocaleString()}원
            </span>
          </div>
          {marketPrice.unit && (
            <p className="text-sm text-gray-500 ml-7">
              단위: {marketPrice.unit}
            </p>
          )}
        </div>

        {/* 등급 정보 (명확히 표시) */}
        {marketPrice.grade && marketPrice.grade !== "일반" && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">품질 등급:</span>
            <span
              className={`font-semibold ${getGradeColor(marketPrice.grade)}`}
            >
              {marketPrice.grade}
            </span>
          </div>
        )}

        {/* 날짜 */}
        <p className="text-sm text-gray-500">
          거래일:{" "}
          {new Date(marketPrice.date).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </CardContent>
    </Card>
  );
}
