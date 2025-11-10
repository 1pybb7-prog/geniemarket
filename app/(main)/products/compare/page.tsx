"use client";

/**
 * @file app/(main)/products/compare/page.tsx
 * @description 가격 비교 페이지
 *
 * 이 페이지는 소매점이 특정 상품의 가격을 비교하고 주문할 수 있는 페이지입니다.
 *
 * 주요 기능:
 * 1. 표준 상품명 표시
 * 2. 도매점별 가격 비교 (익명화)
 * 3. 공영시장 시세 표시
 * 4. 주문하기 기능
 *
 * 핵심 구현 로직:
 * - URL 쿼리 파라미터에서 상품명 추출
 * - 가격 비교 API 호출
 * - PriceCompareCard와 MarketPriceCard 컴포넌트로 표시
 * - 주문하기 모달 열기
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증
 * - next/navigation: 라우팅
 * - @/components/products/PriceCompareCard: 가격 비교 카드
 * - @/components/market-prices/MarketPriceCard: 시세 카드
 * - @/lib/types: 타입 정의
 *
 * @see {@link docs/PRD.md} - 가격 비교 페이지 명세
 * @see {@link docs/TODO.md} - TODO 706-746 라인
 */

import { useState, useEffect, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { PriceCompareCard } from "@/components/products/PriceCompareCard";
import { MarketPriceCard } from "@/components/market-prices/MarketPriceCard";
import { OrderModal } from "@/components/orders/OrderModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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

interface MarketPrice {
  market_name: string;
  price: number;
  grade?: string;
  date: string;
}

interface CompareData {
  standard_name: string;
  category?: string;
  unit?: string;
  vendor_prices: VendorPrice[];
  market_prices: MarketPrice[];
  average_market_price: number;
}

// useSearchParams를 사용하는 내부 컴포넌트
function ComparePageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedVendorPrice, setSelectedVendorPrice] =
    useState<VendorPrice | null>(null);
  const productName = searchParams.get("product");

  // 인증 확인
  useEffect(() => {
    if (isLoaded && !user) {
      console.log("❌ 로그인이 필요합니다.");
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

  // 가격 비교 데이터 조회
  useEffect(() => {
    if (!user || !isLoaded || !productName) return;

    const fetchCompareData = async () => {
      try {
        setLoading(true);
        console.group("💰 가격 비교 데이터 조회 시작");
        console.log("상품명:", productName);

        const response = await fetch(
          `/api/products/compare?product=${encodeURIComponent(productName)}`,
        );
        const result = await response.json();

        if (!response.ok) {
          console.error("❌ 가격 비교 데이터 조회 실패:", result);
          throw new Error(
            result.error || "가격 비교 데이터 조회에 실패했습니다.",
          );
        }

        console.log("✅ 가격 비교 데이터 조회 성공:", result);
        console.groupEnd();

        setCompareData(result);
      } catch (error) {
        console.error("❌ 가격 비교 데이터 조회 에러:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "가격 비교 데이터 조회에 실패했습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompareData();
  }, [user, isLoaded, productName]);

  // 주문하기 핸들러
  const handleOrder = (vendorPrice: VendorPrice) => {
    console.group("🛒 주문하기 시작");
    console.log("상품 ID:", vendorPrice.raw_product_id);
    console.log("도매점 ID:", vendorPrice.vendor_id);
    console.log("가격:", vendorPrice.price);
    console.groupEnd();

    setSelectedVendorPrice(vendorPrice);
    setOrderModalOpen(true);
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

  // 상품명이 없으면 에러
  if (!productName) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-600 mb-4">상품명이 지정되지 않았습니다.</p>
            <Link href="/products">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                상품 검색으로 돌아가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 데이터가 없으면 에러
  if (!compareData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-600 mb-4">
              가격 비교 데이터를 불러올 수 없습니다.
            </p>
            <Link href="/products">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                상품 검색으로 돌아가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 최저가 찾기
  const lowestPrice =
    compareData.vendor_prices.length > 0
      ? Math.min(...compareData.vendor_prices.map((p) => p.price))
      : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-6">
        <Link href="/products">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            상품 검색으로 돌아가기
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">{compareData.standard_name}</h1>
        {compareData.category && (
          <p className="text-gray-600">카테고리: {compareData.category}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 도매점 가격 비교 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>도매점 가격 비교</CardTitle>
            </CardHeader>
            <CardContent>
              {compareData.vendor_prices.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  등록된 도매점이 없습니다.
                </p>
              ) : (
                <div className="space-y-4">
                  {compareData.vendor_prices.map((vendorPrice) => (
                    <PriceCompareCard
                      key={vendorPrice.raw_product_id}
                      vendorPrice={vendorPrice}
                      isLowest={vendorPrice.price === lowestPrice}
                      onOrder={handleOrder}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 공영시장 시세 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-blue-600" />
                오늘의 공영시장 시세
              </CardTitle>
            </CardHeader>
            <CardContent>
              {compareData.market_prices.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  시세 정보가 없습니다.
                </p>
              ) : (
                <div className="space-y-4">
                  {compareData.market_prices.map((marketPrice, index) => (
                    <MarketPriceCard key={index} marketPrice={marketPrice} />
                  ))}
                  {compareData.average_market_price > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900 font-semibold mb-1">
                        평균 경매가
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {compareData.average_market_price.toLocaleString()}원
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 주문 모달 */}
      <OrderModal
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        vendorPrice={selectedVendorPrice}
      />
    </div>
  );
}

// Suspense로 감싼 메인 컴포넌트
export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}
