/**
 * @file app/api/user/update-metadata/route.ts
 * @description Clerk 사용자 publicMetadata 업데이트 API
 *
 * 이 API는 Clerk 사용자의 publicMetadata를 업데이트합니다.
 * 회원가입 완료 후 추가 정보(회원 유형, 상호명, 전화번호)를 저장하는 데 사용됩니다.
 *
 * 주요 기능:
 * 1. Clerk 인증 확인
 * 2. publicMetadata 업데이트
 * 3. 로그 출력
 *
 * @dependencies
 * - @clerk/nextjs/server: auth, clerkClient
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.group("📝 Clerk publicMetadata 업데이트 시작");

    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증되지 않은 사용자입니다.");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("👤 사용자 ID:", userId);

    // 요청 본문 가져오기
    const body = await req.json();
    const { publicMetadata } = body;

    if (!publicMetadata) {
      console.error("❌ publicMetadata가 제공되지 않았습니다.");
      console.groupEnd();
      return NextResponse.json(
        { error: "publicMetadata is required" },
        { status: 400 }
      );
    }

    console.log("📦 업데이트할 publicMetadata:", JSON.stringify(publicMetadata, null, 2));

    // Clerk 클라이언트 가져오기
    const client = await clerkClient();

    // publicMetadata 업데이트
    const updatedUser = await client.users.updateUser(userId, {
      publicMetadata: publicMetadata,
    });

    console.log("✅ publicMetadata 업데이트 성공");
    console.log("📦 업데이트된 publicMetadata:", JSON.stringify(updatedUser.publicMetadata, null, 2));
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "Metadata updated successfully",
      user: {
        id: updatedUser.id,
        publicMetadata: updatedUser.publicMetadata,
      },
    });
  } catch (error) {
    console.error("❌ publicMetadata 업데이트 실패:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Failed to update metadata",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

