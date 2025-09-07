# Dynamic CORS Solution for VQMethod

## Problem Solved

Frontend port keeps changing (3000, 3001, 3002, 3003, 3004, etc.) when Next.js detects the default port is in use. Previously, login would break when the frontend started on a different port.

## Solution Implemented

Created a **dynamic CORS configuration** that automatically allows ANY localhost port in development, while maintaining strict security in production.

## Implementation Details

### Location: `/backend/src/main.ts`

```typescript
// Dynamic CORS configuration
const corsOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => {
  // Allow requests with no origin (like mobile apps or Postman)
  if (!origin) {
    callback(null, true);
    return;
  }

  // In development, allow any localhost port
  if (process.env.NODE_ENV !== 'production') {
    // Allow localhost with any port, or 127.0.0.1 with any port
    const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
    if (localhostRegex.test(origin)) {
      callback(null, true);
      return;
    }
  }

  // In production, check against allowed origins
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://vqmethod.com',
    'https://www.vqmethod.com',
  ].filter(Boolean);

  if (allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};
```

## Key Features

### ✅ Development Flexibility

- **ANY localhost port** is automatically allowed (3000-9999, etc.)
- Works with both `localhost` and `127.0.0.1`
- No need to restart backend when frontend port changes
- Supports HTTP and HTTPS protocols

### 🔒 Production Security

- Only allows specific whitelisted origins in production
- Uses environment variable `FRONTEND_URL` for configuration
- Blocks all non-whitelisted origins
- Maintains strict security in production

## Test Results

Successfully tested with the following ports:

- ✅ localhost:3000
- ✅ localhost:3001
- ✅ localhost:3002
- ✅ localhost:3003
- ✅ localhost:3004
- ✅ localhost:3005
- ✅ 127.0.0.1:3000

## Benefits

1. **No More Login Failures**: Login works regardless of which port the frontend uses
2. **Developer Friendly**: No manual CORS configuration needed when port changes
3. **Future Proof**: Will work with any port Next.js chooses
4. **Security Maintained**: Production environment remains secure
5. **Zero Configuration**: Works out of the box in development

## How It Works

1. When a request comes in, the CORS function checks the `Origin` header
2. In development mode, it uses a regex to match any localhost/127.0.0.1 with any port
3. If matched, the request is allowed
4. In production, only explicitly configured origins are allowed

## Testing the Solution

Run this simple test to verify CORS is working:

```javascript
// Save as test-cors.js
const axios = require('axios');

async function testCORS(port) {
  try {
    const response = await axios.post(
      'http://localhost:4000/api/auth/login',
      { email: 'admin@test.com', password: 'Password123!' },
      { headers: { Origin: `http://localhost:${port}` } }
    );
    console.log(`✅ Port ${port}: CORS allowed`);
  } catch (error) {
    console.log(`❌ Port ${port}: CORS blocked`);
  }
}

// Test different ports
testCORS(3000);
testCORS(3001);
testCORS(3004);
```

## Maintenance

No maintenance required! The solution is:

- Self-managing in development
- Configurable via environment variables in production
- Regex-based for maximum flexibility
- Framework-agnostic (works with any frontend framework)

---

**Status**: ✅ IMPLEMENTED & TESTED
**Date**: 2025-09-06
**Impact**: Login now works on ANY localhost port automatically
