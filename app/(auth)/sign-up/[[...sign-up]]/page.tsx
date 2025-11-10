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
 *
 * @see {@link https://clerk.com/docs/components/authentication/sign-up} - Clerk SignUp 컴포넌트 문서
 */

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
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
        signInUrl="/sign-in"
        afterSignUpUrl="/"
      />
    </div>
  );
}

