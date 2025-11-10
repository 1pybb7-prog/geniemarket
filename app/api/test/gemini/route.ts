/**
 * @file app/api/test/gemini/route.ts
 * @description Gemini API 테스트용 엔드포인트
 *
 * 이 엔드포인트는 Gemini API가 정상적으로 작동하는지 테스트하기 위한 것입니다.
 * 브라우저에서 프롬프트를 입력하고 표준화 결과를 확인할 수 있습니다.
 *
 * 사용 방법:
 * POST /api/test/gemini
 * Body: { originalName: "청양고추 1키로" }
 */

import { NextRequest, NextResponse } from "next/server";
import { standardizeProductName } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  console.group("🧪 Gemini API 테스트 엔드포인트 호출");

  try {
    const body = await request.json();
    const { originalName } = body;

    if (!originalName || typeof originalName !== "string") {
      console.error("❌ 잘못된 요청: originalName이 필요합니다.");
      return NextResponse.json(
        { error: "originalName (문자열)이 필요합니다." },
        { status: 400 },
      );
    }

    console.log("📝 테스트 상품명:", originalName);

    // Gemini API 호출
    const standardizedName = await standardizeProductName(originalName);

    console.log("✅ 테스트 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      originalName,
      standardizedName,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ 테스트 실패:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    );
  }
}

// GET 요청도 지원 (간단한 테스트용)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const originalName = searchParams.get("name") || "청양고추 1키로";

  console.group("🧪 Gemini API 테스트 (GET)");
  console.log("📝 테스트 상품명:", originalName);

  try {
    const standardizedName = await standardizeProductName(originalName);

    console.log("✅ 테스트 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      originalName,
      standardizedName,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ 테스트 실패:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    );
  }
}
