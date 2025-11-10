/**
 * @file layout.tsx
 * @description 메인 레이아웃 컴포넌트
 *
 * Header + Sidebar + Main Content 구조의 반응형 레이아웃입니다.
 * Desktop: Sidebar 표시, Mobile: 하단 네비게이션 표시
 */

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
