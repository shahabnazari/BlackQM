# AI Suggestions Issue - Root Cause Found

## Problem
AI suggestions in the search bar are not appearing when users type queries.

## Root Cause
**OpenAI API Quota Exceeded** - Error 429

Backend logs show:
```
RateLimitError: 429 You exceeded your current quota, please check your plan and billing details.
```

## Technical Flow

1. **User types in search bar** (>3 characters)
2. **Frontend** calls `/api/ai/query/expand/public`
3. **Backend** calls OpenAI API to generate suggestions
4. **OpenAI API** returns 429 (quota exceeded)
5. **Backend** catches error and returns empty suggestions as fallback
6. **Frontend** displays dropdown but with no suggestions

## Solution Options

### Option 1: Add Credits to OpenAI Account (Recommended)
1. Go to https://platform.openai.com/account/billing
2. Add credits to your account
3. Restart backend server
4. AI suggestions will work immediately

### Option 2: Use Different OpenAI API Key
1. Get a new API key from https://platform.openai.com/api-keys
2. Update `backend/.env`:
   ```bash
   OPENAI_API_KEY="your-new-key-here"
   ```
3. Restart backend: `./start-servers.sh`

### Option 3: Disable AI Suggestions (Temporary Workaround)
Keep the search functionality but remove the AI-powered suggestions dropdown.

## Current Status
- Search functionality: ✅ Working (search still works without AI suggestions)
- AI suggestions: ❌ Not working (OpenAI quota exceeded)
- Backend: ✅ Running normally (gracefully handling the error)
- Frontend: ✅ Working (no errors, just empty suggestions)

## Files Involved
- Frontend: `frontend/app/(researcher)/discover/literature/components/SearchSection/SearchBar.tsx`
- API Service: `frontend/lib/api/services/query-expansion-api.service.ts`
- Backend Controller: `backend/src/modules/ai/controllers/ai.controller.ts`
- Backend Service: `backend/src/modules/ai/services/query-expansion.service.ts`
- OpenAI Service: `backend/src/modules/ai/services/openai.service.ts`

## Next Steps
Choose one of the solution options above based on your needs.
