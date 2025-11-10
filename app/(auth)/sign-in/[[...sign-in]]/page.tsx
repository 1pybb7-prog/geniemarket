/**
 * @file app/(auth)/sign-in/[[...sign-in]]/page.tsx
 * @description Clerk 로그인 페이지
 *
 * 이 페이지는 Clerk의 SignIn 컴포넌트를 사용하여 로그인 기능을 제공합니다.
 * Clerk가 자동으로 인증 상태 관리, 세션 관리 등을 처리합니다.
 *
 * 주요 기능:
 * 1. 이메일/비밀번호 로그인
 * 2. 소셜 로그인 (Google, GitHub 등 - Clerk 대시보드에서 설정)
 * 3. 비밀번호 찾기
 *
 * @see {@link https://clerk.com/docs/components/authentication/sign-in} - Clerk SignIn 컴포넌트 문서
 */

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/"
      />
    </div>
  );
}

