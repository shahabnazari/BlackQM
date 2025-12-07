/**
 * JWT TOKEN DIAGNOSTIC SCRIPT
 * Run this in the browser console (F12) while on http://localhost:3000
 *
 * This script will:
 * 1. Retrieve token from localStorage
 * 2. Decode the JWT payload
 * 3. Check expiration time
 * 4. Validate token structure
 * 5. Display all findings
 */

console.log('🔍 === JWT TOKEN DIAGNOSTIC STARTED ===\n');

// Step 1: Retrieve token from all possible storage locations
console.log('📦 STEP 1: Checking token storage locations...\n');

const storageLocations = {
  'localStorage.access_token': localStorage.getItem('access_token'),
  'localStorage.auth_token': localStorage.getItem('auth_token'),
  'sessionStorage.access_token': sessionStorage.getItem('access_token'),
  'sessionStorage.auth_token': sessionStorage.getItem('auth_token'),
};

let token = null;
let tokenSource = null;

for (const [location, value] of Object.entries(storageLocations)) {
  if (value) {
    console.log(`✅ Found token in: ${location}`);
    console.log(`   Length: ${value.length} characters`);
    console.log(`   Preview: ${value.substring(0, 50)}...`);
    if (!token) {
      token = value;
      tokenSource = location;
    }
  } else {
    console.log(`❌ No token in: ${location}`);
  }
}

if (!token) {
  console.error('\n🚨 CRITICAL: No token found in any storage location!');
  console.log('Please log in first, then re-run this script.');
  throw new Error('No authentication token found');
}

console.log(`\n✅ Using token from: ${tokenSource}\n`);

// Step 2: Validate JWT structure
console.log('🔍 STEP 2: Validating JWT structure...\n');

const parts = token.split('.');
console.log(`Token parts: ${parts.length} (expected: 3)`);

if (parts.length !== 3) {
  console.error('🚨 INVALID TOKEN STRUCTURE!');
  console.log('Expected format: header.payload.signature');
  console.log(`Actual parts: ${parts.length}`);
  throw new Error('Invalid JWT token structure');
}

console.log('✅ Token structure is valid (3 parts)\n');
console.log('Parts breakdown:');
console.log(`  - Header:    ${parts[0].length} chars`);
console.log(`  - Payload:   ${parts[1].length} chars`);
console.log(`  - Signature: ${parts[2].length} chars`);

// Step 3: Decode header
console.log('\n📋 STEP 3: Decoding JWT header...\n');

try {
  const headerDecoded = JSON.parse(atob(parts[0]));
  console.log('Header:', headerDecoded);

  if (headerDecoded.alg !== 'HS256') {
    console.warn(`⚠️  Algorithm is "${headerDecoded.alg}" (expected: HS256)`);
  } else {
    console.log('✅ Algorithm: HS256 (correct)');
  }

  if (headerDecoded.typ !== 'JWT') {
    console.warn(`⚠️  Type is "${headerDecoded.typ}" (expected: JWT)`);
  } else {
    console.log('✅ Type: JWT (correct)');
  }
} catch (error) {
  console.error('🚨 Failed to decode header:', error.message);
}

// Step 4: Decode payload
console.log('\n📋 STEP 4: Decoding JWT payload...\n');

let payload;
try {
  payload = JSON.parse(atob(parts[1]));
  console.log('Full payload:', payload);
} catch (error) {
  console.error('🚨 Failed to decode payload:', error.message);
  throw error;
}

// Step 5: Analyze payload fields
console.log('\n🔍 STEP 5: Analyzing payload fields...\n');

// Check required fields
const requiredFields = ['sub', 'email', 'iat', 'exp'];
const missingFields = requiredFields.filter(field => !(field in payload));

if (missingFields.length > 0) {
  console.error(`🚨 Missing required fields: ${missingFields.join(', ')}`);
} else {
  console.log('✅ All required fields present');
}

// Decode timestamps
const now = Date.now();
const issuedAt = payload.iat ? new Date(payload.iat * 1000) : null;
const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;

console.log('\n📅 Timestamp Analysis:');
console.log(`  Current time:     ${new Date(now).toISOString()}`);
console.log(`  Token issued at:  ${issuedAt ? issuedAt.toISOString() : 'NOT SET'}`);
console.log(`  Token expires at: ${expiresAt ? expiresAt.toISOString() : 'NOT SET'}`);

if (issuedAt && expiresAt) {
  const tokenLifespanMs = (payload.exp - payload.iat) * 1000;
  const tokenLifespanHours = tokenLifespanMs / (1000 * 60 * 60);
  const tokenLifespanMinutes = tokenLifespanMs / (1000 * 60);

  console.log(`  Token lifespan:   ${tokenLifespanHours.toFixed(2)} hours (${tokenLifespanMinutes.toFixed(0)} minutes)`);

  const tokenAgeMs = now - (payload.iat * 1000);
  const tokenAgeMinutes = tokenAgeMs / (1000 * 60);
  console.log(`  Token age:        ${tokenAgeMinutes.toFixed(1)} minutes`);

  const timeUntilExpiryMs = (payload.exp * 1000) - now;
  const timeUntilExpiryMinutes = timeUntilExpiryMs / (1000 * 60);

  if (timeUntilExpiryMs < 0) {
    console.error(`\n🚨 TOKEN IS EXPIRED!`);
    console.error(`   Expired ${Math.abs(timeUntilExpiryMinutes).toFixed(1)} minutes ago`);
  } else if (timeUntilExpiryMinutes < 5) {
    console.warn(`\n⚠️  TOKEN EXPIRES SOON!`);
    console.warn(`   Expires in ${timeUntilExpiryMinutes.toFixed(1)} minutes`);
  } else {
    console.log(`\n✅ TOKEN IS VALID`);
    console.log(`   Expires in ${timeUntilExpiryMinutes.toFixed(1)} minutes`);
  }
}

// Step 6: Check user claims
console.log('\n👤 STEP 6: User Claims Analysis:\n');
console.log(`  User ID (sub):    ${payload.sub || 'NOT SET'}`);
console.log(`  Email:            ${payload.email || 'NOT SET'}`);
console.log(`  Role:             ${payload.role || 'NOT SET'}`);
console.log(`  Name:             ${payload.name || 'NOT SET'}`);

// Step 7: Security checks
console.log('\n🔒 STEP 7: Security Checks:\n');

// Check if token matches current user in app
if (window.useAuthStore) {
  try {
    const authState = window.useAuthStore.getState();
    const currentUser = authState.user;

    if (currentUser) {
      console.log('Current user from auth store:', currentUser);

      if (currentUser.id !== payload.sub) {
        console.error(`🚨 USER ID MISMATCH!`);
        console.error(`   Token sub: ${payload.sub}`);
        console.error(`   Store user.id: ${currentUser.id}`);
      } else {
        console.log('✅ User ID matches token');
      }

      if (currentUser.email !== payload.email) {
        console.error(`🚨 EMAIL MISMATCH!`);
        console.error(`   Token email: ${payload.email}`);
        console.error(`   Store email: ${currentUser.email}`);
      } else {
        console.log('✅ Email matches token');
      }
    } else {
      console.warn('⚠️  No user in auth store (might be logged out)');
    }
  } catch (e) {
    console.log('ℹ️  Auth store not available (not a React app?)');
  }
}

// Step 8: Test token format for API
console.log('\n🌐 STEP 8: API Format Check:\n');

const authHeader = `Bearer ${token}`;
console.log(`Authorization header would be:`);
console.log(`  "${authHeader.substring(0, 80)}..."`);
console.log(`  Length: ${authHeader.length} characters`);

// Step 9: Summary and recommendations
console.log('\n📊 === DIAGNOSTIC SUMMARY ===\n');

const issues = [];
const warnings = [];

if (parts.length !== 3) {
  issues.push('Invalid token structure (not 3 parts)');
}

if (!payload.exp) {
  issues.push('Token has no expiration (exp field missing)');
} else if ((payload.exp * 1000) < now) {
  issues.push('TOKEN IS EXPIRED - This is likely the root cause!');
}

if (!payload.sub) {
  issues.push('Token has no user ID (sub field missing)');
}

if (!payload.email) {
  warnings.push('Token has no email claim');
}

if (payload.exp && payload.iat) {
  const lifespanHours = (payload.exp - payload.iat) / 3600;
  if (lifespanHours < 1) {
    warnings.push(`Token lifespan is very short (${lifespanHours.toFixed(2)} hours)`);
  }
}

if (issues.length > 0) {
  console.log('🚨 CRITICAL ISSUES FOUND:');
  issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
} else {
  console.log('✅ No critical issues found');
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach((warning, i) => console.log(`  ${i + 1}. ${warning}`));
}

console.log('\n📋 RECOMMENDATIONS:\n');

if (issues.includes('TOKEN IS EXPIRED - This is likely the root cause!')) {
  console.log('1. 🔥 IMMEDIATE ACTION: Log out and log back in to get a fresh token');
  console.log('2. Check backend auth.service.ts for token expiration setting');
  console.log('3. Consider increasing JWT_EXPIRES_IN to 24h or more');
}

if (warnings.find(w => w.includes('very short'))) {
  console.log('1. Increase token lifespan in backend/.env (JWT_EXPIRES_IN)');
  console.log('2. Implement token refresh mechanism');
}

if (issues.length === 0 && warnings.length === 0) {
  console.log('Token appears valid. Issue might be with:');
  console.log('1. Multiple backend processes (different JWT_SECRET)');
  console.log('2. Backend JWT strategy configuration');
  console.log('3. User account status in database (isActive=false)');
}

console.log('\n✅ === DIAGNOSTIC COMPLETE ===');

// Return token object for further inspection
const diagnosticResult = {
  token,
  tokenSource,
  header: JSON.parse(atob(parts[0])),
  payload,
  isExpired: payload.exp ? (payload.exp * 1000) < now : null,
  expiresAt,
  issuedAt,
  issues,
  warnings
};

console.log('\n💾 Diagnostic result saved to window.tokenDiagnostic');
window.tokenDiagnostic = diagnosticResult;

return diagnosticResult;
