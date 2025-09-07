// Test login directly in browser - paste this in browser console
(async function testLoginInBrowser() {
  console.log('🔍 Starting browser login test...');

  // Test API connectivity
  console.log('\n1️⃣ Testing API connectivity...');
  try {
    const healthResponse = await fetch('http://localhost:4000/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ API is reachable:', healthData);
  } catch (error) {
    console.error('❌ API unreachable:', error);
    return;
  }

  // Test login API
  console.log('\n2️⃣ Testing login API...');
  const credentials = {
    email: 'admin@test.com',
    password: 'Password123!',
  };

  try {
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    const loginData = await loginResponse.json();

    if (loginResponse.ok) {
      console.log('✅ Login successful!');
      console.log('User:', loginData.user);
      console.log('Has accessToken:', !!loginData.accessToken);
      console.log('Has refreshToken:', !!loginData.refreshToken);
    } else {
      console.error('❌ Login failed:', loginData);
    }
  } catch (error) {
    console.error('❌ Login request error:', error);
  }
})();
