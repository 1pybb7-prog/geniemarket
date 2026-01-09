"use client";

/**
 * @file components/chat/FloatingChatBot.tsx
 * @description 플로팅 챗봇 버튼 컴포넌트
 *
 * 우측 하단에 고정된 말풍선 버튼으로, 클릭하면 챗봇 다이얼로그가 열립니다.
 * 모든 페이지에서 표시되도록 RootLayout에 추가됩니다.
 *
 * 주요 기능:
 * 1. 우측 하단에 고정된 플로팅 버튼
 * 2. 클릭 시 챗봇 다이얼로그 열기
 * 3. 다이얼로그 내부에 ChatBot 컴포넌트 표시
 *
 * @dependencies
 * - @/components/ui/dialog: Dialog 컴포넌트
 * - @/components/ui/button: Button 컴포넌트
 * - @/components/chat/ChatBot: ChatBot 컴포넌트
 * - lucide-react: MessageCircle 아이콘
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChatBot } from "./ChatBot";
import { MessageCircle } from "lucide-react";

export function FloatingChatBot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 플로팅 버튼 */}
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
        aria-label="챗봇 열기"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* 챗봇 다이얼로그 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] flex flex-col p-0 fixed bottom-24 right-6 top-auto left-auto translate-x-0 translate-y-0 sm:max-w-md">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle>AI 챗봇</DialogTitle>
            <DialogDescription>
              궁금한 것을 물어보세요. AI가 도와드립니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden px-6 pb-6 min-h-0">
            <ChatBot />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

