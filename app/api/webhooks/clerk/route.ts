/**
 * @file app/api/webhooks/clerk/route.ts
 * @description Clerk 웹훅 핸들러
 *
 * 이 API는 Clerk에서 사용자 생성/업데이트/삭제 이벤트를 받아서
 * Supabase users 테이블에 자동으로 동기화합니다.
 *
 * 주요 기능:
 * 1. user.created: 새 사용자 생성 시 Supabase users 테이블에 저장
 * 2. user.updated: 사용자 정보 업데이트 시 Supabase에 반영
 * 3. user.deleted: 사용자 삭제 시 Supabase에서도 삭제
 *
 * 보안:
 * - Svix를 사용하여 웹훅 서명 검증
 * - CLERK_WEBHOOK_SECRET 환경변수 필요
 *
 * @see {@link https://clerk.com/docs/integrations/webhooks/overview} - Clerk 웹훅 문서
 */

import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST(req: Request) {
  console.group("🔔 Clerk 웹훅 수신 시작");

  // 웹훅 시크릿 키 확인
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("❌ CLERK_WEBHOOK_SECRET 환경변수가 설정되지 않았습니다.");
    console.groupEnd();
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // 헤더에서 필요한 정보 가져오기
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("❌ 웹훅 헤더가 올바르지 않습니다.");
    console.groupEnd();
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
  }

  // 요청 본문 가져오기
  const payload = await req.json();
  const body = JSON.stringify(payload);

  console.log("📦 웹훅 이벤트 타입:", payload.type);
  console.log("📦 웹훅 데이터:", JSON.stringify(payload, null, 2));

  // Svix를 사용하여 서명 검증
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;

    console.log("✅ 웹훅 서명 검증 성공");
  } catch (err) {
    console.error("❌ 웹훅 서명 검증 실패:", err);
    console.groupEnd();
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 이벤트 타입에 따라 처리
  const eventType = evt.type;
  const supabase = getServiceRoleClient();

  try {
    if (eventType === "user.created") {
      console.log("👤 새 사용자 생성 이벤트 처리 시작");

      const { id, email_addresses, first_name, last_name, phone_numbers } =
        evt.data;

      const email = email_addresses?.[0]?.email_address;
      const phone = phone_numbers?.[0]?.phone_number || null;
      const fullName =
        first_name && last_name
          ? `${first_name} ${last_name}`
          : first_name || last_name || email || "Unknown";

      console.log("📧 이메일:", email);
      console.log("📞 전화번호:", phone);
      console.log("👤 이름:", fullName);

      if (!email) {
        console.error("❌ 이메일 주소가 없습니다.");
        console.groupEnd();
        return NextResponse.json(
          { error: "Email is required" },
          { status: 400 },
        );
      }

      // Supabase users 테이블에 사용자 저장
      // 주의: user_type과 business_name은 필수이지만, Clerk에서 받을 수 없으므로
      // 기본값으로 설정합니다. 나중에 사용자가 프로필을 완성하도록 할 수 있습니다.
      const { data, error } = await supabase
        .from("users")
        .insert({
          id: id, // Clerk user ID를 UUID로 사용
          email: email,
          user_type: "retailer", // 기본값: 소매점 (나중에 프로필에서 변경 가능)
          business_name: fullName, // 기본값: 이름 (나중에 프로필에서 변경 가능)
          phone: phone,
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Supabase 사용자 생성 실패:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "Failed to create user in Supabase",
            details: error.message,
          },
          { status: 500 },
        );
      }

      console.log("✅ Supabase 사용자 생성 성공:", data);
      console.groupEnd();

      return NextResponse.json({
        success: true,
        message: "User created in Supabase",
        user: data,
      });
    }

    if (eventType === "user.updated") {
      console.log("👤 사용자 업데이트 이벤트 처리 시작");

      const { id, email_addresses, first_name, last_name, phone_numbers } =
        evt.data;

      const email = email_addresses?.[0]?.email_address;
      const phone = phone_numbers?.[0]?.phone_number || null;
      const fullName =
        first_name && last_name
          ? `${first_name} ${last_name}`
          : first_name || last_name || email || "Unknown";

      console.log("📧 이메일:", email);
      console.log("📞 전화번호:", phone);
      console.log("👤 이름:", fullName);

      // Supabase users 테이블 업데이트
      const { data, error } = await supabase
        .from("users")
        .update({
          email: email,
          phone: phone,
          business_name: fullName, // 이름이 변경되면 business_name도 업데이트
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ Supabase 사용자 업데이트 실패:", error);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "Failed to update user in Supabase",
            details: error.message,
          },
          { status: 500 },
        );
      }

      console.log("✅ Supabase 사용자 업데이트 성공:", data);
      console.groupEnd();

      return NextResponse.json({
        success: true,
        message: "User updated in Supabase",
        user: data,
      });
    }

    if (eventType === "user.deleted") {
      console.log("👤 사용자 삭제 이벤트 처리 시작");

      const { id } = evt.data;

      console.log("🗑️ 삭제할 사용자 ID:", id);

      // Supabase users 테이블에서 사용자 삭제
      const { error } = await supabase.from("users").delete().eq("id", id);

      if (error) {
        console.error("❌ Supabase 사용자 삭제 실패:", error);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "Failed to delete user in Supabase",
            details: error.message,
          },
          { status: 500 },
        );
      }

      console.log("✅ Supabase 사용자 삭제 성공");
      console.groupEnd();

      return NextResponse.json({
        success: true,
        message: "User deleted from Supabase",
      });
    }

    // 처리하지 않는 이벤트 타입
    console.log("ℹ️ 처리하지 않는 이벤트 타입:", eventType);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: `Event ${eventType} received but not processed`,
    });
  } catch (error) {
    console.error("❌ 웹훅 처리 중 오류 발생:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
