/**
 * @file app/(vendor)/vendor/page.tsx
 * @description 도매점 홈 페이지
 *
 * 도매점 사용자가 로그인 후 접근하는 메인 페이지입니다.
 * 상품 목록 페이지로 리다이렉트합니다.
 */

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { hasUserType } from "@/lib/types";

export default async function VendorHomePage() {
  console.group("🏪 도매점 홈 페이지 접근");

  const { userId } = await auth();

  if (!userId) {
    console.log("❌ 로그인하지 않은 사용자, 로그인 페이지로 리다이렉트");
    console.groupEnd();
    redirect("/sign-in");
  }

  const supabase = createClerkSupabaseClient();
  const { data: userData, error } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("❌ 사용자 정보 조회 실패:", error);
    console.groupEnd();
    redirect("/sign-in");
  }

  if (!userData || !hasUserType(userData.user_type, "vendor")) {
    console.log("❌ 도매점 권한이 없는 사용자, 홈으로 리다이렉트");
    console.groupEnd();
    redirect("/");
  }

  console.log("✅ 도매점 사용자 확인 완료, 상품 목록 페이지로 리다이렉트");
  console.groupEnd();

  // 도매점 홈 페이지는 상품 목록 페이지로 리다이렉트
  redirect("/vendor/products");
}
