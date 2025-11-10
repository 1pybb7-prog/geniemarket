"use client";

/**
 * @file SearchBar.tsx
 * @description 검색 입력창 컴포넌트
 *
 * 상품 검색을 위한 검색 입력창 컴포넌트입니다.
 * 검색 아이콘과 입력 필드를 포함합니다.
 */

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export function SearchBar({
  className,
  placeholder = "상품 검색...",
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("[SearchBar] 검색 실행:", searchQuery);
      // TODO: 검색 페이지로 이동 또는 검색 API 호출
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className || ""}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9 pr-4 w-full"
      />
    </form>
  );
}
