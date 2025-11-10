/**
 * @file lib/supabase.ts
 * @description Supabase 클라이언트 유틸리티
 *
 * 이 파일은 Supabase 클라이언트를 생성하는 유틸리티 함수를 제공합니다.
 * PRD.md에 명시된 기본 Supabase 클라이언트를 export합니다.
 *
 * 주요 기능:
 * 1. 기본 Supabase 클라이언트 생성 (인증 없이 공개 데이터 접근용)
 * 2. Clerk 인증을 포함한 Supabase 클라이언트 생성 (레거시, 사용 지양)
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase 클라이언트
 * - @clerk/nextjs/server: Clerk 인증 (레거시 함수용)
 *
 * @see {@link lib/supabase/clerk-client.ts} - Client Component용 (권장)
 * @see {@link lib/supabase/server.ts} - Server Component용 (권장)
 * @see {@link lib/supabase/service-role.ts} - 관리자 권한용
 * @see {@link lib/supabase/client.ts} - 인증 불필요한 공개 데이터용
 */

import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * 기본 Supabase 클라이언트 (인증 없이 공개 데이터 접근용)
 *
 * PRD.md에 명시된 기본 Supabase 클라이언트입니다.
 * 인증이 필요 없는 공개 데이터 조회에 사용할 수 있습니다.
 *
 * @example
 * ```typescript
 * import { supabase } from '@/lib/supabase';
 *
 * // 공개 데이터 조회
 * const { data } = await supabase.from('products').select('*');
 * ```
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * Clerk 인증을 포함한 Supabase 클라이언트 생성 함수 (레거시)
 *
 * ⚠️ 사용 지양: 이 함수는 레거시입니다.
 * 대신 다음을 사용하세요:
 * - Client Component: `useClerkSupabaseClient()` from `@/lib/supabase/clerk-client`
 * - Server Component: `createClerkSupabaseClient()` from `@/lib/supabase/server`
 *
 * @deprecated 이 함수는 레거시입니다. 새로운 코드에서는 사용하지 마세요.
 */
export const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken();
      },
    },
  );
};
