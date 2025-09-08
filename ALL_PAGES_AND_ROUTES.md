# VQMethod - Complete Page & Route Directory

**Status:** ✅ ALL PAGES WORKING  
**Date Verified:** 2025-09-07  
**Frontend:** http://localhost:3000  
**Backend API:** http://localhost:4000/api  
**API Docs:** http://localhost:4000/api/docs  

## 📱 Frontend Pages

### 🏠 Public Pages (No Auth Required)
| Route | Status | Purpose |
|-------|--------|---------|
| `/` | ✅ 200 | Homepage - Landing page with app introduction |
| `/about` | ✅ 200 | About page - Information about VQMethod |
| `/contact` | ✅ 200 | Contact page - Contact form and information |
| `/help` | ✅ 200 | Help center - User guides and FAQs |
| `/privacy` | ✅ 200 | Privacy policy |
| `/terms` | ✅ 200 | Terms of service |
| `/navigation-test` | ✅ 200 | Navigation testing page (development) |

### 🔐 Authentication Pages
| Route | Status | Purpose |
|-------|--------|---------|
| `/auth/login` | ✅ 200 | User login page |
| `/auth/register` | ✅ 200 | New user registration |
| `/auth/forgot-password` | ✅ 200 | Password reset request |
| `/auth/reset-password` | ✅ 200 | Password reset form |
| `/auth/verify-email` | ✅ 200 | Email verification page |

### 👨‍🔬 Researcher Pages (Auth Required)
| Route | Status | Purpose |
|-------|--------|---------|
| `/dashboard` | ✅ 200 | Researcher dashboard - Overview of studies |
| `/studies` | ✅ 200 | Studies list - View all studies |
| `/studies/create` | ✅ 200 | Create new study form |
| `/studies/[id]` | ✅ Dynamic | Individual study details |
| `/analysis` | ✅ 200 | Analysis overview page |
| `/analysis/q-methodology` | ✅ 200 | Q-Methodology analysis tools |
| `/analytics` | ✅ 200 | Analytics dashboard |
| `/visualization-demo` | ✅ 200 | Data visualization demos |
| `/visualization-demo/q-methodology` | ✅ 200 | Q-Method specific visualizations |

### 👥 Participant Pages
| Route | Status | Purpose |
|-------|--------|---------|
| `/join` | ✅ 200 | Join study entry page |
| `/study/[token]` | ✅ Dynamic | Participant study interface |

### 🧪 Testing Pages (Development)
| Route | Status | Purpose |
|-------|--------|---------|
| `/test-auth` | ✅ 200 | Authentication testing |
| `/test-routing` | ✅ 200 | Routing system test |

### 🚫 Error Pages
| Route | Status | Purpose |
|-------|--------|---------|
| `/404` | ✅ 404 | Not found page (automatic) |
| Custom error | ✅ | Error boundary page |

## 🔧 Backend API Endpoints

### Core Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api` | GET | API root - welcome message |
| `/api/health` | GET | Health check endpoint |
| `/api/health/database` | GET | Database connection check |
| `/api/health/detailed` | GET | Detailed system health |
| `/api/docs` | GET | Swagger API documentation |

### Authentication Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/refresh` | POST | Refresh JWT token |
| `/api/auth/verify-email` | POST | Verify email address |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password |
| `/api/auth/me` | GET | Get current user info |
| `/api/auth/2fa/generate` | POST | Generate 2FA secret |
| `/api/auth/2fa/enable` | POST | Enable 2FA |
| `/api/auth/2fa/disable` | DELETE | Disable 2FA |
| `/api/auth/2fa/verify` | POST | Verify 2FA code |

### Study Management Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/studies` | GET | List all studies |
| `/api/studies` | POST | Create new study |
| `/api/studies/:id` | GET | Get study details |
| `/api/studies/:id` | PUT | Update study |
| `/api/studies/:id` | DELETE | Delete study |
| `/api/studies/:id/status` | PUT | Update study status |
| `/api/studies/:id/statements` | GET | Get study statements |
| `/api/studies/:id/statements` | POST | Add statements |
| `/api/studies/:id/statements/:statementId` | PUT | Update statement |
| `/api/studies/:id/statements/:statementId` | DELETE | Delete statement |
| `/api/studies/:id/statistics` | GET | Get study statistics |

### Participant Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/participant/session/start` | POST | Start participant session |
| `/api/participant/session/:sessionCode` | GET | Get session info |
| `/api/participant/session/:sessionCode/study` | GET | Get study details |
| `/api/participant/session/:sessionCode/statements` | GET | Get statements |
| `/api/participant/session/:sessionCode/progress` | GET | Get progress |
| `/api/participant/session/:sessionCode/progress` | PUT | Update progress |
| `/api/participant/session/:sessionCode/consent` | POST | Submit consent |
| `/api/participant/session/:sessionCode/presort` | POST | Submit pre-sort |
| `/api/participant/session/:sessionCode/presort` | GET | Get pre-sort |
| `/api/participant/session/:sessionCode/qsort` | POST | Submit Q-sort |
| `/api/participant/session/:sessionCode/qsort` | GET | Get Q-sort |
| `/api/participant/session/:sessionCode/commentary` | POST | Submit commentary |
| `/api/participant/session/:sessionCode/demographics` | POST | Submit demographics |
| `/api/participant/session/:sessionCode/complete` | POST | Complete session |
| `/api/participant/session/:sessionCode/validate` | GET | Validate session |

### File Upload Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/files/upload` | POST | Upload single file |
| `/api/files/upload-multiple` | POST | Upload multiple files |
| `/api/files/:id` | GET | Get file info |
| `/api/files/:id/download` | GET | Download file |
| `/api/files/:id` | DELETE | Delete file |
| `/api/files/test/eicar` | POST | Test virus scanner |

## 📊 Page Organization

### Layout Structure
```
app/
├── (participant)/          # Participant layout group
│   ├── join/              # Study entry
│   └── study/[token]/     # Dynamic study pages
├── (researcher)/          # Researcher layout group
│   ├── dashboard/         # Main dashboard
│   ├── studies/           # Study management
│   ├── analysis/          # Analysis tools
│   ├── analytics/         # Analytics dashboard
│   └── visualization-demo/ # Visualization demos
├── auth/                  # Authentication pages
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── reset-password/
│   └── verify-email/
├── about/                 # Public info pages
├── contact/
├── help/
├── privacy/
├── terms/
└── page.tsx              # Homepage
```

## 🔍 Key Features by Page

### Homepage (`/`)
- Welcome message
- Feature highlights
- Call-to-action buttons
- Navigation to key sections

### Dashboard (`/dashboard`)
- Study overview cards
- Recent activity
- Quick actions
- Statistics summary

### Studies (`/studies`)
- Searchable study list
- Filter and sort options
- Study status indicators
- Quick actions per study

### Analysis (`/analysis/q-methodology`)
- Data upload section
- Factor extraction panel
- Factor rotation view
- Factor interpretation
- Export functionality

### Participant Flow
1. `/join` - Enter study code
2. `/study/[token]` - Complete study steps:
   - Consent
   - Instructions
   - Pre-sort
   - Q-sort
   - Commentary
   - Demographics
   - Completion

## ✅ Testing Summary

| Category | Total | Working | Status |
|----------|-------|---------|--------|
| Public Pages | 7 | 7 | ✅ 100% |
| Auth Pages | 5 | 5 | ✅ 100% |
| Researcher Pages | 9 | 9 | ✅ 100% |
| Participant Pages | 2 | 2 | ✅ 100% |
| API Health | 3 | 3 | ✅ 100% |
| Error Handling | 1 | 1 | ✅ 100% |

**Total Pages: 27**  
**All Working: ✅ YES**

## 🚀 Quick Access Commands

```bash
# Start development server
npm run dev

# Access main areas
open http://localhost:3000              # Frontend
open http://localhost:3000/dashboard    # Researcher area
open http://localhost:3000/join         # Participant entry
open http://localhost:4000/api/docs     # API documentation

# Test specific pages
curl -I http://localhost:3000/[page-route]
```

## 📝 Notes

1. **Authentication:** Some researcher pages may redirect to login if not authenticated
2. **Dynamic Routes:** `[id]` and `[token]` routes accept dynamic parameters
3. **API Protection:** Most API endpoints require JWT authentication
4. **Health Checks:** All health endpoints are publicly accessible
5. **Development Pages:** Test pages are available in development mode only

---

*All pages verified working on 2025-09-07*