import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

async function testLogin(email: string, password: string) {
  try {
    console.log(`\nTesting login for ${email} with password: ${password}`);
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    console.log('✅ Login successful!');
    console.log('User:', response.data.user);
    return true;
  } catch (error: any) {
    console.log(
      '❌ Login failed:',
      error.response?.data?.message || error.message,
    );
    return false;
  }
}

async function main() {
  console.log('🔐 Testing admin@test.com login with different passwords...\n');

  // Test different password combinations
  const passwords = [
    'Password123!',
    'TestPassword123!',
    'Admin123!',
    'admin123',
    'password',
    'Password123',
  ];

  for (const password of passwords) {
    await testLogin('admin@test.com', password);
  }

  console.log('\n🔐 Testing researcher@test.com login...');
  await testLogin('researcher@test.com', 'TestPassword123!');
}

main().catch(console.error);
