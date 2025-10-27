# YouTube Alternative Source Search - User Guide

## 🚨 IMPORTANT: This Issue Has Been Fixed!

**Problem:** 401 Unauthorized error when searching YouTube
**Solution:** Fixed async token retrieval bug in authentication interceptor
**Status:** ✅ RESOLVED - Frontend code updated

**What was wrong:** The auth token wasn't being properly retrieved before making the API request.
**What's fixed:** Token is now properly retrieved using `await getAuthToken()` in the axios interceptor.

**Try it now!** The search should work. If you still see 401 errors:

1. **Log out** (click profile icon → Logout)
2. **Log back in** with your credentials
3. **Try YouTube search again**

---

## Where to Find and Use YouTube Search

### Step-by-Step Visual Guide

#### 1. Navigate to Literature Review Page

- **URL:** `http://localhost:3000/discover/literature`
- **Path:** Dashboard → Discover → Literature

#### 2. Locate the Search Interface

The literature review page has **THREE main panels**:

```
┌─────────────────────────────────────────────────────────────┐
│  📚 Literature Search                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Search Box: [Type your query here]  🔍 Search        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ PANEL 1: Search Results ───────────────────────────┐   │
│  │  (Main academic database results appear here)        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ PANEL 2: Alternative Sources (YouTube HERE!) ──────┐   │
│  │  📌 Alternative Sources & Social Media               │   │
│  │                                                       │   │
│  │  Select Alternative Sources:                         │   │
│  │  [🎥 YouTube] [🎙️ Podcasts] [💻 GitHub]           │   │
│  │  [📚 StackOverflow] [🧬 bioRxiv] [📄 arXiv]       │   │
│  │                                                       │   │
│  │  [🔍 Search These Sources Only]  3 results found    │   │
│  │                                                       │   │
│  │  ┌─ Results appear RIGHT HERE ─────────────────┐    │   │
│  │  │                                               │    │   │
│  │  │  ┌──────────────────────────────────────┐    │    │   │
│  │  │  │ climate engine - Educational Video   │    │    │   │
│  │  │  │ (DEMO)                               │    │    │   │
│  │  │  │ Science Channel                      │    │    │   │
│  │  │  │ [YouTube]                            │    │    │   │
│  │  │  │ ⚠️ YouTube API Key Required...      │    │    │   │
│  │  │  │                            [↗ Link]  │    │    │   │
│  │  │  └──────────────────────────────────────┘    │    │   │
│  │  │                                               │    │   │
│  │  │  ┌──────────────────────────────────────┐    │    │   │
│  │  │  │ Understanding climate engine...      │    │    │   │
│  │  │  │ TED Talks                            │    │    │   │
│  │  │  │ [YouTube]                            │    │    │   │
│  │  │  │ This is a demo result...             │    │    │   │
│  │  │  │                            [↗ Link]  │    │    │   │
│  │  │  └──────────────────────────────────────┘    │    │   │
│  │  │                                               │    │   │
│  │  │  [... more results ...]                      │    │   │
│  │  │                                               │    │   │
│  │  └───────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ PANEL 3: Social Media Intelligence ────────────────┐   │
│  │  (Twitter, LinkedIn, Reddit search)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Exact Steps to Search YouTube

1. **Type your search query** in the top search box
   - Example: `climate engine`

2. **Scroll down to "Alternative Sources & Social Media" panel** (PANEL 2)
   - This is the second card/panel on the page

3. **Click the YouTube badge** (🎥 YouTube)
   - The badge will change color to indicate it's selected (purple/blue background)

4. **Click "Search These Sources Only" button**
   - Button is below the source badges
   - A loading spinner will appear briefly

5. **Results appear IMMEDIATELY BELOW the button** in the same panel
   - If you see demo results, they will have "(DEMO)" in the title
   - Each result is a card with:
     - Title
     - Channel name (authors)
     - YouTube badge
     - Description/abstract
     - External link button (↗)

### What You Should See

#### Demo Results (Current - No API Key)

```
┌──────────────────────────────────────────────┐
│ climate engine - Educational Video (DEMO)     │
│ Science Channel                                │
│ [YouTube]                                      │
│ ⚠️ YouTube API Key Required: To see real     │
│ YouTube results, add YOUTUBE_API_KEY to       │
│ your .env file...                              │
│                                      [↗ Link] │
└──────────────────────────────────────────────┘
```

#### Real Results (After API Key Setup)

```
┌──────────────────────────────────────────────┐
│ Climate Engine: A New Tool for Climate...     │
│ NASA Climate Change                            │
│ [YouTube]                                      │
│ Climate Engine is a free web application      │
│ that allows users to analyze and download...  │
│                                      [↗ Link] │
└──────────────────────────────────────────────┘
```

### Troubleshooting

#### Problem: "Nothing appeared in search results"

**Check these locations in order:**

1. **Browser Developer Console** (F12 → Console tab)
   - Look for messages starting with:
     - `🔍 [Alternative Sources] Searching...`
     - `✅ [Alternative Sources] Results received:`
     - `📦 [Alternative Sources] Returning:`
   - Look for errors starting with:
     - `❌ [Alternative Sources] Search failed:`

2. **Backend Logs** (Terminal where `npm run dev` is running)
   - Look for messages:
     - `🔍 [Alternative Sources] Request received`
     - `✅ [Alternative Sources] Returning X results`

3. **Common Issues:**

   **Issue 1: Results count shows but no results visible**
   - **Symptom:** Badge shows "3 results found" but nothing appears below button
   - **Cause:** Results div not rendering
   - **Solution:** Check browser console for JavaScript errors

   **Issue 2: Authentication error**
   - **Symptom:** Error in console: "Unauthorized" or 401
   - **Cause:** Not logged in or token expired
   - **Solution:** Log out and log back in

   **Issue 3: "Alternative sources search failed" toast**
   - **Symptom:** Red error toast appears
   - **Cause:** Backend error or network issue
   - **Solution:** Check backend logs, verify backend is running

   **Issue 4: Button disabled/greyed out**
   - **Symptom:** Can't click "Search These Sources Only"
   - **Cause:** No sources selected or search in progress
   - **Solution:** Make sure YouTube badge is highlighted/selected

### Debug Checklist

Run through this checklist if YouTube search isn't working:

- [ ] **Logged in?** Check if profile icon appears in top right
- [ ] **On correct page?** URL should be `/discover/literature`
- [ ] **Query entered?** Search box has text
- [ ] **YouTube selected?** YouTube badge is highlighted/active
- [ ] **Backend running?** Check `http://localhost:4000/api/health`
- [ ] **Frontend running?** Page loads normally
- [ ] **Browser console open?** Press F12, check Console tab
- [ ] **Backend logs visible?** Check terminal where servers are running

### Expected Console Output (Working)

**Browser Console:**

```
🔍 [Alternative Sources] Searching... {query: "climate engine", sources: ["youtube"]}
✅ [Alternative Sources] Results received: Array(3)
📊 [Alternative Sources] Result count: 3
📦 [Alternative Sources] Returning: 3 results
```

**Backend Logs:**

```
🔍 [Alternative Sources] Request received - Query: "climate engine", Sources: ["youtube"], User: abc123
⚠️  YouTube API key not configured - returning demo results
✅ [Alternative Sources] Returning 3 results
```

### Where Results DON'T Appear

❌ **NOT** in the top search results panel (that's for academic databases)
❌ **NOT** in a new page
❌ **NOT** in a popup/modal
❌ **NOT** in the social media panel (that's panel 3)

✅ **YES** - In the Alternative Sources panel, right below the "Search These Sources Only" button

---

## Quick Reference

| Action             | Location                                                     |
| ------------------ | ------------------------------------------------------------ |
| Enter search query | Top of page, main search box                                 |
| Select YouTube     | Alternative Sources panel, click 🎥 YouTube badge            |
| Start search       | Alternative Sources panel, click "Search These Sources Only" |
| View results       | Alternative Sources panel, scrollable list below button      |
| Open video         | Click the [↗] button on any result card                     |

## Need Help?

1. Open browser console (F12)
2. Look for colored log messages with [Alternative Sources] prefix
3. Check backend terminal for similar messages
4. Verify you see demo results with "(DEMO)" in titles
5. If no results or errors, share console output for debugging
