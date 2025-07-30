const axios = require('axios');

async function testMicrosoftAuth() {
  console.log('🧪 Testing Microsoft Authentication Endpoint...\n');
  
  try {
    // Test the Microsoft login endpoint
    console.log('📡 Testing /api/auth/login endpoint...');
    
    const testData = {
      msalToken: 'test-token-for-logging',
      clientId: '8d042e34-5a5f-40f5-a019-ee56de49b64e',
      tenantId: 'c16b04b5-b78c-4cce-b3f8-93686f221d09'
    };
    
    console.log('📤 Sending test request with data:', {
      hasMsalToken: !!testData.msalToken,
      clientId: testData.clientId,
      tenantId: testData.tenantId
    });
    
    const response = await axios.post('http://localhost:5000/api/auth/login', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response received:', {
      status: response.status,
      hasData: !!response.data,
      dataKeys: Object.keys(response.data || {})
    });
    
    if (response.data) {
      console.log('📋 Response data:', response.data);
    }
    
  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Error Message:', error.message);
    
    if (error.response?.data) {
      console.log('📋 Error Response Data:', error.response.data);
    }
  }
  
  console.log('\n🔍 Check the backend server console for detailed logs...');
}

// Run the test
testMicrosoftAuth().catch(console.error); 