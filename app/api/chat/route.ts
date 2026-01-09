import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * @file app/api/chat/route.ts
 * @description AI 챗봇 API 라우트
 *
 * 이 API는 사용자의 메시지를 받아서 n8n 웹훅으로 전달하고,
 * n8n에서 받은 AI 응답을 클라이언트에 반환합니다.
 *
 * 주요 기능:
 * 1. 사용자 인증 확인
 * 2. 사용자 메시지를 n8n 웹훅으로 전달
 * 3. n8n에서 받은 AI 응답 반환
 *
 * 핵심 구현 로직:
 * - Clerk auth() 함수로 사용자 인증 확인
 * - n8n 웹훅 URL은 환경변수에서 가져옴 (서버 사이드만 접근)
 * - POST 요청으로 사용자 메시지를 n8n에 전달
 * - n8n 응답을 그대로 클라이언트에 반환
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 *
 * @see {@link components/chat/ChatBot.tsx} - 챗봇 UI 컴포넌트
 */

/**
 * POST /api/chat
 * 챗봇 메시지 전송 및 응답 받기
 *
 * Request Body:
 * {
 *   message: string;
 *   conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
 * }
 *
 * Response:
 * {
 *   response: string;
 * }
 */
export async function POST(request: Request) {
  try {
    console.group("💬 챗봇 API 시작");

    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증되지 않은 사용자");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ 인증된 사용자 ID:", userId);

    // 요청 본문 파싱
    const body = await request.json();
    const { message, conversationHistory } = body;

    console.log("📝 사용자 메시지:", message);
    console.log("📚 대화 이력 길이:", conversationHistory?.length || 0);

    // 입력 검증
    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      console.error("❌ 메시지가 비어있음");
      console.groupEnd();
      return NextResponse.json(
        { error: "메시지를 입력해주세요." },
        { status: 400 },
      );
    }

    // n8n 웹훅 URL 가져오기 (환경변수)
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error("❌ n8n 웹훅 URL이 설정되지 않음");
      console.groupEnd();
      return NextResponse.json(
        { error: "챗봇 서비스가 설정되지 않았습니다." },
        { status: 500 },
      );
    }

    console.log("🔗 n8n 웹훅 URL:", webhookUrl);

    // n8n 웹훅으로 메시지 전달
    console.log("📤 n8n으로 메시지 전송 중...");
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message.trim(),
        userId: userId,
        conversationHistory: conversationHistory || [],
      }),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("❌ n8n 웹훅 응답 실패:", {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        error: errorText,
      });
      console.groupEnd();
      return NextResponse.json(
        {
          error: "챗봇 응답을 받는 중 오류가 발생했습니다.",
          details: `n8n 응답 오류: ${webhookResponse.status} ${webhookResponse.statusText}`,
        },
        { status: 500 },
      );
    }

    // n8n 응답 파싱
    const webhookData = await webhookResponse.json();
    console.log("✅ n8n 응답 받음:", webhookData);

    // 응답 형식 확인 및 추출
    let aiResponse: string;

    // 배열 형식 처리: [{"response":"..."}]
    if (Array.isArray(webhookData) && webhookData.length > 0) {
      const firstItem = webhookData[0];
      if (typeof firstItem === "object" && firstItem !== null) {
        aiResponse =
          firstItem.response ||
          firstItem.message ||
          firstItem.text ||
          JSON.stringify(firstItem);
      } else {
        aiResponse = String(firstItem);
      }
    } else if (typeof webhookData === "string") {
      aiResponse = webhookData;
    } else if (webhookData.response) {
      aiResponse = webhookData.response;
    } else if (webhookData.message) {
      aiResponse = webhookData.message;
    } else if (webhookData.text) {
      aiResponse = webhookData.text;
    } else {
      // 객체인 경우 JSON 문자열로 변환
      aiResponse = JSON.stringify(webhookData);
    }

    // 마크다운 포맷팅 제거 (자연스러운 텍스트로 변환)
    // **텍스트** → 텍스트로 변환
    aiResponse = aiResponse.replace(/\*\*(.+?)\*\*/g, "$1");

    console.log("💬 AI 응답 추출 완료 (마크다운 제거 후):", aiResponse);
    console.groupEnd();

    return NextResponse.json({
      response: aiResponse,
    });
  } catch (error) {
    console.error("❌ 챗봇 API 에러:", error);
    return NextResponse.json(
      {
        error: "챗봇 응답 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
