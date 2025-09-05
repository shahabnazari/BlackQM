# 🚨 NEVER FORGET THESE RULES - PREVENT ALL CONFUSION

## 🔴 RULE #1: FRONTEND FOLDER IS MANDATORY

**ALL Next.js/React code goes in `/frontend/` - NEVER in root!**

```bash
❌ WRONG: /app/page.tsx
✅ RIGHT: /frontend/app/page.tsx

❌ WRONG: /components/Button.tsx
✅ RIGHT: /frontend/components/Button.tsx
```

## 🔴 RULE #2: ROUTE GROUPS DON'T APPEAR IN URLs

**Folders with parentheses like `(researcher)` are INVISIBLE in URLs!**

| Your File                                                    | The URL                   | NOT This                                  |
| ------------------------------------------------------------ | ------------------------- | ----------------------------------------- |
| `/frontend/app/(researcher)/dashboard/page.tsx`              | `/dashboard`              | ❌ `/researcher/dashboard`                |
| `/frontend/app/(researcher)/analysis/q-methodology/page.tsx` | `/analysis/q-methodology` | ❌ `/(researcher)/analysis/q-methodology` |

## 🔴 RULE #3: ALWAYS RUN FROM CORRECT FOLDER

```bash
# Frontend (Next.js)
cd frontend
npm run dev
# URL: http://localhost:3000

# Backend (NestJS)
cd backend
npm run start:dev
# URL: http://localhost:3001
```

## 🛠️ QUICK VALIDATION COMMAND

Run this anytime you're confused:

```bash
npm run validate
```

## 📍 QUICK REFERENCE URLS

- Dashboard: `http://localhost:3000/dashboard`
- Q-Analysis: `http://localhost:3000/analysis/q-methodology`
- Login: `http://localhost:3000/auth/login`

## 🚫 IF YOU MAKE A MISTAKE

```bash
# If you created files in wrong place:
npm run validate        # Shows what's wrong
npm run organize        # Fixes it automatically
```

## 💡 MENTAL MODEL

Think: **"FRONTEND FIRST"**

- Creating a page? → `/frontend/app/...`
- Creating a component? → `/frontend/components/...`
- Installing React package? → `cd frontend && npm install`
- Route group folder? → Invisible in URL!

---

**BOOKMARK THIS FILE - CHECK BEFORE CREATING ANY FILE!**
