"use client";

/**
 * @file app/(main)/profile/page.tsx
 * @description 프로필 정보 페이지
 *
 * 이 페이지는 사용자의 프로필 정보를 표시하고 수정할 수 있는 페이지입니다.
 * Clerk의 UserProfile 컴포넌트를 사용하여 프로필 정보를 관리합니다.
 *
 * 주요 기능:
 * 1. 사용자 정보 표시 (이메일, 상호명, 전화번호, 회원 유형)
 * 2. 프로필 정보 수정 (Clerk UserProfile 활용)
 * 3. Supabase users 테이블과 동기화
 *
 * @dependencies
 * - @clerk/nextjs: useUser, UserProfile
 * - @supabase/supabase-js: useClerkSupabaseClient
 */

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { UserProfile } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface UserData {
  id: string;
  email: string;
  user_type: "vendor" | "retailer";
  business_name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사용자 데이터 가져오기
  useEffect(() => {
    async function fetchUserData() {
      if (!isLoaded || !user) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.group("👤 프로필 정보 조회 시작");
        console.log("Clerk User ID:", user.id);

        const { data, error: supabaseError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (supabaseError) {
          console.error("❌ Supabase 조회 실패:", supabaseError);
          throw new Error("사용자 정보를 가져올 수 없습니다.");
        }

        console.log("✅ 사용자 정보 조회 성공:", data);
        setUserData(data);
        console.groupEnd();
      } catch (err) {
        console.error("❌ 프로필 정보 조회 실패:", err);
        setError(
          err instanceof Error
            ? err.message
            : "사용자 정보를 가져올 수 없습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [isLoaded, user, supabase]);

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>로그인이 필요합니다</CardTitle>
            <CardDescription>
              프로필을 보려면 먼저 로그인해주세요.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">프로필</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          프로필 정보를 확인하고 수정할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 사용자 정보 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>사용자 정보</CardTitle>
            <CardDescription>기본 사용자 정보입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : error ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : userData ? (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    이메일
                  </label>
                  <p className="mt-1 text-sm">{userData.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    회원 유형
                  </label>
                  <p className="mt-1 text-sm">
                    {userData.user_type === "vendor" ? "도매점" : "소매점"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    상호명
                  </label>
                  <p className="mt-1 text-sm">{userData.business_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    전화번호
                  </label>
                  <p className="mt-1 text-sm">{userData.phone || "미입력"}</p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* 프로필 수정 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>프로필 수정</CardTitle>
            <CardDescription>
              Clerk를 통해 프로필 정보를 수정할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showEditForm ? (
              <div className="space-y-4">
                <UserProfile
                  appearance={{
                    elements: {
                      rootBox: "mx-auto",
                      card: "shadow-lg",
                    },
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => setShowEditForm(false)}
                  className="w-full"
                >
                  닫기
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowEditForm(true)} className="w-full">
                프로필 수정하기
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
