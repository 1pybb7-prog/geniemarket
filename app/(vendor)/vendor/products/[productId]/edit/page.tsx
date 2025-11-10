"use client";

/**
 * @file app/(vendor)/vendor/products/[productId]/edit/page.tsx
 * @description 도매점 상품 수정 페이지
 *
 * 이 페이지는 도매점이 등록한 상품을 수정할 때 사용하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 상품 정보 수정 폼 표시
 * 2. 기존 상품 정보 로드
 * 3. 폼 제출 시 API 호출
 * 4. 성공 시 상품 목록 페이지로 리다이렉트
 * 5. 도매점(vendor)만 접근 가능하도록 인증 확인
 *
 * 핵심 구현 로직:
 * - Clerk useUser 훅으로 사용자 인증 확인
 * - useRouter로 페이지 이동
 * - ProductForm 컴포넌트 사용
 * - API Route로 상품 정보 조회 및 수정 요청
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증
 * - next/navigation: 라우팅
 * - @/components/products/ProductForm: 상품 등록/수정 폼
 * - @/lib/types: 타입 정의
 *
 * @see {@link docs/PRD.md} - 상품 수정 페이지 명세
 * @see {@link docs/TODO.md} - TODO 644-649 라인
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import {
  ProductForm,
  ProductFormData,
} from "@/components/products/ProductForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { ProductRaw } from "@/lib/types";

export default function EditProductPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;
  const [product, setProduct] = useState<ProductRaw | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 인증 확인
  useEffect(() => {
    if (isLoaded && !user) {
      console.log("❌ 로그인이 필요합니다.");
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

  // 상품 정보 조회
  useEffect(() => {
    if (!user || !isLoaded || !productId) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        console.group("📦 상품 정보 조회 시작");
        console.log("상품 ID:", productId);

        // 상품 목록에서 해당 상품 찾기
        const response = await fetch("/api/products?type=vendor");
        const result = await response.json();

        if (!response.ok) {
          console.error("❌ 상품 목록 조회 실패:", result);
          throw new Error(result.error || "상품 정보 조회에 실패했습니다.");
        }

        const foundProduct = result.products?.find(
          (p: ProductRaw) => p.id === productId,
        );

        if (!foundProduct) {
          console.error("❌ 상품을 찾을 수 없습니다.");
          throw new Error("상품을 찾을 수 없습니다.");
        }

        console.log("✅ 상품 정보 조회 성공:", foundProduct);
        console.groupEnd();

        setProduct(foundProduct);
      } catch (error) {
        console.error("❌ 상품 정보 조회 에러:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "상품 정보 조회에 실패했습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [user, isLoaded, productId, router]);

  // 상품 수정 핸들러
  const handleSubmit = async (data: ProductFormData) => {
    if (!user || !productId) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      console.group("📝 상품 수정 API 호출");
      console.log("상품 ID:", productId);
      console.log("요청 데이터:", data);

      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ 상품 수정 실패:", result);
        throw new Error(result.error || "상품 수정에 실패했습니다.");
      }

      console.log("✅ 상품 수정 성공:", result);
      console.groupEnd();

      toast.success("상품이 수정되었습니다.");
      router.push("/vendor/products");
    } catch (error) {
      console.error("❌ 상품 수정 에러:", error);
      toast.error(
        error instanceof Error ? error.message : "상품 수정에 실패했습니다.",
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

  // 로그인 안 됨
  if (!user) {
    return null; // useEffect에서 리다이렉트 처리
  }

  // 상품 정보가 없으면 에러
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              상품 정보를 불러올 수 없습니다.
            </p>
            <Link href="/vendor/products">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                상품 목록으로 돌아가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
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
          <h1 className="text-3xl font-bold">상품 수정</h1>
        </div>
        <p className="text-gray-600 mt-2">상품 정보를 수정해주세요.</p>
      </div>

      {/* 상품 수정 폼 */}
      <Card>
        <CardHeader>
          <CardTitle>상품 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            onSubmit={handleSubmit}
            defaultValues={{
              original_name: product.original_name,
              price: product.price,
              unit: product.unit,
              stock: product.stock,
              image_url: product.image_url || "",
            }}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
