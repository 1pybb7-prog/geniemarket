"use client";

/**
 * @file app/(vendor)/vendor/market-prices/kamis/page.tsx
 * @description 도매점 KAMIS 시세 조회 페이지
 *
 * 이 페이지는 도매점이 KAMIS(한국농수산식품유통공사) API를 통해 농산물 시세를 조회하는 페이지입니다.
 *
 * 주요 기능:
 * 1. KAMIS 시세 조회
 * 2. 내 상품과 시세 비교
 * 3. 가격 경쟁력 분석
 *
 * 핵심 구현 로직:
 * - Clerk useUser 훅으로 사용자 인증 확인
 * - KAMIS API 연동 (향후 구현 예정)
 * - 시세 데이터 표시 및 비교
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증
 * - next/navigation: 라우팅
 *
 * @see {@link docs/KAMIS_API_SETUP.md} - KAMIS API 설정 가이드
 */

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Loader2 } from "lucide-react";

export default function VendorKAMISMarketPricesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // 인증 확인
  useEffect(() => {
    if (isLoaded && !user) {
      console.log("❌ 로그인이 필요합니다.");
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

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
          <BarChart3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">KAMIS 시세 조회</h1>
        </div>
        <p className="text-gray-600">
          KAMIS(한국농수산식품유통공사) API를 통해 농산물 시세를 조회하고 가격 경쟁력을 분석합니다.
        </p>
      </div>

      {/* 기본 페이지 컨텐츠 */}
      <Card>
        <CardHeader>
          <CardTitle>KAMIS 시세 조회</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2 text-center">
            KAMIS 시세 조회 기능이 곧 제공될 예정입니다.
          </p>
          <p className="text-sm text-gray-500 text-center">
            농산물 가격 정보를 조회하고 내 상품과 비교할 수 있는 기능을 준비 중입니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

