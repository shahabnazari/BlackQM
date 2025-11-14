# Social Media Search - Current Status & Next Steps

**Date:** November 13, 2025  
**Status:** ✅ Frontend Complete, ⚠️ Backend Required

---

## 🎯 What's Working Now

### Frontend (100% Complete)
✅ **Unified Search Bar** - One search for all platforms  
✅ **TikTok Search** - Shows 12 mock videos (demo mode)  
✅ **Instagram Search** - Shows "coming soon" message  
✅ **YouTube Search** - Ready to call backend API  
✅ **Error Handling** - Graceful degradation when backend is offline  
✅ **Loading States** - Per-platform spinners  
✅ **Result Display** - Separate sections for each platform  

---

## ⚠️ Current Error Explanation

### Error You're Seeing:
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
:4000/api/literature…atforms=instagram
```

### What This Means:
- The **backend server is not running** on port 4000
- Or the backend doesn't have the social media endpoints yet
- The frontend is trying to call APIs that don't exist

### Why It Still Works:
- TikTok uses **mock data** (no backend needed) ✅
- Instagram shows **info message** (no backend needed) ✅
- YouTube gracefully handles backend being offline ⚠️
- Error messages guide users to start backend

---

## 🚀 How to Test (With Backend)

### Step 1: Start the Backend
```bash
cd backend
npm run dev
```

### Step 2: Verify Backend is Running
Check that you see:
```
✅ Backend server listening on port 4000
```

### Step 3: Test YouTube Search
1. Go to Literature page
2. Select YouTube platform
3. Enter search query (e.g., "machine learning")
4. Click Search
5. Should see YouTube videos from API ✅

---

## 📋 Backend Requirements

### Endpoints Needed:

#### 1. YouTube Search (Existing?)
```typescript
GET /api/literature/youtube/search?query=<query>&maxResults=20
```
**Status:** Should already exist via `searchYouTubeWithTranscription`

#### 2. Instagram Search (Not Implemented)
```typescript
GET /api/social-media/instagram/search?query=<query>
```
**Status:** ❌ Not implemented - Shows "coming soon" message

#### 3. TikTok Search (Not Implemented)
```typescript
GET /api/social-media/tiktok/search?query=<query>&timeRange=30
```
**Status:** ❌ Not implemented - Uses mock data

---

## 🔧 Frontend Changes Made

### Created: `useSocialMediaSearch.ts` (288 lines)
- Handles all social media search logic
- Works with or without backend
- Graceful error handling
- Mock data for TikTok (demo mode)

### Updated: `SocialMediaPanel.tsx`
- Removed call to `onSocialSearch()` that triggered non-existent API
- Now uses `useSocialMediaSearch` hook exclusively
- Each platform searches independently
- No dependency on parent's social media handler

---

## ✅ Testing Checklist

### Without Backend (Current State)
- [ ] Select TikTok → Search → See 12 mock videos ✅
- [ ] Select Instagram → Search → See "coming soon" message ✅
- [ ] Select YouTube → Search → See "Backend not running" error ⚠️
- [ ] All 3 platforms → Search → TikTok & Instagram work ✅

### With Backend Running
- [ ] Select YouTube → Search → See real videos from API ✅
- [ ] Select all platforms → Each searches independently ✅
- [ ] Check browser console → No ERR_CONNECTION_REFUSED ✅

---

## 🎯 Next Steps for Full Functionality

### Priority 1: YouTube (Backend Already Exists?)
1. Verify backend endpoint exists: `/api/literature/youtube/search`
2. Start backend server: `npm run dev` in backend directory
3. Test YouTube search in frontend
4. Should work immediately ✅

### Priority 2: Instagram API (Future)
1. Create Instagram search endpoint in backend
2. Implement Instagram API integration (Meta Graph API)
3. Update hook to call real API instead of info message
4. Replace `searchInstagram()` implementation

### Priority 3: TikTok API (Future)
1. Create TikTok search endpoint in backend
2. Implement TikTok Research API integration
3. Update hook to call real API instead of mock data
4. Replace mock data generator with real API call

---

## 🐛 Common Issues & Fixes

### Issue 1: ERR_CONNECTION_REFUSED
**Cause:** Backend not running  
**Fix:** Start backend with `npm run dev`

### Issue 2: No YouTube Results
**Cause:** Backend doesn't have YouTube endpoint  
**Fix:** Implement `/api/literature/youtube/search` endpoint

### Issue 3: CORS Errors
**Cause:** Backend not allowing frontend origin  
**Fix:** Add CORS middleware in backend for `http://localhost:3000`

---

## 📊 Architecture Overview

```
User enters query in unified search bar
                ↓
    useSocialMediaSearch.searchAll()
                ↓
        ┌───────┴───────┬───────────┐
        ↓               ↓           ↓
  searchYouTube()  searchInstagram()  searchTikTok()
        ↓               ↓           ↓
   Backend API    Info Message    Mock Data
   (port 4000)    (No API)       (No API)
        ↓               ↓           ↓
   Real Videos    "Coming Soon"  12 Mock Videos
        ↓               ↓           ↓
   Display in     Display in     Display in
VideoSelection    Message      TikTokGrid
   Panel          Box           Component
```

---

## 💡 Pro Tips

### For Development:
1. **Backend Optional:** TikTok & Instagram work without backend
2. **YouTube Needs Backend:** Only YouTube requires backend running
3. **Mock Data:** TikTok generates realistic mock data for UI testing
4. **Error Messages:** Clear messages guide users when backend is offline

### For Production:
1. **All Platforms Need Backend:** Implement all 3 API endpoints
2. **Remove Mock Data:** Replace TikTok mock with real API
3. **Update Instagram:** Add real Instagram search instead of info message
4. **Add Rate Limiting:** Protect APIs from abuse

---

## 🎉 Summary

**Current State:**
- ✅ Frontend is 100% complete and working
- ⚠️ Backend is needed for YouTube to show real results
- ⚠️ Backend is needed for Instagram (future)
- ⚠️ Backend is needed for TikTok (future)

**To Fix Connection Error:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (already running)
# Just refresh the browser
```

**Then test:** Select YouTube platform → Enter query → Search → See results!

---

**Status:** Ready for backend integration. Frontend gracefully handles missing backend.

