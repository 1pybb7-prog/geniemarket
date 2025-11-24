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
  // 등급별 색상 및 배지 스타일
  const getGradeStyle = (grade?: string) => {
    if (!grade) return { color: "text-gray-600", bg: "bg-gray-100", label: "일반" };
    
    const normalizedGrade = grade.toLowerCase();
    
    // 특상, 특등급
    if (normalizedGrade.includes("특상") || normalizedGrade.includes("특등")) {
      return { color: "text-purple-700", bg: "bg-purple-100", label: grade };
    }
    // 상품, 상
    if (normalizedGrade.includes("상품") || normalizedGrade === "상") {
      return { color: "text-green-700", bg: "bg-green-100", label: grade };
    }
    // 중품, 중
    if (normalizedGrade.includes("중품") || normalizedGrade === "중") {
      return { color: "text-yellow-700", bg: "bg-yellow-100", label: grade };
    }
    // 하품, 하
    if (normalizedGrade.includes("하품") || normalizedGrade === "하") {
      return { color: "text-red-700", bg: "bg-red-100", label: grade };
    }
    
    return { color: "text-gray-600", bg: "bg-gray-100", label: grade };
  };

  const gradeStyle = getGradeStyle(marketPrice.grade);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent className="p-4 space-y-2">
        {/* 시장명 및 등급 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{marketPrice.market_name}</h3>
          {marketPrice.grade && (
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${gradeStyle.color} ${gradeStyle.bg} border ${gradeStyle.color.replace("text-", "border-")}`}
            >
              {gradeStyle.label}
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
          <div className="flex items-center gap-2 text-sm pt-2 border-t">
            <span className="text-gray-600 font-medium">품질 등급:</span>
            <span
              className={`font-bold ${gradeStyle.color} px-2 py-1 rounded ${gradeStyle.bg}`}
            >
              {gradeStyle.label}
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
