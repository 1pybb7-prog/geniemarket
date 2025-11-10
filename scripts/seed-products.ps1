# 테스트 상품 등록 스크립트
# 이 스크립트는 개발 환경에서 테스트 데이터를 생성하기 위한 것입니다.

Write-Host "🌱 테스트 상품 등록 시작..." -ForegroundColor Green

# API 엔드포인트 호출
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/test/seed-products" -Method POST -ContentType "application/json"

if ($response.success) {
    Write-Host "✅ 상품 등록 성공!" -ForegroundColor Green
    Write-Host "도매점: $($response.vendor.business_name)" -ForegroundColor Cyan
    Write-Host "등록된 상품 수: $($response.products.Count)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "등록된 상품 목록:" -ForegroundColor Yellow
    foreach ($product in $response.products) {
        Write-Host "  - $($product.original_name) ($($product.price)원/$($product.unit))" -ForegroundColor White
    }
} else {
    Write-Host "❌ 상품 등록 실패: $($response.error)" -ForegroundColor Red
}

