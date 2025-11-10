/**
 * @file page.tsx
 * @description 홈 페이지
 *
 * 소매점용 홈 페이지입니다.
 * 최근 등록된 상품, 인기 상품, 공영시장 시세 요약을 표시합니다.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, TrendingUp, BarChart3 } from "lucide-react";

export default function HomePage() {
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
