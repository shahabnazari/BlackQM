# Accessibility Enforcement Guide
**Phase 10.8 Day 3: WCAG AA Compliance**

This document ensures **all future development** maintains WCAG AA compliance with **zero exceptions**.

---

## 🔒 Mandatory Requirements

### Every New Component MUST:

1. ✅ **Keyboard Navigation**
   - All interactive elements accessible via Tab
   - Enter/Space activates buttons
   - Escape closes modals
   - Arrow keys navigate lists
   - No keyboard traps

2. ✅ **Focus Indicators**
   - 2px solid outline minimum
   - Visible on all focusable elements
   - Never `outline: none` without alternative

3. ✅ **ARIA Labels**
   - All buttons have descriptive labels
   - Images have alt text
   - Forms have associated labels
   - Dynamic content has live regions

4. ✅ **Color Contrast**
   - 4.5:1 minimum for normal text
   - 3:1 minimum for large text (18pt+ or 14pt+ bold)
   - Use `hassufficientContrast()` utility to verify

5. ✅ **Touch Targets**
   - 44x44px minimum
   - Adequate spacing between targets
   - Never overlap

6. ✅ **Screen Reader Support**
   - Semantic HTML (nav, main, article, etc.)
   - ARIA roles when semantic HTML insufficient
   - Meaningful text content (no empty divs with only icons)

---

## 🚫 NEVER Do These:

### 1. Hiding Focus Outlines Without Replacement
```css
/* ❌ NEVER DO THIS */
button:focus {
  outline: none; /* Violates WCAG 2.4.7 */
}

/* ✅ DO THIS INSTEAD */
button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

### 2. Using Color Alone for Information
```jsx
/* ❌ NEVER DO THIS */
<span style={{ color: 'red' }}>Error</span>

/* ✅ DO THIS INSTEAD */
<span className="text-error" role="alert" aria-live="assertive">
  <AlertIcon aria-hidden="true" />
  <span>Error: Please fill in all required fields</span>
</span>
```

### 3. Icon-Only Buttons Without Labels
```jsx
/* ❌ NEVER DO THIS */
<button>
  <TrashIcon />
</button>

/* ✅ DO THIS INSTEAD */
<button aria-label={generateButtonAriaLabel('Delete', 'paper', paperTitle)}>
  <TrashIcon aria-hidden="true" />
  <span className="sr-only">Delete {paperTitle}</span>
</button>
```

### 4. Inaccessible Modals
```jsx
/* ❌ NEVER DO THIS */
<div className="modal">
  <button onClick={closeModal}>X</button>
  {content}
</div>

/* ✅ DO THIS INSTEAD */
<div 
  ref={modalRef}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  data-focus-trap="true"
>
  <h2 id="modal-title">Modal Title</h2>
  <button 
    onClick={closeModal}
    aria-label="Close modal"
    onKeyDown={(e) => handleEscapeKey(e, closeModal)}
  >
    <X aria-hidden="true" />
  </button>
  {content}
</div>

useEffect(() => {
  if (!isOpen) return;
  return setupFocusTrap(modalRef, isOpen);
}, [isOpen]);
```

### 5. Non-Descriptive Link Text
```jsx
/* ❌ NEVER DO THIS */
<a href="/paper/123">Click here</a>
<a href="/paper/123">Read more</a>

/* ✅ DO THIS INSTEAD */
<a href="/paper/123">
  Read the full paper: {paperTitle}
</a>
<a href="/paper/123" aria-label={`Read more about ${paperTitle}`}>
  Read more
</a>
```

### 6. Missing Form Labels
```jsx
/* ❌ NEVER DO THIS */
<input placeholder="Enter your name" />

/* ✅ DO THIS INSTEAD */
const id = useMemo(() => generateUniqueId('name-input'), []);

<label htmlFor={id}>Name (required)</label>
<input 
  id={id}
  required
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? `${id}-error` : undefined}
/>
{hasError && (
  <span id={`${id}-error`} role="alert">
    {errorMessage}
  </span>
)}
```

### 7. Small Touch Targets
```css
/* ❌ NEVER DO THIS */
button {
  width: 20px;
  height: 20px;
  padding: 0;
}

/* ✅ DO THIS INSTEAD */
button {
  min-width: 44px;
  min-height: 44px;
  padding: 8px;
}
```

### 8. Non-Keyboard Accessible Interactions
```jsx
/* ❌ NEVER DO THIS */
<div onClick={handleClick}>
  Click me
</div>

/* ✅ DO THIS INSTEAD */
<button 
  onClick={handleClick}
  onKeyDown={(e) => handleKeyboardActivation(e, handleClick)}
>
  Click me
</button>

// Or if you MUST use a div (rare):
<div 
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => handleKeyboardActivation(e, handleClick)}
>
  Click me
</div>
```

---

## ✅ Code Review Checklist

Before merging ANY PR, verify:

### Keyboard Navigation
- [ ] Tab reaches all interactive elements in logical order
- [ ] Shift+Tab reverses direction correctly
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys navigate lists (if applicable)
- [ ] No keyboard traps exist

### Focus Management
- [ ] Focus indicators visible on all elements
- [ ] Focus indicators have 2px minimum thickness
- [ ] Focus indicators have sufficient contrast (3:1)
- [ ] Modal focus trapped when open
- [ ] Focus returns to trigger element on close

### ARIA & Semantics
- [ ] All buttons have descriptive `aria-label` or text content
- [ ] All images have `alt` text (or `aria-label` or `role="presentation"`)
- [ ] All form inputs have associated `<label>` elements
- [ ] Required fields marked with `aria-required="true"` and `required`
- [ ] Error states marked with `aria-invalid="true"`
- [ ] Dynamic content uses `aria-live` regions
- [ ] Page landmarks used (nav, main, aside, etc.)
- [ ] Headings follow logical hierarchy (h1 → h2 → h3, no skipping)

### Color & Contrast
- [ ] Text has 4.5:1 contrast minimum (use `hasSufficientContrast()`)
- [ ] Large text (18pt+) has 3:1 contrast minimum
- [ ] Color not sole means of conveying information
- [ ] Links distinguishable from surrounding text
- [ ] Error states use icons + text, not just color

### Touch Targets
- [ ] All interactive elements 44x44px minimum
- [ ] Adequate spacing between targets (8px minimum)
- [ ] Buttons have visible boundaries

### Screen Readers
- [ ] All icon-only buttons have `aria-label`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Screen reader only text uses `.sr-only` class
- [ ] Loading states announced with `aria-live`
- [ ] Error messages announced with `role="alert"`
- [ ] Success messages announced

### Responsive & Mobile
- [ ] Touch targets remain 44x44px on mobile
- [ ] No horizontal scroll required
- [ ] Zoom to 200% doesn't break layout
- [ ] Text remains readable at all sizes

---

## 🛠️ Required Utilities

### For All New Components:

```typescript
import {
  // Keyboard navigation
  handleListKeyNavigation,
  handleKeyboardActivation,
  handleEscapeKey,
  
  // Focus management
  setupFocusTrap,
  autoFocusElement,
  
  // ARIA helpers
  getSearchResultsAnnouncement,
  getLoadingAnnouncement,
  getPaginationAnnouncement,
  generateButtonAriaLabel,
  getAriaRole,
  
  // Screen reader
  announceToScreenReader,
  SR_ONLY_CLASS,
  
  // Color contrast
  hasSufficientContrast,
  
  // Navigation
  getSkipLinkProps,
  generateUniqueId,
} from '@/lib/utils/accessibility';
```

### Usage Examples:

#### Button with Icon
```tsx
import { generateButtonAriaLabel } from '@/lib/utils/accessibility';

<button 
  aria-label={generateButtonAriaLabel('Delete', 'paper', paperTitle)}
  onClick={handleDelete}
>
  <TrashIcon aria-hidden="true" />
</button>
```

#### Modal with Focus Trap
```tsx
import { setupFocusTrap, handleEscapeKey } from '@/lib/utils/accessibility';

const modalRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!isOpen) return;
  return setupFocusTrap(modalRef, isOpen);
}, [isOpen]);

<div 
  ref={modalRef}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  onKeyDown={(e) => handleEscapeKey(e, handleClose)}
>
  <h2 id="modal-title">Modal Title</h2>
  {/* Modal content */}
</div>
```

#### List with Arrow Key Navigation
```tsx
import { handleListKeyNavigation } from '@/lib/utils/accessibility';

<ul 
  role="list"
  onKeyDown={(e) => handleListKeyNavigation(
    e,
    focusedIndex,
    items.length,
    setFocusedIndex
  )}
>
  {items.map((item, index) => (
    <li 
      key={item.id}
      role="listitem"
      tabIndex={focusedIndex === index ? 0 : -1}
    >
      {item.title}
    </li>
  ))}
</ul>
```

#### Dynamic Content Announcement
```tsx
import { announceToScreenReader } from '@/lib/utils/accessibility';

// After search completes
useEffect(() => {
  if (searchResults) {
    announceToScreenReader(
      `Found ${searchResults.length} papers`,
      'polite'
    );
  }
}, [searchResults]);
```

#### Form with Validation
```tsx
import { generateUniqueId } from '@/lib/utils/accessibility';

const inputId = useMemo(() => generateUniqueId('email'), []);
const errorId = `${inputId}-error`;

<div>
  <label htmlFor={inputId}>
    Email {required && <span aria-hidden="true">*</span>}
  </label>
  <input
    id={inputId}
    type="email"
    required={required}
    aria-required={required}
    aria-invalid={hasError}
    aria-describedby={hasError ? errorId : undefined}
  />
  {hasError && (
    <span id={errorId} role="alert" className="text-error">
      {errorMessage}
    </span>
  )}
</div>
```

---

## 🎨 CSS Classes Available

### Screen Reader Only
```tsx
<span className="sr-only">
  Additional context for screen readers only
</span>
```

### Focus Visible (Automatic)
```css
/* All elements get focus indicators automatically */
*:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

### Skip Links
```tsx
<a {...getSkipLinkProps('main-content')}>
  Skip to main content
</a>

<main id="main-content" tabIndex={-1}>
  {/* Main content */}
</main>
```

---

## 📊 Testing Requirements

### Before Every Commit:

1. **Keyboard Test** (5 minutes)
   - Tab through entire page
   - Verify all interactive elements reachable
   - Test Escape, Enter, Space, Arrow keys

2. **Screen Reader Test** (10 minutes)
   - Mac: VoiceOver (Cmd+F5)
   - Windows: NVDA (free) or JAWS
   - Verify all content announced correctly

3. **Contrast Test** (2 minutes)
   - Use browser DevTools Accessibility panel
   - Or use `hasSufficientContrast()` programmatically
   - Verify all text passes WCAG AA

4. **Touch Target Test** (2 minutes)
   - Inspect element sizes in DevTools
   - Verify 44x44px minimum
   - Test on mobile device

### Automated Tests (Coming Soon):
- [ ] axe-core integration (Lighthouse accessibility audit)
- [ ] pa11y-ci in CI/CD pipeline
- [ ] jest-axe for unit tests

---

## 🚨 When Violations Occur

### If You Find A Violation:

1. **DO NOT SHIP IT** - Accessibility is not optional
2. Fix immediately or create P0 bug
3. Document the fix in PR
4. Add test to prevent regression

### Common Fixes:

| Violation | Fix |
|-----------|-----|
| Missing focus indicator | Add `:focus-visible` styles |
| Low contrast text | Use darker color from design system |
| Missing ARIA label | Add descriptive `aria-label` |
| Small touch target | Increase padding to reach 44x44px |
| Keyboard trap | Use `setupFocusTrap()` utility |
| No alt text | Add descriptive `alt` attribute |

---

## 📚 Resources

### WCAG 2.1 Guidelines
- https://www.w3.org/WAI/WCAG21/quickref/
- Focus on Level A & AA requirements

### Testing Tools
- **axe DevTools** - Browser extension for accessibility testing
- **WAVE** - Web accessibility evaluation tool
- **Lighthouse** - Built into Chrome DevTools
- **VoiceOver** - Mac screen reader (Cmd+F5)
- **NVDA** - Windows screen reader (free)

### Our Utilities
- `/frontend/lib/utils/accessibility.ts` - All helper functions
- `/frontend/app/globals-accessibility.css` - Global styles

---

## 🔒 Enforcement

### Code Review Requirements:
- ✅ All checklist items verified
- ✅ Screenshot of focus indicators
- ✅ Contrast ratios documented
- ✅ Keyboard navigation tested

### PR Template (Add This):
```markdown
## Accessibility Checklist
- [ ] Keyboard navigation tested
- [ ] Focus indicators visible
- [ ] ARIA labels added
- [ ] Color contrast verified (4.5:1)
- [ ] Touch targets 44x44px
- [ ] Screen reader tested
```

---

## ✅ Success Criteria

### Component is Accessible When:
1. ✅ Passes automated axe scan (0 violations)
2. ✅ Fully keyboard navigable
3. ✅ Screen reader announces all content
4. ✅ All text passes contrast requirements
5. ✅ All touch targets meet size requirements
6. ✅ No keyboard traps
7. ✅ Focus indicators always visible

---

## 💡 Remember

> **Accessibility is not optional.**  
> **It's not a nice-to-have.**  
> **It's a legal requirement and moral obligation.**

Every user deserves equal access to our application, regardless of:
- ✅ Vision ability
- ✅ Motor skills
- ✅ Hearing ability
- ✅ Cognitive ability
- ✅ Device capabilities

**When in doubt, make it more accessible, not less.**

---

**This guide is mandatory for all development going forward.**  
**No exceptions. No compromises. Full compliance.**

---

Last Updated: November 13, 2025  
Phase: 10.8 Day 3  
WCAG Level: AA (with some AAA)  
Status: **ENFORCED** ✅

