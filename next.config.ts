import type { NextConfig } from "next";

// Supabase Storage 도메인 추출
const getSupabaseHostname = (): string | null => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const url = new URL(supabaseUrl);
    return url.hostname;
  } catch {
    return null;
  }
};

const supabaseHostname = getSupabaseHostname();

// Next.js Image 컴포넌트에서 허용할 외부 이미지 호스트 목록
const remotePatterns: Array<{
  protocol?: "http" | "https";
  hostname: string;
  pathname?: string;
}> = [
  { protocol: "https", hostname: "img.clerk.com" }, // Clerk 프로필 이미지
];

// Supabase Storage 도메인 추가
if (supabaseHostname) {
  remotePatterns.push({
    protocol: "https",
    hostname: supabaseHostname,
    pathname: "/storage/v1/object/public/**",
  });
  console.log("✅ Supabase Storage 도메인 추가됨:", supabaseHostname);
} else {
  // 환경 변수가 없을 경우, 에러 메시지의 도메인을 직접 추가
  // TODO: 환경 변수를 설정하면 자동으로 추가됩니다
  console.warn(
    "⚠️ NEXT_PUBLIC_SUPABASE_URL이 설정되지 않아 Supabase Storage 도메인을 자동으로 추가할 수 없습니다.",
  );
  console.warn(
    "💡 .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL을 설정하거나, 아래에 도메인을 직접 추가하세요.",
  );
  // 필요시 여기에 특정 Supabase 프로젝트 도메인을 직접 추가할 수 있습니다
  // remotePatterns.push({ hostname: "cypexbaydcoccxiegimf.supabase.co" });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
