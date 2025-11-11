import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { hasUserType } from "@/lib/types";
import { ProductFormData } from "@/components/products/ProductForm";
import type { ProductRaw } from "@/lib/types";

/**
 * @file app/api/products/route.ts
 * @description 상품 등록/조회 API (POST/GET)
 *
 * 이 API는 도매점이 상품을 등록하거나 조회할 때 사용합니다.
 *
 * 주요 기능:
 * 1. GET: 도매점의 상품 목록 조회
 * 2. POST: 새로운 상품 등록
 *    - Clerk 인증 확인
 *    - 도매점(vendor)만 등록 가능하도록 체크
 *    - products_raw 테이블에 상품 저장
 *    - AI 표준화 연동 및 표준화 결과 저장
 *
 * 핵심 구현 로직:
 * - Clerk auth() 함수로 사용자 인증 확인
 * - Supabase에서 사용자 정보 조회하여 user_type 확인
 * - products_raw 테이블에 상품 정보 저장
 * - vendor_id는 현재 사용자의 Clerk ID 사용
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/server: createClerkSupabaseClient
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/types: ProductRaw
 *
 * @see {@link docs/PRD.md} - products_raw 테이블 스키마
 * @see {@link docs/TODO.md} - TODO 519-526, 625-649 라인
 */

/**
 * GET /api/products
 * 상품 목록 조회 (도매점/소매점 구분)
 *
 * Query Parameters:
 * - type: "vendor" | "retailer" (선택, 기본값: user_type에 따라 자동 결정)
 * - search: 검색어 (표준 상품명, 소매점용)
 * - category: 카테고리 필터 (소매점용)
 * - limit: 페이지당 개수 (기본 12개)
 * - offset: 페이지네이션 (기본 0)
 *
 * Response (도매점):
 * {
 *   products: ProductRaw[];
 *   count: number;
 * }
 *
 * Response (소매점):
 * {
 *   products: LowestPrice[];
 *   count: number;
 * }
 */
export async function GET(request: Request) {
  try {
    console.group("📦 상품 목록 조회 API 시작");

    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증되지 않은 사용자");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ 인증된 사용자 ID:", userId);

    // 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const region = searchParams.get("region");
    const city = searchParams.get("city");
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    console.log("📋 쿼리 파라미터:", {
      type,
      search,
      category,
      region,
      city,
      limit,
      offset,
    });

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // 사용자 정보 조회 (user_type 확인)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, user_type")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      console.error("❌ 사용자 정보 조회 실패:", userError);
      console.groupEnd();
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const requestedType = (type as "vendor" | "retailer") || userData.user_type;
    const userType = userData.user_type;
    console.log("👤 사용자 유형:", userType);
    console.log("👤 요청된 유형:", requestedType);

    // 도매점(vendor)인 경우: 본인 상품 목록 조회
    if (
      hasUserType(userType, "vendor") &&
      (requestedType === "vendor" || !type)
    ) {
      // 도매점의 상품 목록 조회 (표준화 결과 포함)
      const { data: products, error: productsError } = await supabase
        .from("products_raw")
        .select(
          `
          *,
          product_mapping (
            id,
            standard_product_id,
            is_verified,
            products_standard (
              id,
              standard_name,
              category,
              unit
            )
          )
        `,
        )
        .eq("vendor_id", userId)
        .order("created_at", { ascending: false });

      if (productsError) {
        console.error("❌ 상품 목록 조회 실패:", productsError);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "상품 목록 조회에 실패했습니다.",
            details: productsError.message,
          },
          { status: 500 },
        );
      }

      console.log(`✅ ${products?.length || 0}개의 상품 조회 성공`);
      console.groupEnd();

      return NextResponse.json({
        products: products || [],
        count: products?.length || 0,
      });
    }

    // 소매점(retailer)인 경우: 표준 상품 검색 (최저가 포함)
    // 지역 필터링이 필요한 경우 v_product_prices를 사용하고, 그렇지 않으면 v_lowest_prices 사용
    const needsRegionFilter = region || city;

    if (needsRegionFilter) {
      // 지역 필터링이 필요한 경우: v_product_prices 사용 후 그룹화
      let baseQuery = supabase
        .from("v_product_prices")
        .select("*", { count: "exact" });

      // 검색어 필터
      if (search && search.trim().length > 0) {
        baseQuery = baseQuery.ilike("standard_name", `%${search.trim()}%`);
      }

      // 카테고리 필터
      if (category && category.trim().length > 0) {
        baseQuery = baseQuery.eq("category", category.trim());
      }

      // 지역 필터
      if (region && region.trim().length > 0) {
        baseQuery = baseQuery.eq("region", region.trim());
        console.log("📍 지역 필터 - 시/도:", region);
      }

      if (city && city.trim().length > 0) {
        baseQuery = baseQuery.eq("city", city.trim());
        console.log("📍 지역 필터 - 시/군/구:", city);
      }

      // 데이터 조회
      const {
        data: allProducts,
        error: productsError,
        count,
      } = await baseQuery;

      if (productsError) {
        console.error("❌ 상품 목록 조회 실패:", productsError);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "상품 목록 조회에 실패했습니다.",
            details: productsError.message,
          },
          { status: 500 },
        );
      }

      // 표준 상품별로 그룹화하여 최저가 계산
      const groupedProducts = new Map<
        string,
        {
          standard_product_id: string;
          standard_name: string;
          category?: string;
          lowest_price: number;
          product_count: number;
        }
      >();

      (allProducts || []).forEach((product: any) => {
        const key = product.standard_product_id;
        if (!groupedProducts.has(key)) {
          groupedProducts.set(key, {
            standard_product_id: product.standard_product_id,
            standard_name: product.standard_name,
            category: product.category,
            lowest_price: product.price,
            product_count: 1,
          });
        } else {
          const existing = groupedProducts.get(key)!;
          if (product.price < existing.lowest_price) {
            existing.lowest_price = product.price;
          }
          existing.product_count += 1;
        }
      });

      // 배열로 변환하고 정렬
      const products = Array.from(groupedProducts.values())
        .sort((a, b) => a.lowest_price - b.lowest_price)
        .slice(offset, offset + limit);

      console.log(
        `✅ ${products.length}개의 상품 조회 성공 (전체: ${count || 0}개, 지역 필터 적용)`,
      );
      console.groupEnd();

      return NextResponse.json({
        products: products,
        count: count || 0,
      });
    } else {
      // 지역 필터링이 필요 없는 경우: 기존 로직 사용 (v_lowest_prices)
      let query = supabase
        .from("v_lowest_prices")
        .select("*", { count: "exact" });

      // 검색어 필터
      if (search && search.trim().length > 0) {
        query = query.ilike("standard_name", `%${search.trim()}%`);
      }

      // 카테고리 필터
      if (category && category.trim().length > 0) {
        query = query.eq("category", category.trim());
      }

      // 페이지네이션
      query = query.range(offset, offset + limit - 1);

      // 정렬 (최저가 낮은 순)
      query = query.order("lowest_price", { ascending: true });

      const { data: products, error: productsError, count } = await query;

      if (productsError) {
        console.error("❌ 상품 목록 조회 실패:", productsError);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "상품 목록 조회에 실패했습니다.",
            details: productsError.message,
          },
          { status: 500 },
        );
      }

      console.log(
        `✅ ${products?.length || 0}개의 상품 조회 성공 (전체: ${count || 0}개)`,
      );
      console.groupEnd();

      return NextResponse.json({
        products: products || [],
        count: count || 0,
      });
    }
  } catch (error) {
    console.error("❌ 상품 목록 조회 API 에러:", error);
    return NextResponse.json(
      {
        error: "상품 목록 조회 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/products
 * 상품 등록
 *
 * Request Body:
 * {
 *   original_name: string;
 *   price: number;
 *   unit: string;
 *   stock: number;
 *   image_url?: string;
 * }
 *
 * Response:
 * {
 *   id: string;
 *   vendor_id: string;
 *   original_name: string;
 *   price: number;
 *   unit: string;
 *   stock: number;
 *   image_url?: string;
 *   created_at: string;
 *   updated_at: string;
 * }
 */
export async function POST(request: Request) {
  try {
    console.group("📦 상품 등록 API 시작");

    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증되지 않은 사용자");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ 인증된 사용자 ID:", userId);

    // 요청 본문 파싱
    const body: ProductFormData = await request.json();
    console.log("📝 요청 데이터:", body);

    // 입력 검증
    if (
      !body.original_name ||
      !body.price ||
      !body.unit ||
      body.stock === undefined
    ) {
      console.error("❌ 필수 필드 누락");
      console.groupEnd();
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 },
      );
    }

    // 가격 검증
    if (body.price < 1 || body.price > 999999999) {
      console.error("❌ 가격 범위 오류:", body.price);
      console.groupEnd();
      return NextResponse.json(
        { error: "가격은 1원 이상 999,999,999원 이하여야 합니다." },
        { status: 400 },
      );
    }

    // 재고 검증
    if (body.stock < 0 || body.stock > 999999) {
      console.error("❌ 재고 범위 오류:", body.stock);
      console.groupEnd();
      return NextResponse.json(
        { error: "재고는 0 이상 999,999 이하여야 합니다." },
        { status: 400 },
      );
    }

    // Supabase 클라이언트 생성 (Service Role - RLS 우회)
    const supabase = getServiceRoleClient();

    // 사용자 정보 조회 (user_type 확인)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, user_type, email")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      console.error("❌ 사용자 정보 조회 실패:", userError);
      console.groupEnd();
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    console.log("👤 사용자 정보:", userData);

    // 도매점(vendor) 권한이 없으면 등록 불가
    if (!hasUserType(userData.user_type, "vendor")) {
      console.error("❌ 도매점 권한이 없는 사용자:", userData.user_type);
      console.groupEnd();
      return NextResponse.json(
        { error: "도매점만 상품을 등록할 수 있습니다." },
        { status: 403 },
      );
    }

    console.log("✅ 도매점 확인 완료");

    // 상품 데이터 준비
    const productData: Omit<ProductRaw, "id" | "created_at" | "updated_at"> = {
      vendor_id: userId,
      original_name: body.original_name,
      price: body.price,
      unit: body.unit,
      stock: body.stock,
      image_url: body.image_url || null,
      region: body.region || null,
      city: body.city || null,
    };

    console.log("💾 저장할 상품 데이터:", productData);
    console.log("📍 지역 정보 - 시/도:", productData.region || "없음");
    console.log("📍 지역 정보 - 시/군/구:", productData.city || "없음");

    // products_raw 테이블에 상품 저장
    const { data: product, error: insertError } = await supabase
      .from("products_raw")
      .insert(productData)
      .select()
      .single();

    if (insertError) {
      console.error("❌ 상품 저장 실패:", insertError);
      console.groupEnd();
      return NextResponse.json(
        { error: "상품 등록에 실패했습니다.", details: insertError.message },
        { status: 500 },
      );
    }

    console.log("✅ 상품 저장 성공:", product);

    // AI 표준화 API 호출 및 표준화 결과 저장
    try {
      console.log("🤖 AI 표준화 시작...");
      const standardizeResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products/standardize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            original_name: product.original_name,
          }),
        },
      );

      if (standardizeResponse.ok) {
        const standardizeResult = await standardizeResponse.json();
        console.log("✅ AI 표준화 성공:", standardizeResult);

        // product_mapping 테이블에 연결 정보 저장
        const { error: mappingError } = await supabase
          .from("product_mapping")
          .insert({
            raw_product_id: product.id,
            standard_product_id: standardizeResult.standard_product_id,
            is_verified: false, // 도매점이 아직 확인하지 않음
          });

        if (mappingError) {
          console.error("❌ 매핑 저장 실패:", mappingError);
          // 매핑 저장 실패는 치명적이지 않으므로 경고만 출력
          console.warn(
            "⚠️ 표준화 결과 매핑 저장에 실패했지만 상품 등록은 완료되었습니다.",
          );
        } else {
          console.log("✅ 표준화 결과 매핑 저장 성공");
        }
      } else {
        console.warn("⚠️ AI 표준화 실패 (상품 등록은 완료됨)");
        // 표준화 실패는 치명적이지 않으므로 경고만 출력
      }
    } catch (standardizeError) {
      console.warn(
        "⚠️ AI 표준화 중 오류 발생 (상품 등록은 완료됨):",
        standardizeError,
      );
      // 표준화 실패는 치명적이지 않으므로 경고만 출력
    }

    console.groupEnd();

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("❌ 상품 등록 API 에러:", error);
    return NextResponse.json(
      {
        error: "상품 등록 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
