import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Server Component용)
 *
 * 2025년 4월부터 권장되는 방식:
 * - JWT 템플릿 불필요
 * - Clerk 토큰을 Supabase가 자동 검증
 * - auth().getToken()으로 현재 세션 토큰 사용
 *
 * @example
 * ```tsx
 * // Server Component
 * import { createClerkSupabaseClient } from '@/lib/supabase/server';
 *
 * export default async function MyPage() {
 *   const supabase = createClerkSupabaseClient();
 *   const { data } = await supabase.from('table').select('*');
 *   return <div>...</div>;
 * }
 * ```
 */
export function createClerkSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase 환경변수가 설정되지 않았습니다.");
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.",
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    async accessToken() {
      try {
        const authData = await auth();
        // Clerk의 auth()는 { userId, getToken }을 반환
        // 로그인하지 않은 경우 userId가 null이고 getToken이 없을 수 있음
        if (
          authData &&
          "getToken" in authData &&
          typeof authData.getToken === "function"
        ) {
          const token = await authData.getToken();
          return token;
        }
        // 토큰을 가져올 수 없는 경우 null 반환 (anon 접근)
        return null;
      } catch (error) {
        console.error("❌ Supabase 클라이언트 토큰 가져오기 실패:", error);
        // 에러 발생 시 null 반환 (anon 접근)
        return null;
      }
    },
  });
}
