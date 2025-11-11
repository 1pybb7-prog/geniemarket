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
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** form 태그를 사용하지 않을지 여부 (부모 form과 중첩 방지) */
  noForm?: boolean;
}

export function SearchBar({
  className,
  placeholder = "상품 검색...",
  value: controlledValue,
  onChange: controlledOnChange,
  onKeyDown,
  noForm = false,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState("");
  const router = useRouter();

  // controlled 또는 uncontrolled 모드 지원
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  const setValue = isControlled
    ? controlledOnChange
      ? (e: React.ChangeEvent<HTMLInputElement>) => {
          controlledOnChange(e);
        }
      : undefined
    : (e: React.ChangeEvent<HTMLInputElement>) => {
        setInternalValue(e.target.value);
      };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // onKeyDown 핸들러가 있으면 기본 동작(라우팅)을 막음
    // 이는 시세 조회 페이지 등에서 API 호출을 직접 처리하기 위함
    if (onKeyDown) {
      return;
    }
    if (value.trim()) {
      console.log("[SearchBar] 검색 실행:", value);
      // TODO: 검색 페이지로 이동 또는 검색 API 호출
      router.push(`/products?search=${encodeURIComponent(value)}`);
    }
  };

  const inputElement = (
    <>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={setValue}
        onKeyDown={onKeyDown}
        className="pl-9 pr-4 w-full"
      />
    </>
  );

  // form을 사용하지 않는 경우 (부모 form과 중첩 방지)
  if (noForm) {
    return <div className={`relative ${className || ""}`}>{inputElement}</div>;
  }

  // 기본: form 사용
  return (
    <form onSubmit={handleSubmit} className={`relative ${className || ""}`}>
      {inputElement}
    </form>
  );
}
