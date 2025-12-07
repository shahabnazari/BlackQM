# Tooltip Visual Guide
## What Changed & How It Looks

## 🎨 Visual Changes

### Before (Broken Tooltips)
```
Sources Queried (6)

PubMed                    0 papers (0%)
█░░░░░░░░░░░░░░░░░░░░░░░░

CrossRef                  400 papers (53%)
████████████████████░░░░░

(Hover over source name... wait 2 seconds... maybe see tooltip... maybe not)
❌ No visual indicator
❌ Slow to appear
❌ Doesn't work on mobile
```

### After (Working Tooltips)
```
Sources Queried (6)

PubMed ⚠️                 0 papers (0%)
█░░░░░░░░░░░░░░░░░░░░░░░░
       ↑
   Hover here → Instant tooltip!

CrossRef 🛈                400 papers (53%)
████████████████████░░░░░
         ↑
    Hover here → Instant tooltip!

✅ Clear visual indicators
✅ Instant appearance
✅ Works on mobile
```

---

## 📱 Tooltip Examples

### Zero-Result Source (⚠️ Warning Icon)
```
Hover over: PubMed ⚠️

Tooltip appears:
┌─────────────────────────────────────┐
│ PubMed                              │  ← Bold header
│ Medical/life sciences (36M+ papers) │  ← Database info
│ This is normal - databases          │  ← Contextual help
│ specialize in different fields.     │
└─────────────────────────────────────┘
```

**User understands:**
- ✅ What PubMed specializes in
- ✅ Why it returned 0 papers
- ✅ That this is expected behavior

---

### Source with Results (🛈 Help Icon)
```
Hover over: CrossRef 🛈

Tooltip appears:
┌─────────────────────────────────────┐
│ DOI registry across all disciplines │  ← Database info
│ (150M+ records)                     │
└─────────────────────────────────────┘
```

**User learns:**
- ✅ What CrossRef is
- ✅ How much coverage it has
- ✅ What type of database it is

---

## 🔄 State Comparison

### During Loading (Sources Queried)
```
┌────────────────────────────────────────────┐
│ Sources Queried (6)                        │
├────────────────────────────────────────────┤
│                                            │
│ CrossRef 🛈        400 papers (53%)        │
│ ████████████████████░░░░░░                 │
│                                            │
│ ArXiv 🛈           350 papers (47%)        │
│ █████████████████░░░░░░░░░                 │
│                                            │
│ Semantic Scholar ⚠️  0 papers (0%)         │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░                  │
│                                            │
│ PubMed ⚠️           0 papers (0%)          │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░                  │
│                                            │
│ PMC ⚠️              0 papers (0%)          │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░                  │
│                                            │
│ ERIC ⚠️             0 papers (0%)          │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░                  │
└────────────────────────────────────────────┘

All icons are interactive!
Hover/tap ⚠️ → Why 0 papers?
Hover/tap 🛈 → Database info
```

---

### After Complete (Papers per Source)
```
┌────────────────────────────────────────────┐
│ How We Found These Papers                  │
├────────────────────────────────────────────┤
│ Papers per source:                         │
│                                            │
│ CrossRef 🛈        400        53%          │
│ ████████████████████░░░░░░                 │
│                                            │
│ ArXiv 🛈           350        47%          │
│ █████████████████░░░░░░░░░                 │
│                                            │
│ Semantic Scholar ⚠️  0         0%          │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░                  │
│                                            │
│ PubMed ⚠️           0         0%           │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░                  │
│                                            │
│ PMC ⚠️              0         0%           │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░                  │
│                                            │
│ ERIC ⚠️             0         0%           │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░                  │
└────────────────────────────────────────────┘

Same tooltips work here too!
Consistent experience across states
```

---

## 🖱️ Interaction Patterns

### Desktop/Mouse
```
1. User sees: PubMed ⚠️
   ↓
2. Cursor changes to help icon (cursor-help)
   ↓
3. User hovers over ⚠️
   ↓
4. Tooltip appears INSTANTLY (no delay)
   ↓
5. User reads info
   ↓
6. User moves mouse away
   ↓
7. Tooltip disappears
```

### Mobile/Touch
```
1. User sees: PubMed ⚠️
   ↓
2. User taps ⚠️ icon
   ↓
3. Tooltip appears
   ↓
4. User reads info
   ↓
5. User taps outside OR another icon
   ↓
6. Tooltip disappears
```

---

## 🎯 Icon Meanings

### ⚠️ Warning Icon (Amber)
**When shown:**
- Source returned 0 papers

**What it means:**
- This is normal, not an error
- Database doesn't cover this topic
- Click/hover for explanation

**Tooltip content:**
- Database name
- What it specializes in
- Why it might return 0 results
- Reassurance that this is normal

**Visual style:**
- Amber color (⚠️)
- `cursor-help` (question mark cursor)
- Inline with source name

---

### 🛈 Help Icon (Gray)
**When shown:**
- Source returned 1+ papers
- Source has description available

**What it means:**
- Additional info available
- Learn about this database
- Click/hover for details

**Tooltip content:**
- Database description
- Coverage information
- Specialty/focus area

**Visual style:**
- Gray color (subtle, not intrusive)
- Small circle icon (3x3 pixels)
- `cursor-help` (question mark cursor)
- Inline with source name

---

## 📊 All Source Descriptions

Here's what users will see in tooltips:

### Medical/Health Sciences
```
PubMed ⚠️ → Medical/life sciences (36M+ papers)

PMC ⚠️ → Free full-text biomedical articles (8M+ papers)

MedRxiv ⚠️ → Medical preprints (45k papers)
```

### General/Multidisciplinary
```
CrossRef 🛈 → DOI registry across all disciplines (150M+ records)

Semantic Scholar ⚠️ → AI-powered academic search (200M+ papers)

Google Scholar 🛈 → Multi-source aggregator (400M+ papers)
```

### STEM Fields
```
ArXiv 🛈 → Physics/Math/CS preprints (2M+ papers)

BioRxiv ⚠️ → Biology preprints (220k papers)

ChemRxiv ⚠️ → Chemistry preprints (35k papers)
```

### Social Sciences
```
ERIC ⚠️ → Education research database (1.5M+ papers)

SSRN ⚠️ → Social science research network (1M+ papers)
```

---

## 🎨 Styling Details

### Tooltip Appearance
```css
Background: Dark gray (#1f2937)
Text: White
Padding: 12px (px-3 py-2)
Border radius: 8px (rounded-lg)
Shadow: Large shadow (shadow-lg)
Max width: 320px (max-w-xs)
Font size: Small (text-xs for details)
Z-index: 50 (always on top)
```

### Icon Styling
```css
⚠️ Warning Icon:
  Color: Amber (#f59e0b)
  Cursor: help (question mark)
  Display: inline-flex
  
🛈 Help Icon:
  Color: Gray 400 (#9ca3af)
  Size: 12px (w-3 h-3)
  Cursor: help (question mark)
  Display: inline-flex
```

### Hover Effects
```css
Icons:
  - No background change
  - Cursor changes to help icon
  - Tooltip appears instantly
  
Tooltip:
  - Fade in animation (opacity 0 → 1)
  - No delay
  - Smooth transitions
```

---

## 🔄 Animation Timeline

### Tooltip Appearance
```
0ms   → User hovers/taps icon
0ms   → Tooltip element created (opacity: 0)
0ms   → Position calculated
50ms  → Fade in animation starts
200ms → Tooltip fully visible (opacity: 1)

Total: 200ms to full visibility
```

### Tooltip Disappearance
```
0ms   → User moves away/taps outside
0ms   → Fade out animation starts
150ms → Tooltip removed from DOM

Total: 150ms to disappear
```

---

## 💡 Pro Tips for Users

### Desktop Users
1. Look for ⚠️ and 🛈 icons next to source names
2. Hover your mouse over these icons
3. Tooltip appears instantly - no waiting!
4. Read the information
5. Move mouse away to dismiss

### Mobile Users
1. Look for ⚠️ and 🛈 icons next to source names
2. Tap on these icons
3. Tooltip appears - read the info
4. Tap outside or on another icon to dismiss

### Understanding the Icons
- **⚠️ (Amber)** = "0 papers is normal for this topic"
- **🛈 (Gray)** = "Learn more about this database"

---

## 📈 Coverage by Field

Based on tooltip descriptions, users can quickly understand which databases cover their field:

### Medical Research → Use:
- PubMed (36M papers)
- PMC (8M full-text)
- MedRxiv (preprints)

### Computer Science → Use:
- ArXiv (2M papers)
- Semantic Scholar (200M papers)
- CrossRef (150M records)

### Education Research → Use:
- ERIC (1.5M papers)

### All Fields → Use:
- CrossRef (150M records)
- Semantic Scholar (200M papers)
- Google Scholar (400M papers)

---

## ✅ Quality Checklist

### User Experience ✅
- [x] Instant tooltip appearance
- [x] Clear visual indicators
- [x] Works on mobile
- [x] Helpful, contextual information
- [x] Professional appearance
- [x] Consistent across states

### Technical Quality ✅
- [x] Uses existing components
- [x] No new dependencies
- [x] Type-safe TypeScript
- [x] No linter errors
- [x] Clean, maintainable code
- [x] No technical debt

### Accessibility ✅
- [x] `cursor-help` indicates interactivity
- [x] Keyboard accessible (via Tooltip component)
- [x] Touch-friendly (mobile support)
- [x] Clear visual hierarchy
- [x] Readable contrast ratios
- [x] Descriptive content

---

**Result:** Professional, fast, mobile-friendly tooltips that actually work! 🎉


