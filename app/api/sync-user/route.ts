import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Clerk 사용자를 Supabase users 테이블에 동기화하는 API
 *
 * 클라이언트에서 로그인 후 이 API를 호출하여 사용자 정보를 Supabase에 저장합니다.
 * 이미 존재하는 경우 업데이트하고, 없으면 새로 생성합니다.
 */
export async function POST() {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clerk에서 사용자 정보 가져오기
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Supabase에 사용자 정보 동기화
    console.group("🔄 Supabase 사용자 동기화 시작");
    console.log("Clerk User ID:", userId);
    console.log(
      "Clerk User Name:",
      clerkUser.fullName || clerkUser.username || "Unknown",
    );

    const supabase = getServiceRoleClient();

    // Clerk에서 사용자 정보 추출
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || null;
    const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber || null;
    const fullName =
      clerkUser.fullName ||
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      email ||
      "Unknown";

    if (!email) {
      console.error("❌ 이메일 주소가 없습니다.");
      console.groupEnd();
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log("📧 이메일:", email);
    console.log("📞 전화번호:", phone);
    console.log("👤 이름:", fullName);

    // Supabase users 테이블에 사용자 정보 동기화
    // 주의: user_type과 business_name은 필수이지만, Clerk에서 받을 수 없으므로
    // 기본값으로 설정합니다. 나중에 사용자가 프로필을 완성하도록 할 수 있습니다.
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          id: clerkUser.id, // Clerk user ID를 UUID로 사용
          email: email,
          user_type: "retailer", // 기본값: 소매점 (나중에 프로필에서 변경 가능)
          business_name: fullName, // 기본값: 이름 (나중에 프로필에서 변경 가능)
          phone: phone,
        },
        {
          onConflict: "id", // id 컬럼을 기준으로 upsert
        },
      )
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase sync error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to sync user", details: error.message },
        { status: 500 },
      );
    }

    console.log("✅ 사용자 동기화 성공:", data);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error("❌ Sync user error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      // 환경 변수 관련 에러인 경우 더 자세한 정보 제공
      if (error.message.includes("environment variables")) {
        return NextResponse.json(
          {
            error: "Failed to sync user",
            details:
              "Invalid API key - 환경 변수가 올바르게 설정되지 않았습니다. .env.local 파일을 확인하세요.",
          },
          { status: 500 },
        );
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
