/**
 * @file app/api/user/check-nickname/route.ts
 * @description 닉네임 중복 확인 API
 *
 * 이 API는 사용자가 입력한 닉네임이 이미 사용 중인지 확인합니다.
 * 닉네임은 2-20자이며, 한글, 영문, 숫자, 언더스코어만 사용 가능합니다.
 *
 * 주요 기능:
 * 1. 닉네임 형식 검증 (길이, 문자 제한)
 * 2. 데이터베이스에서 중복 확인
 * 3. 사용 가능 여부 반환
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 */

import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST(req: Request) {
  try {
    console.group("🔍 닉네임 중복 확인 시작");

    const { nickname } = await req.json();

    // 닉네임 입력 확인
    if (!nickname || nickname.trim().length === 0) {
      console.log("❌ 닉네임이 입력되지 않았습니다.");
      console.groupEnd();
      return NextResponse.json(
        { error: "닉네임을 입력해주세요." },
        { status: 400 },
      );
    }

    const trimmedNickname = nickname.trim();

    // 닉네임 길이 검증 (2-20자)
    if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
      console.log("❌ 닉네임 길이 오류:", trimmedNickname.length);
      console.groupEnd();
      return NextResponse.json(
        { error: "닉네임은 2자 이상 20자 이하여야 합니다." },
        { status: 400 },
      );
    }

    // 닉네임 형식 검증 (한글, 영문, 숫자, 언더스코어만 허용)
    const nicknameRegex = /^[a-zA-Z0-9가-힣_]+$/;
    if (!nicknameRegex.test(trimmedNickname)) {
      console.log("❌ 닉네임 형식 오류:", trimmedNickname);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다.",
        },
        { status: 400 },
      );
    }

    console.log("📝 확인할 닉네임:", trimmedNickname);

    // Supabase에서 중복 확인
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("nickname", trimmedNickname)
      .single();

    // PGRST116은 "no rows returned" 에러 (중복 없음 - 정상)
    if (error && error.code !== "PGRST116") {
      console.error("❌ 닉네임 중복 확인 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "닉네임 확인 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }

    // data가 있으면 중복
    if (data) {
      console.log("❌ 이미 사용 중인 닉네임입니다.");
      console.groupEnd();
      return NextResponse.json(
        { available: false, message: "이미 사용 중인 닉네임입니다." },
        { status: 200 },
      );
    }

    // 중복 없음 - 사용 가능
    console.log("✅ 사용 가능한 닉네임입니다.");
    console.groupEnd();
    return NextResponse.json({
      available: true,
      message: "사용 가능한 닉네임입니다.",
    });
  } catch (error) {
    console.error("❌ 닉네임 확인 API 오류:", error);
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
