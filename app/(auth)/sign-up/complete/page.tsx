"use client";

/**
 * @file app/(auth)/sign-up/complete/page.tsx
 * @description 회원가입 완료 후 추가 정보 입력 페이지
 *
 * 이 페이지는 Clerk 회원가입 완료 후 추가 정보를 입력받습니다.
 * 회원 유형(도매점/소매점), 닉네임, 상호명, 전화번호를 입력받아 Clerk의 publicMetadata에 저장합니다.
 *
 * 주요 기능:
 * 1. 회원 유형 선택 (도매점/소매점)
 * 2. 닉네임 입력 및 중복 확인
 * 3. 사업자 정보 입력 (상호명, 전화번호)
 * 4. publicMetadata에 user_type, nickname 저장
 * 5. Supabase users 테이블 업데이트
 *
 * @dependencies
 * - @clerk/nextjs: useUser, useAuth
 * - react-hook-form: 폼 관리
 * - zod: 유효성 검사
 */

import { useState, useEffect, Suspense } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { UserType, combineUserTypes } from "@/lib/types";

// 유효성 검사 스키마
const completeSignUpSchema = z.object({
  userTypes: z
    .array(z.enum(["vendor", "retailer"]))
    .min(1, "최소 하나의 회원 유형을 선택해주세요."),
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다.")
    .max(20, "닉네임은 20자 이하여야 합니다.")
    .regex(
      /^[a-zA-Z0-9가-힣_]+$/,
      "닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다.",
    ),
  businessName: z.string().min(1, "상호명을 입력해주세요."),
  phone: z
    .string()
    .min(1, "전화번호를 입력해주세요.")
    .regex(/^[0-9-]+$/, "전화번호 형식이 올바르지 않습니다."),
});

type CompleteSignUpForm = z.infer<typeof completeSignUpSchema>;

// useSearchParams를 사용하는 내부 컴포넌트
function CompleteSignUpFormContent() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useClerkSupabaseClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState<{
    available: boolean | null;
    message: string;
  }>({ available: null, message: "" });

  // URL에서 역할 정보 가져오기
  const roleFromUrl = searchParams.get("role") as UserType | null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompleteSignUpForm>({
    resolver: zodResolver(completeSignUpSchema),
    defaultValues: {
      userTypes:
        roleFromUrl && ["vendor", "retailer"].includes(roleFromUrl)
          ? [roleFromUrl as "vendor" | "retailer"]
          : [],
      nickname: "",
      businessName: "",
      phone: "",
    },
  });

  const userTypes = watch("userTypes") || [];
  const watchedNickname = watch("nickname");

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

  // 닉네임 중복 확인 함수
  const checkNickname = async (value: string) => {
    if (value.length < 2) {
      setNicknameStatus({ available: null, message: "" });
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
      }, 500); // 500ms 디바운스

      return () => clearTimeout(timeoutId);
    } else {
      setNicknameStatus({ available: null, message: "" });
    }
  }, [watchedNickname]);

  // URL에서 역할 정보가 있으면 기본값으로 설정
  useEffect(() => {
    if (roleFromUrl && ["vendor", "retailer"].includes(roleFromUrl)) {
      console.log("[CompleteSignUpPage] URL에서 역할 정보 받음:", roleFromUrl);
      setValue("userTypes", [roleFromUrl as "vendor" | "retailer"]);
    }
  }, [roleFromUrl, setValue]);

  // 회원가입이 완료되지 않은 경우 리다이렉트
  useEffect(() => {
    if (isLoaded && !user) {
      console.log(
        "❌ 로그인되지 않은 사용자입니다. 로그인 페이지로 리다이렉트합니다.",
      );
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  // 이미 정보가 입력된 경우 홈으로 리다이렉트
  useEffect(() => {
    async function checkUserInfo() {
      if (isLoaded && user) {
        const userType = user.publicMetadata?.user_type;
        const nickname = user.publicMetadata?.nickname;

        // Supabase에서도 확인
        const { data: userData } = await supabase
          .from("users")
          .select("user_type, nickname")
          .eq("id", user.id)
          .single();

        if (
          (userType || userData?.user_type) &&
          (nickname || userData?.nickname)
        ) {
          console.log(
            "✅ 이미 추가 정보가 입력되었습니다. 홈으로 리다이렉트합니다.",
          );
          router.push("/");
        }
      }
    }

    checkUserInfo();
  }, [isLoaded, user, router, supabase]);

  const onSubmit = async (data: CompleteSignUpForm) => {
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // 닉네임 중복 확인
    if (nicknameStatus.available === false) {
      setError("사용할 수 없는 닉네임입니다. 다른 닉네임을 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    // 닉네임이 아직 확인되지 않은 경우
    if (
      data.nickname &&
      data.nickname.length >= 2 &&
      nicknameStatus.available === null
    ) {
      setError("닉네임 중복 확인을 완료해주세요.");
      setIsSubmitting(false);
      return;
    }

    try {
      console.group("📝 회원가입 추가 정보 저장 시작");

      // userTypes 배열을 문자열로 변환
      const userTypeString = combineUserTypes(data.userTypes);
      console.log("선택된 회원 유형:", data.userTypes);
      console.log("저장할 회원 유형:", userTypeString);
      console.log("닉네임:", data.nickname);
      console.log("상호명:", data.businessName);
      console.log("전화번호:", data.phone);

      // 1. Clerk publicMetadata 업데이트
      const token = await getToken();
      if (!token) {
        throw new Error("인증 토큰을 가져올 수 없습니다.");
      }

      const response = await fetch("/api/user/update-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicMetadata: {
            user_type: userTypeString,
            nickname: data.nickname,
            business_name: data.businessName,
            phone: data.phone,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "메타데이터 업데이트 실패");
      }

      console.log("✅ Clerk publicMetadata 업데이트 성공");

      // 2. Supabase users 테이블 업데이트
      const { error: supabaseError } = await supabase
        .from("users")
        .update({
          user_type: userTypeString,
          nickname: data.nickname,
          business_name: data.businessName,
          phone: data.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (supabaseError) {
        console.error("❌ Supabase 업데이트 실패:", supabaseError);
        throw new Error("사용자 정보 업데이트 실패");
      }

      console.log("✅ Supabase users 테이블 업데이트 성공");
      console.groupEnd();

      // 3. 홈으로 리다이렉트
      router.push("/");
    } catch (err) {
      console.error("❌ 회원가입 추가 정보 저장 실패:", err);
      setError(
        err instanceof Error
          ? err.message
          : "정보 저장 중 오류가 발생했습니다.",
      );
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">추가 정보 입력</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            회원가입을 완료하기 위해 추가 정보를 입력해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 회원 유형 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              회원 유형 <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={userTypes.includes("vendor") ? "default" : "outline"}
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
                variant={userTypes.includes("retailer") ? "default" : "outline"}
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

          {/* 닉네임 입력 */}
          <div className="space-y-2">
            <label htmlFor="nickname" className="text-sm font-medium">
              닉네임 <span className="text-destructive">*</span>
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
                  onClick={() => checkNickname(nickname || watchedNickname)}
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
              <p className="text-xs text-muted-foreground">
                한글, 영문, 숫자, 언더스코어만 사용 가능합니다.
              </p>
            </div>
          </div>

          {/* 상호명 입력 */}
          <div className="space-y-2">
            <label htmlFor="businessName" className="text-sm font-medium">
              상호명 <span className="text-destructive">*</span>
            </label>
            <Input
              id="businessName"
              placeholder="상호명을 입력해주세요"
              {...register("businessName")}
              aria-invalid={errors.businessName ? "true" : "false"}
            />
            {errors.businessName && (
              <p className="text-sm text-destructive">
                {errors.businessName.message}
              </p>
            )}
          </div>

          {/* 전화번호 입력 */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              전화번호 <span className="text-destructive">*</span>
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="010-1234-5678"
              {...register("phone")}
              aria-invalid={errors.phone ? "true" : "false"}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* 제출 버튼 */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "완료"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// Suspense로 감싼 메인 컴포넌트
export default function CompleteSignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-lg">로딩 중...</p>
          </div>
        </div>
      }
    >
      <CompleteSignUpFormContent />
    </Suspense>
  );
}
