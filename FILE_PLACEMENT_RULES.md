# 🚨 CRITICAL FILE PLACEMENT RULES - PREVENTING NEXT.JS CONFUSION

## ⚠️ CRITICAL WARNING

**THE #1 CAUSE OF BROKEN FEATURES: Creating files in `/app/` instead of `/frontend/app/`**

## 🎯 THE GOLDEN RULE

**ALL Next.js/React files MUST go in `/frontend/` - NEVER in root!**

## Overview

This document defines strict file placement rules to prevent the common Next.js routing confusion that has occurred multiple times. These rules are automatically enforced by pre-commit hooks and CI/CD pipelines.

## Automated Enforcement

### Pre-Commit Hook

- Validates file structure before every commit
- Blocks commits with misplaced files
- Suggests corrections for violations

### CI/CD Pipeline

- Validates structure on every PR
- Runs auto-organization check
- Fails build if structure is invalid

### Auto-Organization

Run `npm run organize` to automatically move misplaced files to their correct locations.

## File Placement Rules

### Root Directory (`/`)

#### ✅ ALLOWED Files

- `package.json` - Workspace configuration
- `package-lock.json` - Dependency lock file
- `.gitignore` - Git ignore rules
- `.nvmrc` - Node version specification
- `.prettierrc` - Code formatting config
- `.eslintrc.json` - Linting configuration
- `README.md` - Project documentation
- `LICENSE` - License file
- `CONTRIBUTING.md` - Contribution guidelines
- `docker-compose.yml` - Docker configuration
- `docker-compose.*.yml` - Environment-specific Docker configs
- `port-config.json` - Port configuration
- `.env.ports` - Port environment variables
- `.env.example` - Example environment variables
- `ecosystem.config.js` - PM2 configuration
- `CLAUDE.md` - Claude AI context file
- `FILE_PLACEMENT_RULES.md` - This file

#### ✅ ALLOWED Directories

- `.git/` - Git repository data
- `.github/` - GitHub configuration and workflows
- `.husky/` - Git hooks
- `.vscode/` - VS Code configuration
- `node_modules/` - Dependencies (workspace root)
- `frontend/` - Frontend workspace
- `backend/` - Backend workspace
- `scripts/` - Build and utility scripts
- `infrastructure/` - Infrastructure configuration
- `Lead/` - Project management and documentation
- `logs/` - Application logs

#### ❌ FORBIDDEN Files

- `tsconfig.json` → Move to `frontend/` or `backend/`
- `tailwind.config.*` → Move to `frontend/`
- `next.config.*` → Move to `frontend/`
- `postcss.config.*` → Move to `frontend/`
- `vitest.config.*` → Move to `frontend/`
- `playwright.config.*` → Move to `frontend/`
- `nest-cli.json` → Move to `backend/`
- `ormconfig.*` → Move to `backend/`
- `jest.config.*` → Move to `backend/`
- `webpack.config.*` → Move to appropriate workspace
- `*.sh` → Move to `scripts/`

#### ❌ FORBIDDEN Directories

- `.next/` → Move to `frontend/`
- `dist/` → Move to `backend/`
- `prisma/` → Move to `backend/`
- `src/` → Move to appropriate workspace
- `app/` → Move to `frontend/`
- `components/` → Move to `frontend/`
- `pages/` → Move to `frontend/`
- `public/` → Move to `frontend/`
- `styles/` → Move to `frontend/`
- `modules/` → Move to `backend/src/`
- `entities/` → Move to `backend/src/`

### Frontend Directory (`/frontend`)

## 🔴 CRITICAL NEXT.JS ROUTING RULES

### Understanding Route Groups (CAUSES MOST CONFUSION)

**Route groups with parentheses like `(researcher)` DO NOT appear in URLs!**

| File Location                                               | Actual URL                | Common Mistake                          |
| ----------------------------------------------------------- | ------------------------- | --------------------------------------- |
| `frontend/app/(researcher)/dashboard/page.tsx`              | `/dashboard`              | ❌ `/researcher/dashboard`              |
| `frontend/app/(researcher)/studies/page.tsx`                | `/studies`                | ❌ `/(researcher)/studies`              |
| `frontend/app/(researcher)/analysis/q-methodology/page.tsx` | `/analysis/q-methodology` | ❌ `/researcher/analysis/q-methodology` |
| `frontend/app/(participant)/join/page.tsx`                  | `/join`                   | ❌ `/participant/join`                  |
| `frontend/app/auth/login/page.tsx`                          | `/auth/login`             | ✅ Correct (no route group)             |

### Why Route Groups?

Route groups organize code WITHOUT affecting URLs:

- `(researcher)` - Groups researcher pages
- `(participant)` - Groups participant pages
- Parentheses mean "invisible in URL"

#### Required Files

- `package.json` (must have `"name": "@vqmethod/frontend"`)
- `next.config.js` or `next.config.mjs`
- `tsconfig.json`
- `tailwind.config.js` or `tailwind.config.ts`
- `postcss.config.js` or `postcss.config.mjs`

#### Expected Structure

```
frontend/
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── .env.local (optional)
├── public/
├── src/ or app/
├── components/
├── styles/
├── tests/
└── .next/ (build output)
```

### Backend Directory (`/backend`)

#### Required Files

- `package.json` (must have `"name": "@vqmethod/backend"`)
- `nest-cli.json`
- `tsconfig.json`
- `tsconfig.build.json`

#### Expected Structure

```
backend/
├── package.json
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── .env (optional)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   └── modules/
├── test/
└── dist/ (build output)
```

### Scripts Directory (`/scripts`)

All shell scripts and build utilities should be placed here:

- `*.sh` - Shell scripts
- `*.js` - Node.js utility scripts
- `validate-structure.js` - Structure validation
- `auto-organize.js` - Auto-organization script
- Test scripts
- Build scripts
- Deployment scripts

### Special File Types

#### Configuration Files

- **TypeScript configs** (`tsconfig.json`): Must be in workspace directories
- **Build configs** (webpack, vite, etc.): Must be in workspace directories
- **Test configs** (jest, vitest, playwright): Must be in workspace directories
- **Style configs** (tailwind, postcss): Must be in `frontend/`
- **Framework configs** (next, nest): Must be in respective workspace

#### Environment Files

- `.env` → Workspace-specific
- `.env.local` → `frontend/`
- `.env.backend` → `backend/`
- `.env.ports` → Root (shared)
- `.env.example` → Root (template)

#### Documentation

- Main docs (`README.md`, `LICENSE`, etc.) → Root
- Workspace-specific docs → Respective workspace
- Architecture docs → `Lead/`
- API docs → `backend/docs/` or generated

## Validation Commands

### Check Structure

```bash
# Validate current structure
npm run validate:structure

# Check for misplaced files (dry run)
npm run organize:check
```

### Fix Structure

```bash
# Automatically organize files
npm run organize

# Manual check and fix
npm run organize:interactive
```

### Pre-Commit

The pre-commit hook automatically:

1. Validates repository structure
2. Blocks commits with violations
3. Suggests fixes for issues

### CI/CD

GitHub Actions automatically:

1. Validates structure on every PR
2. Runs organization check
3. Fails build if structure is invalid

## 🚫 COMMON MISTAKES TO AVOID

### Mistake #1: Creating files in wrong `/app/` directory

```bash
❌ WRONG: touch app/(researcher)/feature/page.tsx
✅ RIGHT: touch frontend/app/(researcher)/feature/page.tsx
```

### Mistake #2: Expecting route groups in URLs

```bash
❌ WRONG: http://localhost:3000/(researcher)/dashboard
✅ RIGHT: http://localhost:3000/dashboard
```

### Mistake #3: Installing packages in wrong location

```bash
❌ WRONG: npm install react-three (in root)
✅ RIGHT: npm install --prefix frontend react-three
```

### Mistake #4: Running dev server from wrong directory

```bash
❌ WRONG: npm run dev (in root)
✅ RIGHT: cd frontend && npm run dev
```

## Common Issues and Solutions

### Issue: "File found in root directory"

**Solution**: Run `npm run organize` to automatically move files

### Issue: "Required file missing"

**Solution**: Ensure all workspace required files exist

### Issue: "Incorrect package.json namespace"

**Solution**: Update package.json name to `@vqmethod/frontend` or `@vqmethod/backend`

### Issue: "Build output in wrong location"

**Solution**: Check build configurations point to correct output directories

## Exceptions

If you need to add an exception:

1. Update `scripts/validate-structure.js` with the new rule
2. Update `scripts/auto-organize.js` if needed
3. Update this documentation
4. Create a PR with justification

## 🛡️ PREVENTION CHECKLIST

Before creating ANY Next.js file:

- [ ] Run `pwd` - Are you in `/blackQmethhod` root?
- [ ] Your path starts with `frontend/app/` not just `app/`?
- [ ] You understand route groups don't appear in URLs?
- [ ] Dependencies installed in `frontend/` not root?

## 🔍 QUICK VERIFICATION COMMANDS

```bash
# Check if you're creating files in the right place
ls frontend/app/  # Should show (researcher), (participant), etc.
ls app/          # Should error or be empty!

# Verify your page will work
find frontend/app -name "page.tsx" | head -5  # Shows all pages

# Check running servers
lsof -i :3000    # Should show Next.js from frontend/
```

## Enforcement

This structure is enforced at multiple levels:

1. **Local Development**: Pre-commit hooks
2. **Pull Requests**: GitHub Actions CI
3. **Manual**: `npm run organize` command
4. **Documentation**: This file

All changes to structure rules must be approved by the team lead.
