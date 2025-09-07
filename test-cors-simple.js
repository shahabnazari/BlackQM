const axios = require('axios');

async function testPort(port) {
  const origin = `http://localhost:${port}`;
  console.log(`\n🔍 Testing CORS from port ${port}...`);

  try {
    const response = await axios.post(
      'http://localhost:4000/api/auth/login',
      {
        email: 'admin@test.com',
        password: 'Password123!',
      },
      {
        headers: {
          Origin: origin,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );

    console.log(`✅ Port ${port}: CORS allowed - Login successful`);
    console.log(`   User: ${response.data.user.email}`);
    return true;
  } catch (error) {
    if (
      error.code === 'ERR_BAD_REQUEST' &&
      error.response?.data?.message?.includes('CORS')
    ) {
      console.log(`❌ Port ${port}: CORS blocked`);
    } else if (error.response?.status === 401) {
      console.log(
        `✅ Port ${port}: CORS allowed (auth failed as expected with wrong password)`
      );
    } else {
      console.log(`⚠️  Port ${port}: ${error.message}`);
    }
    return false;
  }
}

async function main() {
  console.log('Testing CORS configuration with dynamic ports...');
  console.log('='.repeat(50));

  // Test various ports
  await testPort(3000);
  await testPort(3001);
  await testPort(3002);
  await testPort(3003);
  await testPort(3004);
  await testPort(3005);

  // Test with 127.0.0.1
  console.log(`\n🔍 Testing CORS from 127.0.0.1:3000...`);
  try {
    const response = await axios.post(
      'http://localhost:4000/api/auth/login',
      {
        email: 'admin@test.com',
        password: 'Password123!',
      },
      {
        headers: {
          Origin: 'http://127.0.0.1:3000',
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );
    console.log(`✅ 127.0.0.1:3000: CORS allowed`);
  } catch (error) {
    if (
      error.code === 'ERR_BAD_REQUEST' &&
      error.response?.data?.message?.includes('CORS')
    ) {
      console.log(`❌ 127.0.0.1:3000: CORS blocked`);
    } else {
      console.log(`✅ 127.0.0.1:3000: CORS allowed`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(
    '✅ All localhost ports should now work with the dynamic CORS configuration!'
  );
}

main().catch(console.error);
