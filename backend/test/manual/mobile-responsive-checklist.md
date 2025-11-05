# Mobile Responsive Testing Checklist

## Phase 10 Day 5.7 Stage 2 Phase 2

**Purpose:** Validate mobile responsiveness across 3 breakpoints
**Target:** 100% functionality on all breakpoints
**Tools:** Chrome DevTools Device Mode

---

## Setup Instructions

1. Open Chrome browser
2. Navigate to the page to test
3. Press `F12` to open DevTools
4. Press `Ctrl+Shift+M` (Windows) or `Cmd+Opt+M` (Mac) to toggle device toolbar
5. Select device or enter custom dimensions

---

## Breakpoint 1: Mobile (375px) - iPhone SE

### Page: Literature Search (`/discover/literature`)

#### Layout

- [ ] Search input is full width
- [ ] Search input has proper padding (comfortable touch target)
- [ ] Source checkboxes are vertically stacked
- [ ] Each checkbox has ≥44px touch target
- [ ] Advanced filters collapse into accordion or menu
- [ ] No horizontal scrolling on any content
- [ ] Text is readable without zooming (≥16px base font size)

#### Navigation

- [ ] Main navigation collapses into hamburger menu
- [ ] Hamburger icon is ≥44px touch target
- [ ] Menu opens smoothly with animation
- [ ] Menu items are easy to tap (≥44px height)
- [ ] Menu closes when clicking outside or on item

#### Forms

- [ ] "Search" button is full width or properly sized
- [ ] Button text is readable and centered
- [ ] All form inputs have visible labels
- [ ] Validation errors display clearly
- [ ] Submit button disabled state is distinguishable

#### Typography

- [ ] Headings scale appropriately (smaller than desktop)
- [ ] Body text is ≥16px (prevents zoom on iOS)
- [ ] Line height is comfortable (1.5-1.6)
- [ ] Text wraps properly (no overflow)

### Page: Search Results

#### Layout

- [ ] Paper cards stack vertically (1 per row)
- [ ] Each card has proper spacing (≥16px margin)
- [ ] Paper titles wrap to multiple lines if needed
- [ ] Author names wrap or truncate gracefully (...ellipsis)
- [ ] Year and citation info visible

#### Interactions

- [ ] Checkboxes have ≥44px touch targets
- [ ] Tap to select works reliably
- [ ] Visual feedback on tap (ripple or highlight)
- [ ] "Select All" checkbox is accessible
- [ ] Long-press doesn't trigger browser context menu

#### Actions

- [ ] "Extract Themes" button is visible
- [ ] Button is full width or prominent
- [ ] Button moves above fold or sticky to bottom
- [ ] Pagination controls are touch-friendly
- [ ] Page numbers have ≥44px touch targets

#### Filters

- [ ] Filters collapse into drawer or modal
- [ ] Filter icon/button has ≥44px touch target
- [ ] Drawer/modal slides in smoothly
- [ ] Applied filters show count badge
- [ ] "Clear All" button is accessible

### Page: Theme Extraction Results

#### Layout

- [ ] Theme cards stack vertically
- [ ] Keywords wrap to multiple lines
- [ ] Confidence scores are visible
- [ ] No horizontal overflow on keyword lists

#### Tables

- [ ] Tables convert to card layout or stack rows
- [ ] Each row/card shows all important data
- [ ] Horizontal scroll if needed has visible indicator
- [ ] Sticky headers if horizontal scroll used

#### Charts

- [ ] Charts resize to fit mobile width
- [ ] Chart labels are readable (not overlapping)
- [ ] Legend positioned below chart (not to side)
- [ ] Touch to interact works (zoom, pan if applicable)

#### Export

- [ ] Export buttons visible
- [ ] Buttons may collapse into "..." menu
- [ ] Menu opens as bottom sheet or modal
- [ ] Each export option has clear label

### Page: Library View

#### Layout

- [ ] Saved papers display as cards (not table)
- [ ] Cards stack vertically with proper spacing
- [ ] Search bar is full width
- [ ] Sorting dropdown is accessible

#### Actions

- [ ] Delete icon is ≥44px touch target
- [ ] Edit icon is ≥44px touch target
- [ ] Swipe-to-delete works (optional enhancement)
- [ ] Long-press for context menu (optional)

#### Empty States

- [ ] Empty library message is centered
- [ ] "Add Papers" CTA is prominent
- [ ] Illustration (if any) scales properly

---

## Breakpoint 2: Tablet (768px) - iPad

### Page: Literature Search

#### Layout

- [ ] Two-column layout starts to appear
- [ ] Filters may show in sidebar (not collapsed)
- [ ] Search input is centered with max-width
- [ ] Source checkboxes may go 2-column

#### Navigation

- [ ] Sidebar navigation visible (if app has one)
- [ ] Main navigation may expand from hamburger
- [ ] Breadcrumbs appear (if applicable)

### Page: Search Results

#### Layout

- [ ] Paper cards in 2-column grid
- [ ] Cards have equal heights in row
- [ ] Proper gutters between columns (≥24px)

#### Actions

- [ ] Filters show in left sidebar or right panel
- [ ] "Extract Themes" button in header or sidebar
- [ ] Pagination in footer with more page numbers

### Page: Theme Extraction Results

#### Layout

- [ ] Themes in 2-column grid
- [ ] Tables display full width (all columns visible)
- [ ] Charts use more horizontal space

#### Export

- [ ] All export buttons visible (no overflow menu)
- [ ] Buttons in row with proper spacing

### Page: Library View

#### Layout

- [ ] Papers in 2-column grid
- [ ] Search and filters in header
- [ ] Sorting controls inline (not dropdown)

---

## Breakpoint 3: Desktop (1920px) - Full HD

### Page: Literature Search

#### Layout

- [ ] Content centered with max-width (≤1400px)
- [ ] Sidebar filters always visible
- [ ] Search bar has max-width (≤800px)
- [ ] Three-column layout if applicable

#### Navigation

- [ ] Full horizontal navigation bar
- [ ] All menu items visible
- [ ] Dropdowns work on hover

### Page: Search Results

#### Layout

- [ ] Paper cards in 3-4 column grid
- [ ] Cards maintain aspect ratio
- [ ] No excessive whitespace
- [ ] Content centered or left-aligned

#### Filters

- [ ] Filters in left sidebar (always visible)
- [ ] Filter groups expanded by default
- [ ] Applied filters show in header with remove option

### Page: Theme Extraction Results

#### Layout

- [ ] Themes in 3-4 column grid
- [ ] Tables show all columns
- [ ] Charts use optimal width (not edge-to-edge)
- [ ] Export buttons in header

### Page: Library View

#### Layout

- [ ] Papers in 3-4 column grid
- [ ] Advanced sorting and filtering visible
- [ ] Bulk actions in toolbar

---

## Orientation Testing

### Portrait Mode (Mobile/Tablet)

- [ ] All content accessible without horizontal scroll
- [ ] Navigation remains accessible
- [ ] Forms stack vertically for easy input
- [ ] Buttons are touch-friendly sized
- [ ] Virtual keyboard doesn't obscure inputs (viewport units not vh)

### Landscape Mode (Mobile/Tablet)

- [ ] Content reflows to utilize horizontal space
- [ ] Navigation adapts (may use horizontal layout)
- [ ] Tables may show more columns
- [ ] Virtual keyboard doesn't obscure critical UI
- [ ] Charts and visualizations take advantage of width

---

## Performance on Mobile

- [ ] Page loads in <3 seconds on 3G
- [ ] Images are lazy-loaded
- [ ] Critical CSS inlined
- [ ] JavaScript deferred or async
- [ ] Smooth scrolling (60fps)

---

## Touch Interactions

- [ ] Tap targets ≥44px × 44px
- [ ] Adequate spacing between tappable elements (≥8px)
- [ ] Visual feedback on touch (ripple, highlight)
- [ ] No :hover-only interactions (must work on tap)
- [ ] Swipe gestures work (if implemented)

---

## Typography on Mobile

- [ ] Base font size ≥16px (prevents auto-zoom on iOS)
- [ ] Line height 1.5-1.6 for readability
- [ ] Heading scale appropriate for viewport
- [ ] Text contrast ratio ≥4.5:1
- [ ] No text truncation unless necessary

---

## Images and Media

- [ ] Images responsive (width: 100%, height: auto)
- [ ] Srcset used for different densities (@1x, @2x, @3x)
- [ ] Alt text provided for all images
- [ ] Videos responsive and don't auto-play
- [ ] Posters used for videos (loading placeholder)

---

## Results Summary

### Mobile (375px)

- Total Checks: \_\_\_\_
- Passed: \_\_\_\_
- Failed: \_\_\_\_
- Status: [ ] Pass [ ] Fail

### Tablet (768px)

- Total Checks: \_\_\_\_
- Passed: \_\_\_\_
- Failed: \_\_\_\_
- Status: [ ] Pass [ ] Fail

### Desktop (1920px)

- Total Checks: \_\_\_\_
- Passed: \_\_\_\_
- Failed: \_\_\_\_
- Status: [ ] Pass [ ] Fail

### Overall Mobile Responsiveness

- Breakpoints Passed: \_\_\_\_/3
- Status: [ ] Pass (3/3) [ ] Fail (<3/3)

---

## Common Issues and Fixes

### Issue: Horizontal Scroll on Mobile

- **Fix:** Remove fixed widths, use max-width instead
- **Fix:** Check for viewport width overflow (100vw issues)
- **Fix:** Set body overflow-x: hidden (last resort)

### Issue: Text Too Small

- **Fix:** Set base font-size to 16px minimum
- **Fix:** Use rem units for font sizes
- **Fix:** Avoid viewport units for font-size

### Issue: Tiny Touch Targets

- **Fix:** Increase padding on buttons/links
- **Fix:** Use min-width and min-height of 44px
- **Fix:** Add margin between tappable elements

### Issue: Layout Breaks at Specific Width

- **Fix:** Test at that specific width
- **Fix:** Add media query for that breakpoint
- **Fix:** Use flexbox/grid for flexible layouts

### Issue: Images Overflow Container

- **Fix:** Set max-width: 100% and height: auto
- **Fix:** Use object-fit: contain or cover
- **Fix:** Wrap in container with overflow: hidden

---

**Checklist Version:** 1.0
**Last Updated:** October 29, 2025
**Owner:** Phase 10 Day 5.7 Stage 2 Phase 2
