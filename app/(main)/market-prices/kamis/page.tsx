"use client";

/**
 * @file app/(main)/market-prices/kamis/page.tsx
 * @description KAMIS 실시간 시세 조회 페이지
 *
 * 이 페이지는 소매점이 KAMIS Open API를 통해 공영도매시장의 실시간 시세를 조회하는 페이지입니다.
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { MarketPriceCard } from "@/components/market-prices/MarketPriceCard";
import { SearchBar } from "@/components/layout/SearchBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

interface MarketPrice {
  market_name: string;
  price: number;
  grade?: string;
  date: string;
}

export default function KamisMarketPricesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // KAMIS API는 날짜 필터링이 조금 다를 수 있지만 UI 일관성을 위해 유지
  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "week">(
    "today",
  );

  // 인증 확인
  useEffect(() => {
    if (isLoaded && !user) {
      console.log("❌ 로그인이 필요합니다.");
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

  // 시세 조회
  const fetchMarketPrices = async (productName?: string) => {
    if (!user || !isLoaded) return;

    try {
      setLoading(true);
      console.group("📊 KAMIS 시세 조회 시작");
      console.log("상품명:", productName || "전체");

      const params = new URLSearchParams();
      if (productName && productName.trim()) {
        params.append("productName", productName.trim());
      }
      // 지역 필터 등 추가 가능

      const apiUrl = `/api/market-prices/kamis?${params.toString()}`;
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
        // console.log("📄 응답 본문 (처음 500자):", responseText.substring(0, 500));

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

      setMarketPrices(result.prices || []);
    } catch (error) {
      console.error("❌ 시세 조회 에러:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "시세 조회에 실패했습니다. 잠시 후 다시 시도해주세요.";
      toast.error(errorMessage);
      setMarketPrices([]); // 에러 발생 시 빈 배열로 초기화
    } finally {
      setLoading(false);
    }
  };

  // 검색 실행
  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchMarketPrices(searchQuery.trim());
    } else {
      toast.info("상품명을 입력해주세요.");
    }
  };

  // 로딩 중
  if (!isLoaded) {
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
          <h1 className="text-3xl font-bold">실시간 시세 조회 (KAMIS)</h1>
        </div>
        <p className="text-gray-600">
          KAMIS Open API를 통해 공영도매시장의 실시간 경매 가격을 확인하세요.
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
                  handleSearch();
                }
              }}
              placeholder="상품명을 입력하세요 (예: 청양고추)"
            />
          </div>
          <Button onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" />
            검색
          </Button>
        </div>

        {/* 날짜 필터 (UI만 유지, 실제 기능은 API 구현에 따라 다름) */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={dateFilter === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("today")}
          >
            오늘
          </Button>
          <Button
            variant={dateFilter === "yesterday" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("yesterday")}
          >
            어제
          </Button>
          <Button
            variant={dateFilter === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("week")}
          >
            최근 7일
          </Button>
        </div>
      </div>

      {/* 시세 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : marketPrices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              {searchQuery.trim()
                ? "시세 정보가 없습니다."
                : "상품명을 검색하여 시세를 조회하세요."}
            </p>
            {searchQuery.trim() && (
              <p className="text-sm text-gray-500">
                다른 상품명으로 시도해보세요.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              총 {marketPrices.length}개의 시세 정보를 찾았습니다.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketPrices.map((marketPrice, index) => (
              <MarketPriceCard key={index} marketPrice={marketPrice} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
