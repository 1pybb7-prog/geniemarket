/**
 * @file app/page.tsx
 * @description 랜딩 페이지 / 홈 페이지
 *
 * 이 페이지는 사용자 상태에 따라 다른 내용을 표시합니다:
 * - 로그인하지 않은 사용자: 도매점/소매점 선택 랜딩 페이지
 * - 로그인한 사용자: 메인 홈 페이지 (메인 레이아웃 적용)
 *
 * 주요 기능:
 * 1. 로그인한 사용자에게는 메인 홈 페이지를 메인 레이아웃과 함께 렌더링
 * 2. 로그인하지 않은 사용자에게 도매점/소매점 선택 버튼 제공
 * 3. 선택한 역할을 쿼리 파라미터로 전달하여 로그인 페이지로 이동
 */

import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, TrendingUp, BarChart3 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

// 메인 홈 페이지 내용 컴포넌트
function HomePageContent() {
  console.log("[HomePage] 홈 페이지 렌더링");

  return (
    <div className="space-y-8">
      {/* 환영 메시지 */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">안녕하세요! 👋</h1>
        <p className="text-muted-foreground text-lg">
          도소매 가격비교 플랫폼에 오신 것을 환영합니다.
          <br />
          최저가 상품을 찾고 실시간 시세를 확인하세요.
        </p>
      </section>

      {/* 빠른 액션 */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5" />
              상품 검색
            </CardTitle>
            <CardDescription>
              원하는 상품을 검색하고 가격을 비교하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/products">
              <Button className="w-full">상품 검색하기</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              실시간 시세
            </CardTitle>
            <CardDescription>
              공영도매시장의 실시간 경매 시세를 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/market-prices">
              <Button className="w-full" variant="outline">
                시세 조회하기
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              주문 내역
            </CardTitle>
            <CardDescription>주문한 상품의 상태를 확인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/orders">
              <Button className="w-full" variant="outline">
                주문 내역 보기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* 최근 등록된 상품 섹션 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">최근 등록된 상품</h2>
          <Link href="/products">
            <Button variant="ghost" size="sm">
              더보기 →
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* TODO: 최근 등록된 상품 데이터 연결 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">상품 데이터 준비 중</CardTitle>
              <CardDescription>
                상품 등록 기능이 완성되면 여기에 표시됩니다
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* 인기 상품 섹션 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">인기 상품</h2>
          <Link href="/products">
            <Button variant="ghost" size="sm">
              더보기 →
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* TODO: 인기 상품 데이터 연결 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">상품 데이터 준비 중</CardTitle>
              <CardDescription>
                인기 상품 데이터가 준비되면 여기에 표시됩니다
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* 공영시장 시세 요약 섹션 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">오늘의 공영시장 시세</h2>
          <Link href="/market-prices">
            <Button variant="ghost" size="sm">
              더보기 →
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* TODO: 공영시장 시세 데이터 연결 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">시세 데이터 준비 중</CardTitle>
              <CardDescription>
                공영시장 시세 데이터가 준비되면 여기에 표시됩니다
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default async function LandingPage() {
  console.log("[LandingPage] 랜딩 페이지 렌더링");

  // 로그인한 사용자는 메인 홈 페이지를 메인 레이아웃과 함께 렌더링
  const { userId } = await auth();
  if (userId) {
    console.log("[LandingPage] 로그인한 사용자 감지, 메인 홈 페이지 렌더링");
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
            <HomePageContent />
          </main>
        </div>
        <MobileNav />
      </div>
    );
  }

  // 로그인하지 않은 사용자에게 랜딩 페이지 표시
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* 제목 */}
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-blue-600">OSCM</h1>
          <p className="text-lg text-gray-600">
            AI 기반 공급망 최적화 B2B 플랫폼
          </p>
        </div>

        {/* 역할 선택 버튼 */}
        <div className="space-y-4">
          <Link href="/sign-in?role=retailer" className="block">
            <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 h-12 text-base font-medium">
              소매점으로 시작하기
            </Button>
          </Link>
          <Link href="/sign-in?role=vendor" className="block">
            <Button
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 h-12 text-base font-medium"
            >
              도매점으로 시작하기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
