// Simple test script to check backend connectivity
const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3000';

async function testBackendEndpoints() {
  console.log('Testing backend connectivity...');
  console.log('Backend URL:', EXTERNAL_API_BASE_URL);
  
  const endpoints = [
    '/auth/check-auth',
    '/auth/auth-url',
    '/api/pipedrive-data',
    '/api/xero/status'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting: ${EXTERNAL_API_BASE_URL}${endpoint}`);
      const response = await fetch(`${EXTERNAL_API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`Status: ${response.status}`);
      
      try {
        const data = await response.text();
        console.log(`Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
      } catch (e) {
        console.log('Could not parse response');
      }
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
}

testBackendEndpoints().catch(console.error);
