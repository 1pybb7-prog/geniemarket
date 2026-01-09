const fs = require('fs');

async function testPublicApi() {
  const apiKey = "637bda9c5cbfe57e5f9bd8d403344dc96c3b8ec57e6ad52c980a355a554cffcc";
  const baseUrl = "http://apis.data.go.kr/B552845/katRealTime/trades";
  
  // Target date: Last Friday (2025-11-21) - assuming today is Sat 2025-11-23
  // Wait, the system time says 2025-11-23 (Sat).
  // So Friday was 2025-11-21.
  const targetDate = "2025-11-21";
  const targetDateNoHyphen = "20251121";
  
  console.log("🔑 Testing API Key:", apiKey);
  console.log("📅 Target Date:", targetDate);

  const candidateParams = [
    "p_date",
    "p_ymd",
    "p_regday",
    "p_auc_dt",
    "p_sbid_dt", // Successful bid date
    "p_trd_dt", // Trade date
    "sbid_dt",
    "auc_dt",
    "reg_date",
    "date",
    "ymd"
  ];

  for (const paramName of candidateParams) {
    console.log(`\n🧪 Testing parameter: ${paramName}`);
    
    // Try both hyphenated and non-hyphenated formats
    const formats = [targetDate, targetDateNoHyphen];
    
    for (const dateVal of formats) {
      const queryParams = new URLSearchParams({
        serviceKey: apiKey,
        numOfRows: "5",
        pageNo: "1",
        format: "json",
        [paramName]: dateVal
      });

      const url = `${baseUrl}?${queryParams.toString()}`;
      // console.log("Request URL:", url);

      try {
        const response = await fetch(url);
        if (!response.ok) {
           console.log(`❌ HTTP Error: ${response.status}`);
           continue;
        }
        
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          const items = data.response?.body?.items?.item || data.response?.body?.items;
          const totalCount = data.response?.body?.totalCount;
          
          if (totalCount > 0 || (Array.isArray(items) && items.length > 0)) {
            console.log(`✅ SUCCESS! Found data with ${paramName}=${dateVal}`);
            console.log(`📦 Count: ${totalCount}`);
            if (Array.isArray(items)) console.log("First item:", items[0]);
            return; // Found it!
          } else {
            console.log(`⚠️ No data with ${paramName}=${dateVal}`);
          }
        } catch (e) {
          console.log(`⚠️ Parse error or invalid format`);
        }
      } catch (err) {
        console.log(`❌ Network error: ${err.message}`);
      }
    }
  }
  
  console.log("\n❌ Failed to find a working date parameter.");
}

testPublicApi();
