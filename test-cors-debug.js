// Test CORS configuration debug
const origin = 'http://localhost:3001';

// Simulate the CORS check
function testCorsOrigin(origin) {
  console.log('Testing origin:', origin);
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');

  // Check 1: No origin
  if (!origin) {
    console.log('✅ No origin - allowing');
    return true;
  }

  // Check 2: Development mode
  const isDevelopment = process.env.NODE_ENV !== 'production';
  console.log('Is development?', isDevelopment);

  if (isDevelopment) {
    const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
    const testResult = localhostRegex.test(origin);
    console.log('Localhost regex test:', testResult);
    console.log('Regex:', localhostRegex.toString());

    if (testResult) {
      console.log('✅ Localhost in development - allowing');
      return true;
    }
  }

  // Check 3: Production allowed origins
  console.log('❌ Not allowed - would check production origins');
  return false;
}

// Test with different origins
console.log('\n--- Test 1: localhost:3001 ---');
testCorsOrigin('http://localhost:3001');

console.log('\n--- Test 2: localhost:4000 ---');
testCorsOrigin('http://localhost:4000');

console.log('\n--- Test 3: 127.0.0.1:3001 ---');
testCorsOrigin('http://127.0.0.1:3001');

console.log('\n--- Test 4: With NODE_ENV=development ---');
process.env.NODE_ENV = 'development';
testCorsOrigin('http://localhost:3001');
