/**
 * @file app/(main)/chat/page.tsx
 * @description AI 챗봇 페이지
 *
 * 사용자가 AI 챗봇과 대화할 수 있는 페이지입니다.
 * 로그인한 사용자만 접근 가능합니다.
 *
 * 주요 기능:
 * 1. 챗봇 UI 표시
 * 2. 사용자와 AI의 대화 내역 관리
 *
 * @dependencies
 * - @/components/chat/ChatBot: ChatBot 컴포넌트
 */

import { ChatBot } from "@/components/chat/ChatBot";

export default function ChatPage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI 챗봇</h1>
        <p className="text-muted-foreground">
          궁금한 것을 물어보세요. AI가 도와드립니다.
        </p>
      </div>
      <ChatBot />
    </div>
  );
}

