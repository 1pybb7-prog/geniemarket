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
import type { User, UserType } from "@/lib/types";

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

      const {
        id,
        email_addresses,
        first_name,
        last_name,
        phone_numbers,
        public_metadata,
      } = evt.data;

      const email = email_addresses?.[0]?.email_address;
      const phone = phone_numbers?.[0]?.phone_number || null;
      const fullName =
        first_name && last_name
          ? `${first_name} ${last_name}`
          : first_name || last_name || email || "Unknown";

      // publicMetadata에서 추가 정보 가져오기
      const userType: UserType =
        (public_metadata?.user_type as UserType) || "retailer";
      const businessName =
        (public_metadata?.business_name as string) || fullName;
      const metadataPhone = (public_metadata?.phone as string) || phone;

      console.log("📧 이메일:", email);
      console.log("📞 전화번호:", metadataPhone || phone);
      console.log("👤 이름:", fullName);
      console.log("🏢 회원 유형:", userType);
      console.log("🏪 상호명:", businessName);
      console.log(
        "📦 publicMetadata:",
        JSON.stringify(public_metadata, null, 2),
      );

      // 필수 필드 검증
      if (!email) {
        console.error("❌ 이메일 주소가 없습니다.");
        console.groupEnd();
        return NextResponse.json(
          { error: "Email is required" },
          { status: 400 },
        );
      }

      if (!id) {
        console.error("❌ 사용자 ID가 없습니다.");
        console.groupEnd();
        return NextResponse.json(
          { error: "User ID is required" },
          { status: 400 },
        );
      }

      // user_type 유효성 검증
      if (userType !== "vendor" && userType !== "retailer") {
        console.error("❌ 잘못된 사용자 유형:", userType);
        console.groupEnd();
        return NextResponse.json(
          { error: "Invalid user type" },
          { status: 400 },
        );
      }

      // Supabase users 테이블에 사용자 저장
      // publicMetadata에서 정보를 가져오고, 없으면 기본값 사용
      const userData: Omit<User, "created_at" | "updated_at"> = {
        id: id, // Clerk user ID를 UUID로 사용
        email: email,
        user_type: userType, // publicMetadata에서 가져오거나 기본값: 소매점
        business_name: businessName, // publicMetadata에서 가져오거나 기본값: 이름
        phone: metadataPhone || phone || undefined,
      };

      console.log(
        "💾 저장할 사용자 데이터:",
        JSON.stringify(userData, null, 2),
      );

      const { data, error } = await supabase
        .from("users")
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error("❌ Supabase 사용자 생성 실패:");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);
        console.error("저장하려던 데이터:", JSON.stringify(userData, null, 2));
        console.groupEnd();

        // 중복 키 에러 처리
        if (error.code === "23505") {
          // PostgreSQL unique violation
          console.log("ℹ️ 사용자가 이미 존재합니다. 업데이트를 시도합니다.");

          const { data: updatedData, error: updateError } = await supabase
            .from("users")
            .update({
              email: userData.email,
              user_type: userData.user_type,
              business_name: userData.business_name,
              phone: userData.phone,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userData.id)
            .select()
            .single();

          if (updateError) {
            console.error("❌ 사용자 업데이트도 실패:", updateError);
            return NextResponse.json(
              {
                error: "Failed to create or update user in Supabase",
                details: updateError.message,
              },
              { status: 500 },
            );
          }

          console.log("✅ 기존 사용자 업데이트 성공:", updatedData);
          console.groupEnd();

          return NextResponse.json({
            success: true,
            message: "User updated in Supabase",
            user: updatedData,
          });
        }

        return NextResponse.json(
          {
            error: "Failed to create user in Supabase",
            details: error.message,
            code: error.code,
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

      const {
        id,
        email_addresses,
        first_name,
        last_name,
        phone_numbers,
        public_metadata,
      } = evt.data;

      const email = email_addresses?.[0]?.email_address;
      const phone = phone_numbers?.[0]?.phone_number || null;
      const fullName =
        first_name && last_name
          ? `${first_name} ${last_name}`
          : first_name || last_name || email || "Unknown";

      // publicMetadata에서 추가 정보 가져오기
      const userType: UserType =
        (public_metadata?.user_type as UserType) || "retailer";
      const businessName =
        (public_metadata?.business_name as string) || fullName;
      const metadataPhone = (public_metadata?.phone as string) || phone;

      console.log("📧 이메일:", email);
      console.log("📞 전화번호:", metadataPhone || phone);
      console.log("👤 이름:", fullName);
      console.log("🏢 회원 유형:", userType);
      console.log("🏪 상호명:", businessName);
      console.log(
        "📦 publicMetadata:",
        JSON.stringify(public_metadata, null, 2),
      );

      // 필수 필드 검증
      if (!id) {
        console.error("❌ 사용자 ID가 없습니다.");
        console.groupEnd();
        return NextResponse.json(
          { error: "User ID is required" },
          { status: 400 },
        );
      }

      if (!email) {
        console.error("❌ 이메일 주소가 없습니다.");
        console.groupEnd();
        return NextResponse.json(
          { error: "Email is required" },
          { status: 400 },
        );
      }

      // user_type 유효성 검증
      if (userType !== "vendor" && userType !== "retailer") {
        console.error("❌ 잘못된 사용자 유형:", userType);
        console.groupEnd();
        return NextResponse.json(
          { error: "Invalid user type" },
          { status: 400 },
        );
      }

      // Supabase users 테이블 업데이트
      const updateData: Partial<User> = {
        email: email,
        phone: metadataPhone || phone || undefined,
        user_type: userType, // publicMetadata에서 가져온 회원 유형
        business_name: businessName, // publicMetadata에서 가져온 상호명 또는 이름
        updated_at: new Date().toISOString(),
      };

      console.log(
        "💾 업데이트할 사용자 데이터:",
        JSON.stringify(updateData, null, 2),
      );

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ Supabase 사용자 업데이트 실패:");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);
        console.error(
          "업데이트하려던 데이터:",
          JSON.stringify(updateData, null, 2),
        );
        console.groupEnd();

        // 사용자가 존재하지 않는 경우
        if (error.code === "PGRST116") {
          // PostgREST not found
          console.log("ℹ️ 사용자가 존재하지 않습니다. 생성을 시도합니다.");

          const { data: createdData, error: createError } = await supabase
            .from("users")
            .insert({
              id: id,
              email: email,
              user_type: userType,
              business_name: businessName,
              phone: metadataPhone || phone || undefined,
            })
            .select()
            .single();

          if (createError) {
            console.error("❌ 사용자 생성도 실패:", createError);
            return NextResponse.json(
              {
                error: "Failed to update or create user in Supabase",
                details: createError.message,
              },
              { status: 500 },
            );
          }

          console.log("✅ 새 사용자 생성 성공:", createdData);
          console.groupEnd();

          return NextResponse.json({
            success: true,
            message: "User created in Supabase",
            user: createdData,
          });
        }

        return NextResponse.json(
          {
            error: "Failed to update user in Supabase",
            details: error.message,
            code: error.code,
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

      // 필수 필드 검증
      if (!id) {
        console.error("❌ 사용자 ID가 없습니다.");
        console.groupEnd();
        return NextResponse.json(
          { error: "User ID is required" },
          { status: 400 },
        );
      }

      console.log("🗑️ 삭제할 사용자 ID:", id);

      // Supabase users 테이블에서 사용자 삭제
      const { error } = await supabase.from("users").delete().eq("id", id);

      if (error) {
        console.error("❌ Supabase 사용자 삭제 실패:");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);
        console.groupEnd();

        // 사용자가 이미 존재하지 않는 경우는 성공으로 처리
        if (error.code === "PGRST116") {
          console.log("ℹ️ 사용자가 이미 존재하지 않습니다.");
          console.groupEnd();
          return NextResponse.json({
            success: true,
            message: "User already deleted or not found",
          });
        }

        return NextResponse.json(
          {
            error: "Failed to delete user in Supabase",
            details: error.message,
            code: error.code,
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
