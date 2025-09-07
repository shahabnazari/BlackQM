// Test CORS with different port numbers
const axios = require('axios');

const API_URL = 'http://localhost:4000/api';
const TEST_PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 8080, 8081];

async function testCorsFromPort(port) {
  const origin = `http://localhost:${port}`;

  try {
    const response = await axios.post(
      `${API_URL}/auth/login`,
      {
        email: 'admin@test.com',
        password: 'Password123!',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Origin: origin,
        },
        withCredentials: true,
      }
    );

    console.log(`✅ Port ${port}: CORS allowed - Login successful`);
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      // 401 means CORS worked but credentials were wrong
      console.log(`✅ Port ${port}: CORS allowed - Auth check passed`);
      return true;
    } else if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.log(`❌ Port ${port}: CORS blocked`);
      return false;
    } else {
      console.log(`⚠️  Port ${port}: Other error - ${error.message}`);
      return false;
    }
  }
}

async function testAllPorts() {
  console.log('🔍 Testing CORS configuration with different ports...\n');
  console.log(
    'Expected: All localhost ports should be allowed in development\n'
  );

  // Wait a bit for backend to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  let successCount = 0;
  let failCount = 0;

  for (const port of TEST_PORTS) {
    const success = await testCorsFromPort(port);
    if (success) successCount++;
    else failCount++;

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Results:');
  console.log(`✅ Successful: ${successCount}/${TEST_PORTS.length} ports`);
  console.log(`❌ Failed: ${failCount}/${TEST_PORTS.length} ports`);

  if (failCount === 0) {
    console.log(
      '\n🎉 Perfect! CORS is configured to accept any localhost port.'
    );
  } else {
    console.log('\n⚠️  Some ports were blocked. Check the CORS configuration.');
  }
}

// Also test with 127.0.0.1
async function testIPAddress() {
  console.log('\n🔍 Testing with 127.0.0.1...');

  try {
    const response = await axios.post(
      `${API_URL}/auth/login`,
      {
        email: 'admin@test.com',
        password: 'Password123!',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://127.0.0.1:3000',
        },
        withCredentials: true,
      }
    );

    console.log('✅ 127.0.0.1:3000: CORS allowed');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ 127.0.0.1:3000: CORS allowed');
    } else {
      console.log('❌ 127.0.0.1:3000: CORS blocked');
    }
  }
}

async function main() {
  console.log('Waiting for backend to start...');
  // Give backend time to compile and start
  await new Promise(resolve => setTimeout(resolve, 20000));

  await testAllPorts();
  await testIPAddress();
}

main().catch(console.error);
