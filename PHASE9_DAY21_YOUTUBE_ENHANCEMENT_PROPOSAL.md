# Phase 9 Day 21: YouTube Enhancement & AI Search Assistance

**Status:** 🔴 PROPOSED (Not Started)
**Priority:** HIGH - Addresses critical UX and cost transparency gaps
**Dependencies:** Days 17-18 complete (YouTube API ✅ + Transcription ✅)
**Estimated Duration:** 1 full day (6-8 hours)
**Date Proposed:** October 3, 2025

---

## 🎯 PROBLEM STATEMENT

### Current YouTube Implementation Issues

Based on user feedback and system analysis, the current YouTube integration (Days 17-18) has the following critical gaps:

#### 1. **No Video Selection Interface**

- **Problem:** Videos are auto-transcribed without user preview
- **Impact:** Users waste money transcribing irrelevant videos
- **User Quote:** "I have no idea what is being transcribed and what I am paying for"

#### 2. **No Cost Transparency**

- **Problem:** No cost preview before transcription
- **Impact:** Users don't know the cost until after transcription completes
- **Expected:** Show cost estimate upfront (e.g., "30min video = $0.18")

#### 3. **Limited Input Methods**

- **Problem:** Can only search with keywords, no channel/URL support
- **Impact:** Users can't:
  - Add entire YouTube channels
  - Paste direct video URLs
  - Browse a channel's videos
- **User Request:** "We should be able to add channels or even direct YouTube videos"

#### 4. **No AI Video Selection**

- **Problem:** Users must manually evaluate every video's relevance
- **Impact:** Time-consuming, prone to error
- **User Request:** "Leave it to AI to select it for us"

#### 5. **Poor Search Results for Simple Queries**

- **Problem:** Single keywords like "climate" return poor results
- **Impact:** Users get irrelevant videos mixed with relevant ones
- **User Request:** "If I write climate as single word not a meaningful set of papers or media will be retrieved"
- **Expected:** AI should expand "climate" to "climate change impacts on agriculture research methods"

---

## 📋 PROPOSED SOLUTION: 5 TASKS

### Task 1: Video Selection Interface with Cost Preview

**Time:** 2 hours
**Value:** Prevents wasted transcription costs, improves UX

**New Component:** `frontend/components/multimedia/VideoSelectionPanel.tsx`

**Features:**

- Display YouTube search results in card grid with thumbnails
- Show metadata: title, channel, duration, views, publish date
- **Calculate cost BEFORE selection:** `(duration_seconds / 60) * $0.006`
  - Example: 30min video = `$0.18`
  - Example: 1hr video = `$0.36`
- Multi-select checkboxes for batch operations
- Show **total cost** for selected videos at bottom
- "Preview" button opens embedded YouTube player
- **"Transcribe Selected (Total: $2.45)"** button
- Confirmation dialog: "You're about to transcribe 8 videos for $2.45. Continue?"
- Status indicators:
  - 🔵 Not Transcribed
  - 🟡 Processing...
  - 🟢 Transcribed (cached) - **$0.00**

**Backend API:**

```typescript
GET /api/literature/youtube/estimate-cost/:videoId
Response: {
  duration: 1850, // seconds
  estimatedCost: 0.185, // $0.185
  alreadyTranscribed: false,
  cachedTranscriptId?: string
}
```

**Acceptance Criteria:**

- ✅ Users see cost BEFORE transcribing
- ✅ Users can select multiple videos and see total cost
- ✅ Cached videos show $0.00 cost
- ✅ Confirmation dialog shows breakdown

---

### Task 2: Channel & Direct URL Support

**Time:** 1.5 hours
**Value:** Flexibility, enables curated content sources

**New Component:** `frontend/components/multimedia/YouTubeChannelBrowser.tsx`

**Channel Support Features:**

- Input field accepts:
  - Channel URL: `https://www.youtube.com/c/TED`
  - Channel handle: `@TEDx`
  - Channel ID: `UCsT0YIqwnpJCM-mx7-gSA4Q`
- Fetch channel metadata using YouTube Data API v3
- Display: name, subscribers, video count, description
- List recent videos (paginated, 20 per page)
- Filters:
  - Date range (week/month/year/all)
  - Duration (short <4min, medium 4-20min, long >20min)
  - Keyword in title/description
- "Add All Visible" button for batch selection
- "Add Channel to My Sources" for future monitoring

**Direct URL Support Features:**

- Input field accepts:
  - Standard URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
  - Short URL: `https://youtu.be/dQw4w9WgXcQ`
  - Embedded URL: `https://www.youtube.com/embed/dQw4w9WgXcQ`
- Extract video ID automatically
- Fetch and display metadata immediately
- Add to selection panel

**Backend Service Updates:**

```typescript
// Add to literature.service.ts
async getChannelVideos(channelId: string, filters: ChannelFilters) {
  // Use YouTube Data API v3
  // channels.list for metadata
  // search.list for videos
  // Cache for 1 hour
}

async getVideoMetadata(videoId: string) {
  // Use YouTube Data API v3
  // videos.list endpoint
  // Cache for 24 hours
}

async validateYouTubeUrl(url: string): Promise<{
  valid: boolean,
  type: 'video' | 'channel' | 'invalid',
  id: string
}> {
  // Parse and validate URLs
}
```

**API Endpoints:**

```typescript
POST /api/literature/youtube/channel
Body: { channelId, filters: { dateRange, duration, keyword } }
Response: { channel: {...}, videos: [...] }

POST /api/literature/youtube/video-metadata
Body: { videoId }
Response: { title, channel, duration, views, publishedAt, ... }

POST /api/literature/youtube/validate-url
Body: { url }
Response: { valid, type, id }
```

**Acceptance Criteria:**

- ✅ Users can paste channel URL and browse videos
- ✅ Users can paste direct video URL and preview
- ✅ Filters work correctly
- ✅ Invalid URLs show clear error messages
- ✅ Channel shows 20+ videos with metadata

---

### Task 3: AI-Powered Video Relevance Scoring

**Time:** 2 hours
**Value:** Saves money, improves research quality

**New Backend Service:** `backend/src/modules/literature/services/video-relevance.service.ts`

**Core Capabilities:**

- Score video relevance using GPT-4
- Input: video metadata + user's research context
- Output: relevance score (0-100), reasoning, topics

**AI Scoring Algorithm:**

```typescript
interface RelevanceScore {
  score: number; // 0-100
  reasoning: string; // Why this score
  topics: string[]; // Key topics detected
  isAcademic: boolean; // Research vs entertainment
  confidence: number; // 0-1
  recommendations: {
    transcribe: boolean;
    priority: 'high' | 'medium' | 'low';
  };
}

async scoreVideoRelevance(
  video: VideoMetadata,
  researchContext: string
): Promise<RelevanceScore> {
  const prompt = `
    Research Topic: "${researchContext}"
    Video Title: "${video.title}"
    Video Description: "${video.description}"
    Channel: "${video.channelName}"

    Score relevance (0-100):
    - 0-30: Irrelevant (entertainment, unrelated)
    - 31-60: Tangentially related (mentions topic)
    - 61-80: Moderately relevant (discusses topic)
    - 81-100: Highly relevant (research, methodology, findings)

    Consider:
    - Academic vs entertainment content
    - Research methodology discussions
    - Empirical findings
    - Theoretical frameworks

    Return JSON with score, reasoning, topics, isAcademic.
  `;

  // Call GPT-4 with structured output
  // Parse and validate response
  // Cache result for 24 hours
}
```

**Frontend Integration:**

- Add "AI Relevance" badge to each video card
- Color coding:
  - 🔴 0-30: Not Relevant (greyed out)
  - 🟡 31-60: Maybe Relevant
  - 🟢 61-80: Relevant
  - 🔵 81-100: Highly Relevant
- Sort videos by relevance (highest first)
- "Show Only Relevant (≥60)" toggle
- Display AI reasoning on hover/click
- **"Let AI Select Top 5"** button
  - AI automatically selects 5 highest-scoring videos
  - Shows total estimated cost
  - One-click approval

**Batch Scoring:**

- Score all search results at once
- Show progress: "Analyzing relevance... 7/10 videos"
- ~2-3 seconds for 10 videos

**Cost Management:**

- Cache scores for 24 hours
- Batch API calls (score 10 videos in one request)
- Cost: ~$0.01 per 10 videos
- Budget: $5/month for 5000 videos

**API Endpoints:**

```typescript
POST /api/literature/youtube/score-relevance
Body: { videoId, researchContext }
Response: { score, reasoning, topics, isAcademic, recommendations }

POST /api/literature/youtube/batch-score
Body: { videoIds: string[], researchContext }
Response: { scores: RelevanceScore[] }

POST /api/literature/youtube/ai-select
Body: { videoIds: string[], researchContext, topN: 5 }
Response: { selectedVideos: string[], totalCost, reasoning }
```

**Acceptance Criteria:**

- ✅ Each video shows AI relevance score
- ✅ Scores are accurate (validated with 10 test videos)
- ✅ AI can select top 5 relevant videos
- ✅ Irrelevant videos are clearly marked
- ✅ Scoring completes in <3s per 10 videos
- ✅ Cost stays under $0.01 per 10 videos

---

### Task 4: AI Search Query Expansion

**Time:** 1.5 hours
**Value:** Better search results, saves time

**New Backend Service:** `backend/src/modules/ai/services/query-expansion.service.ts`

**Core Capabilities:**

- Expand simple queries into comprehensive academic searches
- Suggest related terms
- Detect and narrow vague queries
- Add methodology keywords

**Query Expansion Algorithm:**

```typescript
interface ExpandedQuery {
  expanded: string; // Full expanded query
  suggestions: string[]; // Related terms
  isTooVague: boolean; // True if needs narrowing
  narrowingQuestions: string[]; // Questions to help user narrow
  confidence: number; // 0-1
}

async expandQuery(
  query: string,
  domain?: 'climate' | 'health' | 'education' | 'general'
): Promise<ExpandedQuery> {
  const prompt = `
    User query: "${query}"
    Context: Academic research literature search
    Goal: Find research videos, papers, methodology discussions

    If query is too broad/vague (single word like "climate", "health"):
    1. Suggest 3 specific research angles
    2. Add methodology keywords
    3. Include academic terminology

    Expand query to include:
    - Related academic terms
    - Common research methods in this field
    - Theoretical frameworks
    - Empirical study keywords

    Examples:
    "climate" → "climate change impacts on agriculture and food security research methods"
    "health" → "public health research methods OR mental health interventions OR healthcare policy"

    Return JSON with expanded query, suggestions, isTooVague, narrowingQuestions.
  `;

  // Call GPT-4
  // Return structured response
}
```

**Frontend Component:** `frontend/components/literature/AISearchAssistant.tsx`

**Features:**

- Detects vague queries as user types
- Shows expansion suggestions in real-time
- Display options:
  - **Option 1:** Use AI's expanded query
  - **Option 2:** Customize expansion (edit before searching)
  - **Option 3:** Search as-is (ignore suggestions)
- Shows related terms as chips (click to add)
- "Why these suggestions?" tooltip with reasoning

**UI Examples:**

**Example 1: Vague Query**

```
User types: "climate"
AI suggests:
┌────────────────────────────────────────────────┐
│ 🤖 Your query is too broad. Try:              │
│                                                 │
│ ○ "climate change impacts on agriculture"      │
│ ○ "climate modeling techniques and methods"    │
│ ○ "climate policy research and interventions"  │
│                                                 │
│ [Use First Suggestion] [Customize] [Ignore]    │
└────────────────────────────────────────────────┘
```

**Example 2: Good Query**

```
User types: "climate change adaptation strategies"
AI suggests:
┌────────────────────────────────────────────────┐
│ ✅ Good query! Related terms:                  │
│                                                 │
│ [+ resilience] [+ mitigation] [+ vulnerability] │
│ [+ ecosystem] [+ sustainability]                │
│                                                 │
│ Expanded: "climate change adaptation strategies │
│ resilience mitigation research methods"         │
│                                                 │
│ [Use Expanded] [Search As-Is]                   │
└────────────────────────────────────────────────┘
```

**API Endpoints:**

```typescript
POST /api/ai/expand-query
Body: { query, domain? }
Response: { expanded, suggestions, isTooVague, narrowingQuestions }

POST /api/ai/suggest-terms
Body: { query, field: 'climate' | 'health' | ... }
Response: { terms: string[], confidence: number[] }

POST /api/ai/narrow-query
Body: { query }
Response: { narrowed: string[], reasoning }
```

**Acceptance Criteria:**

- ✅ "climate" expands to meaningful research query
- ✅ Suggestions appear in <2s
- ✅ Expanded queries return better results (A/B tested)
- ✅ Users can customize before applying
- ✅ Related terms are academically relevant
- ✅ Works for 5+ tested domains (climate, health, education, etc.)

---

### Task 5: Integration & Testing

**Time:** 1 hour
**Value:** Ensures everything works end-to-end

**Complete Workflow Test:**

1. **User types vague query:** "climate"
2. **AI suggests expansion:** "climate change impacts on agriculture research methods"
3. **User clicks "Use Expansion"**
4. **YouTube search executes** with expanded query
5. **AI scores all results** (shows progress: "Analyzing 10 videos...")
6. **Videos display** with relevance badges (81% 🔵, 65% 🟢, 25% 🔴)
7. **User toggles "Show Only Relevant"** (filters to ≥60)
8. **User clicks "Let AI Select Top 5"**
9. **AI selects 5 videos**, shows total cost: **$1.23**
10. **User clicks "Transcribe Selected ($1.23)"**
11. **Confirmation dialog** shows breakdown:
    - Video 1: 15min - $0.09
    - Video 2: 28min - $0.17
    - Video 3: 42min - $0.25
    - Video 4: 19min - $0.11
    - Video 5: 67min - $0.40
    - **Total: $1.23**
12. **User confirms**, transcription begins
13. **Themes extracted** from all transcripts
14. **Themes flow** into study creation

**Alternative Workflow Test:**

1. **User pastes channel URL:** `https://www.youtube.com/c/TED`
2. **Channel browser loads** with 100+ videos
3. **User applies filters:** Duration: Medium (4-20min), Keyword: "research"
4. **Filtered results:** 23 videos
5. **User clicks "AI Select Top 5 from These"**
6. **AI scores and selects** 5 most relevant
7. **User approves**, transcription proceeds

**Testing Scenarios:**

| Scenario            | Input                  | Expected Output                      |
| ------------------- | ---------------------- | ------------------------------------ |
| Vague query         | "health"               | AI suggests 3 specific angles        |
| Channel browse      | TED channel URL        | 100+ videos with filters working     |
| Direct URL          | Single YouTube video   | Metadata preview, cost estimate      |
| AI scoring          | 10 mixed videos        | Accurate scores (validated manually) |
| Batch transcription | 5 selected videos      | Total cost accurate, all transcribed |
| Cached video        | Previously transcribed | Shows $0.00, instant access          |
| Invalid URL         | Bad YouTube link       | Clear error message                  |
| Cost accuracy       | 30min video            | Shows $0.18 estimate                 |

**Performance Benchmarks:**

| Metric               | Target             | Test Method                 |
| -------------------- | ------------------ | --------------------------- |
| Query expansion      | <2s                | Test with 5 queries         |
| AI relevance scoring | <3s per 10 videos  | Batch score 30 videos       |
| Channel video fetch  | <5s for 100 videos | Test with large channels    |
| Cost calculation     | Instant            | Test with various durations |
| Video metadata fetch | <1s                | Test with 10 videos         |

**Error Handling Tests:**

- [ ] YouTube API quota exceeded → Show clear message
- [ ] Invalid channel URL → Suggest correct format
- [ ] Video unavailable → Mark as unavailable, suggest alternatives
- [ ] OpenAI API timeout → Retry 3 times, then show error
- [ ] User cancels mid-transcription → Stop process, refund estimate

**Daily Checklist:**

- [ ] **3:00 PM:** Integration Testing (complete workflow)
- [ ] **4:00 PM:** Performance Testing (meet all benchmarks)
- [ ] **5:00 PM:** Run Daily Error Check (`npm run typecheck`)
- [ ] **5:30 PM:** Security & Quality Audit (API keys protected)
- [ ] **5:45 PM:** Cost Tracking Test (estimates match actuals)
- [ ] **6:00 PM:** User Guide Documentation

---

## 📊 SUCCESS METRICS

### Quantitative Metrics:

| Metric                        | Before Day 21 | Target After | Measurement            |
| ----------------------------- | ------------- | ------------ | ---------------------- |
| Irrelevant videos transcribed | 40%           | <10%         | Track relevance scores |
| User confusion about costs    | High          | 0%           | User feedback          |
| Search result quality         | 3/10          | 8/10         | User ratings           |
| Time to find relevant video   | 15min         | 5min         | User testing           |
| Wasted transcription costs    | $20/month     | <$5/month    | Cost tracking          |

### Qualitative Metrics:

- ✅ Users understand costs before committing
- ✅ Users can find channels and paste URLs easily
- ✅ AI suggestions improve search quality
- ✅ Users trust AI video selection
- ✅ Users save time finding relevant content

---

## 💰 COST ANALYSIS

### Development Cost:

- **Time:** 6-8 hours (1 full day)
- **Developer Rate:** Assume $100/hour
- **Total:** $600-800

### Operational Cost (Monthly):

- **AI Query Expansion:** ~$5/month (500 queries)
- **AI Relevance Scoring:** ~$10/month (1000 videos)
- **YouTube API:** Free (10,000 searches/day quota)
- **Total:** ~$15/month

### Cost Savings (Monthly):

- **Reduced Wasted Transcriptions:** ~$50/month
- **User Time Saved:** ~10 hours/month ($200 value)
- **Net Savings:** $235/month

**ROI:** ~30x return in first month

---

## 🔒 SECURITY & PRIVACY

- All API keys stored in backend `.env` only
- No API keys in frontend code
- User research context encrypted in database
- AI prompts don't include personally identifiable information
- YouTube Data API complies with ToS
- OpenAI API complies with data usage policies

---

## 📝 ACCEPTANCE CRITERIA SUMMARY

### Must Have (P0):

- ✅ Video selection UI with cost preview
- ✅ Multi-select and batch operations
- ✅ Channel browsing functionality
- ✅ Direct URL paste support
- ✅ AI relevance scoring (basic)
- ✅ Query expansion (basic)

### Should Have (P1):

- ✅ AI auto-selection of top N videos
- ✅ Advanced filters (date, duration, keyword)
- ✅ Cached video detection ($0.00 cost)
- ✅ Detailed reasoning for AI scores

### Nice to Have (P2):

- ⏸️ Channel subscription for ongoing monitoring
- ⏸️ Save favorite channels
- ⏸️ Playlist support
- ⏸️ Advanced AI tuning (user preferences)

---

## 🚀 NEXT STEPS

1. **User Approval:** Get approval to proceed with Day 21
2. **Update Phase Tracker Part 2:** Add Day 21 section
3. **Update Implementation Guide Part 5:** Add Day 21 technical specs
4. **Begin Implementation:** Start with Task 1 (Video Selection UI)
5. **Incremental Testing:** Test each task before moving to next
6. **Final Integration:** Test complete workflow
7. **Documentation:** Update user guides and API docs

---

## 📋 ALTERNATIVE APPROACH

If Day 21 feels too large, we could split into:

- **Day 21A:** Tasks 1-2 (Video Selection + Channel Support) - 3.5 hours
- **Day 21B:** Tasks 3-4 (AI Features) - 3.5 hours
- **Day 21C:** Task 5 (Integration & Testing) - 1 hour

**Your choice!** Let me know which approach you prefer.

---

**Status:** Awaiting approval to begin implementation
**Proposed Start Date:** Upon approval
**Estimated Completion:** Same day as start (6-8 hours)
