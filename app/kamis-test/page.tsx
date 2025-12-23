"use client";

/**
 * @file app/kamis-test/page.tsx
 * @description KAMIS Open API 테스트 페이지
 *
 * 이 페이지는 KAMIS Open API가 정상적으로 작동하는지 테스트하기 위한 것입니다.
 * 상품명을 입력하고 시세 정보를 확인할 수 있습니다.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Loader2,
  CheckCircle2,
  XCircle,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { KAMIS_SUPPORTED_REGIONS } from "@/lib/constants/kamis-region-codes";
import { getKamisRegionCode } from "@/lib/constants/kamis-region-codes";
import { PriceChart } from "@/components/market-prices/PriceChart";

interface TestResult {
  success: boolean;
  productName?: string;
  regionCode?: string | null;
  itemCount?: number;
  items?: any[];
  rawResponse?: any;
  error?: string;
  errorCode?: string;
  errorMsg?: string;
  timestamp?: string;
  duration?: string;
}

export default function KAMISTestPage() {
  const [productName, setProductName] = useState("사과");
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const handleTest = async () => {
    if (!productName.trim()) {
      alert("상품명을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      console.group("🧪 KAMIS API 테스트 시작");
      console.log("상품명:", productName);
      if (selectedRegion) {
        console.log("지역:", selectedRegion);
        console.log("지역 코드:", getKamisRegionCode(selectedRegion));
      }

      // API URL 구성
      const params = new URLSearchParams({
        productName: productName.trim(),
      });

      if (selectedRegion) {
        const regionCode = getKamisRegionCode(selectedRegion);
        if (regionCode) {
          params.append("regionCode", regionCode);
        }
      }

      const response = await fetch(`/api/test/kamis?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data: TestResult = await response.json();
      console.log("테스트 결과:", data);
      console.groupEnd();

      setResult(data);

      // 시세 조회 성공 시 그래프용 데이터도 별도로 조회
      if (data.success && data.items && data.items.length > 0) {
        fetchChartData(productName.trim(), selectedRegion);
      } else {
        setChartData([]);
      }
    } catch (error) {
      console.error("테스트 실패:", error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      setLoading(false);
    }
  };

  // 그래프용 데이터 조회 함수 (지난 1주일간)
  const fetchChartData = async (productName: string, region?: string) => {
    try {
      setChartLoading(true);
      setChartData([]);

      console.group("📊 그래프용 데이터 조회 시작 (지난 1주일)");
      console.log("상품명:", productName);
      if (region) {
        console.log("지역:", region);
      }

      // KAMIS API는 날짜 파라미터를 지원하지 않으므로,
      // 한 번의 API 호출로 받은 데이터에서 날짜별로 구분하여 사용
      // 단일 API 호출로 데이터 조회
      const allChartItems: any[] = [];

      try {
        const params = new URLSearchParams({
          productName: productName,
        });

        if (region) {
          const regionCode = getKamisRegionCode(region);
          if (regionCode) {
            params.append("regionCode", regionCode);
          }
        }

        const response = await fetch(`/api/test/kamis?${params.toString()}`);
        const data = await response.json();

        if (data.success && data.items && data.items.length > 0) {
          // 응답 데이터에서 날짜별로 필터링
          // 지난 7일간의 날짜 범위 계산
          const today = new Date();
          const kstOffset = 9 * 60;
          const kstToday = new Date(
            today.getTime() + (kstOffset - today.getTimezoneOffset()) * 60000,
          );

          const dateRange: string[] = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date(kstToday);
            date.setDate(date.getDate() - i);
            const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
            dateRange.push(dateStr);
          }

          console.log("📅 조회할 날짜 범위:", dateRange);

          // 응답 데이터에서 지난 7일 범위의 데이터만 필터링
          const filteredItems = data.items.filter((item: any) => {
            const itemDate =
              item.lastest_day || item.p_regday || item.regday || "";

            // 날짜 형식 정규화
            const normalizedDate = itemDate.replace(/-/g, "");

            // 지난 7일 범위에 포함되는지 확인
            return (
              normalizedDate.length === 8 && dateRange.includes(normalizedDate)
            );
          });

          console.log(
            `✅ 총 ${data.items.length}개 중 ${filteredItems.length}개 아이템이 지난 7일 범위에 포함됨`,
          );

          allChartItems.push(...filteredItems);
        }
      } catch (error) {
        console.error("❌ 그래프 데이터 조회 실패:", error);
      }

      setChartData(allChartItems);
      console.log(`✅ 그래프 데이터 수집 완료: 총 ${allChartItems.length}개`);
      console.groupEnd();
    } catch (error) {
      console.error("❌ 그래프 데이터 조회 실패:", error);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← 홈으로 돌아가기
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">KAMIS Open API 테스트</h1>
        </div>
        <p className="text-gray-600">
          KAMIS Open API를 직접 호출하여 시세 정보를 조회할 수 있습니다.
        </p>
      </div>

      {/* 테스트 입력 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API 테스트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-name">상품명</Label>
                <Input
                  id="product-name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="예: 사과, 청양고추, 배추"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleTest();
                    }
                  }}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="region-select">지역 (선택 사항)</Label>
                <Select
                  value={selectedRegion || ""}
                  onValueChange={(value) =>
                    setSelectedRegion(value === "all" ? undefined : value)
                  }
                >
                  <SelectTrigger id="region-select" className="mt-2">
                    <SelectValue placeholder="전체 지역" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 지역</SelectItem>
                    {KAMIS_SUPPORTED_REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleTest}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    테스트 중...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    테스트 실행
                  </>
                )}
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              💡 빠른 테스트: &quot;사과&quot;, &quot;청양고추&quot;, &quot;배추&quot; 등을 입력해보세요.
              {selectedRegion && (
                <span className="ml-2">
                  📍 지역 필터: <strong>{selectedRegion}</strong> (
                  {getKamisRegionCode(selectedRegion)})
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 결과 표시 */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <CardTitle className="text-green-600">테스트 성공</CardTitle>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-600" />
                  <CardTitle className="text-red-600">테스트 실패</CardTitle>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-semibold">상품명</Label>
                <p className="text-sm text-gray-600">
                  {result.productName || "N/A"}
                </p>
              </div>
              {result.success && (
                <>
                  {result.regionCode && (
                    <div>
                      <Label className="text-sm font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        지역 코드
                      </Label>
                      <p className="text-sm text-gray-600">
                        {result.regionCode}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-semibold">
                      조회된 아이템 수
                    </Label>
                    <p className="text-sm text-gray-600">
                      {result.itemCount || 0}개
                    </p>
                  </div>
                  {result.duration && (
                    <div>
                      <Label className="text-sm font-semibold">응답 시간</Label>
                      <p className="text-sm text-gray-600">{result.duration}</p>
                    </div>
                  )}
                  {result.timestamp && (
                    <div>
                      <Label className="text-sm font-semibold">
                        테스트 시간
                      </Label>
                      <p className="text-sm text-gray-600">
                        {new Date(result.timestamp).toLocaleString("ko-KR")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 에러 정보 */}
            {!result.success && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <Label className="text-sm font-semibold text-red-800">
                  에러 정보
                </Label>
                <p className="text-sm text-red-700 mt-1">{result.error}</p>
                {result.errorCode && (
                  <p className="text-sm text-red-600 mt-1">
                    에러 코드: {result.errorCode}
                  </p>
                )}
                {result.errorMsg && (
                  <p className="text-sm text-red-600 mt-1">
                    에러 메시지: {result.errorMsg}
                  </p>
                )}
              </div>
            )}

            {/* 시세 정보 */}
            {result.success && result.items && result.items.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  시세 정보 ({result.items.length}개)
                </Label>

                {/* 카테고리별 그룹화 */}
                {(() => {
                  // 카테고리별로 그룹화
                  const groupedByCategory = result.items.reduce(
                    (acc: Record<string, any[]>, item: any) => {
                      const category = item.category_name || "기타";
                      if (!acc[category]) {
                        acc[category] = [];
                      }
                      acc[category].push(item);
                      return acc;
                    },
                    {},
                  );

                  return Object.entries(groupedByCategory).map(
                    ([category, items]: [string, any[]]) => (
                      <div key={category} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-px flex-1 bg-gray-200" />
                          <Label className="text-sm font-bold text-primary">
                            {category} ({items.length}개)
                          </Label>
                          <div className="h-px flex-1 bg-gray-200" />
                        </div>
                        <div className="space-y-2">
                          {items.map((item: any, index: number) => (
                            <div
                              key={index}
                              className="p-3 bg-gray-50 border rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="font-semibold">상품명:</span>{" "}
                                  {item.productName || item.item_name || "N/A"}
                                </div>
                                <div>
                                  <span className="font-semibold">품목명:</span>{" "}
                                  {item.item_name || item.productName || "N/A"}
                                </div>
                                <div>
                                  <span className="font-semibold">가격:</span>{" "}
                                  <span className="text-primary font-bold">
                                    {item.dpr1
                                      ? `${item.dpr1.toString().replace(/,/g, "")}원`
                                      : "N/A"}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-semibold">단위:</span>{" "}
                                  {item.unit || "N/A"}
                                </div>
                                <div>
                                  <span className="font-semibold">유형:</span>{" "}
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs ${
                                      item.product_cls_name === "소매"
                                        ? "bg-blue-100 text-blue-800"
                                        : item.product_cls_name === "도매"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {item.product_cls_name || "N/A"}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-semibold">날짜:</span>{" "}
                                  {item.lastest_day || "N/A"}
                                </div>
                                {item.direction !== undefined && (
                                  <div>
                                    <span className="font-semibold">변동:</span>{" "}
                                    <span
                                      className={
                                        item.direction === "1"
                                          ? "text-red-600"
                                          : item.direction === "0"
                                            ? "text-blue-600"
                                            : "text-gray-600"
                                      }
                                    >
                                      {item.direction === "1"
                                        ? "↑ 상승"
                                        : item.direction === "0"
                                          ? "↓ 하락"
                                          : "→ 동일"}{" "}
                                      ({item.value || "0"}%)
                                    </span>
                                  </div>
                                )}
                                {item.dpr2 && (
                                  <div>
                                    <span className="font-semibold">
                                      1일전:
                                    </span>{" "}
                                    {item.dpr2.toString().replace(/,/g, "")}원
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  );
                })()}
              </div>
            )}

            {/* 시세 추이 그래프 (지난 1주일) */}
            {result.success && result.items && result.items.length > 0 && (
              <div className="mt-6">
                <Label className="text-lg font-semibold mb-4 block">
                  시세 추이 그래프 (지난 1주일)
                </Label>
                <Card className="p-4">
                  {chartLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="ml-2 text-gray-600">
                        그래프 데이터 로딩 중...
                      </span>
                    </div>
                  ) : chartData.length > 0 ? (
                    <PriceChart
                      data={chartData
                        .filter((item: any) => {
                          // 가격 데이터가 있는 아이템만 필터링
                          const price = item.dpr1 || item.p_price;
                          return (
                            price &&
                            parseFloat(price.toString().replace(/,/g, "")) > 0
                          );
                        })
                        .map((item: any) => {
                          // 날짜와 가격 추출
                          // 중요: queryDate는 사용하지 않고, 실제 응답 데이터의 날짜 필드를 사용
                          let date =
                            item.lastest_day ||
                            item.p_regday ||
                            item.regday ||
                            "";

                          // 날짜 형식 정규화 (YYYYMMDD 형식으로 변환)
                          if (date) {
                            // YYYY-MM-DD 형식을 YYYYMMDD로 변환
                            date = date.replace(/-/g, "");
                            // YYYYMMDD 형식이 아니면 빈 문자열로 처리
                            if (date.length !== 8) {
                              date = "";
                            }
                          }

                          // 날짜가 없으면 해당 아이템 제외
                          if (!date || date.length !== 8) {
                            return null;
                          }

                          const priceStr = (
                            item.dpr1 ||
                            item.p_price ||
                            "0"
                          ).toString();
                          const price = parseFloat(priceStr.replace(/,/g, ""));

                          return {
                            date: date,
                            price: price,
                            market:
                              item.p_marketname || item.market_name || "전체",
                          };
                        })
                        .filter((item: any) => item !== null) // null 제거
                        // 같은 날짜, 같은 시장의 데이터가 여러 개 있으면 평균 계산
                        .reduce((acc: any[], item: any) => {
                          const existing = acc.find(
                            (i) =>
                              i.date === item.date && i.market === item.market,
                          );
                          if (existing) {
                            // 같은 날짜/시장의 데이터가 있으면 평균 계산
                            existing.price = Math.round(
                              (existing.price + item.price) / 2,
                            );
                          } else {
                            acc.push(item);
                          }
                          return acc;
                        }, [])}
                      productName={result.productName || ""}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <p>그래프 데이터를 불러올 수 없습니다.</p>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* 전체 응답 (접을 수 있게) */}
            {result.rawResponse && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                  전체 응답 보기 (JSON)
                </summary>
                <pre className="mt-2 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-auto text-xs max-h-96">
                  {JSON.stringify(result.rawResponse, null, 2)}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )}

      {/* 안내 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>사용 안내</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            • 이 페이지는 KAMIS Open API가 정상적으로 작동하는지 테스트하기 위한
            것입니다.
          </p>
          <p>
            • 상품명을 입력하고 &quot;테스트 실행&quot; 버튼을 클릭하면 API를 호출합니다.
          </p>
          <p>
            • 환경변수{" "}
            <code className="bg-gray-100 px-1 rounded">KAMIS_CERT_ID</code>와{" "}
            <code className="bg-gray-100 px-1 rounded">KAMIS_CERT_KEY</code>가
            설정되어 있어야 합니다.
          </p>
          <p>
            • 테스트 결과는 콘솔에도 출력되므로 개발자 도구를 열어 확인할 수
            있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
