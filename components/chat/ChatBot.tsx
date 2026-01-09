"use client";

/**
 * @file components/chat/ChatBot.tsx
 * @description AI 챗봇 UI 컴포넌트
 *
 * 사용자가 AI 챗봇과 대화할 수 있는 채팅 인터페이스를 제공합니다.
 *
 * 주요 기능:
 * 1. 사용자 메시지 입력 및 전송
 * 2. 대화 내역 표시 (사용자 메시지 + AI 응답)
 * 3. 로딩 상태 표시
 * 4. 자동 스크롤 (새 메시지가 추가될 때)
 *
 * 핵심 구현 로직:
 * - React 상태로 메시지 목록 관리
 * - /api/chat 엔드포인트로 메시지 전송
 * - 대화 이력을 유지하여 컨텍스트 보존
 * - 메시지 전송 중에는 입력 비활성화
 *
 * @dependencies
 * - @/components/ui/button: Button
 * - @/components/ui/textarea: Textarea
 * - @/components/ui/card: Card
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "안녕하세요! 무엇을 도와드릴까요?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 새 메시지가 추가될 때 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enter 키로 전송 (Shift+Enter는 줄바꿈)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 메시지 전송
  const handleSend = async () => {
    const message = input.trim();
    if (!message || isLoading) return;

    console.group("💬 챗봇 메시지 전송");
    console.log("📝 사용자 메시지:", message);

    // 사용자 메시지를 UI에 추가
    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // 대화 이력 준비 (API에 전달할 형식)
    const conversationHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      // API 호출
      console.log("📤 API 호출 중...");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          conversationHistory: conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API 응답 오류:", errorData);
        throw new Error(errorData.error || "응답을 받는 중 오류가 발생했습니다.");
      }

      const data = await response.json();
      console.log("✅ AI 응답 받음:", data);

      // AI 응답을 UI에 추가
      const aiMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      console.log("💬 메시지 추가 완료");
    } catch (error) {
      console.error("❌ 메시지 전송 오류:", error);
      // 에러 메시지 표시
      const errorMessage: Message = {
        role: "assistant",
        content: `죄송합니다. 오류가 발생했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      console.groupEnd();
      // 포커스 다시 맞추기
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 메시지 영역 */}
      <Card className="flex-1 overflow-y-auto p-4 mb-4 bg-muted/30">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-background border rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">응답 중...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* 입력 영역 */}
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
          disabled={isLoading}
          className="resize-none"
          rows={3}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="h-auto"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}

