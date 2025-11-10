"use client";

/**
 * @file app/(vendor)/vendor/products/page.tsx
 * @description 도매점 상품 목록 페이지
 *
 * 이 페이지는 도매점이 등록한 상품 목록을 표시하고 관리하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 등록한 상품 목록 표시
 * 2. 상품 카드 형태로 표시 (이미지, 원본 상품명, 표준 상품명, 가격, 단위, 재고)
 * 3. AI 표준화 결과 확인 및 수정
 * 4. 상품 수정/삭제 기능
 *
 * 핵심 구현 로직:
 * - Clerk useUser 훅으로 사용자 인증 확인
 * - API Route로 상품 목록 조회
 * - 상품 카드 컴포넌트로 표시
 * - 표준화 결과 확인/수정 기능
 * - 상품 수정/삭제 버튼
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증
 * - next/navigation: 라우팅
 * - @/components/ui: shadcn/ui 컴포넌트
 * - @/lib/types: 타입 정의
 *
 * @see {@link docs/PRD.md} - 도매점 상품 목록 페이지 명세
 * @see {@link docs/TODO.md} - TODO 625-649 라인
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProductRaw, ProductStandard } from "@/lib/types";

interface ProductWithMapping extends ProductRaw {
  product_mapping?: Array<{
    id: string;
    standard_product_id: string;
    is_verified: boolean;
    products_standard: ProductStandard | null;
  }>;
}

export default function VendorProductsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
        console.group("📦 상품 목록 조회 시작");

        const response = await fetch("/api/products");
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

  // 표준화 결과 확인
  const handleVerify = async (productId: string, mappingId: string) => {
    try {
      console.group("✅ 표준화 결과 확인 시작");
      console.log("상품 ID:", productId);
      console.log("매핑 ID:", mappingId);

      const response = await fetch(`/api/products/${productId}/mapping`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_verified: true }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ 표준화 결과 확인 실패:", result);
        throw new Error(result.error || "표준화 결과 확인에 실패했습니다.");
      }

      console.log("✅ 표준화 결과 확인 성공:", result);
      console.groupEnd();

      toast.success("표준화 결과가 확인되었습니다.");

      // 목록 새로고침
      router.refresh();
      const refreshResponse = await fetch("/api/products?type=vendor");
      const refreshResult = await refreshResponse.json();
      if (refreshResponse.ok) {
        setProducts(refreshResult.products || []);
      }
    } catch (error) {
      console.error("❌ 표준화 결과 확인 에러:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "표준화 결과 확인에 실패했습니다.",
      );
    }
  };

  // 상품 삭제
  const handleDelete = async (productId: string) => {
    try {
      setDeletingProductId(productId);
      console.group("🗑️ 상품 삭제 시작");
      console.log("상품 ID:", productId);

      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ 상품 삭제 실패:", result);
        throw new Error(result.error || "상품 삭제에 실패했습니다.");
      }

      console.log("✅ 상품 삭제 성공");
      console.groupEnd();

      toast.success("상품이 삭제되었습니다.");

      // 목록에서 제거
      setProducts(products.filter((p) => p.id !== productId));
      setShowDeleteDialog(false);
      setDeletingProductId(null);
    } catch (error) {
      console.error("❌ 상품 삭제 에러:", error);
      toast.error(
        error instanceof Error ? error.message : "상품 삭제에 실패했습니다.",
      );
      setDeletingProductId(null);
    }
  };

  // 로딩 중
  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>로딩 중...</p>
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">내 상품 목록</h1>
        </div>
        <Link href="/vendor/products/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />새 상품 등록
          </Button>
        </Link>
      </div>

      {/* 상품 목록 */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">등록된 상품이 없습니다.</p>
            <Link href="/vendor/products/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />첫 상품 등록하기
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const mapping = product.product_mapping?.[0];
            const standardProduct = mapping?.products_standard;

            return (
              <Card key={product.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">
                      {product.original_name}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Link href={`/vendor/products/${product.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingProductId(product.id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 상품 이미지 */}
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.original_name}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg border">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  {/* 표준화 결과 */}
                  {standardProduct ? (
                    <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-blue-900">
                          AI 표준화 결과
                        </p>
                        {mapping?.is_verified ? (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            확인됨
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerify(product.id, mapping.id)}
                            className="text-xs"
                          >
                            확인
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-blue-800">
                        {standardProduct.standard_name}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">표준화 결과 없음</p>
                    </div>
                  )}

                  {/* 상품 정보 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">가격</span>
                      <span className="text-lg font-bold">
                        {product.price.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">단위</span>
                      <span className="text-sm font-medium">
                        {product.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">재고</span>
                      <span
                        className={`text-sm font-medium ${
                          product.stock > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {product.stock > 0 ? `${product.stock}개` : "재고 없음"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>상품 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingProductId(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingProductId) {
                  handleDelete(deletingProductId);
                }
              }}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
