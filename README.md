# 🎯 VQMethod - Advanced Q Methodology Research Platform

<div align="center">
  
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red)](https://nestjs.com/)
[![License](https://img.shields.io/badge/license-MIT-purple)](LICENSE)

**World-Class Q Methodology Platform with Apple Design Excellence**

[Documentation](./Lead) • [Quick Start](#-quick-start) • [Features](#-key-features) • [Architecture](#-architecture)

</div>

---

## 🌟 Overview

VQMethod is an enterprise-grade Q methodology research platform that combines sophisticated research capabilities with Apple's Human Interface Guidelines design principles. Built as a production-ready monorepo with Next.js and NestJS, it delivers a dual-interface architecture for both researchers and participants.

### 🏆 World-Class Implementation Status

- ✅ **Phase 1**: Foundation & Apple Design System (100% Complete)
- ✅ **Phase 2**: Authentication & Security (100% Complete)
- ✅ **Phase 3-8**: Q-Methodology Core & Analysis (100% Complete)
- 🟢 **Phase 9**: Comprehensive Literature Review System (80% Complete)
  - Days 0-11: Literature Pipeline & Integration ✅
  - Days 14-15: Knowledge Graph & Predictive Gap Detection ✅
  - Days 17-18: YouTube API & Multi-Modal Transcription ✅
  - Days 12-13, 16, 19: Deferred (Alternative sources, visualizations, social media)
  - **Day 20: Unified Theme Extraction (Planning Stage 📋)**
- ⏳ **Phase 10+**: Report Generation & Advanced Features (Planned)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **Git**: Latest version

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/vqmethod.git
cd vqmethod

# Install dependencies for monorepo
npm install

# Start development servers (CHOOSE ONE):

# 🚀 RECOMMENDED: Lightweight mode (LOW CPU/MEMORY)
npm run dev:lite       # No test watchers, optimized for performance

# ⚡ Performance mode (with 2GB memory limit)
npm run dev:performance

# 🔧 ENTERPRISE: Ultimate Dev Manager V4 (Phase 10.1 Day 11)
npm run dev            # Auto-restart, health monitoring, metrics API
                       # Monitoring: http://localhost:9090/status

# Other commands
npm run dev:v3         # Legacy V3 dev manager
npm run stop           # Stop all servers
npm run restart        # Stop and restart
npm run dev:clean      # Clean build and restart
```

**💡 Performance Tip:** Use `dev:lite` for daily development to reduce CPU/memory usage by ~75%. See [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) for details.

### Access Points

- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:4000
- 📚 **API Documentation**: http://localhost:4000/api/docs
- 📊 **Dev Manager Monitoring** (V4 only): http://localhost:9090/status
  - Status: http://localhost:9090/status
  - Metrics: http://localhost:9090/metrics
  - Health: http://localhost:9090/health

---

## 🎯 Key Features

### For Researchers

- 📊 **Advanced Study Builder**: 15+ question types with Qualtrics-level capabilities
- 🎨 **Q-Sort Grid Designer**: Customizable grid layouts with forced/free distribution
- 📈 **Real-time Analytics**: Live participant tracking and data visualization
- 👥 **Collaboration Tools**: Multi-researcher support with role-based permissions
- 📱 **Video Integration**: Google Meet/Zoom support throughout the journey

### For Participants

- 🎯 **8-Step Journey**: Complete Q-methodology flow from screening to completion
- 🖱️ **Intuitive Q-Sort**: Drag-and-drop interface with Apple-style interactions
- 📱 **Mobile Optimized**: Responsive design for all devices
- 🌍 **Multi-language**: International support with RTL languages
- ♿ **Accessible**: WCAG 2.1 AA compliance with VoiceOver support

### Security & Infrastructure

- 🔐 **Enterprise Security**: 2FA/TOTP, virus scanning, encryption at rest
- 🛡️ **Rate Limiting**: 10+ protection types against DDoS attacks
- 🏢 **Multi-tenant**: Row-Level Security with complete data isolation
- 📊 **Scalable**: Support for 10,000+ concurrent users
- 🔄 **Real-time**: WebSocket support for live collaboration

---

## 🏗️ Architecture

### Directory Structure

```
VQMethod Monorepo
├── 🎨 frontend/          # Next.js 15+ with App Router
│   ├── app/              # App Router pages
│   │   ├── (researcher)/ # ⚠️ MUST use parentheses - Researcher route group
│   │   ├── (participant)/ # ⚠️ MUST use parentheses - Participant route group
│   │   └── page.tsx      # Landing page
│   ├── components/       # Apple UI component library
│   ├── public/           # Static assets (REQUIRED)
│   │   ├── images/       # Image files
│   │   └── fonts/        # Font files
│   └── styles/           # Apple design tokens
│
├── ⚙️ backend/           # NestJS with Prisma
│   ├── src/modules/      # Feature modules
│   ├── prisma/           # Database schema & migrations
│   └── postman/          # API testing collections
│
├── 🚀 scripts/           # Automation & tooling
│   ├── port-manager.js   # Port conflict resolution
│   └── start-safe.js     # Safe startup script
│
└── 📚 Lead/              # Comprehensive documentation
    ├── Complete_Product_Specification.md
    └── Implementation_Guides/
```

### Technology Stack

| Layer        | Technology                        | Purpose                 |
| ------------ | --------------------------------- | ----------------------- |
| **Frontend** | Next.js 15, React 19              | Modern web application  |
| **Styling**  | Tailwind CSS, Apple Design System | Consistent UI/UX        |
| **Backend**  | NestJS, Prisma                    | Scalable API server     |
| **Database** | PostgreSQL/SQLite                 | Data persistence        |
| **Security** | JWT, 2FA, RLS                     | Enterprise protection   |
| **Testing**  | Vitest, Playwright                | 90%+ coverage           |
| **DevOps**   | Docker, Kubernetes                | Container orchestration |

### ⚠️ Important Directory Rules

To maintain a clean and organized codebase, we enforce strict directory standards:

1. **Route Groups MUST Use Parentheses**:
   - ✅ Correct: `frontend/app/(researcher)/` and `frontend/app/(participant)/`
   - ❌ Wrong: `frontend/app/researcher/` and `frontend/app/participant/`

2. **Public Directory is REQUIRED**:
   - All static assets must be in `frontend/public/`
   - Images go in `frontend/public/images/`
   - Fonts go in `frontend/public/fonts/`

3. **No Config Files in Root**:
   - All framework configs must be in their workspace directories
   - ✅ `frontend/next.config.js`, `backend/nest-cli.json`
   - ❌ `/next.config.js`, `/nest-cli.json`

4. **Validate Structure Before Committing**:
   ```bash
   npm run validate:structure
   ```

See [REPOSITORY_STANDARDS.md](./Lead/REPOSITORY_STANDARDS.md) for complete guidelines.

---

## 📖 Documentation

Comprehensive documentation is available in the [`/Lead`](./Lead) directory:

- 📋 [Complete Product Specification](./Lead/Complete_Product_Specification.md)
- 🛠️ [Development Implementation Guide Part 1](./Lead/Development_Implementation_Guide_Part1.md)
- 🔧 [Development Implementation Guide Part 2](./Lead/Development_Implementation_Guide_Part2.md)
- ✅ [Implementation Phases](./Lead/IMPLEMENTATION_PHASES.md)
- 📊 [Quality Scoring Methodology](./QUALITY_SCORING_METHODOLOGY.md) - Transparent paper quality assessment

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm run test

# Frontend tests with coverage
cd frontend
npm run test -- --coverage
npm run test:watch  # Watch mode

# Backend tests
cd backend
npm run test
npm run test:watch  # Watch mode
npm run test:cov    # Coverage report

# Test specific file
npm run test -- literature.service.spec.ts
```

### E2E Tests

```bash
# Run E2E tests with Playwright
cd frontend
npm run e2e

# Run E2E tests in headed mode (see browser)
npm run e2e:headed

# Run specific E2E test
npm run e2e -- tests/literature-search.spec.ts

# Generate E2E test report
npm run e2e:report
```

### Type Checking

```bash
# Check all types
npm run typecheck

# Backend type check
cd backend && npm run typecheck

# Frontend type check
cd frontend && npm run typecheck

# Watch mode
npm run typecheck:watch
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Run Prettier
npm run format

# Check formatting
npm run format:check
```

---

## 🚢 Deployment

### Development Environment

```bash
# Using Docker Compose
docker-compose -f docker-compose.dev.yml up

# Using PM2
pm2 start ecosystem.config.js

# Manual start (no Docker)
npm run dev  # Starts both frontend and backend
```

### Production Environment

```bash
# 1. Build for production
npm run build

# 2. Run database migrations
cd backend
npm run migrate:deploy

# 3. Start production servers
npm run start

# 4. Verify deployment
curl http://localhost:4000/health  # Backend health check
curl http://localhost:3000          # Frontend
```

### Docker Production Deployment

```bash
# Build Docker images
docker-compose -f docker-compose.prod.yml build

# Start containers
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop containers
docker-compose -f docker-compose.prod.yml down
```

### Environment Variables

Before deploying, ensure all required environment variables are set. See `.env.example` for the complete list:

```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env
```

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token generation
- `OPENAI_API_KEY` - OpenAI API key for theme extraction
- `PUBMED_API_KEY` - PubMed API key (optional but recommended)

See [Implementation Guide Part 5](./Main%20Docs/IMPLEMENTATION_GUIDE_PART5.md#phase-101-day-10-production-readiness--enterprise-deployment) for complete deployment checklist.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for detailed guidelines.

### Quick Start for Contributors

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/vqmethod.git
   cd vqmethod
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make Changes and Test**
   ```bash
   npm run test
   npm run typecheck
   npm run lint
   ```

5. **Commit and Push**
   ```bash
   git commit -m "feat: add amazing feature"
   git push origin feature/amazing-feature
   ```

6. **Open Pull Request**
   - Go to GitHub and create a pull request
   - Fill out the PR template
   - Wait for review and CI checks

### Development Guidelines

- **Code Style**: Follow TypeScript and React best practices
- **Testing**: Write tests for all new features (aim for >80% coverage)
- **Documentation**: Update docs for any API or feature changes
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/) format
- **Type Safety**: No `any` types allowed (use `unknown` + type guards)

See [CONTRIBUTING.md](CONTRIBUTING.md) for complete guidelines.

---

## 🔐 Security

- All data encrypted at rest (AES-256-GCM)
- Multi-factor authentication (2FA/TOTP)
- Row-Level Security for data isolation
- Comprehensive rate limiting
- Regular security audits

For security concerns, please email security@vqmethod.com

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Apple Human Interface Guidelines for design inspiration
- Q methodology community for research methodology
- Open source contributors for amazing tools

---

## 📞 Support

- 📧 Email: support@vqmethod.com
- 💬 Discord: [Join our community](https://discord.gg/vqmethod)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/vqmethod/issues)

---

<div align="center">

**Built with ❤️ by the VQMethod Team**

[Website](https://vqmethod.com) • [Documentation](./Lead) • [API Docs](http://localhost:4000/api/docs)

</div>
