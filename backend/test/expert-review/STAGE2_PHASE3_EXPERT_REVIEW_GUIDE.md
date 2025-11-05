# Phase 10 Day 5.7 Stage 2 Phase 3: Expert Review Guide

**Date:** October 29, 2025
**Duration:** 2 hours
**Status:** 🟡 IN PROGRESS
**Purpose:** Academic and UX expert validation of literature discovery pipeline

---

## 📋 Overview

Stage 2 Phase 3 brings in domain experts to validate aspects that automated and manual testing cannot adequately assess:

1. **Academic Researcher:** Search relevance, theme quality, academic rigor
2. **UX Designer:** Visual hierarchy, consistency, user experience

**Success Criteria:**

- ✅ Search relevance ≥80% (academic researcher validation)
- ✅ Theme quality Cohen's kappa ≥0.6 (inter-rater reliability)
- ✅ UX consistency score ≥85/100 (designer evaluation)
- ✅ Visual hierarchy score ≥90/100 (designer evaluation)

---

## 👨‍🎓 Part 1: Academic Researcher Evaluation (1 hour)

### Expert Profile Requirements

**Qualifications:**

- PhD in any research field (preferably STEM or social sciences)
- Experience conducting literature reviews
- Familiarity with academic databases (PubMed, Crossref, arXiv)
- Understanding of research methodology

**Evaluation Focus:**

- Search relevance and precision
- Theme extraction quality
- Academic integrity and rigor
- Metadata accuracy

---

### Evaluation Protocol 1: Search Relevance Assessment

**Objective:** Validate that search results match academic standards for relevance

#### Test Procedure

**Step 1: Select 3 Research Topics**

```
From the 10 test scenarios, select:
1. One medical/biological topic (e.g., diabetes, neuroplasticity)
2. One social science topic (e.g., remote work, UBI)
3. One technical topic (e.g., quantum computing, explainable AI)
```

**Step 2: Execute Searches**

```
For each topic:
1. Navigate to literature search page
2. Enter topic query exactly as specified in test scenarios
3. Select appropriate sources (PubMed, Crossref, arXiv, OpenAlex)
4. Set limit to 20 papers
5. Record search time
```

**Step 3: Evaluate Relevance**

```
For each search result (first 10 papers):

Rating Scale:
  3 = Highly Relevant: Paper directly addresses topic, appropriate methodology
  2 = Somewhat Relevant: Paper tangentially related or peripheral aspect
  1 = Marginally Relevant: Loosely connected, requires inference
  0 = Not Relevant: No clear connection to search topic

Document:
  - Paper title
  - Relevance rating (0-3)
  - Brief justification (1 sentence)
```

**Step 4: Calculate Relevance Score**

```
For each topic:
  Total Points = Sum of all ratings
  Maximum Possible = 10 papers × 3 points = 30
  Relevance Percentage = (Total Points / 30) × 100

Target: ≥80% relevance (24+ points out of 30)
```

#### Academic Researcher Evaluation Form - Search Relevance

```
Topic 1: _________________________ (Medical/Biological)

Paper 1: _______________________
  Rating: [ ] 3  [ ] 2  [ ] 1  [ ] 0
  Justification: _________________

Paper 2: _______________________
  Rating: [ ] 3  [ ] 2  [ ] 1  [ ] 0
  Justification: _________________

[Continue for Papers 3-10]

Total Points: ___ / 30
Relevance Percentage: ____%
Status: [ ] Pass (≥80%) [ ] Fail (<80%)

---

Topic 2: _________________________ (Social Science)
[Repeat same format]

---

Topic 3: _________________________ (Technical)
[Repeat same format]

---

Overall Search Relevance:
  Average across 3 topics: ____%
  Status: [ ] Pass (≥80%) [ ] Fail (<80%)
```

---

### Evaluation Protocol 2: Theme Extraction Quality

**Objective:** Validate AI-extracted themes meet academic standards

#### Test Procedure

**Step 1: Select Paper Set**

```
Use papers from one of the search relevance tests above
Select 5 papers with highest relevance ratings (3 or 2)
```

**Step 2: Extract Themes**

```
1. Select the 5 papers in the interface
2. Click "Extract Themes" button
3. Wait for extraction to complete
4. Document all extracted themes
```

**Step 3: Independent Theme Identification**

```
Academic Researcher (as Rater 1):
  Read abstracts of the 5 papers
  Independently identify 5-10 main research themes
  Without looking at AI-extracted themes first

Document your themes:
  Theme 1: _______________________
  Theme 2: _______________________
  Theme 3: _______________________
  [Continue as needed]
```

**Step 4: Compare and Rate AI Themes**

```
For each AI-extracted theme, evaluate:

Rating Scale:
  1 = Highly Relevant: Theme accurately represents core concept from papers
  2 = Somewhat Relevant: Theme captures peripheral or secondary concept
  3 = Not Relevant: Theme does not represent paper content
  4 = Incorrect: Theme contradicts or misrepresents content

AI Theme 1: _______________________
  Your Rating: [ ] 1  [ ] 2  [ ] 3  [ ] 4
  Matches your theme: [ ] Yes [ ] No
  If Yes, which one: _______

[Repeat for all AI-extracted themes]
```

**Step 5: Calculate Theme Quality Metrics**

```
Precision: What % of AI themes are relevant (rated 1 or 2)?
  Relevant AI Themes / Total AI Themes × 100

Recall: What % of your themes were captured by AI?
  Your Themes Found by AI / Total Your Themes × 100

F1 Score: Harmonic mean of precision and recall
  2 × (Precision × Recall) / (Precision + Recall)

Target: F1 Score ≥ 0.70 (70%)
```

#### Academic Researcher Evaluation Form - Theme Quality

```
Paper Set: _________________________ (Topic)
Number of Papers: 5
AI Extraction Time: ___ seconds

Your Independent Themes (before seeing AI results):
1. _______________________________
2. _______________________________
3. _______________________________
4. _______________________________
5. _______________________________
6. _______________________________
7. _______________________________
[Add more as needed]

AI-Extracted Themes (rate each):

AI Theme 1: _______________________
  Keywords: _______________________
  Confidence: ___
  Your Rating: [ ] 1  [ ] 2  [ ] 3  [ ] 4
  Matches your theme #: ___

AI Theme 2: _______________________
  Keywords: _______________________
  Confidence: ___
  Your Rating: [ ] 1  [ ] 2  [ ] 3  [ ] 4
  Matches your theme #: ___

[Continue for all AI themes]

Quality Metrics:
  Total AI Themes: ___
  Relevant AI Themes (rated 1 or 2): ___
  Precision: ___%

  Your Themes: ___
  Your Themes Captured by AI: ___
  Recall: ___%

  F1 Score: ___
  Status: [ ] Pass (≥70%) [ ] Fail (<70%)

Qualitative Assessment:
  [ ] Themes are semantically meaningful
  [ ] Themes avoid generic/structural terms
  [ ] Themes capture research constructs
  [ ] Themes show appropriate specificity
  [ ] Keywords are relevant and helpful

Overall Theme Quality: [ ] Excellent [ ] Good [ ] Acceptable [ ] Poor
```

---

### Evaluation Protocol 3: Metadata Accuracy

**Objective:** Validate accuracy of bibliographic metadata

#### Test Procedure

**Step 1: Select 10 Papers**

```
From search results, select 10 random papers
Ensure mix of sources (PubMed, Crossref, arXiv, OpenAlex)
```

**Step 2: Verify Metadata**

```
For each paper, check:

Title:
  [ ] Matches original source
  [ ] Complete (not truncated)
  [ ] Proper capitalization

Authors:
  [ ] All authors listed
  [ ] Correct order
  [ ] Proper name formatting

Year:
  [ ] Correct publication year
  [ ] Matches DOI/source

DOI/PMID:
  [ ] Present (if available at source)
  [ ] Correct format
  [ ] Resolvable link

Abstract:
  [ ] Present (if available at source)
  [ ] Complete
  [ ] No encoding errors

Venue/Journal:
  [ ] Correct publication venue
  [ ] Proper formatting
```

**Step 3: Calculate Accuracy**

```
For each paper:
  Metadata Fields Correct / Total Fields × 100

Overall Accuracy:
  Sum all paper scores / Number of papers

Target: ≥95% metadata accuracy
```

#### Academic Researcher Evaluation Form - Metadata Accuracy

```
Paper 1: _________________________
  Source: _______________

  Title: [ ] Complete [ ] Truncated [ ] Incorrect
  Authors: [ ] Complete [ ] Partial [ ] Incorrect
  Year: [ ] Correct [ ] Incorrect [ ] Missing
  DOI/ID: [ ] Present & Valid [ ] Invalid [ ] Missing
  Abstract: [ ] Complete [ ] Partial [ ] Missing
  Venue: [ ] Correct [ ] Incorrect [ ] Missing

  Score: ___ / 6 fields correct
  Percentage: ___%

[Repeat for Papers 2-10]

Overall Metadata Accuracy:
  Average: ___%
  Status: [ ] Pass (≥95%) [ ] Fail (<95%)
```

---

### Academic Researcher Summary Report

```
Evaluator Name: _________________________
Credentials: ___________________________
Research Field: _________________________
Date: _________________________________

SEARCH RELEVANCE ASSESSMENT
  Topic 1 Relevance: ___%
  Topic 2 Relevance: ___%
  Topic 3 Relevance: ___%
  Average Relevance: ___%
  Status: [ ] Pass (≥80%) [ ] Fail (<80%)

THEME EXTRACTION QUALITY
  Precision: ___%
  Recall: ___%
  F1 Score: ___
  Status: [ ] Pass (≥70%) [ ] Fail (<70%)
  Qualitative Rating: _____________

METADATA ACCURACY
  Average Accuracy: ___%
  Status: [ ] Pass (≥95%) [ ] Fail (<95%)

OVERALL ACADEMIC VALIDATION
  Components Passed: ___ / 3
  Status: [ ] Approved [ ] Conditional [ ] Rejected

Comments & Recommendations:
_________________________________________
_________________________________________
_________________________________________

Signature: _____________________________
```

---

## 🎨 Part 2: UX Designer Evaluation (1 hour)

### Expert Profile Requirements

**Qualifications:**

- Professional UX/UI designer (3+ years experience)
- Experience with complex data-heavy interfaces
- Understanding of information architecture
- Familiarity with design systems

**Evaluation Focus:**

- Visual hierarchy and layout
- Consistency across pages
- User experience flow
- Accessibility and usability

---

### Evaluation Protocol 1: Visual Hierarchy Assessment

**Objective:** Validate that important elements are visually prominent

#### Test Procedure

**Step 1: Identify Key User Goals**

```
Primary Goals:
1. Search for academic papers
2. Select relevant papers
3. Extract themes from papers
4. Review and export results

For each goal, identify critical UI elements
```

**Step 2: Evaluate Visual Prominence**

```
For each critical element, assess:

Rating Scale (Visual Prominence):
  5 = Excellent: Immediately visible, clear hierarchy
  4 = Good: Visible within 2 seconds, proper emphasis
  3 = Acceptable: Findable but not prominent
  2 = Poor: Hard to find, weak hierarchy
  1 = Unacceptable: Hidden or requires scrolling

Elements to Evaluate:
  - Search input field
  - Source selection checkboxes
  - "Search" button
  - Paper selection checkboxes
  - "Extract Themes" button
  - Results display
  - Export/download buttons
  - Navigation elements
```

**Step 3: Calculate Hierarchy Score**

```
Average Visual Prominence Score:
  Sum of all ratings / Number of elements

Target: ≥4.0 average (90/100 when normalized)
```

#### UX Designer Evaluation Form - Visual Hierarchy

```
Page 1: Literature Search

Search Input Field:
  Prominence: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Justification: _________________

Source Selection (Checkboxes):
  Prominence: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Justification: _________________

"Search" Button:
  Prominence: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Justification: _________________

Advanced Filters Toggle:
  Prominence: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Justification: _________________

Page Average: ___

---

Page 2: Search Results

Results Grid/List:
  Prominence: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Justification: _________________

Paper Selection Checkboxes:
  Prominence: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Justification: _________________

"Extract Themes" Button:
  Prominence: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Justification: _________________

Pagination Controls:
  Prominence: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Justification: _________________

Page Average: ___

---

Page 3: Theme Extraction Results

Theme Cards/List:
  Prominence: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Justification: _________________

Keywords Display:
  Prominence: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Justification: _________________

Export Buttons:
  Prominence: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Justification: _________________

Page Average: ___

---

Overall Visual Hierarchy Score: ___ / 5.0
Normalized (out of 100): ___
Status: [ ] Pass (≥90) [ ] Fail (<90)
```

---

### Evaluation Protocol 2: Design Consistency Assessment

**Objective:** Validate consistent design patterns across the application

#### Test Procedure

**Step 1: Document Design Patterns**

```
Identify recurring patterns:
1. Button styles (primary, secondary, text)
2. Form input styles
3. Card/container styles
4. Typography hierarchy (h1, h2, h3, body)
5. Color usage (primary, secondary, accent, neutral)
6. Spacing system (margins, padding)
7. Border radius consistency
8. Shadow/elevation usage
```

**Step 2: Evaluate Consistency**

```
For each pattern, rate consistency across pages:

Rating Scale:
  5 = Perfect: 100% consistent application
  4 = Excellent: Minor variations, still cohesive
  3 = Good: Some inconsistencies, mostly uniform
  2 = Poor: Significant inconsistencies
  1 = Inconsistent: No clear pattern

Check across 4 pages:
  - Literature search
  - Search results
  - Theme extraction
  - Library view
```

**Step 3: Calculate Consistency Score**

```
Average Consistency Score:
  Sum of all pattern ratings / Number of patterns

Target: ≥4.25 average (85/100 when normalized)
```

#### UX Designer Evaluation Form - Design Consistency

```
Pattern 1: Button Styles

Primary Buttons:
  Search page: [ ] Consistent [ ] Variant [ ] Different
  Results page: [ ] Consistent [ ] Variant [ ] Different
  Themes page: [ ] Consistent [ ] Variant [ ] Different
  Library page: [ ] Consistent [ ] Variant [ ] Different

  Consistency Rating: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Notes: _____________________

Secondary Buttons:
  [Same format]
  Consistency Rating: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1

---

Pattern 2: Typography Hierarchy

Headings (h1, h2, h3):
  Font family consistent: [ ] Yes [ ] No
  Font sizes consistent: [ ] Yes [ ] No
  Font weights consistent: [ ] Yes [ ] No
  Color consistent: [ ] Yes [ ] No

  Consistency Rating: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Notes: _____________________

Body Text:
  [Same format]
  Consistency Rating: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1

---

Pattern 3: Color Usage

Primary Color:
  Applied consistently: [ ] Yes [ ] No
  Used for same elements: [ ] Yes [ ] No
  Consistency Rating: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1

Secondary/Accent Colors:
  Consistency Rating: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1

Neutral Colors (grays):
  Consistency Rating: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1

---

Pattern 4: Spacing System

Margins:
  Consistent units: [ ] Yes [ ] No
  Consistent scale: [ ] Yes [ ] No
  Consistency Rating: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1

Padding:
  Consistency Rating: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1

---

Pattern 5: Cards/Containers

Border radius:
  Consistency Rating: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1

Shadow/Elevation:
  Consistency Rating: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1

Background color:
  Consistency Rating: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1

---

Overall Design Consistency Score: ___ / 5.0
Normalized (out of 100): ___
Status: [ ] Pass (≥85) [ ] Fail (<85)
```

---

### Evaluation Protocol 3: User Experience Flow

**Objective:** Validate smooth, logical user journey

#### Test Procedure

**Step 1: Complete Core User Journey**

```
Execute complete workflow:
1. Start at home/dashboard
2. Navigate to literature search
3. Perform search with real topic
4. Review results
5. Select 3-5 papers
6. Extract themes
7. Review extracted themes
8. Export or save results

Document:
  - Time to complete
  - Number of clicks
  - Friction points
  - Confusing moments
```

**Step 2: Rate Each Step**

```
Rating Scale:
  5 = Seamless: Intuitive, no friction
  4 = Smooth: Easy to complete
  3 = Acceptable: Completable with minor friction
  2 = Difficult: Requires thought or multiple attempts
  1 = Frustrating: Confusing or error-prone

Rate:
  - Navigation clarity
  - Action discoverability
  - Feedback quality
  - Error prevention
  - Recovery from errors
```

**Step 3: Calculate UX Flow Score**

```
Average UX Flow Score:
  Sum of all step ratings / Number of steps

Target: ≥4.0 average (80/100 when normalized)
```

#### UX Designer Evaluation Form - User Experience Flow

```
Step 1: Navigate to Literature Search
  Clarity: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Time taken: ___ seconds
  Issues: _____________________

Step 2: Enter Search Query
  Clarity: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Feedback: [ ] Clear [ ] Adequate [ ] Unclear
  Issues: _____________________

Step 3: Select Sources
  Clarity: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Discoverability: [ ] Easy [ ] Moderate [ ] Hard
  Issues: _____________________

Step 4: Execute Search
  Clarity: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Loading feedback: [ ] Excellent [ ] Good [ ] Poor
  Issues: _____________________

Step 5: Review Results
  Clarity: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Layout: [ ] Excellent [ ] Good [ ] Poor
  Issues: _____________________

Step 6: Select Papers
  Clarity: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Ease of selection: [ ] Easy [ ] Moderate [ ] Hard
  Issues: _____________________

Step 7: Extract Themes
  Clarity: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Button discoverability: [ ] Easy [ ] Moderate [ ] Hard
  Progress feedback: [ ] Excellent [ ] Good [ ] Poor
  Issues: _____________________

Step 8: Review Themes
  Clarity: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Information display: [ ] Clear [ ] Adequate [ ] Confusing
  Issues: _____________________

Step 9: Export/Save
  Clarity: [ ] 5  [ ] 4  [ ] 3  [ ] 2  [ ] 1
  Options clear: [ ] Yes [ ] Somewhat [ ] No
  Issues: _____________________

Total Journey Time: ___ minutes
Total Clicks: ___
Friction Points Encountered: ___

Overall UX Flow Score: ___ / 5.0
Normalized (out of 100): ___
Status: [ ] Pass (≥80) [ ] Fail (<80)
```

---

### UX Designer Summary Report

```
Evaluator Name: _________________________
Credentials: ___________________________
Years of Experience: ___________________
Date: _________________________________

VISUAL HIERARCHY ASSESSMENT
  Average Score: ___ / 5.0 (___/100)
  Status: [ ] Pass (≥90) [ ] Fail (<90)

  Strengths:
  _______________________________________

  Areas for Improvement:
  _______________________________________

DESIGN CONSISTENCY ASSESSMENT
  Average Score: ___ / 5.0 (___/100)
  Status: [ ] Pass (≥85) [ ] Fail (<85)

  Most Consistent Patterns:
  _______________________________________

  Inconsistencies Found:
  _______________________________________

USER EXPERIENCE FLOW ASSESSMENT
  Average Score: ___ / 5.0 (___/100)
  Status: [ ] Pass (≥80) [ ] Fail (<80)

  Smooth Interactions:
  _______________________________________

  Friction Points:
  _______________________________________

OVERALL UX EVALUATION
  Components Passed: ___ / 3
  Status: [ ] Approved [ ] Conditional [ ] Rejected

Priority Recommendations:
1. _____________________________________
2. _____________________________________
3. _____________________________________

Signature: _____________________________
```

---

## 📊 Stage 2 Phase 3 Final Report

### Combined Expert Validation Summary

```
Test Date: _____________________________
Duration: _____ hours

ACADEMIC RESEARCHER VALIDATION
  Search Relevance: ___% [ ] Pass [ ] Fail
  Theme Quality: F1=___ [ ] Pass [ ] Fail
  Metadata Accuracy: ___% [ ] Pass [ ] Fail
  Overall: [ ] Approved [ ] Conditional [ ] Rejected

UX DESIGNER VALIDATION
  Visual Hierarchy: ___/100 [ ] Pass [ ] Fail
  Design Consistency: ___/100 [ ] Pass [ ] Fail
  UX Flow: ___/100 [ ] Pass [ ] Fail
  Overall: [ ] Approved [ ] Conditional [ ] Rejected

STAGE 2 PHASE 3 STATUS
  Expert Reviews Passed: ___ / 2
  Status: [ ] Approved for Stage 2 Phase 4
          [ ] Conditional (minor fixes)
          [ ] Rejected (major issues)

Critical Issues (Block Progression):
1. _____________________________________
2. _____________________________________

High Priority Issues (Should Fix):
1. _____________________________________
2. _____________________________________

Low Priority Issues (Nice to Have):
1. _____________________________________
2. _____________________________________

Next Steps:
[ ] Proceed to Stage 2 Phase 4 (Edge Case Testing)
[ ] Fix critical issues first
[ ] Schedule re-review
```

---

## 🎯 Success Criteria Summary

**To Pass Stage 2 Phase 3:**

Academic Researcher:

- ✅ Search relevance ≥80%
- ✅ Theme quality F1 ≥ 70%
- ✅ Metadata accuracy ≥95%

UX Designer:

- ✅ Visual hierarchy ≥90/100
- ✅ Design consistency ≥85/100
- ✅ UX flow ≥80/100

**Overall:** Both experts must approve (or conditional approval with minor fixes only)

---

**Expert Review Guide Version:** 1.0
**Last Updated:** October 29, 2025
**Owner:** Phase 10 Day 5.7 Stage 2 Phase 3
