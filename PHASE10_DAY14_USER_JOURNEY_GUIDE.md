# Phase 10 Day 14 - Complete User Journey Guide 🗺️

**Where to Find Everything | Step-by-Step Navigation**

---

## Quick Answer: Where Is Day 14 Implementation?

**Location:** Literature Review Page (`/discover/literature`)
**Tab:** Analysis & Insights → Themes sub-tab
**Trigger:** "Extract Themes from All Sources" button

---

## Complete User Journey (Step-by-Step)

### Step 1: Navigate to Literature Page 📚

**URL:** `http://localhost:3000/(researcher)/discover/literature`

**File:** `frontend/app/(researcher)/discover/literature/page.tsx`

**What You See:**

```
┌─────────────────────────────────────────────────┐
│  Literature Search & Discovery                   │
├─────────────────────────────────────────────────┤
│  [Search Bar]                                    │
│  [Database Filters]                              │
│                                                  │
│  📄 Paper Results (12 papers)                    │
│  ☑ Select papers for theme extraction           │
└─────────────────────────────────────────────────┘
```

---

### Step 2: Select Papers & Click "Extract Themes" 🎯

**Location:** Bottom of search results section (Line 3640)

**Button Text:** "Extract Themes from All Sources"

**What Happens When You Click:**

1. ✅ Validates you have selected papers
2. ✅ Analyzes content (full-text vs abstract)
3. ✅ Opens Purpose Selection Wizard modal

**Code Location:**

```typescript
// Line 3640: frontend/app/(researcher)/discover/literature/page.tsx
<Button
  onClick={handleExtractThemes}
  disabled={selectedPapers.size === 0}
>
  <Sparkles className="w-4 h-4" />
  Extract Themes from All Sources
  <Badge>{selectedPapers.size} papers</Badge>
</Button>
```

**Visual:**

```
┌─────────────────────────────────────────────────┐
│  📄 Selected Papers (5 papers)                   │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  ✨ Extract Themes from All Sources      │  │
│  │     5 papers | 2 videos                  │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  [Alternative: Incremental Extraction]          │
└─────────────────────────────────────────────────┘
```

---

### Step 3: Purpose Selection Wizard Modal 🎓

**Location:** Modal overlay (Lines 6178-6184)

**What You See:**

```
┌──────────────────────────────────────────────────┐
│  What's Your Research Purpose?                    │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Q-Method   │  │ Survey     │  │ Qualitative│ │
│  │ 40-80      │  │ 5-15       │  │ 5-20       │ │
│  │ statements │  │ constructs │  │ themes     │ │
│  └────────────┘  └────────────┘  └────────────┘ │
│                                                   │
│  ┌────────────┐  ┌────────────┐                 │
│  │ Literature │  │ Hypothesis │                 │
│  │ Synthesis  │  │ Generation │                 │
│  │ 10-25      │  │ 8-15       │                 │
│  │ themes     │  │ themes     │                 │
│  └────────────┘  └────────────┘                 │
│                                                   │
│  [Select Purpose]                [Cancel]        │
└──────────────────────────────────────────────────┘
```

**Component:** `PurposeSelectionWizard.tsx`

**What Happens Next:**

1. ✅ You select a research purpose (e.g., "Qualitative Analysis")
2. ✅ Wizard validates content requirements
3. ✅ Calls backend API with purpose parameter
4. ✅ Opens Progress Modal

---

### Step 4: Theme Extraction Progress Modal 📊

**Location:** Modal overlay (Lines 6186-6190)

**What You See (Day 14 Enhancement):**

```
┌──────────────────────────────────────────────────┐
│  Theme Extraction Progress                        │
├──────────────────────────────────────────────────┤
│                                                   │
│  ● Stage 2/6: Initial Coding                     │
│  ━━━━━━━━━━━━━━━━░░░░░░░░  30%                   │
│                                                   │
│  ┌────────────────────────────────────────────┐ │
│  │ 📖 What We're Doing:                        │ │
│  │ Identifying semantic patterns across all    │ │
│  │ 12 sources using AI-powered embeddings      │ │
│  └────────────────────────────────────────────┘ │
│                                                   │
│  ┌────────────────────────────────────────────┐ │
│  │ 🎓 Why This Matters:                        │ │
│  │ Braun & Clarke (2019) requires systematic   │ │
│  │ coding across the entire corpus to ensure   │ │
│  │ rigorous thematic analysis                  │ │
│  └────────────────────────────────────────────┘ │
│                                                   │
│  📊 Live Statistics:                             │
│  • Sources analyzed: 12/12                       │
│  • Codes generated: 245                          │
│  • Themes identified: 0 (pending review)         │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Component:** `ThemeExtractionProgressModal.tsx` → `EnhancedThemeExtractionProgress.tsx`

**Day 14 Features:**

- ✅ 4-part transparent messaging (Stage, What, Why, Stats)
- ✅ 6-stage Braun & Clarke process visualization
- ✅ Progressive disclosure (Novice/Researcher/Expert modes)
- ✅ Real-time WebSocket updates

**Stages You'll See:**

1. Stage 1: Familiarization (0-20%)
2. Stage 2: Initial Coding (20-30%)
3. Stage 3: Theme Generation (30-50%)
4. Stage 4: Theme Review (50-70%)
5. Stage 5: Refinement (70-85%)
6. Stage 6: Provenance (85-100%)

---

### Step 5: Extraction Complete - Confetti! 🎉

**Location:** Automatically triggers after extraction (Line 1565)

**When It Happens:**

```
Theme extraction completes
  ↓
Auto-navigate to Analysis tab (Line 1560)
  ↓
🎊 CONFETTI ANIMATION (Line 1565) ← DAY 14 ADDITION
  ↓
Success toast message (Line 1573)
```

**Code:**

```typescript
// Line 1565: frontend/app/(researcher)/discover/literature/page.tsx
confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899'], // Brand colors
});
```

**What You See:**

```
Screen: Colorful confetti particles falling from top
Toast: ✨ Extracted 12 themes using Qualitative Analysis methodology!
```

---

### Step 6: Auto-Navigate to Analysis Tab → Themes 🎯

**Location:** Analysis & Insights tab → Themes sub-tab (Line 5152)

**Auto-Navigation Code:**

```typescript
// Lines 1560-1562
setActiveTab('analysis'); // Switch to Analysis tab
setActiveAnalysisSubTab('themes'); // Switch to Themes sub-tab
```

**Tab Structure:**

```
┌─────────────────────────────────────────────────┐
│  Tab 1: Results   | Tab 2: Analysis | Tab 3: ... │
│                   |      ▼          |             │
│                   | [ACTIVE]        |             │
└─────────────────────────────────────────────────┘

Within Analysis tab:
┌─────────────────────────────────────────────────┐
│  [Themes] | [Research Gaps] | [Synthesis]        │
│   ▼ ACTIVE                                        │
└─────────────────────────────────────────────────┘
```

---

### Step 7: Themes Section - Where Day 14 Lives! 🏠

**Location:** Analysis tab → Themes sub-tab (Lines 5152-5400+)

**File:** `frontend/app/(researcher)/discover/literature/page.tsx`

**What You See (Top to Bottom):**

```
┌──────────────────────────────────────────────────┐
│  ANALYSIS & INSIGHTS                              │
│  ┌────────────────────────────────────────────┐  │
│  │ [Themes] [Research Gaps] [Synthesis]       │  │
│  │  ▼ ACTIVE                                  │  │
│  └────────────────────────────────────────────┘  │
│                                                   │
│  ╔════════════════════════════════════════════╗  │
│  ║ 1. Theme Sources Summary Card              ║  │
│  ║    📊 12 themes from 5 sources              ║  │
│  ║    Papers: 5 | Videos: 2                    ║  │
│  ╚════════════════════════════════════════════╝  │
│                                                   │
│  ╔════════════════════════════════════════════╗  │
│  ║ 2. Theme Count Guidance                     ║  │
│  ║    ✅ 12 themes is optimal for Qualitative  ║  │
│  ║    📈 Saturation visualization (chart)      ║  │
│  ║    Churchill (1979): 5-15 constructs        ║  │
│  ╚════════════════════════════════════════════╝  │
│                                                   │
│  ╔════════════════════════════════════════════╗  │
│  ║ 3. THEME METHODOLOGY EXPLAINER              ║  │
│  ║    ← DAY 14 ADDITION (Line 5269)            ║  │
│  ║                                              ║  │
│  ║    🎓 Scientific Theme Extraction            ║  │
│  ║    Research-Grade Badge                      ║  │
│  ║                                              ║  │
│  ║    📖 Based on Reflexive Thematic Analysis   ║  │
│  ║    Braun & Clarke (2006, 2019)               ║  │
│  ║    77,000+ citations                         ║  │
│  ║                                              ║  │
│  ║    ✨ How It Works:                          ║  │
│  ║    1. Familiarization (read all sources)    ║  │
│  ║    2. Semantic Coding (embeddings)          ║  │
│  ║    3. Theme Generation (clustering)         ║  │
│  ║    4. Cross-Validation (3+ sources)         ║  │
│  ║    5. Refinement (quality control)          ║  │
│  ║    6. Provenance Tracking (evidence)        ║  │
│  ║                                              ║  │
│  ║    ✅ Quality Assurance:                     ║  │
│  ║    [Cross-Source] [Semantic] [Full Text]    ║  │
│  ║    [Confidence]                              ║  │
│  ║                                              ║  │
│  ║    ⚠️ AI-Assisted, Research-Validated        ║  │
│  ║    AI accelerates coding, but themes are    ║  │
│  ║    validated using established methods      ║  │
│  ║                                              ║  │
│  ║    📚 Academic References (expandable)       ║  │
│  ╚════════════════════════════════════════════╝  │
│                                                   │
│  ╔════════════════════════════════════════════╗  │
│  ║ 4. Theme Card #1: Digital Transformation    ║  │
│  ║    Keywords: AI, automation, innovation     ║  │
│  ║    Confidence: HIGH (0.87)                  ║  │
│  ║    Sources: 8/12 papers                     ║  │
│  ║    [View Evidence] [Convert to Q-Statement] ║  │
│  ╚════════════════════════════════════════════╝  │
│                                                   │
│  ╔════════════════════════════════════════════╗  │
│  ║ 5. Theme Card #2: Organizational Change     ║  │
│  ║    ...                                       ║  │
│  ╚════════════════════════════════════════════╝  │
│                                                   │
│  ... (All 12 themes displayed)                   │
└──────────────────────────────────────────────────┘
```

**Day 14 Component Location:**

```typescript
// Line 5269: frontend/app/(researcher)/discover/literature/page.tsx

{/* Phase 10 Day 14: Theme Methodology Explainer - Educational transparency */}
<ThemeMethodologyExplainer />
```

**Why This Placement?**

- ✅ Appears BEFORE individual theme cards
- ✅ Educates users about the methodology
- ✅ Provides scientific backing (Braun & Clarke)
- ✅ Explains AI role and limitations
- ✅ Shows quality assurance process

---

## Exact File Locations

### Backend Implementation

**Main Service:**

```
backend/src/modules/literature/services/unified-theme-extraction.service.ts
├─ Line 1824: extractThemesAcademic() - 6-stage process
├─ Line 2268: extractThemesV2() - Purpose-adaptive wrapper
└─ Lines 143-194: PURPOSE_CONFIGS - 5 research modes
```

**API Controller:**

```
backend/src/modules/literature/literature.controller.ts
├─ Line 2622: @Post('/themes/extract-themes-v2') - Authenticated
└─ Line 2778: @Post('/themes/extract-themes-v2/public') - Public
```

### Frontend Implementation

**Main Page:**

```
frontend/app/(researcher)/discover/literature/page.tsx
├─ Line 77: import confetti
├─ Line 17: import ThemeMethodologyExplainer
├─ Line 902: handleExtractThemes() function
├─ Line 1565: confetti() - Celebration animation
├─ Line 3640: "Extract Themes" button
├─ Line 5269: <ThemeMethodologyExplainer /> - Educational component
└─ Line 6179: <PurposeSelectionWizard /> - Purpose modal
```

**Components:**

```
frontend/components/literature/
├─ ThemeMethodologyExplainer.tsx (330 lines) - NEW IN DAY 14
├─ EnhancedThemeExtractionProgress.tsx - Progress visualization
├─ ThemeExtractionProgressModal.tsx - Modal wrapper
├─ PurposeSelectionWizard.tsx - Purpose selection
├─ EnterpriseThemeCard.tsx - Individual theme display
└─ ThemeCountGuidance.tsx - Guidance component
```

---

## How to Test Day 14 Implementation

### Quick Test (5 minutes)

1. **Start the application:**

   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

2. **Navigate to Literature page:**
   - URL: `http://localhost:3000/(researcher)/discover/literature`

3. **Search for papers:**
   - Enter search query: "artificial intelligence"
   - Select 5-10 papers using checkboxes

4. **Click "Extract Themes from All Sources"**
   - Button is at bottom of results
   - Should show number of selected papers

5. **Select research purpose:**
   - Modal appears with 5 purpose options
   - Choose "Qualitative Analysis"

6. **Watch the progress modal:**
   - ✅ 6-stage process (Familiarization → Provenance)
   - ✅ 4-part messages (Stage, What, Why, Stats)
   - ✅ Real-time percentage updates

7. **Extraction completes:**
   - ✅ 🎊 CONFETTI ANIMATION (Day 14 addition)
   - ✅ Success toast appears
   - ✅ Auto-navigates to Analysis tab

8. **Scroll through themes section:**
   - Source Summary Card
   - Theme Count Guidance
   - **✅ THEME METHODOLOGY EXPLAINER (Day 14 addition)**
   - Individual theme cards

### What to Look For (Day 14 Additions)

**1. Confetti Animation:**

- ✅ Triggers after extraction
- ✅ Brand colors (green, blue, purple, pink)
- ✅ 100 particles, 70° spread
- ✅ Originates from center-bottom (y: 0.6)

**2. ThemeMethodologyExplainer:**

- ✅ Blue-purple gradient card
- ✅ "Research-Grade" badge
- ✅ Braun & Clarke citations
- ✅ 6-stage process explanation
- ✅ Quality assurance grid (4 items)
- ✅ AI role explanation
- ✅ Expandable academic references

**3. Purpose-Adaptive Extraction:**

- ✅ Different algorithms per purpose
- ✅ Content validation (e.g., 10+ full-text for Literature Synthesis)
- ✅ Purpose-specific theme counts
- ✅ Scientific backing for each mode

---

## Common Questions

### Q1: Where do I click to start theme extraction?

**A:** Go to Literature page → Search for papers → Select papers (checkboxes) → Scroll to bottom → Click blue button "Extract Themes from All Sources"

### Q2: Where is the confetti animation?

**A:** It triggers automatically after theme extraction completes. You'll see it on the screen before the themes tab appears.

### Q3: Where is the ThemeMethodologyExplainer component?

**A:** After extraction completes, go to Analysis tab → Themes sub-tab → Scroll down. It appears between "Theme Count Guidance" and the first theme card.

### Q4: How do I see the new 6-stage progress?

**A:** During extraction, the progress modal shows 6 stages. Each stage displays:

- Stage name + percentage
- "What we're doing" (plain English)
- "Why it matters" (scientific rationale)
- Live statistics (sources, codes, themes)

### Q5: What's different from before Day 14?

**Before Day 14:**

- Simple progress: "Processing 1/2..."
- No confetti
- No methodology explainer
- One algorithm for all purposes

**After Day 14:**

- 6-stage transparent progress with 4-part messages
- 🎊 Confetti celebration
- Educational methodology explainer
- 5 purpose-specific algorithms

### Q6: Can I use the old extraction method?

**A:** No, the system automatically uses the new V2 method (extractThemesV2) which is scientifically correct (holistic corpus-based) per Braun & Clarke (2019).

### Q7: What if I don't see the ThemeMethodologyExplainer?

**Check:**

1. Are you on the correct tab? (Analysis → Themes)
2. Do you have extracted themes? (Must have themes to see it)
3. Scroll down - it appears before the theme cards

---

## URL Routes

**Main Page:**

- Literature Search: `/(researcher)/discover/literature`

**API Endpoints:**

- Theme Extraction V2: `POST /literature/themes/extract-themes-v2`
- Public Endpoint: `POST /literature/themes/extract-themes-v2/public`

---

## Screenshots Guide (What You Should See)

### 1. Literature Page - Initial State

```
[Search Bar]
[Filter Options]
[Search Results: 20 papers found]
[Checkboxes to select papers]
[Bottom: "Extract Themes from All Sources" button]
```

### 2. Purpose Selection Modal

```
Modal overlay with 5 research purpose cards:
- Q-Methodology (40-80 statements)
- Survey Construction (5-15 constructs)
- Qualitative Analysis (5-20 themes)
- Literature Synthesis (10-25 themes)
- Hypothesis Generation (8-15 themes)
```

### 3. Progress Modal (New 6-Stage Process)

```
Stage indicator: ● ● ● ○ ○ ○ (Stage 3/6)
Progress bar: ━━━━━━━━━░░░░░ 50%

4-part message box:
📖 What: "Generating candidate themes..."
🎓 Why: "Braun & Clarke (2019) requires..."
📊 Stats: "12 sources, 245 codes, 15 themes"
```

### 4. Confetti Animation

```
[Colorful particles falling across screen]
[Toast message: "✨ Extracted 12 themes using..."]
```

### 5. Themes Tab - Final State

```
┌─ Source Summary Card
├─ Theme Count Guidance
├─ 📘 THEME METHODOLOGY EXPLAINER ← DAY 14
├─ Theme Card #1
├─ Theme Card #2
└─ ... (all theme cards)
```

---

## Developer Notes

### Code Comments to Look For

**Day 14 markers in code:**

```typescript
// Phase 10 Day 14: Celebration animation on extraction complete
// Phase 10 Day 14: Theme Methodology Explainer - Educational transparency
```

**Related phases:**

```typescript
// Phase 10 Day 5.13: V2 purpose-driven extraction
// Phase 10 Day 5.8: Theme Extraction Methodology Explainer (created)
```

### File Size Stats

- Main page: 6,305 lines
- ThemeMethodologyExplainer: 330 lines
- Total Day 14 additions: ~350 lines
- Bundle impact: ~3-4 KB gzipped

---

## Troubleshooting

### Issue: Button is disabled

**Solution:** Ensure you have selected at least 1 paper (checkbox)

### Issue: No confetti appears

**Check:**

1. Is extraction completing successfully?
2. Browser console for errors
3. Is `canvas-confetti` installed?

### Issue: ThemeMethodologyExplainer not visible

**Check:**

1. Are you on Analysis tab?
2. Have themes been extracted?
3. Is `unifiedThemes.length > 0`?

### Issue: Old progress modal shows

**Solution:** Clear browser cache or hard refresh (Cmd+Shift+R)

---

## Summary

**Day 14 implementation is in the Literature page, specifically:**

1. **Button Location:** Bottom of search results
2. **Confetti Trigger:** Automatically after extraction
3. **Final Destination:** Analysis tab → Themes sub-tab
4. **ThemeMethodologyExplainer:** Between guidance and theme cards (Line 5269)

**Navigation Path:**

```
Literature Page
  → "Extract Themes" button
  → Purpose Selection Modal
  → Progress Modal (6 stages)
  → Confetti 🎊
  → Analysis Tab → Themes Sub-tab
  → ThemeMethodologyExplainer 📘
  → Individual Theme Cards
```

**You will experience Day 14 enhancements every time you extract themes!**

---

**Created:** January 2025
**Purpose:** Guide users to Day 14 implementation
**Status:** ✅ COMPLETE - Ready for user testing
