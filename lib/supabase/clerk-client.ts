"use client";

import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Client Component용)
 *
 * 2025년 4월부터 권장되는 방식:
 * - JWT 템플릿 불필요
 * - useAuth().getToken()으로 현재 세션 토큰 사용
 * - React Hook으로 제공되어 Client Component에서 사용
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
 *
 * export default function MyComponent() {
 *   const supabase = useClerkSupabaseClient();
 *
 *   async function fetchData() {
 *     const { data } = await supabase.from('table').select('*');
 *     return data;
 *   }
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useClerkSupabaseClient() {
  const { getToken } = useAuth();

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 환경변수 확인
    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Supabase 환경변수가 설정되지 않았습니다.");
      console.error(
        "NEXT_PUBLIC_SUPABASE_URL:",
        supabaseUrl ? "✅ 설정됨" : "❌ 없음",
      );
      console.error(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
        supabaseKey ? "✅ 설정됨" : "❌ 없음",
      );
      console.error("💡 .env.local 파일에 환경변수를 설정하세요.");
      throw new Error(
        "Supabase 환경변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.",
      );
    }

    // URL 형식 확인
    if (!supabaseUrl.startsWith("https://")) {
      console.error("❌ Supabase URL 형식이 올바르지 않습니다.");
      console.error("예상 형식: https://xxxxx.supabase.co");
      console.error("현재 값:", supabaseUrl);
      throw new Error(
        "Supabase URL 형식이 올바르지 않습니다. https://로 시작해야 합니다.",
      );
    }

    return createClient(supabaseUrl, supabaseKey, {
      async accessToken() {
        return (await getToken()) ?? null;
      },
    });
  }, [getToken]);

  return supabase;
}
