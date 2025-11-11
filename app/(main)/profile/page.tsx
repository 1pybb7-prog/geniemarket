"use client";

/**
 * @file app/(main)/profile/page.tsx
 * @description 프로필 정보 페이지
 *
 * 이 페이지는 사용자의 프로필 정보를 표시하고 수정할 수 있는 페이지입니다.
 *
 * 주요 기능:
 * 1. 사용자 정보 표시 (이메일, 닉네임, 상호명, 전화번호, 회원 유형)
 * 2. 프로필 정보 수정 (닉네임, 상호명, 전화번호)
 * 3. 주문 현황 요약 (최근 주문, 통계)
 * 4. Supabase users 테이블과 동기화
 *
 * @dependencies
 * - @clerk/nextjs: useUser
 * - @supabase/supabase-js: useClerkSupabaseClient
 * - react-hook-form: 폼 관리
 * - zod: 유효성 검사
 */

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Package, Edit2, Check } from "lucide-react";
import Link from "next/link";
import type { Order } from "@/lib/types";
import { getUserTypes, combineUserTypes, hasUserType } from "@/lib/types";

interface UserData {
  id: string;
  email: string;
  user_type: "vendor" | "retailer" | "vendor/retailer";
  nickname?: string;
  business_name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

// 프로필 수정 폼 스키마
const profileFormSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다.")
    .max(20, "닉네임은 20자 이하여야 합니다.")
    .regex(
      /^[a-zA-Z0-9가-힣_]+$/,
      "닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다.",
    )
    .optional()
    .or(z.literal("")),
  business_name: z.string().min(1, "상호명을 입력해주세요."),
  phone: z
    .string()
    .regex(/^[0-9-]*$/, "전화번호 형식이 올바르지 않습니다.")
    .optional()
    .or(z.literal("")),
  userTypes: z
    .array(z.enum(["vendor", "retailer"]))
    .min(1, "최소 하나의 회원 유형을 선택해주세요."),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const supabase = useClerkSupabaseClient();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState<{
    available: boolean | null;
    message: string;
  }>({ available: null, message: "" });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
  });

  const watchedNickname = watch("nickname");
  const userTypes = watch("userTypes") || [];

  // 회원 유형 토글 함수
  const toggleUserType = (type: "vendor" | "retailer") => {
    const currentTypes = userTypes;
    if (currentTypes.includes(type)) {
      // 이미 선택된 경우 제거 (단, 최소 하나는 유지)
      if (currentTypes.length > 1) {
        setValue(
          "userTypes",
          currentTypes.filter((t) => t !== type),
        );
      }
    } else {
      // 선택되지 않은 경우 추가
      setValue("userTypes", [...currentTypes, type]);
    }
  };

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
        setNickname(data.nickname || "");

        // 폼 초기값 설정
        const userTypes = getUserTypes(data.user_type);
        reset({
          nickname: data.nickname || "",
          business_name: data.business_name,
          phone: data.phone || "",
          userTypes: userTypes,
        });

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
  }, [isLoaded, user, supabase, reset]);

  // 주문 목록 조회
  useEffect(() => {
    async function fetchOrders() {
      if (!isLoaded || !user || !userData) {
        return;
      }

      setOrdersLoading(true);

      try {
        console.group("📋 주문 목록 조회 시작");
        const userType = userData.user_type;
        const response = await fetch(`/api/orders?type=${userType}&limit=5`);
        const result = await response.json();

        if (!response.ok) {
          console.error("❌ 주문 목록 조회 실패:", result);
          throw new Error(result.error || "주문 목록 조회에 실패했습니다.");
        }

        console.log("✅ 주문 목록 조회 성공:", result);
        setOrders(result.orders || []);
        console.groupEnd();
      } catch (error) {
        console.error("❌ 주문 목록 조회 에러:", error);
      } finally {
        setOrdersLoading(false);
      }
    }

    fetchOrders();
  }, [isLoaded, user, userData]);

  // 닉네임 중복 확인 함수
  const checkNickname = async (value: string) => {
    if (!value || value.length < 2) {
      setNicknameStatus({ available: null, message: "" });
      return;
    }

    // 현재 닉네임과 같으면 확인 불필요
    if (value === userData?.nickname) {
      setNicknameStatus({ available: true, message: "" });
      return;
    }

    setIsCheckingNickname(true);
    try {
      console.log("🔍 닉네임 중복 확인 요청:", value);
      const response = await fetch("/api/user/check-nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: value }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("✅ 닉네임 확인 결과:", data);
        setNicknameStatus({
          available: data.available,
          message: data.message,
        });
      } else {
        console.error("❌ 닉네임 확인 실패:", data);
        setNicknameStatus({
          available: false,
          message: data.error || "확인 중 오류가 발생했습니다.",
        });
      }
    } catch (error) {
      console.error("❌ 닉네임 확인 실패:", error);
      setNicknameStatus({
        available: false,
        message: "확인 중 오류가 발생했습니다.",
      });
    } finally {
      setIsCheckingNickname(false);
    }
  };

  // 닉네임 입력 시 디바운스된 중복 확인
  useEffect(() => {
    if (watchedNickname && watchedNickname.length >= 2) {
      const timeoutId = setTimeout(() => {
        checkNickname(watchedNickname);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setNicknameStatus({ available: null, message: "" });
    }
  }, [watchedNickname]);

  // 프로필 수정 제출
  const onSubmit = async (data: ProfileFormData) => {
    if (!user || !userData) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    // 닉네임 중복 확인
    if (data.nickname && data.nickname !== userData.nickname) {
      if (nicknameStatus.available === false) {
        toast.error("사용할 수 없는 닉네임입니다.");
        return;
      }

      if (data.nickname.length >= 2 && nicknameStatus.available === null) {
        toast.error("닉네임 중복 확인을 완료해주세요.");
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.group("📝 프로필 정보 업데이트 시작");
      console.log("업데이트할 정보:", data);

      // userTypes 배열을 문자열로 변환
      const userTypeString = combineUserTypes(data.userTypes);
      console.log("선택된 회원 유형:", data.userTypes);
      console.log("저장할 회원 유형:", userTypeString);

      const response = await fetch("/api/user/update-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname: data.nickname || undefined,
          business_name: data.business_name,
          phone: data.phone || undefined,
          user_type: userTypeString,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ 프로필 업데이트 실패:", result);
        throw new Error(result.error || "프로필 업데이트에 실패했습니다.");
      }

      console.log("✅ 프로필 업데이트 성공:", result);
      console.groupEnd();

      toast.success("프로필이 업데이트되었습니다.");
      setUserData(result.user);
      setIsEditing(false);
      setNicknameStatus({ available: null, message: "" });
    } catch (err) {
      console.error("❌ 프로필 업데이트 에러:", err);
      setError(
        err instanceof Error ? err.message : "프로필 업데이트에 실패했습니다.",
      );
      toast.error(
        err instanceof Error ? err.message : "프로필 업데이트에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 사용자 정보 카드 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>사용자 정보</CardTitle>
                <CardDescription>기본 사용자 정보입니다.</CardDescription>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  수정
                </Button>
              )}
            </div>
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
              isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* 닉네임 */}
                  <div className="space-y-2">
                    <label
                      htmlFor="nickname"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      닉네임
                    </label>
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <Input
                          id="nickname"
                          placeholder="닉네임을 입력해주세요 (2-20자)"
                          {...register("nickname")}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNickname(value);
                            register("nickname").onChange(e);
                          }}
                          aria-invalid={errors.nickname ? "true" : "false"}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            checkNickname(nickname || watchedNickname || "")
                          }
                          disabled={
                            isCheckingNickname ||
                            (nickname || watchedNickname || "").length < 2
                          }
                        >
                          {isCheckingNickname ? "확인 중..." : "중복 확인"}
                        </Button>
                      </div>
                      {nicknameStatus.message && (
                        <p
                          className={`text-sm ${
                            nicknameStatus.available
                              ? "text-green-600"
                              : nicknameStatus.available === false
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }`}
                        >
                          {nicknameStatus.message}
                        </p>
                      )}
                      {errors.nickname && (
                        <p className="text-sm text-destructive">
                          {errors.nickname.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 상호명 */}
                  <div className="space-y-2">
                    <label
                      htmlFor="business_name"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      상호명 <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="business_name"
                      {...register("business_name")}
                      aria-invalid={errors.business_name ? "true" : "false"}
                    />
                    {errors.business_name && (
                      <p className="text-sm text-destructive">
                        {errors.business_name.message}
                      </p>
                    )}
                  </div>

                  {/* 전화번호 */}
                  <div className="space-y-2">
                    <label
                      htmlFor="phone"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      전화번호
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="010-1234-5678"
                      {...register("phone")}
                      aria-invalid={errors.phone ? "true" : "false"}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* 회원 유형 선택 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      회원 유형 <span className="text-destructive">*</span>
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={
                          userTypes.includes("vendor") ? "default" : "outline"
                        }
                        className="flex-1"
                        onClick={() => toggleUserType("vendor")}
                      >
                        {userTypes.includes("vendor") && (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        도매점
                      </Button>
                      <Button
                        type="button"
                        variant={
                          userTypes.includes("retailer") ? "default" : "outline"
                        }
                        className="flex-1"
                        onClick={() => toggleUserType("retailer")}
                      >
                        {userTypes.includes("retailer") && (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        소매점
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      하나 또는 둘 다 선택할 수 있습니다.
                    </p>
                    {errors.userTypes && (
                      <p className="text-sm text-destructive">
                        {errors.userTypes.message}
                      </p>
                    )}
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? "저장 중..." : "저장"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        const userTypes = getUserTypes(userData.user_type);
                        reset({
                          nickname: userData.nickname || "",
                          business_name: userData.business_name,
                          phone: userData.phone || "",
                          userTypes: userTypes,
                        });
                        setNicknameStatus({ available: null, message: "" });
                      }}
                      disabled={isSubmitting}
                    >
                      취소
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      이메일
                    </label>
                    <p className="mt-1 text-sm">{userData.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      닉네임
                    </label>
                    <p className="mt-1 text-sm">
                      {userData.nickname || "미입력"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      회원 유형
                    </label>
                    <p className="mt-1 text-sm">
                      {userData.user_type === "vendor"
                        ? "도매점"
                        : userData.user_type === "retailer"
                          ? "소매점"
                          : "도매점/소매점"}
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
              )
            ) : null}
          </CardContent>
        </Card>

        {/* 주문 현황 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>주문 현황</CardTitle>
            <CardDescription>
              {userData?.user_type === "vendor"
                ? "받은 주문 내역"
                : "주문 내역"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ordersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-4">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  주문 내역이 없습니다.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {orders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-2 rounded-md border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          주문 #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {order.total_price.toLocaleString()}원
                        </p>
                        <p
                          className={`text-xs ${
                            order.status === "confirmed"
                              ? "text-green-600"
                              : order.status === "cancelled"
                                ? "text-red-600"
                                : "text-yellow-600"
                          }`}
                        >
                          {order.status === "confirmed"
                            ? "확인됨"
                            : order.status === "cancelled"
                              ? "취소"
                              : "대기중"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href={
                    userData?.user_type === "vendor"
                      ? "/vendor/orders"
                      : "/orders"
                  }
                >
                  <Button variant="outline" className="w-full" size="sm">
                    전체 주문 보기
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
