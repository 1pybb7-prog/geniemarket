"use client";

/**
 * @file Header.tsx
 * @description 헤더 컴포넌트
 *
 * 로고, 검색창, 마이페이지, 로그인 버튼을 포함하는 헤더 컴포넌트입니다.
 * Clerk의 UserButton을 사용하여 사용자 인증 상태를 표시합니다.
 */

import Link from "next/link";
import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";
import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4 px-4">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Image
            src="/logo.png"
            alt="로고"
            width={32}
            height={32}
            className="rounded"
          />
          <span className="hidden sm:inline-block">도소매 가격비교</span>
        </Link>

        {/* 검색창 (Desktop에서만 표시) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <SearchBar />
        </div>

        {/* 우측 메뉴 */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile 검색 아이콘 (Mobile에서만 표시) */}
          <div className="md:hidden">
            <SearchBar className="w-48" />
          </div>

          {/* 로그인/사용자 버튼 */}
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">
                로그인
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
