# VQMethod Backend

## Technology Stack

### Core Framework
- **NestJS** - Progressive Node.js framework for building efficient, scalable server-side applications
- **TypeScript** - Strict type checking and modern JavaScript features

### Database
- **PostgreSQL** - Primary database for application data
- **Prisma ORM** - Type-safe database client with migrations and schema management
- **Row-Level Security (RLS)** - Tenant isolation at database level

### Authentication & Security
- **JWT** - JSON Web Tokens for stateless authentication
- **bcrypt** - Password hashing with salt rounds ≥12
- **Refresh Token Rotation** - Enhanced security with rotating refresh tokens
- **CSRF Protection** - Cross-Site Request Forgery prevention
- **Rate Limiting** - DDoS protection and API throttling

## Architecture

```
backend/
├── src/
│   ├── auth/              # Authentication module
│   ├── users/             # User management
│   ├── surveys/           # Survey CRUD operations
│   ├── responses/         # Participant responses
│   ├── common/            # Shared utilities
│   │   ├── guards/        # Auth guards
│   │   ├── interceptors/  # Logging, transformation
│   │   └── filters/       # Exception handling
│   └── main.ts            # Application entry point
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
└── test/                  # E2E tests
```

## Database Schema

### Core Models
- **User** - Authentication and user profiles
- **Session** - JWT refresh token management
- **Survey** - Q-methodology study configuration
- **Statement** - Q-sort items
- **Response** - Participant submissions
- **QSort** - Statement rankings

### Multi-Tenant Isolation
- PostgreSQL Row-Level Security (RLS) policies
- Tenant context validation middleware
- Database constraints preventing cross-tenant data leakage

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- PostgreSQL >= 14
- npm >= 9.0.0

### Installation
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npm run seed
```

### Database Setup
```bash
# Set DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/vqmethod"

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### Development
```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

### Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Endpoints (Phase 2)

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login with JWT
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Invalidate refresh token

### User Management
- `GET /users/profile` - Get current user
- `PUT /users/profile` - Update profile
- `DELETE /users/account` - Delete account

### Survey Management
- `GET /surveys` - List user surveys
- `POST /surveys` - Create new survey
- `GET /surveys/:id` - Get survey details
- `PUT /surveys/:id` - Update survey
- `DELETE /surveys/:id` - Delete survey

### Participant API
- `POST /participant/start` - Begin survey session
- `POST /participant/save-step` - Save progress
- `POST /participant/submit` - Submit response
- `GET /participant/results/:code` - Get results

## Security Features

### Rate Limiting
- Authentication: 5 attempts/15min per IP
- API endpoints: 100 requests/minute per IP
- File uploads: 10 uploads/hour per user
- Survey creation: 50 surveys/day per user

### Security Headers
- HSTS (Strict-Transport-Security)
- CSP (Content-Security-Policy)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vqmethod"

# JWT
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_TTL=900
RATE_LIMIT_LIMIT=100

# Environment
NODE_ENV="development"
PORT=3001
```

## API Documentation
API documentation will be available at `/api/docs` when Swagger is configured.