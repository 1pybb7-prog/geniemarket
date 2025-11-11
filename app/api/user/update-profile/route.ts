/**
 * @file app/api/user/update-profile/route.ts
 * @description 사용자 프로필 정보 업데이트 API
 *
 * 이 API는 사용자의 프로필 정보(닉네임, 상호명, 전화번호)를 업데이트합니다.
 * 닉네임은 중복 확인 후 업데이트합니다.
 *
 * 주요 기능:
 * 1. Clerk 인증 확인
 * 2. 닉네임 중복 확인 (변경 시)
 * 3. Clerk publicMetadata 업데이트
 * 4. Supabase users 테이블 업데이트
 *
 * @dependencies
 * - @clerk/nextjs/server: auth, clerkClient
 * - @/lib/supabase/service-role: getServiceRoleClient
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export async function PATCH(req: Request) {
  try {
    console.group("📝 프로필 정보 업데이트 시작");

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
    const { nickname, business_name, phone, user_type } = body;

    console.log("📦 업데이트할 정보:", {
      nickname,
      business_name,
      phone,
      user_type,
    });

    const supabase = getServiceRoleClient();

    // 기존 사용자 정보 조회
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, nickname, business_name, phone")
      .eq("id", userId)
      .single();

    if (fetchError) {
      console.error("❌ 사용자 정보 조회 실패:", fetchError);
      console.groupEnd();
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    console.log("✅ 기존 사용자 정보:", existingUser);

    // 닉네임이 변경되는 경우 중복 확인
    if (nickname && nickname !== existingUser?.nickname) {
      const trimmedNickname = nickname.trim();

      // 닉네임 길이 검증
      if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
        console.error("❌ 닉네임 길이 오류:", trimmedNickname.length);
        console.groupEnd();
        return NextResponse.json(
          { error: "닉네임은 2자 이상 20자 이하여야 합니다." },
          { status: 400 },
        );
      }

      // 닉네임 형식 검증
      const nicknameRegex = /^[a-zA-Z0-9가-힣_]+$/;
      if (!nicknameRegex.test(trimmedNickname)) {
        console.error("❌ 닉네임 형식 오류:", trimmedNickname);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다.",
          },
          { status: 400 },
        );
      }

      // 중복 확인
      const { data: duplicateUser, error: duplicateError } = await supabase
        .from("users")
        .select("id")
        .eq("nickname", trimmedNickname)
        .neq("id", userId)
        .single();

      if (duplicateError && duplicateError.code !== "PGRST116") {
        console.error("❌ 닉네임 중복 확인 실패:", duplicateError);
        console.groupEnd();
        return NextResponse.json(
          { error: "닉네임 확인 중 오류가 발생했습니다." },
          { status: 500 },
        );
      }

      if (duplicateUser) {
        console.error("❌ 이미 사용 중인 닉네임입니다.");
        console.groupEnd();
        return NextResponse.json(
          { error: "이미 사용 중인 닉네임입니다." },
          { status: 400 },
        );
      }

      console.log("✅ 닉네임 중복 확인 완료");
    }

    // 업데이트할 데이터 준비
    const updateData: {
      nickname?: string;
      business_name?: string;
      phone?: string;
      user_type?: string;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (nickname !== undefined) {
      updateData.nickname = nickname.trim();
    }
    if (business_name !== undefined) {
      updateData.business_name = business_name;
    }
    if (phone !== undefined) {
      updateData.phone = phone || null;
    }
    if (user_type !== undefined) {
      // user_type 유효성 검사
      if (!["vendor", "retailer", "vendor/retailer"].includes(user_type)) {
        console.error("❌ 잘못된 user_type:", user_type);
        console.groupEnd();
        return NextResponse.json(
          { error: "잘못된 회원 유형입니다." },
          { status: 400 },
        );
      }
      updateData.user_type = user_type;
    }

    console.log("💾 Supabase 업데이트 데이터:", updateData);

    // Supabase users 테이블 업데이트
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Supabase 업데이트 실패:", updateError);
      console.groupEnd();
      return NextResponse.json(
        { error: "프로필 업데이트에 실패했습니다." },
        { status: 500 },
      );
    }

    console.log("✅ Supabase 업데이트 성공:", updatedUser);

    // Clerk publicMetadata 업데이트
    const client = await clerkClient();
    const currentUser = await client.users.getUser(userId);
    const currentMetadata = (currentUser.publicMetadata || {}) as {
      user_type?: string;
      nickname?: string;
      business_name?: string;
      phone?: string;
    };

    const newMetadata = {
      ...currentMetadata,
      ...(nickname !== undefined && { nickname: nickname.trim() }),
      ...(business_name !== undefined && { business_name }),
      ...(phone !== undefined && { phone }),
      ...(user_type !== undefined && { user_type }),
    };

    console.log("📦 Clerk publicMetadata 업데이트:", newMetadata);

    await client.users.updateUser(userId, {
      publicMetadata: newMetadata,
    });

    console.log("✅ Clerk publicMetadata 업데이트 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ 프로필 업데이트 API 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
