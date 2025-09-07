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
- 🔄 **Phase 3**: Q-Methodology Core (Ready for Implementation)
- ⏳ **Phase 4-7**: Advanced Features (Planned)

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

# Start development with automatic port management
npm run dev:safe

# Or start specific services
npm run dev:frontend   # Frontend only
npm run dev:backend    # Backend only
```

### Access Points

- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:4000
- 📚 **API Documentation**: http://localhost:4000/api/docs

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

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Frontend tests with coverage
npm run test:frontend -- --coverage

# Backend tests
npm run test:backend

# E2E tests
npm run e2e

# Type checking
npm run typecheck
```

---

## 🚢 Deployment

### Development

```bash
# Using Docker Compose
docker-compose -f docker-compose.dev.yml up

# Using PM2
pm2 start ecosystem.config.js
```

### Production

```bash
# Build for production
npm run build

# Start production servers
npm run start
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

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
