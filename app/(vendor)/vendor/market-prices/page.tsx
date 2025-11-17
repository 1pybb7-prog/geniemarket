"use client";

/**
 * @file app/(vendor)/vendor/market-prices/page.tsx
 * @description 도매점 시세 참고 페이지
 *
 * 이 페이지는 도매점이 자신이 등록한 상품의 공영시장 시세를 비교하고 가격 경쟁력을 분석하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 내 상품 목록 표시
 * 2. 각 상품의 공영시장 시세 조회
 * 3. 내 가격 vs 시세 비교
 * 4. 가격 경쟁력 분석
 *
 * 핵심 구현 로직:
 * - Clerk useUser 훅으로 사용자 인증 확인
 * - API Route로 내 상품 목록 조회
 * - 각 상품의 표준 상품명으로 시세 조회
 * - 가격 비교 및 경쟁력 분석
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증
 * - next/navigation: 라우팅
 * - @/components/market-prices/MarketPriceCard: 시세 카드 컴포넌트
 * - @/lib/types: 타입 정의
 *
 * @see {@link docs/PRD.md} - 도매점 시세 참고 페이지 명세
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { MarketPriceCard } from "@/components/market-prices/MarketPriceCard";
import { SearchBar } from "@/components/layout/SearchBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Loader2,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import type { ProductRaw, ProductStandard } from "@/lib/types";

interface ProductWithMapping extends ProductRaw {
  product_mapping?: Array<{
    id: string;
    standard_product_id: string;
    is_verified: boolean;
    products_standard: ProductStandard | null;
  }>;
}

interface MarketPrice {
  market_name: string;
  price: number;
  grade?: string;
  date: string;
}

interface ProductWithMarketPrice extends ProductWithMapping {
  marketPrices?: MarketPrice[];
  averageMarketPrice?: number;
  priceCompetitiveness?: "high" | "medium" | "low" | "unknown";
}

export default function VendorMarketPricesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithMarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMarketPrices, setLoadingMarketPrices] = useState<
    Record<string, boolean>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    productName: string;
    marketPrices: MarketPrice[];
    averagePrice: number;
  } | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // 인증 확인
  useEffect(() => {
    if (isLoaded && !user) {
      console.log("❌ 로그인이 필요합니다.");
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

  // 상품 목록 조회
  useEffect(() => {
    if (!user || !isLoaded) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.group("📦 내 상품 목록 조회 시작");

        const response = await fetch("/api/products?type=vendor");
        const result = await response.json();

        if (!response.ok) {
          console.error("❌ 상품 목록 조회 실패:", result);
          throw new Error(result.error || "상품 목록 조회에 실패했습니다.");
        }

        console.log("✅ 상품 목록 조회 성공:", result);
        setProducts(result.products || []);
        console.groupEnd();
      } catch (error) {
        console.error("❌ 상품 목록 조회 에러:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "상품 목록 조회에 실패했습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, isLoaded]);

  // 특정 상품의 시세 조회
  const fetchMarketPriceForProduct = async (product: ProductWithMapping) => {
    const mapping = product.product_mapping?.[0];
    const standardProduct = mapping?.products_standard;

    if (!standardProduct?.standard_name) {
      toast.warning(
        `${product.original_name}의 표준 상품명이 없어 시세를 조회할 수 없습니다.`,
      );
      return;
    }

    try {
      setLoadingMarketPrices((prev) => ({ ...prev, [product.id]: true }));
      console.group(`📊 ${product.original_name} 시세 조회 시작`);
      console.log("표준 상품명:", standardProduct.standard_name);

      const response = await fetch(
        `/api/market-prices?productName=${encodeURIComponent(standardProduct.standard_name)}`,
      );
      const result = await response.json();

      if (!response.ok) {
        console.error("❌ 시세 조회 실패:", result);
        throw new Error(result.error || "시세 조회에 실패했습니다.");
      }

      console.log("✅ 시세 조회 성공:", result);
      console.groupEnd();

      const marketPrices = result.prices || [];
      const averageMarketPrice = result.averagePrice || 0;

      // 가격 경쟁력 분석
      let priceCompetitiveness: "high" | "medium" | "low" | "unknown" =
        "unknown";
      if (averageMarketPrice > 0 && product.price > 0) {
        const priceDiff =
          ((product.price - averageMarketPrice) / averageMarketPrice) * 100;
        if (priceDiff <= -5) {
          priceCompetitiveness = "high"; // 시세보다 5% 이상 저렴
        } else if (priceDiff <= 5) {
          priceCompetitiveness = "medium"; // 시세와 비슷 (±5%)
        } else {
          priceCompetitiveness = "low"; // 시세보다 5% 이상 비쌈
        }
      }

      // 상품 목록 업데이트
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.id === product.id
            ? {
                ...p,
                marketPrices,
                averageMarketPrice,
                priceCompetitiveness,
              }
            : p,
        ),
      );
    } catch (error) {
      console.error("❌ 시세 조회 에러:", error);
      toast.error(
        error instanceof Error ? error.message : "시세 조회에 실패했습니다.",
      );
    } finally {
      setLoadingMarketPrices((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  // 모든 상품의 시세 일괄 조회
  const fetchAllMarketPrices = async () => {
    const productsWithStandardName = products.filter(
      (p) => p.product_mapping?.[0]?.products_standard?.standard_name,
    );

    if (productsWithStandardName.length === 0) {
      toast.warning("표준 상품명이 있는 상품이 없습니다.");
      return;
    }

    console.group("📊 모든 상품 시세 일괄 조회 시작");
    toast.info(
      `${productsWithStandardName.length}개 상품의 시세를 조회합니다...`,
    );

    for (const product of productsWithStandardName) {
      await fetchMarketPriceForProduct(product);
      // API 호출 제한을 고려하여 약간의 딜레이
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    console.groupEnd();
    toast.success("모든 상품의 시세 조회가 완료되었습니다.");
  };

  // 검색창으로 시세 조회
  const handleSearchMarketPrice = async () => {
    if (!searchQuery.trim()) {
      toast.info("상품명을 입력해주세요.");
      return;
    }

    try {
      setLoadingSearch(true);
      console.group("📊 시세 검색 시작");
      console.log("상품명:", searchQuery.trim());

      const apiUrl = `/api/market-prices?productName=${encodeURIComponent(searchQuery.trim())}`;
      console.log("🔗 API URL:", apiUrl);

      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (fetchError) {
        console.error("❌ Fetch 에러:", fetchError);
        throw new Error(
          "네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.",
        );
      }

      // 응답이 없거나 실패한 경우
      if (!response) {
        throw new Error("서버로부터 응답을 받지 못했습니다.");
      }

      console.log("📥 응답 상태:", response.status, response.statusText);

      // 응답 본문 파싱
      let result: any;
      try {
        const responseText = await response.text();
        console.log("📄 응답 본문 (처음 500자):", responseText.substring(0, 500));

        if (!responseText || responseText.trim() === "") {
          throw new Error("서버로부터 빈 응답을 받았습니다.");
        }

        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error("❌ JSON 파싱 실패:", parseError);
          console.error("📄 원본 응답:", responseText);
          throw new Error("서버 응답을 파싱할 수 없습니다.");
        }
      } catch (parseError) {
        if (parseError instanceof Error) {
          throw parseError;
        }
        throw new Error("응답 처리 중 오류가 발생했습니다.");
      }

      if (!response.ok) {
        console.error("❌ 시세 조회 실패:", result);
        const errorMessage =
          result?.error ||
          result?.details ||
          `서버 오류 (${response.status}): ${response.statusText}`;
        throw new Error(errorMessage);
      }

      console.log("✅ 시세 조회 성공:", result);
      console.groupEnd();

      const marketPrices = result.prices || [];
      const averagePrice = result.averagePrice || 0;

      setSearchResults({
        productName: searchQuery.trim(),
        marketPrices,
        averagePrice,
      });

      if (marketPrices.length === 0) {
        toast.warning("시세 정보가 없습니다.");
      } else {
        toast.success(`${marketPrices.length}개의 시세 정보를 찾았습니다.`);
      }
    } catch (error) {
      console.error("❌ 시세 조회 에러:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "시세 조회에 실패했습니다. 잠시 후 다시 시도해주세요.";
      toast.error(errorMessage);
      setSearchResults(null);
    } finally {
      setLoadingSearch(false);
    }
  };

  // 가격 경쟁력 아이콘 및 텍스트
  const getCompetitivenessDisplay = (
    competitiveness: "high" | "medium" | "low" | "unknown",
  ) => {
    switch (competitiveness) {
      case "high":
        return {
          icon: CheckCircle2,
          text: "경쟁력 높음",
          color: "text-green-600",
          bgColor: "bg-green-50",
        };
      case "medium":
        return {
          icon: AlertCircle,
          text: "보통",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
        };
      case "low":
        return {
          icon: XCircle,
          text: "경쟁력 낮음",
          color: "text-red-600",
          bgColor: "bg-red-50",
        };
      default:
        return {
          icon: AlertCircle,
          text: "분석 불가",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
        };
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
          <TrendingUp className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">시세 참고</h1>
        </div>
        <p className="text-gray-600">
          내 상품의 공영시장 시세를 확인하고 가격 경쟁력을 분석하세요.
        </p>
      </div>

      {/* 검색창 및 시세 조회 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">상품명으로 시세 조회</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchMarketPrice();
            }}
            className="flex gap-4"
          >
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSearchMarketPrice();
                  }
                }}
                placeholder="상품명을 입력하세요 (예: 청양고추, 사과, 배추)"
                noForm={true}
              />
            </div>
            <Button type="submit" disabled={loadingSearch}>
              {loadingSearch ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              시세 조회
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 검색 결과 */}
      {searchResults && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                &ldquo;{searchResults.productName}&rdquo; 시세 조회 결과
              </CardTitle>
              {searchResults.averagePrice > 0 && (
                <p className="text-sm text-gray-600">
                  평균: {searchResults.averagePrice.toLocaleString()}원
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {searchResults.marketPrices.length === 0 ? (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  시세 정보가 없습니다. 다른 상품명으로 시도해보세요.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.marketPrices.map((marketPrice, index) => (
                  <MarketPriceCard key={index} marketPrice={marketPrice} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 내 상품 목록 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">내 상품 시세 비교</h2>
        {products.length > 0 && (
          <Button onClick={fetchAllMarketPrices} variant="outline" size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            모든 상품 시세 조회
          </Button>
        )}
      </div>

      {/* 상품 목록 */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">등록된 상품이 없습니다.</p>
            <Button onClick={() => router.push("/vendor/products/new")}>
              상품 등록하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {products.map((product) => {
            const mapping = product.product_mapping?.[0];
            const standardProduct = mapping?.products_standard;
            const competitivenessDisplay = getCompetitivenessDisplay(
              product.priceCompetitiveness || "unknown",
            );
            const CompetitivenessIcon = competitivenessDisplay.icon;

            return (
              <Card key={product.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {product.original_name}
                      </CardTitle>
                      {standardProduct ? (
                        <p className="text-sm text-gray-600">
                          표준 상품명: {standardProduct.standard_name}
                        </p>
                      ) : (
                        <p className="text-sm text-yellow-600">
                          표준 상품명이 없습니다.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {product.priceCompetitiveness && (
                        <div
                          className={`flex items-center gap-1 px-3 py-1 rounded-full ${competitivenessDisplay.bgColor} ${competitivenessDisplay.color}`}
                        >
                          <CompetitivenessIcon className="w-4 h-4" />
                          <span className="text-xs font-semibold">
                            {competitivenessDisplay.text}
                          </span>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchMarketPriceForProduct(product)}
                        disabled={loadingMarketPrices[product.id]}
                      >
                        {loadingMarketPrices[product.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            시세 조회
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 내 가격 정보 */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">내 가격</p>
                      <p className="text-xl font-bold">
                        {product.price.toLocaleString()}원
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">단위</p>
                      <p className="text-sm font-medium">{product.unit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">재고</p>
                      <p
                        className={`text-sm font-medium ${
                          product.stock > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {product.stock > 0 ? `${product.stock}개` : "재고 없음"}
                      </p>
                    </div>
                  </div>

                  {/* 시세 정보 */}
                  {product.marketPrices && product.marketPrices.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">공영시장 시세</h3>
                        {product.averageMarketPrice && (
                          <p className="text-sm text-gray-600">
                            평균: {product.averageMarketPrice.toLocaleString()}
                            원
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {product.marketPrices.map((marketPrice, index) => (
                          <MarketPriceCard
                            key={index}
                            marketPrice={marketPrice}
                          />
                        ))}
                      </div>
                    </div>
                  ) : product.marketPrices?.length === 0 ? (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        시세 정보가 없습니다.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">
                        시세 조회 버튼을 클릭하여 공영시장 시세를 확인하세요.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
