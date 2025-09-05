# 🏗️ VQMethod Directory Structure

## World-Class Monorepo Organization

**Last Updated:** September 2, 2025  
**Architecture:** Next.js + NestJS Monorepo with Apple Design System  
**Status:** ✅ Production-Ready Structure

---

## 📁 Repository Overview

```
vqmethod/                         # Root monorepo directory
├── 📦 package.json               # Workspace configuration
├── 📦 package-lock.json          # Dependency lock file
├── 🔧 .gitignore                 # Git ignore rules
├── 📝 README.md                  # Project documentation
├── 🔒 .nvmrc                     # Node version (v20+)
├── 🎣 .husky/                    # Git hooks
│   └── pre-commit                # Pre-commit quality checks
│
├── 🎨 frontend/                  # Next.js 15+ Application
│   ├── 📦 package.json           # Frontend dependencies
│   ├── ⚙️ next.config.js         # Next.js configuration
│   ├── 🎨 tailwind.config.js    # Tailwind CSS with Apple tokens
│   ├── 📝 tsconfig.json          # TypeScript configuration
│   ├── 🧪 vitest.config.ts      # Testing configuration
│   ├── 🎭 playwright.config.ts  # E2E testing setup
│   ├── 🔄 postcss.config.js     # PostCSS configuration
│   │
│   ├── 📱 app/                   # Next.js App Router
│   │   ├── 👨‍🔬 (researcher)/       # Researcher interface routes
│   │   │   ├── dashboard/        # Research dashboard
│   │   │   ├── studies/          # Study management
│   │   │   │   ├── create/       # Study creation wizard
│   │   │   │   └── [id]/         # Individual study pages
│   │   │   ├── analytics/        # Research analytics
│   │   │   └── settings/         # Account settings
│   │   │
│   │   ├── 👥 (participant)/     # Participant interface routes
│   │   │   ├── join/             # Study invitation
│   │   │   └── study/            # 8-step participant journey
│   │   │       ├── [token]/      # Study session
│   │   │       ├── welcome/      # Step 2: Welcome
│   │   │       ├── consent/      # Step 3: Consent
│   │   │       ├── familiarization/ # Step 4: Review
│   │   │       ├── pre-sort/     # Step 5: Pre-sorting
│   │   │       ├── q-sort/       # Step 6: Main Q-sort
│   │   │       ├── commentary/   # Step 7: Commentary
│   │   │       ├── post-survey/  # Step 8a: Survey
│   │   │       └── thank-you/    # Step 8b: Completion
│   │   │
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Landing page
│   │   ├── error.tsx             # Error boundary
│   │   └── not-found.tsx         # 404 page
│   │
│   ├── 🧩 components/            # Component library
│   │   ├── 🍎 apple-ui/          # Apple HIG components
│   │   │   ├── Button/           # iOS-style buttons
│   │   │   ├── TextField/        # iOS text inputs
│   │   │   ├── Card/             # Apple cards
│   │   │   ├── Badge/            # Status badges
│   │   │   ├── ProgressBar/      # Progress indicators
│   │   │   ├── ThemeToggle/      # Dark mode toggle
│   │   │   └── index.ts          # Barrel export
│   │   │
│   │   ├── 🔬 researcher/        # Researcher components
│   │   │   ├── Dashboard/        # Dashboard widgets
│   │   │   ├── StudyBuilder/     # Study creation
│   │   │   │   ├── QuestionBuilder/
│   │   │   │   ├── GridDesigner/
│   │   │   │   └── StimuliManager/
│   │   │   └── Analytics/        # Analytics charts
│   │   │
│   │   ├── 👤 participant/       # Participant components
│   │   │   ├── StepFlow/         # Journey controller
│   │   │   ├── QSortGrid/        # Q-sort interface
│   │   │   ├── PreSorting/       # Three-box sorting
│   │   │   └── ProgressTracker/  # Progress display
│   │   │
│   │   └── 🔗 shared/            # Shared components
│   │       ├── VideoConferencing/
│   │       ├── RichTextEditor/
│   │       └── MediaPlayer/
│   │
│   ├── 🎨 styles/                # Styling system
│   │   ├── tokens.css            # Apple design tokens
│   │   ├── apple-design.css      # Apple HIG styles
│   │   └── globals.css           # Global styles
│   │
│   ├── 📚 lib/                   # Utilities & hooks
│   │   ├── api/                  # API client
│   │   ├── hooks/                # Custom React hooks
│   │   ├── stores/               # Zustand stores
│   │   └── utils/                # Helper functions
│   │
│   ├── 🧪 test/                  # Test configuration
│   │   └── setup.ts              # Test environment setup
│   │
│   └── 🎭 e2e/                   # E2E test specs
│       └── smoke.spec.ts         # Smoke tests
│
├── ⚙️ backend/                   # NestJS Application
│   ├── 📦 package.json           # Backend dependencies
│   ├── 📝 tsconfig.json          # TypeScript config
│   ├── 🔧 nest-cli.json          # NestJS CLI config
│   ├── 🌍 .env                   # Environment variables
│   │
│   ├── 💻 src/                   # Source code
│   │   ├── 📡 main.ts            # Application entry
│   │   ├── 📦 app.module.ts      # Root module
│   │   │
│   │   ├── 🔌 modules/           # Feature modules
│   │   │   ├── 🔐 auth/          # Authentication & 2FA
│   │   │   │   ├── controllers/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   └── two-factor.controller.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── two-factor.service.ts
│   │   │   │   │   └── audit.service.ts
│   │   │   │   └── strategies/
│   │   │   │       └── jwt.strategy.ts
│   │   │   │
│   │   │   ├── 📂 file-upload/   # File management
│   │   │   │   ├── controllers/
│   │   │   │   └── services/
│   │   │   │       ├── file-upload.service.ts
│   │   │   │       └── virus-scan.service.ts
│   │   │   │
│   │   │   └── 🚦 rate-limiting/ # DDoS protection
│   │   │       ├── guards/
│   │   │       └── services/
│   │   │
│   │   ├── 🔧 common/            # Shared services
│   │   │   ├── prisma.service.ts
│   │   │   ├── prisma-rls.service.ts
│   │   │   └── encryption.service.ts
│   │   │
│   │   └── 📝 types/             # TypeScript types
│   │       └── global.d.ts
│   │
│   ├── 🗄️ prisma/                # Database
│   │   ├── schema.prisma         # Database schema
│   │   ├── migrations/           # Migration history
│   │   └── dev.db                # SQLite dev database
│   │
│   └── 📮 postman/               # API testing
│       └── VQMethod.postman_collection.json
│
├── 🚀 scripts/                   # Automation scripts
│   ├── port-manager.js           # Port conflict resolution
│   ├── start-safe.js             # Safe startup script
│   └── apple-design-validate.js  # Design validation
│
├── 🐳 infrastructure/            # DevOps & deployment
│   ├── docker-compose.yml        # Production setup
│   └── kubernetes/               # K8s configurations
│
└── 📚 Lead/                      # Documentation
    ├── Complete_Product_Specification.md
    ├── Development_Implementation_Guide_Part1.md
    ├── Development_Implementation_Guide_Part2.md
    └── IMPLEMENTATION_PHASES.md
```

---

## 🏆 Key Features of This Structure

### 1️⃣ **Clean Monorepo Architecture**

- Workspace-based organization with `@vqmethod/frontend` and `@vqmethod/backend`
- Clear separation of concerns between frontend and backend
- Shared scripts and infrastructure at root level

### 2️⃣ **Apple Design System Integration**

- Dedicated `apple-ui/` component library
- Design tokens in CSS variables
- Consistent theming across the application

### 3️⃣ **Dual Interface Architecture**

- Route groups for `(researcher)` and `(participant)` interfaces
- Complete 8-step participant journey structure
- Clear separation of user experiences

### 4️⃣ **Enterprise Security**

- Authentication module with 2FA/TOTP
- Virus scanning service for file uploads
- Row-Level Security (RLS) implementation
- Encryption services for sensitive data

### 5️⃣ **Developer Experience**

- Port management system to prevent conflicts
- Safe startup scripts
- Comprehensive testing setup
- Git hooks for quality assurance

---

## 📋 Directory Purposes

| Directory         | Purpose             | Key Files                          |
| ----------------- | ------------------- | ---------------------------------- |
| `/frontend`       | Next.js application | `package.json`, `next.config.js`   |
| `/backend`        | NestJS API server   | `package.json`, `main.ts`          |
| `/scripts`        | Automation tools    | `port-manager.js`, `start-safe.js` |
| `/infrastructure` | Deployment configs  | Docker, Kubernetes files           |
| `/Lead`           | Documentation       | Specifications and guides          |

---

## 🚀 Quick Commands

```bash
# Development
npm run dev:safe        # Start with port conflict resolution
npm run dev            # Start both frontend and backend
npm run dev:frontend   # Start only frontend
npm run dev:backend    # Start only backend

# Building
npm run build          # Build both applications
npm run build:frontend # Build frontend only
npm run build:backend  # Build backend only

# Testing
npm run test           # Run all tests
npm run test:frontend  # Test frontend
npm run test:backend   # Test backend

# Port Management
npm run ports:check    # Check port availability
npm run ports:allocate # Allocate ports for project
npm run ports:clean    # Clean port registry
```

---

## 🔒 Security & Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Dependencies**: Regular updates with `npm audit`
3. **Code Quality**: Pre-commit hooks via Husky
4. **Type Safety**: Strict TypeScript configuration
5. **Testing**: 90%+ coverage requirement
6. **Documentation**: Comprehensive guides in `/Lead`

---

## 🎯 Next Steps

1. Install dependencies: `npm install`
2. Start development: `npm run dev:safe`
3. Access frontend: `http://localhost:3000`
4. Access backend API: `http://localhost:4000`
5. View API docs: `http://localhost:4000/api/docs`

---

**Note:** This structure follows enterprise-grade monorepo best practices with clear separation of concerns, comprehensive security, and excellent developer experience.
