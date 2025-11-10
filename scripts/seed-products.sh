#!/bin/bash
# 테스트 상품 등록 스크립트
# 이 스크립트는 개발 환경에서 테스트 데이터를 생성하기 위한 것입니다.

echo "🌱 테스트 상품 등록 시작..."

# API 엔드포인트 호출
response=$(curl -s -X POST http://localhost:3000/api/test/seed-products \
  -H "Content-Type: application/json")

# JSON 파싱 (jq가 설치되어 있는 경우)
if command -v jq &> /dev/null; then
  success=$(echo $response | jq -r '.success')
  if [ "$success" = "true" ]; then
    echo "✅ 상품 등록 성공!"
    echo "도매점: $(echo $response | jq -r '.vendor.business_name')"
    echo "등록된 상품 수: $(echo $response | jq -r '.products | length')"
    echo ""
    echo "등록된 상품 목록:"
    echo $response | jq -r '.products[] | "  - \(.original_name) (\(.price)원/\(.unit))"'
  else
    echo "❌ 상품 등록 실패: $(echo $response | jq -r '.error')"
  fi
else
  echo "$response"
fi

