"use client";

/**
 * @file VendorMobileNav.tsx
 * @description 도매점 하단 네비게이션 컴포넌트 (Mobile)
 *
 * Mobile 화면에서 표시되는 도매점 전용 하단 네비게이션입니다.
 * 홈, 내 상품, 주문 관리, 시세 참고, 마이페이지 메뉴를 포함하며, 현재 페이지를 하이라이트합니다.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, TrendingUp, FileText, User, Plus } from "lucide-react";
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

export function VendorMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("size-5", isActive && "fill-current")} />
              <span className="text-xs truncate w-full text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
