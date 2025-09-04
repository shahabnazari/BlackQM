# 📐 VQMethod Repository Standards & Guidelines
## Mandatory Rules for World-Class Code Organization

**Version:** 1.0  
**Last Updated:** September 2, 2025  
**Status:** 🔴 **MANDATORY - MUST BE FOLLOWED**

---

## ⚠️ COMMON MISTAKES TO AVOID

### 1. Route Groups MUST Use Parentheses
```
❌ WRONG:
/frontend/app/researcher/     # Missing parentheses
/frontend/app/participant/    # Missing parentheses

✅ CORRECT:
/frontend/app/(researcher)/   # Parentheses required for route groups
/frontend/app/(participant)/  # Parentheses required for route groups
```
**Why:** Next.js App Router requires parentheses for route groups that don't affect the URL structure.

### 2. Public Directory is REQUIRED
```
❌ WRONG:
/frontend/images/logo.png     # Images in wrong location
/frontend/fonts/custom.woff   # Fonts in wrong location

✅ CORRECT:
/frontend/public/images/logo.png    # Static assets in public
/frontend/public/fonts/custom.woff  # Fonts in public
```
**Why:** Next.js serves static assets from the public directory.

---

## 🚨 CRITICAL RULES - VIOLATIONS WILL BLOCK COMMITS

### Rule #1: NO Frontend Files in Root Directory
```
❌ FORBIDDEN:
/tsconfig.json         # Frontend TypeScript config
/tailwind.config.js    # Frontend Tailwind config
/vitest.config.ts     # Frontend test config
/next.config.js       # Frontend Next.js config
/.next/               # Frontend build output

✅ CORRECT:
/frontend/tsconfig.json
/frontend/tailwind.config.js
/frontend/vitest.config.ts
/frontend/next.config.js
/frontend/.next/
```

### Rule #2: NO Backend Files in Root Directory
```
❌ FORBIDDEN:
/nest-cli.json        # Backend NestJS config
/ormconfig.js         # Backend ORM config
/prisma/              # Backend database schema

✅ CORRECT:
/backend/nest-cli.json
/backend/ormconfig.js
/backend/prisma/
```

### Rule #3: Root Directory ONLY Contains
```
✅ ALLOWED IN ROOT:
/frontend/            # Frontend workspace
/backend/             # Backend workspace
/scripts/             # Shared automation scripts
/infrastructure/      # Docker, K8s configs
/Lead/               # Documentation
/.github/            # GitHub workflows
/.husky/             # Git hooks
/package.json        # Workspace configuration ONLY
/package-lock.json   # Lock file
/.gitignore          # Git ignore rules
/.nvmrc              # Node version
/.prettierrc         # Code formatting (shared)
/.eslintrc.json      # Linting rules (shared)
/README.md           # Project readme
/LICENSE             # License file
/CONTRIBUTING.md     # Contribution guide
/*.md                # Root-level documentation ONLY

❌ FORBIDDEN IN ROOT:
- Any application source code
- Any framework-specific configs
- Any build outputs
- Any test files
- Any component files
```

---

## 📁 Strict Directory Structure Rules

### Frontend Structure
```typescript
frontend/
├── package.json           // MUST have name: "@vqmethod/frontend"
├── next.config.js         // Next.js config ONLY here
├── tailwind.config.js     // Tailwind config ONLY here
├── postcss.config.js      // PostCSS config ONLY here
├── tsconfig.json          // Frontend TypeScript config
├── vitest.config.ts       // Frontend test config
├── playwright.config.ts   // E2E test config
├── .env.local            // Frontend environment variables
├── .next/                // Build output (git-ignored)
├── node_modules/         // Dependencies (git-ignored)
├── coverage/             // Test coverage (git-ignored)
│
├── app/                  // Next.js App Router ONLY
│   ├── (researcher)/     // ⚠️ MUST USE PARENTHESES - Route group for researcher pages
│   ├── (participant)/    // ⚠️ MUST USE PARENTHESES - Route group for participant pages
│   ├── globals.css       // Global styles
│   ├── layout.tsx        // Root layout
│   └── page.tsx          // Landing page
│
├── components/           // React components ONLY
│   ├── apple-ui/        // Design system components
│   ├── researcher/      // Researcher-specific components
│   ├── participant/     // Participant-specific components
│   └── shared/          // Shared components
│
├── lib/                 // Utilities and hooks ONLY
│   ├── api/            // API client code
│   ├── hooks/          // Custom React hooks
│   ├── stores/         // State management
│   └── utils/          // Helper functions
│
├── styles/             // CSS and design tokens ONLY
│   ├── tokens.css      // Design tokens
│   └── *.css           // Other stylesheets
│
├── public/             // Static assets ONLY
│   ├── images/         // Images
│   └── fonts/          // Custom fonts
│
├── test/               // Test setup files ONLY
│   └── setup.ts        // Test environment setup
│
└── e2e/                // E2E test specs ONLY
    └── *.spec.ts       // Playwright tests
```

### Backend Structure
```typescript
backend/
├── package.json          // MUST have name: "@vqmethod/backend"
├── nest-cli.json         // NestJS CLI config ONLY here
├── tsconfig.json         // Backend TypeScript config
├── tsconfig.build.json   // Build-specific TS config
├── .env                  // Backend environment variables
├── node_modules/         // Dependencies (git-ignored)
├── dist/                 // Build output (git-ignored)
├── coverage/             // Test coverage (git-ignored)
│
├── src/                  // Source code ONLY
│   ├── main.ts          // Application entry point
│   ├── app.module.ts    // Root module
│   ├── app.controller.ts // Root controller
│   ├── app.service.ts   // Root service
│   │
│   ├── modules/         // Feature modules ONLY
│   │   ├── auth/        // Authentication module
│   │   ├── file-upload/ // File upload module
│   │   └── rate-limiting/ // Rate limiting module
│   │
│   ├── common/          // Shared services ONLY
│   │   ├── prisma.service.ts
│   │   └── *.service.ts
│   │
│   └── types/           // TypeScript types ONLY
│       └── *.d.ts       // Type definitions
│
├── prisma/              // Database schema ONLY
│   ├── schema.prisma    // Prisma schema
│   ├── migrations/      // Migration files
│   └── seed.ts          // Seed data
│
├── test/                // Test files ONLY
│   └── *.spec.ts        // Unit/integration tests
│
└── postman/             // API testing ONLY
    └── *.json           // Postman collections
```

---

## 🛡️ Enforcement Mechanisms

### 1. Pre-Commit Hook (Automatic)
```bash
#!/bin/bash
# .husky/pre-commit

# Check for forbidden files in root
FORBIDDEN_FILES=$(find . -maxdepth 1 -name "*.config.js" -o -name "*.config.ts" -o -name "tsconfig.json" | grep -v "./scripts")

if [ ! -z "$FORBIDDEN_FILES" ]; then
  echo "❌ ERROR: Configuration files found in root directory!"
  echo "$FORBIDDEN_FILES"
  echo "Move these files to their respective workspace directories."
  exit 1
fi

# Run structure validation
npm run validate:structure
```

### 2. Structure Validation Script
```javascript
// scripts/validate-structure.js
const RULES = {
  rootForbidden: [
    'tsconfig.json',
    'tailwind.config.js',
    'next.config.js',
    'vitest.config.ts',
    'nest-cli.json',
    '.next/'
  ],
  frontendRequired: [
    'frontend/package.json',
    'frontend/next.config.js',
    'frontend/tsconfig.json'
  ],
  backendRequired: [
    'backend/package.json',
    'backend/nest-cli.json',
    'backend/tsconfig.json'
  ]
};

// Validation logic here...
```

### 3. CI/CD Pipeline Check
```yaml
# .github/workflows/structure-check.yml
name: Repository Structure Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm run validate:structure
      - run: npm run validate:naming
```

---

## 📝 Naming Conventions

### Files
```
✅ CORRECT:
- Components: PascalCase.tsx (Button.tsx, QSortGrid.tsx)
- Utilities: camelCase.ts (formatDate.ts, calculateScore.ts)
- Styles: kebab-case.css (apple-design.css, tokens.css)
- Tests: *.test.ts or *.spec.ts
- Constants: UPPER_SNAKE_CASE.ts (API_ENDPOINTS.ts)

❌ WRONG:
- button.tsx (should be Button.tsx)
- FormatDate.ts (should be formatDate.ts)
- Apple_Design.css (should be apple-design.css)
```

### Directories
```
✅ CORRECT:
- Feature modules: kebab-case (auth/, file-upload/, rate-limiting/)
- Component folders: PascalCase (Button/, TextField/, QSortGrid/)
- Route groups: (parentheses) ((researcher)/, (participant)/)

❌ WRONG:
- fileUpload/ (should be file-upload/)
- button/ (should be Button/)
- researcher/ (should be (researcher)/ for route groups)
```

---

## 🚀 Import Rules

### Path Aliases
```typescript
// tsconfig.json paths configuration
{
  "paths": {
    "@/*": ["./src/*"],           // Backend
    "@/components/*": ["./components/*"], // Frontend
    "@/lib/*": ["./lib/*"],       // Frontend
    "@/styles/*": ["./styles/*"]  // Frontend
  }
}

✅ CORRECT:
import { Button } from '@/components/apple-ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';

❌ WRONG:
import { Button } from '../../../components/apple-ui/Button';
import { Button } from 'components/apple-ui/Button';
```

### Import Order
```typescript
// 1. Node modules
import React from 'react';
import { useState } from 'react';

// 2. Next/Nest modules
import { GetServerSideProps } from 'next';
import { Controller } from '@nestjs/common';

// 3. Internal aliases
import { Button } from '@/components/apple-ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';

// 4. Relative imports
import { localHelper } from './helper';

// 5. Style imports
import styles from './Component.module.css';
```

---

## 🔒 Security Rules

### Environment Variables
```bash
# NEVER commit these files:
.env              # Local environment variables
.env.local        # Frontend local env
.env.production   # Production secrets

# ONLY commit these:
.env.example      # Example with dummy values
.env.defaults     # Non-sensitive defaults
```

### Sensitive Data
```typescript
❌ FORBIDDEN:
- API keys in code
- Passwords in code
- Database URLs in code
- Private keys in repository

✅ CORRECT:
- Use environment variables
- Use secret management services
- Use .env.example for documentation
```

---

## 📊 Quality Standards

### Code Coverage
```
Minimum Requirements:
- Frontend: 90% line coverage
- Backend: 90% line coverage
- E2E: All critical paths covered
```

### Bundle Size
```
Maximum Limits:
- Initial JS: < 200KB
- Initial CSS: < 50KB
- Largest chunk: < 500KB
```

### Performance
```
Requirements:
- Lighthouse Score: > 90
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
```

---

## ⚠️ Consequences of Violations

1. **Immediate:** Pre-commit hook blocks commit
2. **CI/CD:** Pull request fails automated checks
3. **Review:** PR rejected by maintainers
4. **Repeated:** Contributor privileges reviewed

---

## 📚 Additional Resources

- [Complete Product Specification](./Complete_Product_Specification.md)
- [Development Implementation Guide Part 1](./Development_Implementation_Guide_Part1.md)
- [Development Implementation Guide Part 2](./Development_Implementation_Guide_Part2.md)
- [Implementation Phases](./IMPLEMENTATION_PHASES.md)

---

## ✅ Checklist Before Committing

- [ ] No frontend configs in root directory
- [ ] No backend configs in root directory
- [ ] All files in correct workspace directories
- [ ] Package.json files have correct namespace (@vqmethod/*)
- [ ] No duplicate configuration files
- [ ] Import statements use path aliases
- [ ] No sensitive data in code
- [ ] Tests pass with required coverage
- [ ] Structure validation script passes

---

**Remember:** A clean repository is a productive repository. These standards ensure our codebase remains world-class and maintainable for years to come.

**Enforcement Status:** 🟢 **ACTIVE** - All rules are enforced via automated checks