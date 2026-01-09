/**
 * @file lib/constants/kamis-region-codes.ts
 * @description KAMIS Open API 지역 코드 매핑
 *
 * 시/도를 KAMIS API의 지역 코드로 변환합니다.
 * KAMIS API의 p_countycode 파라미터에 사용됩니다.
 *
 * 참고: 실제 지역 코드는 KAMIS API 문서를 확인하거나 테스트를 통해 검증해야 합니다.
 */

import { REGIONS, type Region } from "./regions";

/**
 * KAMIS API 지역 코드 매핑
 * 
 * 주의: 이 코드들은 예상값이며, 실제 KAMIS API 문서를 확인하거나 테스트를 통해 검증이 필요합니다.
 * KAMIS API는 행정구역 코드를 사용할 수 있습니다.
 */
export const KAMIS_REGION_CODES: Record<Region, string> = {
  서울: "1101", // 서울특별시 (예상 코드)
  부산: "2601", // 부산광역시 (예상 코드)
  대구: "2701", // 대구광역시 (예상 코드)
  인천: "2801", // 인천광역시 (예상 코드)
  광주: "2901", // 광주광역시 (예상 코드)
  대전: "3001", // 대전광역시 (예상 코드)
  울산: "3101", // 울산광역시 (예상 코드)
  세종: "3601", // 세종특별자치시 (예상 코드)
  경기: "4100", // 경기도 (예상 코드)
  강원: "4200", // 강원도 (예상 코드)
  충북: "4300", // 충청북도 (예상 코드)
  충남: "4400", // 충청남도 (예상 코드)
  전북: "4500", // 전라북도 (예상 코드)
  전남: "4600", // 전라남도 (예상 코드)
  경북: "4700", // 경상북도 (예상 코드)
  경남: "4800", // 경상남도 (예상 코드)
  제주: "5001", // 제주특별자치도 (예상 코드)
} as const;

/**
 * KAMIS API에서 지원하는 지역 목록
 * KAMIS_REGION_CODES에 정의된 지역만 포함됩니다.
 */
export const KAMIS_SUPPORTED_REGIONS = Object.keys(KAMIS_REGION_CODES) as Region[];

/**
 * 시/도를 KAMIS 지역 코드로 변환
 * @param region - 시/도 이름
 * @returns KAMIS 지역 코드 (없으면 빈 문자열)
 */
export function getKamisRegionCode(region: Region | string | null | undefined): string {
  if (!region || !REGIONS.includes(region as Region)) {
    return "";
  }
  return KAMIS_REGION_CODES[region as Region] || "";
}

/**
 * KAMIS 지역 코드를 시/도 이름으로 변환
 * @param code - KAMIS 지역 코드
 * @returns 시/도 이름 (없으면 null)
 */
export function getRegionByKamisCode(code: string): Region | null {
  const entry = Object.entries(KAMIS_REGION_CODES).find(
    ([, regionCode]) => regionCode === code,
  );
  return entry ? (entry[0] as Region) : null;
}

