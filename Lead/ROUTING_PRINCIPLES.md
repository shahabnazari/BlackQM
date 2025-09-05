# VQMethod Routing Principles

## Executive Summary

**Key Finding:** Next.js route groups with parentheses like `(researcher)` are for file organization only and DO NOT appear in URLs.

## Routing Architecture

### 1. Route Groups in Next.js 13+

Route groups use parentheses `()` to organize files WITHOUT affecting the URL structure:

```
app/
├── (researcher)/         # Organization only - NOT in URL
│   ├── dashboard/       # URL: /dashboard
│   ├── studies/         # URL: /studies
│   └── analytics/       # URL: /analytics
├── (participant)/       # Organization only - NOT in URL
│   ├── join/           # URL: /join
│   └── study/          # URL: /study
└── auth/               # Regular folder - APPEARS in URL
    ├── login/          # URL: /auth/login
    └── register/       # URL: /auth/register
```

### 2. Correct URL Mapping

| File Path                             | Actual URL    | Common Mistake             |
| ------------------------------------- | ------------- | -------------------------- |
| `app/(researcher)/dashboard/page.tsx` | `/dashboard`  | ❌ `/researcher/dashboard` |
| `app/(researcher)/studies/page.tsx`   | `/studies`    | ❌ `/researcher/studies`   |
| `app/(participant)/join/page.tsx`     | `/join`       | ❌ `/participant/join`     |
| `app/auth/login/page.tsx`             | `/auth/login` | ✅ Correct                 |

### 3. Authentication Redirect Flow

**CORRECT Implementation:**

```typescript
// After successful login
router.push('/dashboard'); // ✅ Correct
```

**INCORRECT Implementation:**

```typescript
// This will result in 404
router.push('/researcher/dashboard'); // ❌ Wrong
```

### 4. Navigation Links

**CORRECT Navigation Component:**

```tsx
<nav>
  <a href="/dashboard">Dashboard</a> {/* ✅ */}
  <a href="/studies">Studies</a> {/* ✅ */}
  <a href="/analytics">Analytics</a> {/* ✅ */}
</nav>
```

**INCORRECT Navigation:**

```tsx
<nav>
  <a href="/researcher/dashboard">Dashboard</a> {/* ❌ */}
  <a href="/researcher/studies">Studies</a> {/* ❌ */}
</nav>
```

### 5. Why Use Route Groups?

Route groups provide several benefits:

1. **Organization**: Keep related files together
2. **Shared Layouts**: Apply layouts to specific groups
3. **Middleware Scoping**: Apply middleware to groups
4. **Code Clarity**: Clear separation of concerns

Example structure benefits:

```
app/
├── (researcher)/
│   └── layout.tsx       # Applies to all researcher pages
├── (participant)/
│   └── layout.tsx       # Different layout for participants
└── (public)/
    └── layout.tsx       # Public pages layout
```

### 6. Common Pitfalls & Solutions

#### Pitfall 1: Hardcoding Route Group Names in URLs

**Problem:** Using `/researcher/dashboard` in redirects
**Solution:** Use `/dashboard` directly

#### Pitfall 2: API Endpoints Reference

**Problem:** Backend emails containing wrong URLs
**Solution:** Update all email templates to use correct paths

#### Pitfall 3: Test Files

**Problem:** Tests expecting `/researcher/*` paths
**Solution:** Update test assertions to match actual URLs

### 7. Testing Routes

Use this command to verify routes:

```bash
curl -I http://localhost:3003/dashboard        # ✅ Should return 200
curl -I http://localhost:3003/researcher/dashboard  # ❌ Should return 404
```

### 8. Migration Checklist

When fixing routing issues:

- [ ] Search for all hardcoded `/researcher/*` paths
- [ ] Update authentication redirects
- [ ] Fix navigation components
- [ ] Update email templates in backend
- [ ] Correct test assertions
- [ ] Update documentation
- [ ] Verify with route testing script

### 9. Best Practices

1. **Never hardcode route group names in URLs**
2. **Use route groups for organization, not URL structure**
3. **Test all routes after changes**
4. **Keep navigation components centralized**
5. **Document routing conventions for team**

### 10. Quick Reference

```javascript
// Route Group Folders (with parentheses) - NOT in URL
(researcher)  → Organization only
(participant) → Organization only
(auth)        → Organization only

// Regular Folders - APPEAR in URL
auth          → /auth/*
api           → /api/*
public        → /public/*
```

## Summary

The key principle to remember: **Route groups with parentheses are invisible in URLs**. They exist purely for developer organization and applying shared layouts/middleware. Always test your routes and never assume the folder structure directly maps to the URL structure when parentheses are involved.
