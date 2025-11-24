const fs = require('fs');
const path = require('path');

async function testKamisApi() {
  try {
    const certId = "6836";
    const certKey = "0efbb7e6-0d61-4f8e-b617-a7bd50853d70";

    console.log('✅ KAMIS 인증 정보 설정 완료');

    const baseUrl = 'http://www.kamis.or.kr/service/price/xml.do';
    // 어제 날짜로 고정 (평일 데이터 확인용)
    const dateStr = '2025-11-22'; 
    console.log(`📅 조회 기준일: ${dateStr}`);

    const productClasses = ['02', '01']; // 도매, 소매
    const categories = ['100', '300'];
    
    for (const pClass of productClasses) {
      const pClassName = pClass === '02' ? '도매' : '소매';
      for (const code of categories) {
        console.log(`\n🔍 ${pClassName}(${pClass}) 카테고리 ${code} 조회 중...`);
        
        const params = new URLSearchParams({
          action: 'dailyPriceByCategoryList',
          p_product_cls_code: pClass,
          p_country_code: '1101',
          p_regday: dateStr,
          p_convert_kg_yn: 'N',
          p_item_category_code: code,
          p_cert_key: certKey,
          p_cert_id: certId,
          p_returntype: 'json'
        });

        const url = `${baseUrl}?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          console.log(`❌ 요청 실패: ${response.status}`);
          continue;
        }

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.log('❌ JSON 파싱 실패');
          continue;
        }

        if (data.data && Array.isArray(data.data.item)) {
          const items = data.data.item.filter(item => 
            item.item_name.includes('감자') || 
            item.item_name.includes('고구마') || 
            item.item_name.includes('깨')
          );
          
          if (items.length > 0) {
            console.log(`✅ 카테고리 ${code}에서 타겟 품목 발견!`);
            items.forEach(item => {
              console.log(`- ${item.item_name} (${item.kind_name}) ${item.rank}`);
            });
          } else {
             const itemNames = [...new Set(data.data.item.map(i => i.item_name))];
             console.log(`📋 ${pClassName} 카테고리 ${code} 전체 품목:`, itemNames.join(', '));
          }
        } else {
          console.log(`⚠️ 데이터 없음 또는 구조 다름`);
        }
      }
    }

  } catch (error) {
    console.error('❌ 에러 발생:', error);
  }
}

testKamisApi();
