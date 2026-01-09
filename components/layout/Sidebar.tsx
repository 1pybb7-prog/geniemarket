"use client";

/**
 * @file Sidebar.tsx
 * @description 사이드바 컴포넌트 (Desktop)
 *
 * Desktop 화면에서 표시되는 사이드바 네비게이션입니다.
 * 홈, 상품, 시세, 주문, 마이페이지 메뉴를 포함하며, 현재 페이지를 하이라이트합니다.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, TrendingUp, FileText, User, MessageCircle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/", label: "홈", icon: Home },
  { href: "/products", label: "상품", icon: Package },
  { href: "/market-prices", label: "시세", icon: TrendingUp },
  { href: "/market-prices/kamis", label: "KAMIS 시세", icon: BarChart3 },
  { href: "/orders", label: "주문", icon: FileText },
  { href: "/chat", label: "AI 챗봇", icon: MessageCircle },
  { href: "/profile", label: "마이페이지", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  // 활성 상태 확인 함수: 더 정확한 경로 매칭
  const isItemActive = (itemHref: string) => {
    // 정확히 일치하는 경우
    if (pathname === itemHref) {
      return true;
    }

    // 자식 경로인 경우 확인 (다른 메뉴 항목의 경로와 겹치지 않는지 확인)
    if (pathname.startsWith(`${itemHref}/`)) {
      // 다른 메뉴 항목의 경로가 현재 경로와 정확히 일치하거나 더 긴 prefix인지 확인
      const otherItems = navItems.filter((item) => item.href !== itemHref);
      const hasMoreSpecificMatch = otherItems.some(
        (item) =>
          pathname === item.href ||
          (item.href.startsWith(itemHref) &&
            pathname.startsWith(`${item.href}/`)),
      );

      // 더 구체적인 매치가 없으면 활성화
      return !hasMoreSpecificMatch;
    }

    return false;
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r bg-background">
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
