const fs = require('fs');

async function testPublicApi() {
  const apiKey = "637bda9c5cbfe57e5f9bd8d403344dc96c3b8ec57e6ad52c980a355a554cffcc";
  const baseUrl = "http://apis.data.go.kr/B552845/katRealTime/trades";
  
  console.log("🔑 Testing API Key:", apiKey);
  console.log("🌐 Base URL:", baseUrl);

  // Test WITHOUT product name to see if we get ANY data
  const queryParams = new URLSearchParams({
    serviceKey: apiKey,
    numOfRows: "5", // Just get 5 items
    pageNo: "1",
    format: "json",
    // p_productname: "배추", // Removed
  });

  const url = `${baseUrl}?${queryParams.toString()}`;
  console.log("🔗 Request URL:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    console.log("Status:", response.status);
    const text = await response.text();
    
    try {
      const data = JSON.parse(text);
      console.log("✅ JSON Parse Success");
      
      if (data.response?.header) {
        console.log("Header:", JSON.stringify(data.response.header));
      }
      
      if (data.response?.body) {
        const items = data.response.body.items?.item || data.response.body.items;
        const totalCount = data.response.body.totalCount;
        console.log("Total Count:", totalCount);
        
        if (Array.isArray(items)) {
          console.log(`📦 Received ${items.length} items`);
          if (items.length > 0) {
            console.log("First item:", JSON.stringify(items[0], null, 2));
          }
        } else if (items) {
           console.log("📦 Received single item:", JSON.stringify(items, null, 2));
        } else {
          console.log("⚠️ No items found in body");
        }
      } else {
        console.log("⚠️ No body in response");
      }
      
    } catch (e) {
      console.log("⚠️ Response is not JSON");
    }

  } catch (error) {
    console.error("❌ Request Failed:", error);
  }
}

testPublicApi();
