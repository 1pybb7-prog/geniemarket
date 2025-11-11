"use client";

/**
 * @file app/(main)/products/page.tsx
 * @description 소매점 상품 검색 페이지
 *
 * 이 페이지는 소매점이 상품을 검색하고 가격을 비교할 수 있는 페이지입니다.
 *
 * 주요 기능:
 * 1. 상품 검색 (표준 상품명)
 * 2. 카테고리 필터
 * 3. 검색 결과 표시 (카드 그리드)
 * 4. 무한 스크롤 (선택 사항)
 *
 * 핵심 구현 로직:
 * - Clerk useUser 훅으로 사용자 인증 확인
 * - API Route로 상품 검색
 * - ProductCard 컴포넌트로 표시
 * - 검색어 및 필터 상태 관리
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증
 * - next/navigation: 라우팅
 * - @/components/products/ProductCard: 상품 카드 컴포넌트
 * - @/components/layout/SearchBar: 검색창 컴포넌트
 * - @/lib/types: LowestPrice
 *
 * @see {@link docs/PRD.md} - 상품 검색 페이지 명세
 * @see {@link docs/TODO.md} - TODO 664-704 라인
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/products/ProductCard";
import { SearchBar } from "@/components/layout/SearchBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { LowestPrice } from "@/lib/types";
import { REGIONS, getCitiesByRegion } from "@/lib/constants/regions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// useSearchParams를 사용하는 내부 컴포넌트
function ProductsPageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<LowestPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [region, setRegion] = useState(searchParams.get("region") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 12;

  // 인증 확인
  useEffect(() => {
    if (isLoaded && !user) {
      console.log("❌ 로그인이 필요합니다.");
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

  // 시/도 선택 시 시/군/구 목록 업데이트
  useEffect(() => {
    if (region) {
      const cities = getCitiesByRegion(region);
      setAvailableCities(cities);
      // 시/도가 변경되면 시/군/구 초기화
      if (city && !cities.includes(city)) {
        setCity("");
      }
    } else {
      setAvailableCities([]);
      setCity("");
    }
  }, [region, city]);

  // 상품 검색
  const fetchProducts = useCallback(
    async (reset = false) => {
      if (!user || !isLoaded) return;

      try {
        if (reset) {
          setLoading(true);
          setOffset(0);
        }

        console.group("🔍 상품 검색 시작");
        console.log("검색어:", searchQuery);
        console.log("카테고리:", category);
        console.log("지역 - 시/도:", region || "없음");
        console.log("지역 - 시/군/구:", city || "없음");
        console.log("페이지:", reset ? 0 : offset);

        const params = new URLSearchParams({
          type: "retailer",
          limit: limit.toString(),
          offset: reset ? "0" : offset.toString(),
        });

        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }
        if (category) {
          params.append("category", category);
        }
        if (region) {
          params.append("region", region);
        }
        if (city) {
          params.append("city", city);
        }

        const response = await fetch(`/api/products?${params.toString()}`);
        const result = await response.json();

        if (!response.ok) {
          console.error("❌ 상품 검색 실패:", result);
          throw new Error(result.error || "상품 검색에 실패했습니다.");
        }

        console.log("✅ 상품 검색 성공:", result);
        console.groupEnd();

        if (reset) {
          setProducts(result.products || []);
        } else {
          setProducts((prev) => [...prev, ...(result.products || [])]);
        }

        setHasMore((result.products?.length || 0) === limit);
        setOffset(reset ? limit : offset + limit);
      } catch (error) {
        console.error("❌ 상품 검색 에러:", error);
        toast.error(
          error instanceof Error ? error.message : "상품 검색에 실패했습니다.",
        );
      } finally {
        setLoading(false);
      }
    },
    [user, isLoaded, searchQuery, category, region, city, offset, limit],
  );

  // 초기 로드
  useEffect(() => {
    if (user && isLoaded) {
      fetchProducts(true);
    }
  }, [user, isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // 검색어 변경 시 검색
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // URL 업데이트
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("search", query.trim());
    }
    if (category) {
      params.set("category", category);
    }
    if (region) {
      params.set("region", region);
    }
    if (city) {
      params.set("city", city);
    }
    router.push(`/products?${params.toString()}`);
    // 검색 실행
    setTimeout(() => fetchProducts(true), 100);
  };

  // 카테고리 변경 시 검색
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    // URL 업데이트
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }
    if (newCategory) {
      params.set("category", newCategory);
    }
    if (region) {
      params.set("region", region);
    }
    if (city) {
      params.set("city", city);
    }
    router.push(`/products?${params.toString()}`);
    // 검색 실행
    setTimeout(() => fetchProducts(true), 100);
  };

  // 지역 변경 시 검색
  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    setCity(""); // 시/도 변경 시 시/군/구 초기화
    // URL 업데이트
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }
    if (category) {
      params.set("category", category);
    }
    if (newRegion) {
      params.set("region", newRegion);
    }
    router.push(`/products?${params.toString()}`);
    // 검색 실행
    setTimeout(() => fetchProducts(true), 100);
  };

  // 시/군/구 변경 시 검색
  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    // URL 업데이트
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }
    if (category) {
      params.set("category", category);
    }
    if (region) {
      params.set("region", region);
    }
    if (newCity) {
      params.set("city", newCity);
    }
    router.push(`/products?${params.toString()}`);
    // 검색 실행
    setTimeout(() => fetchProducts(true), 100);
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
          <Package className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">상품 검색</h1>
        </div>
        <p className="text-gray-600">
          원하는 상품을 검색하고 최저가를 비교해보세요.
        </p>
      </div>

      {/* 검색창 및 필터 */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(searchQuery);
                }
              }}
              placeholder="상품명을 입력하세요 (예: 청양고추)"
            />
          </div>
          <Button onClick={() => handleSearch(searchQuery)}>
            <Search className="w-4 h-4 mr-2" />
            검색
          </Button>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={category === "" ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange("")}
          >
            전체
          </Button>
          <Button
            variant={category === "채소" ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange("채소")}
          >
            채소
          </Button>
          <Button
            variant={category === "과일" ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange("과일")}
          >
            과일
          </Button>
          <Button
            variant={category === "수산물" ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange("수산물")}
          >
            수산물
          </Button>
        </div>

        {/* 지역 필터 */}
        <div className="flex gap-4 items-end">
          <div className="flex-1 max-w-xs">
            <Label htmlFor="region" className="mb-2 block">
              시/도
            </Label>
            <Select
              value={region || undefined}
              onValueChange={(value) => handleRegionChange(value || "")}
            >
              <SelectTrigger id="region">
                <SelectValue placeholder="시/도를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {region && availableCities.length > 0 && (
            <div className="flex-1 max-w-xs">
              <Label htmlFor="city" className="mb-2 block">
                시/군/구
              </Label>
              <Select
                value={city || undefined}
                onValueChange={(value) => handleCityChange(value || "")}
              >
                <SelectTrigger id="city">
                  <SelectValue placeholder="시/군/구를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* 검색 결과 */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              {searchQuery.trim()
                ? "검색 결과가 없습니다."
                : "상품을 검색해보세요."}
            </p>
            {searchQuery.trim() && (
              <p className="text-sm text-gray-500">
                다른 검색어로 시도해보세요.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              총 {products.length}개의 상품을 찾았습니다.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.standard_product_id}
                product={product}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchProducts(false)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    로딩 중...
                  </>
                ) : (
                  "더 보기"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Suspense로 감싼 메인 컴포넌트
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
