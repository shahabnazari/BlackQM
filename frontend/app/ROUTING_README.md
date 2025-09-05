# 🚨 NEXT.JS ROUTING - CRITICAL INFORMATION

## ⚠️ THE MOST IMPORTANT RULE

**Route groups with parentheses DO NOT appear in URLs!**

## 📍 Route Group Explanation

Folders with parentheses like `(researcher)` and `(participant)` are **route groups**:

- They organize code
- They DO NOT appear in the URL
- They're for developer organization only

## 🔗 URL Mapping Table

| File Location                                  | Actual URL                | ❌ Common Mistake                       |
| ---------------------------------------------- | ------------------------- | --------------------------------------- |
| `(researcher)/dashboard/page.tsx`              | `/dashboard`              | ❌ `/researcher/dashboard`              |
| `(researcher)/studies/page.tsx`                | `/studies`                | ❌ `/(researcher)/studies`              |
| `(researcher)/studies/[id]/page.tsx`           | `/studies/123`            | ❌ `/researcher/studies/123`            |
| `(researcher)/analysis/q-methodology/page.tsx` | `/analysis/q-methodology` | ❌ `/researcher/analysis/q-methodology` |
| `(participant)/join/page.tsx`                  | `/join`                   | ❌ `/participant/join`                  |
| `(participant)/study/[token]/page.tsx`         | `/study/abc123`           | ❌ `/participant/study/abc123`          |
| `auth/login/page.tsx`                          | `/auth/login`             | ✅ Correct (no route group)             |

## 📁 Current Structure

```
app/
├── (researcher)/          # Route group - NOT in URL
│   ├── dashboard/        # URL: /dashboard
│   ├── studies/          # URL: /studies
│   ├── analytics/        # URL: /analytics
│   ├── settings/         # URL: /settings
│   └── analysis/
│       └── q-methodology/ # URL: /analysis/q-methodology
│
├── (participant)/         # Route group - NOT in URL
│   ├── join/             # URL: /join
│   └── study/
│       └── [token]/      # URL: /study/[token]
│
└── auth/                 # Regular folder - DOES appear in URL
    ├── login/            # URL: /auth/login
    ├── register/         # URL: /auth/register
    └── reset-password/   # URL: /auth/reset-password
```

## 🎯 Quick Reference

### Researcher Pages

- Dashboard: `http://localhost:3000/dashboard`
- Studies: `http://localhost:3000/studies`
- Q-Analysis: `http://localhost:3000/analysis/q-methodology`
- Settings: `http://localhost:3000/settings`

### Participant Pages

- Join Study: `http://localhost:3000/join`
- Study Flow: `http://localhost:3000/study/[token]`

### Auth Pages

- Login: `http://localhost:3000/auth/login`
- Register: `http://localhost:3000/auth/register`

## ❓ Why Use Route Groups?

1. **Organization**: Groups related pages together
2. **Layouts**: Can have different layouts per group
3. **Middleware**: Can apply different middleware per group
4. **Clean URLs**: Keeps URLs simple without organizational prefixes

## 🔧 Creating New Pages

### In a route group:

```bash
# Creates page at URL: /new-feature
touch app/(researcher)/new-feature/page.tsx
```

### Outside route groups:

```bash
# Creates page at URL: /public/about
touch app/public/about/page.tsx
```

## 🚫 Common Mistakes to Avoid

1. **Don't expect parentheses in URLs**
   - ❌ `Link href="/(researcher)/dashboard"`
   - ✅ `Link href="/dashboard"`

2. **Don't create nested route groups**
   - ❌ `(researcher)/(admin)/settings`
   - ✅ `(researcher)/admin-settings`

3. **Don't mix route groups with regular folders**
   - Be consistent in your organization

## 💡 Testing Your Routes

```bash
# List all pages and their URLs
find app -name "page.tsx" | sed 's/app\///g' | sed 's/\/page.tsx//g' | sed 's/(researcher)\///g' | sed 's/(participant)\///g'
```

## 📚 Resources

- [Next.js Route Groups Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)

---

**Remember: When in doubt, test the URL in your browser!**
