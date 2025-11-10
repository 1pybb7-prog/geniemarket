"use client";

/**
 * @file app/(vendor)/vendor/products/new/page.tsx
 * @description 도매점 상품 등록 페이지
 *
 * 이 페이지는 도매점이 새로운 상품을 등록할 때 사용하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 상품 등록 폼 표시
 * 2. 폼 제출 시 API 호출
 * 3. 성공 시 상품 목록 페이지로 리다이렉트
 * 4. 도매점(vendor)만 접근 가능하도록 인증 확인
 *
 * 핵심 구현 로직:
 * - Clerk useUser 훅으로 사용자 인증 확인
 * - useRouter로 페이지 이동
 * - ProductForm 컴포넌트 사용
 * - API Route로 상품 등록 요청
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증
 * - next/navigation: 라우팅
 * - @/components/products/ProductForm: 상품 등록 폼
 * - @/lib/types: 타입 정의
 *
 * @see {@link docs/PRD.md} - 상품 등록 페이지 명세
 * @see {@link docs/TODO.md} - TODO 499-509 라인
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import {
  ProductForm,
  ProductFormData,
} from "@/components/products/ProductForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface UserData {
  id: string;
  user_type: "vendor" | "retailer";
}

export default function NewProductPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const supabase = useClerkSupabaseClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<UserData["user_type"] | null>(null);

  // 인증 및 사용자 타입 확인
  useEffect(() => {
    if (!isLoaded || !user) {
      if (isLoaded && !user) {
        console.log("❌ 로그인이 필요합니다.");
        router.push("/sign-in");
      }
      return;
    }

    const checkUserType = async () => {
      try {
        setLoading(true);
        console.group("👤 사용자 타입 확인 시작");

        // Supabase에서 사용자 정보 조회
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, user_type")
          .eq("id", user.id)
          .single();

        if (userError || !userData) {
          console.error("❌ 사용자 정보 조회 실패:", userError);
          toast.error("사용자 정보를 찾을 수 없습니다.");
          router.push("/sign-in");
          return;
        }

        console.log("✅ 사용자 정보 조회 성공:", userData);
        setUserType(userData.user_type);

        // 도매점(vendor)이 아니면 접근 불가
        if (userData.user_type !== "vendor") {
          console.error("❌ 권한 없음: 도매점만 접근 가능합니다.");
          toast.error("도매점만 상품을 등록할 수 있습니다.");
          router.push("/");
          return;
        }

        console.log("✅ 도매점 사용자 확인 완료");
        console.groupEnd();
      } catch (error) {
        console.error("❌ 사용자 타입 확인 에러:", error);
        toast.error("사용자 정보 확인에 실패했습니다.");
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    };

    checkUserType();
  }, [user, isLoaded, router, supabase]);

  // 상품 등록 핸들러
  const handleSubmit = async (data: ProductFormData) => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      console.group("📦 상품 등록 API 호출");
      console.log("요청 데이터:", data);

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ 상품 등록 실패:", result);
        throw new Error(result.error || "상품 등록에 실패했습니다.");
      }

      console.log("✅ 상품 등록 성공:", result);
      console.groupEnd();

      toast.success("상품이 등록되었습니다.");
      router.push("/vendor/products");
    } catch (error) {
      console.error("❌ 상품 등록 에러:", error);
      toast.error(
        error instanceof Error ? error.message : "상품 등록에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
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

  // 로그인 안 됨 또는 도매점이 아님
  if (!user || userType !== "vendor") {
    return null; // useEffect에서 리다이렉트 처리
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* 헤더 */}
      <div className="mb-6">
        <Link href="/vendor/products">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            상품 목록으로 돌아가기
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">새 상품 등록</h1>
        </div>
        <p className="text-gray-600 mt-2">상품 정보를 입력하고 등록해주세요.</p>
      </div>

      {/* 상품 등록 폼 */}
      <Card>
        <CardHeader>
          <CardTitle>상품 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </CardContent>
      </Card>
    </div>
  );
}
