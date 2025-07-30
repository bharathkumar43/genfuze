const axios = require('axios');

async function testAuthLogs() {
  console.log('🔍 Testing Backend Authentication Logs...\n');
  
  // Test 1: Health check
  console.log('1️⃣ Testing Health Check...');
  try {
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health Check Response:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
  }
  
  console.log('\n2️⃣ Testing Microsoft Auth with Invalid Token...');
  try {
    const authResponse = await axios.post('http://localhost:5000/api/auth/login', {
      msalToken: 'invalid-token-format',
      clientId: 'your-azure-client-id-here',
      tenantId: 'your-azure-tenant-id-here'
    });
    console.log('✅ Auth Response:', authResponse.data);
  } catch (error) {
    console.log('❌ Auth Error (Expected):', {
      status: error.response?.status,
      message: error.response?.data?.details || error.message
    });
  }
  
  console.log('\n3️⃣ Testing Microsoft Auth with Missing Fields...');
  try {
    const authResponse2 = await axios.post('http://localhost:5000/api/auth/login', {
      msalToken: 'test-token'
    });
    console.log('✅ Auth Response 2:', authResponse2.data);
  } catch (error) {
    console.log('❌ Auth Error 2 (Expected):', {
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });
  }
  
  console.log('\n4️⃣ Testing Local Auth...');
  try {
    const localAuthResponse = await axios.post('http://localhost:5000/api/auth/local-login', {
      email: 'test@example.com',
      password: 'testpassword'
    });
    console.log('✅ Local Auth Response:', localAuthResponse.data);
  } catch (error) {
    console.log('❌ Local Auth Error (Expected):', {
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });
  }
  
  console.log('\n📋 Backend Configuration Check:');
  console.log('- Server should be running on port 5000');
  console.log('- Check if you see detailed logs in the backend server console');
  console.log('- Look for lines starting with: 🔐 [Server], [AuthService], etc.');
}

testAuthLogs().catch(console.error); 