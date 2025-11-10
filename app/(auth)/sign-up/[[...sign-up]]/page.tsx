/**
 * @file app/(auth)/sign-up/[[...sign-up]]/page.tsx
 * @description Clerk 회원가입 페이지
 *
 * 이 페이지는 Clerk의 SignUp 컴포넌트를 사용하여 회원가입 기능을 제공합니다.
 * Clerk가 자동으로 이메일 인증, 비밀번호 검증 등을 처리합니다.
 *
 * 주요 기능:
 * 1. 이메일/비밀번호 회원가입
 * 2. 소셜 로그인 (Google, GitHub 등 - Clerk 대시보드에서 설정)
 * 3. 이메일 인증
 * 4. 역할(role) 쿼리 파라미터를 받아서 회원가입 완료 페이지로 전달
 *
 * @see {@link https://clerk.com/docs/components/authentication/sign-up} - Clerk SignUp 컴포넌트 문서
 */

import { SignUp } from "@clerk/nextjs";

interface SignUpPageProps {
  searchParams: Promise<{ role?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const role = params.role;

  console.log("[SignUpPage] 회원가입 페이지 렌더링, 역할:", role);

  // 역할이 있으면 회원가입 완료 URL에 전달
  const afterSignUpUrl = role
    ? `/sign-up/complete?role=${role}`
    : "/sign-up/complete";

  // 역할이 있으면 로그인 URL에도 전달
  const signInUrl = role ? `/sign-in?role=${role}` : "/sign-in";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl={signInUrl}
        afterSignUpUrl={afterSignUpUrl}
      />
    </div>
  );
}
