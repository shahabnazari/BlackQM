# Phase 10 Day 5.7 Stage 2 Phase 2: Manual Testing Guide

**Date:** October 29, 2025
**Duration:** 4 hours
**Status:** 🟡 IN PROGRESS
**Purpose:** Validate real-world usage, theme quality, accessibility, and mobile responsiveness

---

## 📋 Overview

Stage 2 Phase 2 focuses on human-validated testing that automated tests cannot adequately cover:
1. Real research topic diversity and relevance
2. Academic theme quality (Cohen's kappa >0.6)
3. Accessibility compliance (WCAG AA)
4. Mobile responsive design (3 breakpoints)

**Success Criteria:**
- ✅ 10/10 research topics return relevant results (≥80% relevance)
- ✅ Theme quality Cohen's kappa ≥0.6 (substantial agreement)
- ✅ Accessibility score ≥90/100 (Lighthouse)
- ✅ Mobile functionality works on all 3 breakpoints

---

## 🔬 Part 1: Real Research Topic Validation (2 hours)

### Test Scenarios (10 Diverse Research Domains)

#### Test 1: Medical Research - Diabetes Management
```
Topic: "Type 2 diabetes management interventions"
Expected: Papers about lifestyle, medication, diet, exercise
Sources: PubMed, Crossref
Minimum Papers: 15
Validation:
  - [ ] ≥80% papers directly related to diabetes management
  - [ ] Papers from last 5 years available
  - [ ] Authors include medical professionals
  - [ ] Abstracts contain treatment/intervention keywords
```

#### Test 2: Climate Science - Ocean Acidification
```
Topic: "Ocean acidification impact on marine ecosystems"
Expected: Papers about pH changes, coral reefs, marine life
Sources: CrossRef, OpenAlex
Minimum Papers: 12
Validation:
  - [ ] ≥80% papers about ocean chemistry or marine biology
  - [ ] Papers cite pH measurements or ecological impacts
  - [ ] Geographic diversity (Pacific, Atlantic, etc.)
  - [ ] Multiple methodologies (field study, modeling, lab)
```

#### Test 3: Computer Science - Quantum Computing
```
Topic: "Quantum computing algorithms for cryptography"
Expected: Papers about Shor's algorithm, post-quantum crypto
Sources: arXiv, CrossRef
Minimum Papers: 10
Validation:
  - [ ] ≥80% papers about quantum algorithms or cryptography
  - [ ] Technical depth (not popular science)
  - [ ] Mathematical formulations present
  - [ ] Recent advances (last 3 years)
```

#### Test 4: Social Sciences - Remote Work Productivity
```
Topic: "Remote work productivity and employee wellbeing"
Expected: Papers about WFH, productivity metrics, mental health
Sources: CrossRef, OpenAlex
Minimum Papers: 15
Validation:
  - [ ] ≥80% papers about remote work or telework
  - [ ] Mixed methods (quantitative + qualitative studies)
  - [ ] Pre-2020 and post-2020 pandemic studies
  - [ ] International studies (not just US-centric)
```

#### Test 5: Education - Active Learning Strategies
```
Topic: "Active learning strategies in STEM education"
Expected: Papers about pedagogy, student engagement, outcomes
Sources: PubMed (education journals), CrossRef
Minimum Papers: 12
Validation:
  - [ ] ≥80% papers about teaching methods in STEM
  - [ ] Empirical studies with student outcome data
  - [ ] Multiple education levels (K-12, undergrad, grad)
  - [ ] Diverse STEM fields (physics, biology, engineering)
```

#### Test 6: Environmental Science - Renewable Energy Policy
```
Topic: "Renewable energy policy effectiveness solar wind"
Expected: Papers about policy analysis, adoption rates, barriers
Sources: CrossRef, OpenAlex
Minimum Papers: 10
Validation:
  - [ ] ≥80% papers about energy policy or renewable adoption
  - [ ] Multiple countries/regions represented
  - [ ] Policy evaluation methodologies
  - [ ] Economic and social impact analysis
```

#### Test 7: Psychology - Cognitive Behavioral Therapy
```
Topic: "Cognitive behavioral therapy for anxiety disorders"
Expected: Papers about CBT techniques, efficacy, randomized trials
Sources: PubMed, CrossRef
Minimum Papers: 15
Validation:
  - [ ] ≥80% papers about CBT or anxiety treatment
  - [ ] Randomized controlled trials (RCTs) present
  - [ ] Effect size reporting
  - [ ] Meta-analyses or systematic reviews available
```

#### Test 8: Economics - Universal Basic Income
```
Topic: "Universal basic income pilot programs outcomes"
Expected: Papers about UBI trials, economic impacts, social effects
Sources: CrossRef, OpenAlex
Minimum Papers: 8
Validation:
  - [ ] ≥80% papers about UBI or unconditional cash transfers
  - [ ] Empirical data from real pilot programs
  - [ ] Multiple countries (Finland, Kenya, US, etc.)
  - [ ] Labor market and poverty impact analysis
```

#### Test 9: Neuroscience - Brain Plasticity
```
Topic: "Neuroplasticity adult brain recovery after injury"
Expected: Papers about brain recovery, rehabilitation, neural rewiring
Sources: PubMed, CrossRef
Minimum Papers: 12
Validation:
  - [ ] ≥80% papers about neuroplasticity or brain recovery
  - [ ] Human studies (not just animal models)
  - [ ] Imaging studies (fMRI, PET, etc.)
  - [ ] Intervention studies (physical therapy, cognitive training)
```

#### Test 10: Artificial Intelligence - Explainable AI
```
Topic: "Explainable artificial intelligence interpretability healthcare"
Expected: Papers about XAI, LIME, SHAP, medical AI transparency
Sources: arXiv, CrossRef
Minimum Papers: 10
Validation:
  - [ ] ≥80% papers about AI interpretability or explainability
  - [ ] Healthcare/medical AI applications
  - [ ] Technical methods (SHAP, LIME, attention mechanisms)
  - [ ] Ethical considerations discussed
```

### Testing Procedure

For each research topic:

1. **Execute Search**
   ```
   - Navigate to literature search page
   - Enter topic query verbatim
   - Select appropriate sources
   - Set limit to 20 papers
   - Record search time (should be <5s)
   ```

2. **Evaluate Relevance**
   ```
   - Review first 10 paper titles
   - Count how many are directly relevant
   - Calculate relevance percentage: (relevant/10) × 100
   - Target: ≥80% relevance
   ```

3. **Validate Metadata Quality**
   ```
   - [ ] All papers have titles
   - [ ] ≥80% have author information
   - [ ] ≥70% have publication year
   - [ ] ≥50% have abstracts
   - [ ] ≥30% have DOI or PMID
   ```

4. **Record Results**
   ```
   Topic: _________________
   Papers Retrieved: ___
   Search Time: ___ seconds
   Relevance Score: ____%
   Metadata Complete: [ ] Yes [ ] No
   Notes: _________________
   ```

---

## 🎯 Part 2: Theme Quality Validation (1 hour)

### Cohen's Kappa Inter-Rater Reliability Test

**Purpose:** Validate that AI-extracted themes match expert judgment

**Methodology:**
1. Select 3 paper sets from Test Scenarios above
2. Extract themes using unified theme extraction
3. Have 2 independent raters classify themes
4. Calculate Cohen's kappa coefficient
5. Target: κ ≥ 0.6 (substantial agreement)

### Test Set 1: Medical Research (Diabetes)

**Papers:** Use 5 papers from Test 1 results

**AI-Extracted Themes:**
```
Run theme extraction and record results:

Theme 1: ___________________
  Keywords: _________________
  Confidence: ___

Theme 2: ___________________
  Keywords: _________________
  Confidence: ___

Theme 3: ___________________
  Keywords: _________________
  Confidence: ___

[Continue for all extracted themes]
```

**Rater 1 Validation:**
```
For each AI theme, rate:
1 = Highly Relevant (theme directly represents paper content)
2 = Somewhat Relevant (theme tangentially related)
3 = Not Relevant (theme does not represent content)
4 = Incorrect (theme contradicts paper content)

Theme 1 Rating: ___
Theme 2 Rating: ___
Theme 3 Rating: ___
[Continue...]
```

**Rater 2 Validation:**
```
[Same rating scale, independent from Rater 1]

Theme 1 Rating: ___
Theme 2 Rating: ___
Theme 3 Rating: ___
[Continue...]
```

**Cohen's Kappa Calculation:**
```
Formula: κ = (P_o - P_e) / (1 - P_e)

Where:
  P_o = observed agreement (% ratings that match)
  P_e = expected agreement by chance

Target: κ ≥ 0.6
Interpretation:
  0.00-0.20: Slight agreement
  0.21-0.40: Fair agreement
  0.41-0.60: Moderate agreement
  0.61-0.80: Substantial agreement
  0.81-1.00: Almost perfect agreement

Test Set 1 Result: κ = ______
Status: [ ] Pass (≥0.6) [ ] Fail (<0.6)
```

### Test Set 2: Climate Science (Ocean Acidification)

[Repeat same process as Test Set 1]

### Test Set 3: Computer Science (Quantum Computing)

[Repeat same process as Test Set 1]

### Theme Quality Summary

```
Overall Cohen's Kappa: ______ (average across 3 test sets)
Status: [ ] Pass (≥0.6) [ ] Fail (<0.6)

Qualitative Assessment:
- Themes are semantically meaningful: [ ] Yes [ ] No
- Themes avoid generic structural terms: [ ] Yes [ ] No
- Themes capture research constructs: [ ] Yes [ ] No
- Themes show domain specificity: [ ] Yes [ ] No
```

---

## ♿ Part 3: Accessibility Audit (45 minutes)

### 3.1 Automated Accessibility Testing

**Tool:** Lighthouse (Chrome DevTools)

**Pages to Test:**
1. Literature search page (`/discover/literature`)
2. Search results view
3. Theme extraction results
4. Paper library view

**Procedure:**
```bash
1. Open Chrome DevTools (F12)
2. Navigate to "Lighthouse" tab
3. Select "Accessibility" category
4. Generate report
5. Target: ≥90/100 score
```

**Results Template:**
```
Page 1: Literature Search
  Score: ___/100
  Issues Found: ___
  Critical Issues: ___
  Status: [ ] Pass (≥90) [ ] Fail (<90)

Page 2: Search Results
  Score: ___/100
  Issues Found: ___
  Critical Issues: ___
  Status: [ ] Pass (≥90) [ ] Fail (<90)

Page 3: Theme Extraction
  Score: ___/100
  Issues Found: ___
  Critical Issues: ___
  Status: [ ] Pass (≥90) [ ] Fail (<90)

Page 4: Library View
  Score: ___/100
  Issues Found: ___
  Critical Issues: ___
  Status: [ ] Pass (≥90) [ ] Fail (<90)
```

### 3.2 Keyboard Navigation Testing

**Test Checklist:**

```
Search Page:
  [ ] Tab through all interactive elements
  [ ] Search input receives focus with visible indicator
  [ ] Source checkboxes accessible via keyboard
  [ ] Submit button activatable with Enter/Space
  [ ] No keyboard traps (can exit all components)

Results Page:
  [ ] Paper cards focusable with Tab
  [ ] Checkbox selection with Space key
  [ ] "Extract Themes" button keyboard accessible
  [ ] Pagination controls keyboard accessible
  [ ] Filters expandable/collapsible with keyboard

Theme Extraction:
  [ ] Progress indicator does not trap focus
  [ ] Results table navigable with arrow keys
  [ ] Export buttons keyboard accessible
  [ ] Theme cards expandable with Enter key

Library:
  [ ] Saved papers navigable with Tab
  [ ] Delete/edit actions keyboard accessible
  [ ] Sorting controls keyboard accessible
  [ ] Search within library keyboard accessible
```

### 3.3 Screen Reader Testing

**Tool:** NVDA (Windows) or VoiceOver (Mac)

**Test Checklist:**
```
[ ] Page titles announced correctly
[ ] Headings have proper hierarchy (h1 → h2 → h3)
[ ] Form labels associated with inputs
[ ] Button purposes clearly announced
[ ] Loading states announced to screen reader
[ ] Error messages announced and descriptive
[ ] Tables have proper headers and captions
[ ] Images have alt text (or marked decorative)
[ ] Links have descriptive text (not "click here")
[ ] Dynamic content updates announced (ARIA live regions)
```

### 3.4 Color Contrast Testing

**Tool:** axe DevTools or WAVE

**Requirements:**
```
- Normal text: 4.5:1 contrast ratio minimum
- Large text (18pt+): 3:1 contrast ratio minimum
- UI components: 3:1 contrast ratio minimum

Test Areas:
  [ ] Body text on background
  [ ] Button text on button background
  [ ] Link text vs. surrounding text
  [ ] Form input borders and labels
  [ ] Error messages and alerts
  [ ] Disabled state (if distinguishable)
```

---

## 📱 Part 4: Mobile Responsive Testing (45 minutes)

### Breakpoints to Test

1. **Mobile (375px)** - iPhone SE
2. **Tablet (768px)** - iPad
3. **Desktop (1920px)** - Full HD

### Testing Procedure

**Setup:**
```
1. Open Chrome DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select device or set custom dimensions
4. Test in both portrait and landscape
```

### Mobile (375px) Testing Checklist

**Literature Search Page:**
```
[ ] Search input full width and properly sized
[ ] Source checkboxes visible and tappable (44px min touch target)
[ ] Advanced filters collapse into accordion/menu
[ ] "Search" button full width or properly sized
[ ] No horizontal scrolling
[ ] Text readable without zooming
[ ] Navigation menu collapses into hamburger
```

**Search Results:**
```
[ ] Paper cards stack vertically
[ ] Paper titles wrap properly (no overflow)
[ ] Author names truncate or wrap gracefully
[ ] Checkboxes have adequate touch targets
[ ] "Extract Themes" button visible and accessible
[ ] Pagination controls usable with touch
[ ] Filters accessible (drawer/modal on mobile)
```

**Theme Extraction Results:**
```
[ ] Theme cards stack vertically
[ ] Keywords wrap to multiple lines if needed
[ ] Export buttons accessible (may be in overflow menu)
[ ] Tables convert to responsive format (stacked or horizontal scroll)
[ ] Charts resize or convert to mobile-friendly view
[ ] No critical information hidden on mobile
```

**Library View:**
```
[ ] Saved papers display in card layout
[ ] Actions accessible (delete, edit via menu/icons)
[ ] Search within library functional
[ ] Sorting controls accessible
[ ] Empty states display properly
```

### Tablet (768px) Testing Checklist

```
[ ] Two-column layouts work properly
[ ] Sidebar navigation visible (if applicable)
[ ] Paper cards in 2-column grid
[ ] Tables display full width without overflow
[ ] Modal dialogs sized appropriately
[ ] Touch targets remain 44px minimum
[ ] Desktop features start appearing (not all condensed)
```

### Desktop (1920px) Testing Checklist

```
[ ] Content centered or properly aligned (not edge-to-edge)
[ ] Maximum width constraints applied (readable line length)
[ ] Multi-column layouts utilized effectively
[ ] Sidebar navigation fully visible
[ ] Paper cards in 3-4 column grid
[ ] Tables fully visible with all columns
[ ] No excessive whitespace
[ ] Charts and visualizations scale appropriately
```

### Orientation Testing

**Portrait Mode:**
```
[ ] All content accessible without horizontal scroll
[ ] Navigation remains accessible
[ ] Forms stack vertically for easy input
[ ] Buttons properly sized for touch
```

**Landscape Mode:**
```
[ ] Content reflows to utilize horizontal space
[ ] Navigation adapts (may use horizontal layout)
[ ] Tables may show more columns
[ ] Virtual keyboard doesn't obscure critical UI
```

---

## 📊 Manual Testing Report Template

### Executive Summary

```
Test Date: ___________
Tester Name: ___________
Duration: ___ hours
Overall Status: [ ] Pass [ ] Fail [ ] Conditional Pass

Summary:
- Research Topics: ___/10 passed (≥80% relevance)
- Theme Quality: κ = _____ (target ≥0.6)
- Accessibility: ___/100 average score (target ≥90)
- Mobile Responsive: ___/3 breakpoints passed

Recommendation:
[ ] Ready for Stage 2 Phase 3 (Expert Review)
[ ] Minor fixes needed before proceeding
[ ] Major issues require resolution
```

### Detailed Findings

#### Research Topic Results

| Topic | Papers | Search Time | Relevance | Metadata | Status |
|-------|--------|-------------|-----------|----------|--------|
| 1. Diabetes | ___ | ___s | ___% | ✅/❌ | ✅/❌ |
| 2. Ocean Acidification | ___ | ___s | ___% | ✅/❌ | ✅/❌ |
| 3. Quantum Computing | ___ | ___s | ___% | ✅/❌ | ✅/❌ |
| 4. Remote Work | ___ | ___s | ___% | ✅/❌ | ✅/❌ |
| 5. Active Learning | ___ | ___s | ___% | ✅/❌ | ✅/❌ |
| 6. Renewable Energy | ___ | ___s | ___% | ✅/❌ | ✅/❌ |
| 7. CBT Therapy | ___ | ___s | ___% | ✅/❌ | ✅/❌ |
| 8. UBI Programs | ___ | ___s | ___% | ✅/❌ | ✅/❌ |
| 9. Neuroplasticity | ___ | ___s | ___% | ✅/❌ | ✅/❌ |
| 10. Explainable AI | ___ | ___s | ___% | ✅/❌ | ✅/❌ |

**Average Relevance:** _____%
**Status:** [ ] Pass (≥80%) [ ] Fail (<80%)

#### Theme Quality Results

| Test Set | Papers | Themes | Rater 1 Avg | Rater 2 Avg | Cohen's κ | Status |
|----------|--------|--------|-------------|-------------|-----------|--------|
| Medical | 5 | ___ | ___ | ___ | ___ | ✅/❌ |
| Climate | 5 | ___ | ___ | ___ | ___ | ✅/❌ |
| Computer Sci | 5 | ___ | ___ | ___ | ___ | ✅/❌ |

**Overall Cohen's κ:** ______
**Status:** [ ] Pass (≥0.6) [ ] Fail (<0.6)

#### Accessibility Results

| Page | Lighthouse Score | Critical Issues | Keyboard Nav | Screen Reader | Color Contrast |
|------|-----------------|-----------------|--------------|---------------|----------------|
| Search | ___/100 | ___ | ✅/❌ | ✅/❌ | ✅/❌ |
| Results | ___/100 | ___ | ✅/❌ | ✅/❌ | ✅/❌ |
| Themes | ___/100 | ___ | ✅/❌ | ✅/❌ | ✅/❌ |
| Library | ___/100 | ___ | ✅/❌ | ✅/❌ | ✅/❌ |

**Average Score:** ___/100
**Status:** [ ] Pass (≥90) [ ] Fail (<90)

#### Mobile Responsive Results

| Breakpoint | Layout | Navigation | Touch Targets | Readability | Functionality | Status |
|------------|--------|------------|---------------|-------------|---------------|--------|
| 375px (Mobile) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| 768px (Tablet) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| 1920px (Desktop) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

**Status:** [ ] All 3 passed [ ] 2/3 passed [ ] <2/3 passed

### Issues Log

#### Critical Issues (Block Progression)
```
1. _______________________
   Impact: High
   Reproduction: _________
   Recommended Fix: ______

[Continue for all critical issues...]
```

#### High Priority Issues (Should Fix)
```
1. _______________________
   Impact: Medium
   Reproduction: _________
   Recommended Fix: ______

[Continue for all high priority issues...]
```

#### Low Priority Issues (Nice to Have)
```
1. _______________________
   Impact: Low
   Reproduction: _________
   Recommended Fix: ______

[Continue for all low priority issues...]
```

### Recommendations

```
1. Immediate Actions Required:
   - _______________________
   - _______________________

2. Before Stage 2 Phase 3:
   - _______________________
   - _______________________

3. Future Enhancements:
   - _______________________
   - _______________________
```

### Sign-off

```
Tester: ___________________
Date: _____________________
Signature: ________________

Status: [ ] Approved for Stage 2 Phase 3
        [ ] Conditional approval (minor fixes)
        [ ] Rejected (major issues require resolution)
```

---

## 📝 Next Steps After Manual Testing

If manual testing passes (≥90% overall success):
1. ✅ Proceed to Stage 2 Phase 3 (Expert Review)
2. Document all findings in test report
3. Log any non-critical issues for future sprints
4. Update Phase Tracker with results

If manual testing fails (<90% overall success):
1. ❌ Fix critical and high priority issues
2. Re-run failed test scenarios
3. Document fixes and re-test results
4. Only proceed when ≥90% success achieved

---

**Manual Testing Guide Version:** 1.0
**Last Updated:** October 29, 2025
**Owner:** Phase 10 Day 5.7 Stage 2 Phase 2
