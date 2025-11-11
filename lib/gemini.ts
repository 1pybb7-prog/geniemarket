/**
 * @file gemini.ts
 * @description Google Gemini API를 사용한 상품명 표준화 유틸리티
 *
 * 이 파일은 Google Gemini API를 사용하여 농수산물 상품명을 표준화하는 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 상품명 표준화 (단위 통일, 띄어쓰기 일관성 등)
 * 2. 에러 처리 및 로깅
 *
 * 핵심 구현 로직:
 * - Google Generative AI SDK를 사용하여 Gemini 1.5 Flash 모델 호출
 * - 프롬프트 엔지니어링을 통한 상품명 표준화
 * - API 호출 실패 시 원본 상품명 반환 (안전한 폴백)
 *
 * @dependencies
 * - @google/generative-ai: Google Gemini API 클라이언트
 *
 * @see {@link /docs/TODO.md} - 상품명 표준화 요구사항
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini API 클라이언트 초기화
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
    console.error("💡 .env.local 파일에 GEMINI_API_KEY를 추가하세요.");
    throw new Error(
      "GEMINI_API_KEY 환경변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.",
    );
  }

  return new GoogleGenerativeAI(apiKey);
};

/**
 * 상품명을 표준화합니다.
 *
 * 규칙:
 * 1. 상품명과 단위만 포함
 * 2. 띄어쓰기 일관성 유지
 * 3. 단위 통일 (kg, g, 개 등)
 *
 * @param originalName - 원본 상품명 (예: "청양고추 1키로")
 * @returns 표준화된 상품명 (예: "청양고추 1kg")
 *
 * @example
 * ```ts
 * const standardized = await standardizeProductName("청양고추 1키로");
 * console.log(standardized); // "청양고추 1kg"
 * ```
 */
export async function standardizeProductName(
  originalName: string,
): Promise<string> {
  console.group("🤖 Gemini API: 상품명 표준화 시작");
  console.log("📝 원본 상품명:", originalName);

  try {
    // API 키 확인
    const genAI = getGenAI();

    // Gemini 2.5 Flash 모델 사용
    // 참고: 모델 이름은 "gemini-2.5-flash" 또는 "gemini-2.0-flash-exp" 등
    let model;
    const modelNames = [
      "gemini-2.5-flash", // 사용자 요청: Gemini 2.5 Flash
      "gemini-2.0-flash-exp", // 대안 1: Gemini 2.0 Flash Experimental
      "gemini-2.0-flash-latest", // 대안 2: Gemini 2.0 Flash Latest
      "gemini-1.5-flash-latest", // 대안 3: Gemini 1.5 Flash Latest
      "gemini-1.5-pro", // 대안 4: Gemini 1.5 Pro
    ];
    let lastError: Error | null = null;
    let selectedModelName = "";

    // 모델 생성 및 실제 API 호출까지 테스트
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        console.log(`🔍 모델 생성 시도: ${modelName}`);

        // 실제 API 호출 테스트 (빈 프롬프트로 모델 유효성 확인)
        // 주의: 이 방법은 API 호출 비용이 발생할 수 있으므로, 실제 사용 시에는 제거 가능
        // 대신 첫 번째 모델을 바로 사용하고, generateContent 호출 시 에러 처리

        selectedModelName = modelName;
        console.log(`✅ 모델 선택: ${modelName}`);
        break;
      } catch (modelError) {
        console.log(`⚠️ ${modelName} 모델 생성 실패, 다음 모델 시도 중...`);
        lastError =
          modelError instanceof Error
            ? modelError
            : new Error(String(modelError));
      }
    }

    if (!model) {
      throw new Error(
        `모든 Gemini 모델 시도 실패. 마지막 에러: ${lastError?.message || "알 수 없는 오류"}`,
      );
    }

    // 표준화 프롬프트 작성
    const prompt = `다음 농수산물 상품명을 표준화해주세요.
규칙:
1. 상품명과 단위만 포함
2. 띄어쓰기 일관성
3. 단위 통일 (kg, g, 개 등)

예시:
입력: "청양고추 1키로"
출력: "청양고추 1kg"

입력: "사과 10개"
출력: "사과 10개"

입력: "${originalName}"
출력:`;

    console.log("📤 프롬프트 전송 중...");

    // API 호출 (실제 호출 시점에 모델이 작동하지 않으면 다른 모델 시도)
    let result;
    let response;
    let standardizedName: string;

    try {
      result = await model.generateContent(prompt);
      response = await result.response;
      standardizedName = response.text().trim();
    } catch (apiError) {
      // 첫 번째 모델이 실패하면 다른 모델 시도
      console.log(
        `⚠️ ${selectedModelName} API 호출 실패, 다른 모델 시도 중...`,
      );

      // 선택된 모델의 인덱스 찾기
      const selectedIndex = modelNames.indexOf(selectedModelName);
      const remainingModels = modelNames.slice(selectedIndex + 1);

      let success = false;

      for (const modelName of remainingModels) {
        try {
          console.log(`🔍 대안 모델 시도: ${modelName}`);
          const altModel = genAI.getGenerativeModel({ model: modelName });
          result = await altModel.generateContent(prompt);
          response = await result.response;
          standardizedName = response.text().trim();
          console.log(`✅ 대안 모델 성공: ${modelName}`);
          success = true;
          break;
        } catch {
          console.log(`⚠️ ${modelName} 실패, 다음 모델 시도 중...`);
        }
      }

      if (!success) {
        throw apiError; // 모든 모델 실패 시 원래 에러 throw
      }
    }

    console.log("✅ 표준화 완료:", standardizedName);
    console.groupEnd();

    return standardizedName;
  } catch (error) {
    console.error("❌ Gemini API 호출 실패:", error);
    console.error("💡 원본 상품명을 그대로 반환합니다.");

    // 에러 발생 시 원본 상품명 반환 (안전한 폴백)
    console.groupEnd();
    return originalName;
  }
}
