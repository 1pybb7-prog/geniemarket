"use client";

/**
 * @file app/(auth)/sign-up/complete/page.tsx
 * @description 회원가입 완료 후 추가 정보 입력 페이지
 *
 * 이 페이지는 Clerk 회원가입 완료 후 추가 정보를 입력받습니다.
 * 회원 유형(도매점/소매점), 상호명, 전화번호를 입력받아 Clerk의 publicMetadata에 저장합니다.
 *
 * 주요 기능:
 * 1. 회원 유형 선택 (도매점/소매점)
 * 2. 사업자 정보 입력 (상호명, 전화번호)
 * 3. publicMetadata에 user_type 저장
 * 4. Supabase users 테이블 업데이트
 *
 * @dependencies
 * - @clerk/nextjs: useUser, useAuth
 * - react-hook-form: 폼 관리
 * - zod: 유효성 검사
 */

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { UserType } from "@/lib/types";

// 유효성 검사 스키마
const completeSignUpSchema = z.object({
  userType: z.enum(["vendor", "retailer"], {
    required_error: "회원 유형을 선택해주세요.",
  }),
  businessName: z.string().min(1, "상호명을 입력해주세요."),
  phone: z
    .string()
    .min(1, "전화번호를 입력해주세요.")
    .regex(/^[0-9-]+$/, "전화번호 형식이 올바르지 않습니다."),
});

type CompleteSignUpForm = z.infer<typeof completeSignUpSchema>;

export default function CompleteSignUpPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useClerkSupabaseClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      userType:
        roleFromUrl && ["vendor", "retailer"].includes(roleFromUrl)
          ? roleFromUrl
          : undefined,
      businessName: "",
      phone: "",
    },
  });

  const userType = watch("userType");

  // URL에서 역할 정보가 있으면 기본값으로 설정
  useEffect(() => {
    if (roleFromUrl && ["vendor", "retailer"].includes(roleFromUrl)) {
      console.log("[CompleteSignUpPage] URL에서 역할 정보 받음:", roleFromUrl);
      setValue("userType", roleFromUrl as "vendor" | "retailer");
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
    if (isLoaded && user) {
      const userType = user.publicMetadata?.user_type;
      if (userType) {
        console.log(
          "✅ 이미 추가 정보가 입력되었습니다. 홈으로 리다이렉트합니다.",
        );
        router.push("/");
      }
    }
  }, [isLoaded, user, router]);

  const onSubmit = async (data: CompleteSignUpForm) => {
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.group("📝 회원가입 추가 정보 저장 시작");
      console.log("회원 유형:", data.userType);
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
            user_type: data.userType,
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
          user_type: data.userType,
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
            <label htmlFor="userType" className="text-sm font-medium">
              회원 유형 <span className="text-destructive">*</span>
            </label>
            <Select
              value={userType}
              onValueChange={(value) =>
                setValue("userType", value as "vendor" | "retailer")
              }
            >
              <SelectTrigger id="userType">
                <SelectValue placeholder="회원 유형을 선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retailer">소매점</SelectItem>
                <SelectItem value="vendor">도매점</SelectItem>
              </SelectContent>
            </Select>
            {errors.userType && (
              <p className="text-sm text-destructive">
                {errors.userType.message}
              </p>
            )}
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
