"use client";

/**
 * @file MobileNav.tsx
 * @description 하단 네비게이션 컴포넌트 (Mobile)
 *
 * Mobile 화면에서 표시되는 하단 네비게이션입니다.
 * 홈, 상품, 시세, 주문, 마이페이지 메뉴를 포함하며, 현재 페이지를 하이라이트합니다.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, TrendingUp, FileText, User, MessageCircle } from "lucide-react";
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
  { href: "/orders", label: "주문", icon: FileText },
  { href: "/chat", label: "챗봇", icon: MessageCircle },
  { href: "/profile", label: "마이페이지", icon: User },
];

export function MobileNav() {
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
