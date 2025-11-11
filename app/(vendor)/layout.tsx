/**
 * @file layout.tsx
 * @description 도매점 레이아웃 컴포넌트
 *
 * Header + Sidebar + Main Content 구조의 반응형 레이아웃입니다.
 * Desktop: Sidebar 표시, Mobile: 하단 네비게이션 표시
 * 도매점 전용 네비게이션 메뉴를 포함합니다.
 */

import { Header } from "@/components/layout/Header";
import { VendorSidebar } from "@/components/layout/VendorSidebar";
import { VendorMobileNav } from "@/components/layout/VendorMobileNav";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <VendorSidebar />
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
      </div>
      <VendorMobileNav />
    </div>
  );
}
