"use client";

/**
 * @file VendorSidebar.tsx
 * @description 도매점 사이드바 컴포넌트 (Desktop)
 *
 * Desktop 화면에서 표시되는 도매점 전용 사이드바 네비게이션입니다.
 * 홈, 내 상품, 상품 등록, 주문 관리, 시세 참고, 마이페이지 메뉴를 포함하며, 현재 페이지를 하이라이트합니다.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, TrendingUp, FileText, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/vendor", label: "홈", icon: Home },
  { href: "/vendor/products", label: "내 상품", icon: Package },
  { href: "/vendor/products/new", label: "상품 등록", icon: Plus },
  { href: "/vendor/orders", label: "주문 관리", icon: FileText },
  { href: "/vendor/market-prices", label: "시세 참고", icon: TrendingUp },
  { href: "/profile", label: "마이페이지", icon: User },
];

export function VendorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r bg-background">
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

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
