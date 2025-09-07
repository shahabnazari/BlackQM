# VQMethod Platform Sitemap

## 🌐 IMPORTANT: Correct URL is http://localhost:3000 (NOT 3003)

## 📍 Route Structure Overview

### Public Routes (No Authentication Required)

```
http://localhost:3000/                     # Homepage
http://localhost:3000/about                # About page
http://localhost:3000/contact              # Contact page
http://localhost:3000/privacy              # Privacy policy
http://localhost:3000/terms                # Terms of service
http://localhost:3000/help                 # Help center
```

### Authentication Routes

```
http://localhost:3000/auth/login           # Sign in page
http://localhost:3000/auth/register        # Sign up page
http://localhost:3000/auth/forgot-password  # Password recovery
http://localhost:3000/auth/reset-password  # Password reset
http://localhost:3000/auth/verify-email     # Email verification
```

### Researcher Routes (Protected - Requires Authentication)

```
http://localhost:3000/dashboard            # Main researcher dashboard
http://localhost:3000/studies              # Study management list
http://localhost:3000/studies/create       # Create new study

# Analytics vs Analysis - IMPORTANT DISTINCTION:
http://localhost:3000/analytics           # General analytics dashboard (metrics, charts)
http://localhost:3000/analysis             # Analysis tools hub (NEEDS INDEX PAGE)
http://localhost:3000/analysis/q-methodology  # Q-methodology specific analysis tool

http://localhost:3000/visualization-demo   # Visualization demos
http://localhost:3000/visualization-demo/q-methodology  # Q-method visualization demo
```

### Participant Routes

```
http://localhost:3000/join                 # Join a study
http://localhost:3000/study/[token]        # Participate in specific study
```

### Test Routes

```
http://localhost:3000/navigation-test      # Navigation component test page
```

## 🔍 Key Differences Explained

### Analytics vs Analysis

1. **`/analytics`** - General Platform Analytics
   - Dashboard metrics
   - User statistics
   - Study performance metrics
   - Platform usage analytics
   - Business intelligence

2. **`/analysis`** - Research Analysis Tools
   - Q-methodology analysis (`/analysis/q-methodology`)
   - Statistical analysis tools
   - Data processing utilities
   - Research-specific tools

## ⚠️ Current Issues

1. **Missing Route**: `/analysis` has no index page
   - Directory exists but no page.tsx
   - Should show analysis tools overview
   - Currently returns 404

2. **Port Confusion**:
   - ✅ CORRECT: http://localhost:3000
   - ❌ WRONG: http://localhost:3003

## 📂 File Structure

```
frontend/app/
├── (researcher)/          # Route group (doesn't appear in URL)
│   ├── analytics/
│   │   └── page.tsx      ✅ EXISTS
│   ├── analysis/
│   │   ├── page.tsx      ❌ MISSING (needs to be created)
│   │   └── q-methodology/
│   │       └── page.tsx  ✅ EXISTS
│   ├── dashboard/
│   │   └── page.tsx      ✅ EXISTS
│   └── studies/
│       ├── page.tsx      ✅ EXISTS
│       └── create/
│           └── page.tsx  ✅ EXISTS
├── (participant)/         # Route group (doesn't appear in URL)
│   ├── join/
│   │   └── page.tsx      ✅ EXISTS
│   └── study/
│       └── [token]/
│           └── page.tsx  ✅ EXISTS
└── auth/
    ├── login/
    │   └── page.tsx      ✅ EXISTS
    └── register/
        └── page.tsx      ✅ EXISTS
```

## 🎯 Recommended Actions

1. Create `/analysis/page.tsx` as an index/hub page for all analysis tools
2. Always use port 3000 for development
3. Update any references from port 3003 to 3000
4. Consider renaming `/analytics` to `/metrics` to avoid confusion with `/analysis`
