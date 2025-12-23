"use client";

/**
 * @file components/market-prices/PriceChart.tsx
 * @description 시세 가격 추이 그래프 컴포넌트
 *
 * KAMIS API에서 받은 시세 데이터를 시각화하는 차트 컴포넌트입니다.
 * 날짜별 가격 변화를 선 그래프로 표시합니다.
 *
 * @dependencies
 * - recharts: 차트 라이브러리
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PriceDataPoint {
  date: string; // YYYYMMDD 형식
  price: number;
  market?: string;
}

interface PriceChartProps {
  data: PriceDataPoint[];
  productName?: string;
}

/**
 * 날짜 형식 변환 (YYYYMMDD -> MM/DD)
 */
function formatDate(dateStr: string): string {
  if (dateStr.length === 8) {
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${month}/${day}`;
  }
  // 이미 포맷된 경우 그대로 반환
  return dateStr;
}

/**
 * 가격 포맷팅 (천 단위 콤마)
 */
function formatPrice(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function PriceChart({ data, productName }: PriceChartProps) {
  // 데이터가 없으면 빈 상태 표시
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>표시할 데이터가 없습니다.</p>
      </div>
    );
  }

  // 날짜순으로 정렬
  const sortedData = [...data].sort((a, b) => {
    const dateA = a.date.replace(/-/g, "");
    const dateB = b.date.replace(/-/g, "");
    return dateA.localeCompare(dateB);
  });

  // 시장별로 그룹화 (여러 시장이 있는 경우)
  const markets = Array.from(
    new Set(sortedData.map((item) => item.market || "전체").filter(Boolean)),
  );

  // 시장별 데이터 준비
  // 같은 날짜, 같은 시장의 데이터가 여러 개 있으면 평균 계산
  const chartData = sortedData.reduce((acc, item) => {
    const dateKey = formatDate(item.date.replace(/-/g, ""));
    const market = item.market || "전체";

    // 해당 날짜의 항목이 없으면 생성
    if (!acc.find((d) => d.date === dateKey)) {
      acc.push({
        date: dateKey,
        ...markets.reduce((obj, m) => ({ ...obj, [m]: null }), {}),
      });
    }

    // 해당 날짜의 항목에 가격 추가
    const dateItem = acc.find((d) => d.date === dateKey);
    if (dateItem) {
      // 같은 날짜, 같은 시장의 데이터가 이미 있으면 평균 계산
      if (dateItem[market] !== null && dateItem[market] !== undefined) {
        dateItem[market] = Math.round((dateItem[market] + item.price) / 2);
      } else {
        dateItem[market] = item.price;
      }
    }

    return acc;
  }, [] as any[]);

  console.group("📊 PriceChart 데이터 처리");
  console.log("원본 데이터:", data);
  console.log("차트 데이터:", chartData);
  console.log("시장 목록:", markets);
  console.groupEnd();

  return (
    <div className="w-full">
      {productName && (
        <h3 className="text-lg font-semibold mb-4">{productName} 시세 추이</h3>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            label={{
              value: "날짜",
              position: "insideBottom",
              offset: -5,
              style: { textAnchor: "middle" },
            }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={formatPrice}
            label={{
              value: "가격 (원)",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle" },
            }}
          />
          <Tooltip
            formatter={(value: number) => {
              if (value === null || value === undefined) return "데이터 없음";
              return `${formatPrice(value)}원`;
            }}
            labelFormatter={(label) => `날짜: ${label}`}
          />
          <Legend />
          {markets.map((market, index) => (
            <Line
              key={market}
              type="monotone"
              dataKey={market}
              stroke={
                [
                  "#3b82f6", // blue
                  "#10b981", // green
                  "#f59e0b", // amber
                  "#ef4444", // red
                  "#8b5cf6", // purple
                  "#ec4899", // pink
                ][index % 6] || "#6b7280"
              }
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {markets.length > 1 && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          여러 시장의 가격을 비교할 수 있습니다.
        </p>
      )}
    </div>
  );
}
