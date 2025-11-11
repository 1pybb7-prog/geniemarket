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

    // Clerk publicMetadata에서 사용자 정보 가져오기
    const publicMetadata = clerkUser.publicMetadata as {
      user_type?: "vendor" | "retailer" | "vendor/retailer";
      business_name?: string;
      nickname?: string;
      phone?: string;
    } | null;

    const userType = publicMetadata?.user_type || "retailer"; // 기본값: 소매점
    const businessName = publicMetadata?.business_name || fullName;
    const metadataPhone = publicMetadata?.phone || phone;

    console.log(
      "📦 Clerk publicMetadata:",
      JSON.stringify(publicMetadata, null, 2),
    );
    console.log("👤 사용자 유형:", userType);
    console.log("🏢 상호명:", businessName);

    // Supabase users 테이블에 사용자 정보 동기화
    // 기존 사용자가 있으면 업데이트하지 않고, 없으면 생성
    // user_type과 business_name은 회원가입 완료 페이지에서 설정되므로
    // 이미 존재하는 경우 기존 값을 유지합니다.
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, user_type, business_name")
      .eq("id", clerkUser.id)
      .single();

    const userDataToUpsert: {
      id: string;
      email: string;
      user_type: string;
      business_name: string;
      phone?: string;
      nickname?: string;
    } = {
      id: clerkUser.id,
      email: email,
      user_type: userType,
      business_name: businessName,
    };

    if (metadataPhone) {
      userDataToUpsert.phone = metadataPhone;
    }

    if (publicMetadata?.nickname) {
      userDataToUpsert.nickname = publicMetadata.nickname;
    }

    // 기존 사용자가 있고 user_type이 이미 설정되어 있으면 유지
    if (existingUser && existingUser.user_type) {
      userDataToUpsert.user_type = existingUser.user_type;
      console.log("✅ 기존 user_type 유지:", existingUser.user_type);
    }

    // 기존 사용자가 있고 business_name이 이미 설정되어 있으면 유지
    if (existingUser && existingUser.business_name) {
      userDataToUpsert.business_name = existingUser.business_name;
      console.log("✅ 기존 business_name 유지:", existingUser.business_name);
    }

    console.log(
      "💾 저장할 사용자 데이터:",
      JSON.stringify(userDataToUpsert, null, 2),
    );

    const { data, error } = await supabase
      .from("users")
      .upsert(userDataToUpsert, {
        onConflict: "id", // id 컬럼을 기준으로 upsert
      })
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
