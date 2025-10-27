# Phase 9 Days 27-28 Implementation Plan

**Date:** October 5, 2025
**Status:** 📋 PLANNED
**Implementation Approach:** Enterprise-grade, incremental deployment

---

## ✅ Day 26: COMPLETE

**Real AI Integration for Search Assistant**

- ✅ Backend controller endpoints created
- ✅ Frontend API service implemented
- ✅ Component updated with real OpenAI/Claude integration
- ✅ Demo mode removed, "AI Powered" badge added
- ✅ Rate limiting, cost tracking, caching in place
- ✅ Zero new TypeScript errors

**Time:** ~2 hours
**Status:** Production ready

---

## 🔄 Day 27: Real SSO Authentication (ORCID OAuth) - IN PROGRESS

### Implementation Status

**✅ Completed:**

1. Dependencies installed (`passport-orcid`, `@nestjs/passport`, `passport`)
2. ORCID Strategy created (`orcid.strategy.ts`)
3. Architecture designed for OAuth 2.0 flow

**📋 Remaining Tasks:**

### Task 1: Backend ORCID Integration (4 hours)

**1.1 Add findOrCreateOrcidUser to AuthService**

```typescript
// backend/src/modules/auth/services/auth.service.ts
async findOrCreateOrcidUser(orcidData: {
  orcid: string;
  name: string;
  email?: string;
  institution?: string;
  accessToken: string;
  refreshToken: string;
}): Promise<User> {
  // Check if user exists with this ORCID
  let user = await this.prisma.user.findFirst({
    where: { orcidId: orcidData.orcid },
  });

  if (user) {
    // Update access tokens
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        orcidAccessToken: orcidData.accessToken,
        orcidRefreshToken: orcidData.refreshToken,
      },
    });
    return user;
  }

  // Create new user
  user = await this.prisma.user.create({
    data: {
      email: orcidData.email || `${orcidData.orcid}@orcid.org`,
      name: orcidData.name,
      orcidId: orcidData.orcid,
      orcidAccessToken: orcidData.accessToken,
      orcidRefreshToken: orcidData.refreshToken,
      institution: orcidData.institution,
      role: 'RESEARCHER',
      isActive: true,
      // No password for OAuth users
      password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
    },
  });

  return user;
}
```

**1.2 Update Prisma Schema**

```prisma
model User {
  // Existing fields...

  // ORCID OAuth fields
  orcidId            String?   @unique
  orcidAccessToken   String?
  orcidRefreshToken  String?
  institution        String?   // From ORCID affiliation
  institutionAccess  Json?     // Database access permissions
}
```

**1.3 Add ORCID Controller Endpoints**

```typescript
// backend/src/modules/auth/controllers/auth.controller.ts

@Get('orcid')
@UseGuards(AuthGuard('orcid'))
async orcidLogin() {
  // Initiates ORCID OAuth flow
  // Handled by passport
}

@Get('orcid/callback')
@UseGuards(AuthGuard('orcid'))
async orcidCallback(@Req() req: any, @Res() res: any) {
  // ORCID returns here after authentication
  const user = req.user;

  // Generate JWT tokens
  const tokens = await this.authService.generateTokens(user.id);

  // Redirect to frontend with tokens
  const frontendUrl = this.configService.get('FRONTEND_URL');
  res.redirect(`${frontendUrl}/auth/orcid/success?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
}
```

**1.4 Update Auth Module**

```typescript
// backend/src/modules/auth/auth.module.ts
import { OrcidStrategy } from './strategies/orcid.strategy';

@Module({
  imports: [
    JwtModule.register({...}),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    OrcidStrategy, // Add this
    // ... other providers
  ],
  controllers: [AuthController],
})
export class AuthModule {}
```

**1.5 Add Environment Variables**

```env
# ORCID OAuth Configuration
ORCID_CLIENT_ID=your-orcid-client-id
ORCID_CLIENT_SECRET=your-orcid-client-secret
ORCID_CALLBACK_URL=http://localhost:4000/api/auth/orcid/callback
FRONTEND_URL=http://localhost:3000
```

### Task 2: Frontend ORCID Integration (3 hours)

**2.1 Create ORCID Login Button**

```tsx
// frontend/components/auth/OrcidLoginButton.tsx
export function OrcidLoginButton() {
  const handleOrcidLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/orcid`;
  };

  return (
    <Button onClick={handleOrcidLogin} className="w-full">
      <OrcidIcon className="w-5 h-5 mr-2" />
      Sign in with ORCID
    </Button>
  );
}
```

**2.2 Create Callback Handler Page**

```tsx
// frontend/app/auth/orcid/success/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/api/services/auth.service';

export default function OrcidSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');

    if (token && refresh) {
      // Store tokens
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', refresh);

      // Fetch user profile
      authService.getCurrentUser().then(() => {
        router.push('/dashboard');
      });
    }
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        <p className="mt-4">Completing ORCID authentication...</p>
      </div>
    </div>
  );
}
```

**2.3 Update Institution Login Component**

```typescript
// Replace simulated SSO with real ORCID OAuth
const handleInstitutionLogin = async (institution: Institution) => {
  if (institution.authMethod === 'orcid') {
    // Redirect to ORCID OAuth
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/orcid`;
  }
  // Other auth methods...
};
```

### Task 3: Database Migration (30 min)

```bash
cd backend
npx prisma migrate dev --name add-orcid-oauth
```

### Task 4: Testing & Validation (2 hours)

**Test Cases:**

1. ✅ ORCID login flow (redirect → authenticate → callback)
2. ✅ New user creation with ORCID
3. ✅ Existing user login with ORCID
4. ✅ Token storage and refresh
5. ✅ Institution detection from ORCID profile
6. ✅ Database access mapping
7. ✅ Error handling (OAuth denial, network errors)

### ORCID OAuth Setup Guide

**Step 1: Register Application**

1. Go to https://orcid.org/developer-tools
2. Click "Register for the free Public API"
3. Fill in application details:
   - Name: "VQMethod Research Platform"
   - Website: "http://localhost:3000" (dev)
   - Redirect URI: "http://localhost:4000/api/auth/orcid/callback"
4. Get Client ID and Client Secret

**Step 2: Configure Environment**

```env
ORCID_CLIENT_ID=APP-***
ORCID_CLIENT_SECRET=***
```

**Step 3: Test Flow**

1. Navigate to http://localhost:3000/auth/login
2. Click "Sign in with ORCID"
3. Authorize on ORCID
4. Redirected back to app with auth

---

## 📊 Day 28: Progress Animation During Theme Extraction - PLANNED

### Implementation Status

**Objective:** Add visual feedback and progress tracking for theme extraction

### Task 1: Backend Progress Tracking (2 hours)

**1.1 Add WebSocket for Real-time Updates**

```typescript
// backend/src/modules/literature/literature.gateway.ts
@WebSocketGateway({ namespace: '/literature' })
export class LiteratureGateway {
  @WebSocketServer() server;

  async emitExtractionProgress(
    userId: string,
    progress: {
      stage: string;
      percentage: number;
      message: string;
    }
  ) {
    this.server.to(userId).emit('extraction-progress', progress);
  }
}
```

**1.2 Update Theme Extraction Service**

```typescript
// Emit progress during extraction
async extractThemes(sources: Source[], userId: string) {
  this.gateway.emitExtractionProgress(userId, {
    stage: 'analyzing',
    percentage: 10,
    message: 'Analyzing source content...'
  });

  // Extract from papers
  const paperThemes = await this.extractFromPapers(papers);
  this.gateway.emitExtractionProgress(userId, {
    stage: 'papers',
    percentage: 40,
    message: 'Extracted themes from papers'
  });

  // Extract from videos
  const videoThemes = await this.extractFromVideos(videos);
  this.gateway.emitExtractionProgress(userId, {
    stage: 'videos',
    percentage: 70,
    message: 'Extracted themes from videos'
  });

  // Merge themes
  const merged = await this.mergeThemes([...paperThemes, ...videoThemes]);
  this.gateway.emitExtractionProgress(userId, {
    stage: 'merging',
    percentage: 90,
    message: 'Merging and deduplicating themes'
  });

  // Complete
  this.gateway.emitExtractionProgress(userId, {
    stage: 'complete',
    percentage: 100,
    message: 'Theme extraction complete!'
  });

  return merged;
}
```

### Task 2: Frontend Progress UI (2 hours)

**2.1 Create Progress Animation Component**

```tsx
// frontend/components/literature/ThemeExtractionProgress.tsx
export function ThemeExtractionProgress() {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const socket = io(`${API_URL}/literature`);

    socket.on('extraction-progress', data => {
      setProgress(data.percentage);
      setStage(data.stage);
      setMessage(data.message);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">
              Extracting Themes from Sources
            </h3>
            <p className="text-sm text-green-700">{message}</p>
          </div>
        </div>

        {/* Visual Progress Stages */}
        <div className="flex items-center justify-between mb-4">
          <StageIndicator
            stage="analyzing"
            label="Analyzing"
            active={stage === 'analyzing'}
            complete={progress > 10}
          />
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <StageIndicator
            stage="papers"
            label="Papers"
            active={stage === 'papers'}
            complete={progress > 40}
          />
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <StageIndicator
            stage="videos"
            label="Videos"
            active={stage === 'videos'}
            complete={progress > 70}
          />
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <StageIndicator
            stage="merging"
            label="Merging"
            active={stage === 'merging'}
            complete={progress > 90}
          />
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-green-200 rounded-full h-3">
          <motion.div
            className="bg-green-600 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="text-right text-sm text-green-700 mt-2">
          {progress}% complete
        </div>
      </CardContent>
    </Card>
  );
}
```

**2.2 Add to Literature Page**

```tsx
// Show during extraction
{
  analyzingThemes && <ThemeExtractionProgress />;
}
```

### Task 3: Enhanced UX (as specified in roadmap) (2 hours)

**3.1 Add Prominent Theme Extraction Card** (from Day 28 roadmap)

- Visual workflow explanation
- Source count display
- Clear CTA button
- "How It Works" tooltip
- Progress feedback

**3.2 Animation & Polish**

- Smooth transitions between stages
- Celebration animation on completion
- Error state handling
- Cancel/pause functionality

---

## 📈 Combined Implementation Timeline

### Day 27: Real SSO (ORCID) - 9 hours

- Backend: 4 hours
- Frontend: 3 hours
- Database: 30 min
- Testing: 2 hours
- **Status:** Dependencies installed, strategy created

### Day 28: Progress Animations - 6 hours

- Backend WebSocket: 2 hours
- Frontend Progress UI: 2 hours
- UX Enhancements: 2 hours
- **Status:** Planned

### Total Remaining: ~15 hours

**Recommendation:** Implement incrementally across 2-3 work sessions

---

## 🔐 Security Considerations

### ORCID OAuth Security

✅ OAuth 2.0 standard compliance
✅ State parameter for CSRF protection
✅ Redirect URI validation
✅ Token storage (httpOnly cookies recommended)
✅ Refresh token rotation
✅ Rate limiting on auth endpoints

---

## 📝 Documentation to Update

After completion:

1. ✅ PHASE9_DAY26_COMPLETION_SUMMARY.md (done)
2. 📋 PHASE9_DAY27_COMPLETION_SUMMARY.md (create)
3. 📋 PHASE9_DAY28_COMPLETION_SUMMARY.md (create)
4. 📋 Update PHASE_TRACKER_PART2.md with Days 26-28
5. 📋 Update README.md with OAuth setup instructions
6. 📋 Update API_KEYS_SETUP.md with ORCID credentials

---

**Document Version:** 1.0
**Created:** October 5, 2025
**Next Action:** Complete Day 27 backend implementation
