import axios from 'axios';

async function testLogin() {
  console.log('\n🔐 Testing Backend Authentication API\n');

  const credentials = {
    email: 'admin@test.com',
    password: 'Password123!',
  };

  console.log('📤 Sending login request:');
  console.log('   URL: http://localhost:4000/api/auth/login');
  console.log('   Email:', credentials.email);
  console.log('   Password:', credentials.password);

  try {
    const response = await axios.post(
      'http://localhost:4000/api/auth/login',
      credentials,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('\n✅ Login successful!');
    console.log('   Status:', response.status);
    console.log('   User:', response.data.user);
    console.log(
      '   Access Token:',
      response.data.accessToken ? '✅ Received' : '❌ Missing',
    );
    console.log(
      '   Refresh Token:',
      response.data.refreshToken ? '✅ Received' : '❌ Missing',
    );

    return response.data;
  } catch (error: any) {
    console.log('\n❌ Login failed!');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data?.message || error.message);
    console.log('   Full error:', error.response?.data);

    if (error.response?.status === 400) {
      console.log('\n⚠️  Bad Request - Check request format');
    } else if (error.response?.status === 401) {
      console.log('\n⚠️  Unauthorized - Invalid credentials');
    } else if (error.response?.status === 403) {
      console.log('\n⚠️  Forbidden - Account may be locked or inactive');
    }

    throw error;
  }
}

// Also test with researcher account
async function testResearcherLogin() {
  console.log('\n🔐 Testing researcher@test.com\n');

  try {
    const response = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'researcher@test.com',
      password: 'Password123!',
    });

    console.log('✅ Researcher login successful!');
    console.log('   User:', response.data.user?.name);
    console.log('   Role:', response.data.user?.role);
  } catch (error: any) {
    console.log('❌ Researcher login failed:', error.response?.data?.message);
  }
}

async function main() {
  // Test admin login
  await testLogin().catch(() => {});

  // Test researcher login
  await testResearcherLogin().catch(() => {});
}

main();
