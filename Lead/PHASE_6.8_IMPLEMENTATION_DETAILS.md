# PHASE 6.8: IMPLEMENTATION DETAILS & TECHNICAL SPECIFICATIONS

## 1. BACKEND INTEGRATION & API SPECIFICATIONS

### 1.1 Database Schema Updates

```sql
-- Add to existing studies table
ALTER TABLE studies ADD COLUMN IF NOT EXISTS 
  title_char_limit INTEGER DEFAULT 100,
  description_char_limit INTEGER DEFAULT 500,
  welcome_message_html TEXT,
  welcome_message_char_limit INTEGER DEFAULT 1000,
  welcome_video_url VARCHAR(500),
  welcome_template_id VARCHAR(50),
  consent_form_html TEXT,
  consent_form_char_limit INTEGER DEFAULT 5000,
  consent_template_id VARCHAR(50),
  require_signature BOOLEAN DEFAULT false,
  signature_type VARCHAR(20) CHECK (signature_type IN ('typed', 'drawn', 'upload')),
  organization_name VARCHAR(255),
  organization_logo_url VARCHAR(500),
  created_from_template BOOLEAN DEFAULT false,
  template_version VARCHAR(20);

-- New templates table
CREATE TABLE IF NOT EXISTS study_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('welcome', 'consent')),
  content TEXT NOT NULL,
  fields JSONB NOT NULL,
  requires_signature BOOLEAN DEFAULT false,
  version VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  compliance_standards JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Signatures table for audit trail
CREATE TABLE IF NOT EXISTS consent_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID REFERENCES studies(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  signature_data TEXT NOT NULL, -- Base64 encoded signature
  signature_type VARCHAR(20) NOT NULL,
  signer_name VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  consent_version VARCHAR(50),
  consent_hash VARCHAR(64), -- SHA-256 hash of consent text
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_valid BOOLEAN DEFAULT true,
  revoked_at TIMESTAMP,
  INDEX idx_study_participant (study_id, participant_id)
);

-- Template usage tracking
CREATE TABLE IF NOT EXISTS template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id VARCHAR(50) REFERENCES study_templates(template_id),
  study_id UUID REFERENCES studies(id),
  user_id UUID REFERENCES users(id),
  field_values JSONB,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 API Endpoint Specifications

```typescript
// backend/src/modules/studies/dto/enhanced-study.dto.ts
export class EnhancedStudyDto {
  @IsString()
  @Length(10, 100)
  @Matches(/^[a-zA-Z0-9\s\-:,.'!?]+$/)
  title: string;

  @IsOptional()
  @IsString()
  @Length(50, 500)
  description?: string;

  @IsString()
  @Length(100, 1000)
  @Transform(({ value }) => sanitizeHtml(value, sanitizeOptions))
  welcomeMessageHtml: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'] })
  @MaxLength(500)
  welcomeVideoUrl?: string;

  @IsString()
  @Length(500, 5000)
  @Transform(({ value }) => sanitizeHtml(value, sanitizeOptions))
  consentFormHtml: string;

  @IsBoolean()
  requireSignature: boolean;

  @IsEnum(['typed', 'drawn', 'upload'])
  signatureType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  organizationName?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'] })
  @MaxLength(500)
  organizationLogoUrl?: string;
}
```

```typescript
// backend/src/modules/studies/controllers/enhanced-studies.controller.ts
@Controller('api/studies')
@UseGuards(JwtAuthGuard, RateLimitGuard)
export class EnhancedStudiesController {
  constructor(
    private studiesService: EnhancedStudiesService,
    private templatesService: TemplatesService,
    private signaturesService: SignaturesService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('organizationLogo'))
  @ApiOperation({ summary: 'Create enhanced study with rich content' })
  async createStudy(
    @Body() dto: EnhancedStudyDto,
    @UploadedFile() logo: Express.Multer.File,
    @Request() req,
  ) {
    // Validate and sanitize HTML content
    const sanitized = await this.studiesService.sanitizeStudyContent(dto);
    
    // Process logo if provided
    if (logo) {
      const logoUrl = await this.studiesService.processLogo(logo, req.user.id);
      sanitized.organizationLogoUrl = logoUrl;
    }
    
    return this.studiesService.create(sanitized, req.user.id);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get available study templates' })
  async getTemplates(@Query('type') type?: 'welcome' | 'consent') {
    return this.templatesService.getActiveTemplates(type);
  }

  @Post('templates/:templateId/fill')
  @ApiOperation({ summary: 'Fill template with values' })
  async fillTemplate(
    @Param('templateId') templateId: string,
    @Body() values: Record<string, string>,
  ) {
    return this.templatesService.fillTemplate(templateId, values);
  }

  @Post(':studyId/signatures')
  @UseGuards(ParticipantAuthGuard)
  @ApiOperation({ summary: 'Submit consent signature' })
  async submitSignature(
    @Param('studyId') studyId: string,
    @Body() signatureDto: SignatureDto,
    @Request() req,
  ) {
    // Verify consent form hasn't changed
    const consentHash = await this.signaturesService.verifyConsentIntegrity(
      studyId,
      signatureDto.consentVersion,
    );
    
    // Store signature with audit trail
    return this.signaturesService.storeSignature({
      ...signatureDto,
      studyId,
      participantId: req.participant.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      consentHash,
    });
  }

  @Get(':studyId/signatures/:participantId')
  @UseGuards(ResearcherAuthGuard)
  @ApiOperation({ summary: 'Verify participant signature' })
  async verifySignature(
    @Param('studyId') studyId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.signaturesService.verifySignature(studyId, participantId);
  }
}
```

### 1.3 Content Sanitization Service

```typescript
// backend/src/modules/studies/services/content-sanitizer.service.ts
import * as DOMPurify from 'isomorphic-dompurify';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ContentSanitizerService {
  private readonly allowedTags = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 's',
    'ul', 'ol', 'li', 'blockquote',
    'a', 'img', 'div', 'span',
  ];

  private readonly allowedAttributes = {
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height'],
    'div': ['style'],
    'span': ['style'],
  };

  private readonly allowedStyles = [
    'color', 'background-color', 'font-size', 'font-weight',
    'text-align', 'padding', 'margin', 'border-radius',
  ];

  sanitizeHtml(html: string): string {
    const config = {
      ALLOWED_TAGS: this.allowedTags,
      ALLOWED_ATTR: this.allowedAttributes,
      ALLOWED_URI_REGEXP: /^https?:\/\//,
      KEEP_CONTENT: true,
      ALLOW_DATA_ATTR: false,
      ADD_TAGS: [],
      ADD_ATTR: [],
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    };

    const clean = DOMPurify.sanitize(html, config);
    
    // Additional validation for URLs
    return this.validateUrls(clean);
  }

  private validateUrls(html: string): string {
    const urlRegex = /<a[^>]+href="([^"]+)"/g;
    return html.replace(urlRegex, (match, url) => {
      if (this.isSafeUrl(url)) {
        return match;
      }
      return match.replace(url, '#');
    });
  }

  private isSafeUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  sanitizeImageUrl(url: string): string | null {
    if (!this.isSafeUrl(url)) return null;
    
    // Check for common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => 
      url.toLowerCase().endsWith(ext)
    );
    
    if (!hasImageExtension) {
      // Additional check for image content-type
      return this.validateImageContentType(url);
    }
    
    return url;
  }

  private async validateImageContentType(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        return url;
      }
    } catch {
      return null;
    }
    return null;
  }
}
```

## 2. COMPREHENSIVE TESTING STRATEGY

### 2.1 Performance Testing Specifications

```typescript
// tests/performance/study-creation.perf.test.ts
import { test, expect } from '@playwright/test';
import { performance } from 'perf_hooks';

test.describe('Study Creation Performance', () => {
  test('Rich text editor response time', async ({ page }) => {
    await page.goto('/studies/create');
    
    const editorSelector = '.rich-text-editor';
    await page.waitForSelector(editorSelector);
    
    // Measure typing performance
    const startTime = performance.now();
    await page.type(editorSelector, 'Lorem ipsum '.repeat(100));
    const endTime = performance.now();
    
    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(50); // <50ms requirement
  });

  test('Template loading performance', async ({ page }) => {
    await page.goto('/studies/create');
    
    const startTime = performance.now();
    await page.click('[data-testid="template-selector"]');
    await page.waitForSelector('[data-testid="template-list"]');
    const endTime = performance.now();
    
    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(200); // <200ms requirement
  });

  test('Character counting performance', async ({ page }) => {
    await page.goto('/studies/create');
    
    const editorSelector = '.rich-text-editor';
    const longText = 'a'.repeat(1000);
    
    const startTime = performance.now();
    await page.fill(editorSelector, longText);
    await page.waitForSelector('[data-testid="character-count"]');
    const endTime = performance.now();
    
    const updateTime = endTime - startTime;
    expect(updateTime).toBeLessThan(100); // Real-time update <100ms
  });
});
```

### 2.2 Load Testing for Signature Processing

```javascript
// tests/load/signature-processing.k6.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

const signatures = new SharedArray('signatures', function () {
  // Generate different signature types for testing
  return [
    { type: 'typed', data: 'John Doe', size: 50 },
    { type: 'drawn', data: generateBase64Image(100), size: 100 },
    { type: 'upload', data: generateBase64Image(500), size: 500 },
  ];
});

export default function () {
  const signature = signatures[Math.floor(Math.random() * signatures.length)];
  
  const payload = JSON.stringify({
    signatureType: signature.type,
    signatureData: signature.data,
    consentVersion: 'v1.0',
    timestamp: new Date().toISOString(),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`,
    },
  };

  const response = http.post(
    `${__ENV.API_URL}/api/studies/test-study/signatures`,
    payload,
    params
  );

  check(response, {
    'status is 201': (r) => r.status === 201,
    'signature saved': (r) => r.json('id') !== undefined,
    'response time OK': (r) => r.timings.duration < 500,
  });

  sleep(1);
}

function generateBase64Image(sizeKb) {
  // Generate a base64 string of specified size for testing
  const bytes = sizeKb * 1024;
  const buffer = new Uint8Array(bytes);
  for (let i = 0; i < bytes; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  return btoa(String.fromCharCode(...buffer));
}
```

### 2.3 Accessibility Testing Details

```typescript
// tests/accessibility/study-creation.a11y.test.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Study Creation Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/studies/create');
    await injectAxe(page);
  });

  test('Rich text editor accessibility', async ({ page }) => {
    await checkA11y(page, '.rich-text-editor', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
      rules: {
        'color-contrast': { enabled: true },
        'label': { enabled: true },
        'aria-roles': { enabled: true },
      },
    });
  });

  test('Keyboard navigation for all controls', async ({ page }) => {
    // Tab through all interactive elements
    const interactiveElements = await page.$$eval(
      'button, input, textarea, select, a, [tabindex]',
      elements => elements.length
    );
    
    for (let i = 0; i < interactiveElements; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => 
        document.activeElement?.tagName
      );
      expect(focusedElement).toBeTruthy();
    }
  });

  test('Screen reader announcements', async ({ page }) => {
    // Test ARIA live regions
    await page.fill('[data-testid="title-input"]', 'Test Study');
    
    const announcement = await page.getAttribute(
      '[role="status"]',
      'aria-label'
    );
    expect(announcement).toContain('characters remaining');
  });

  test('Tooltip accessibility', async ({ page }) => {
    const tooltips = await page.$$('[data-testid="info-tooltip"]');
    
    for (const tooltip of tooltips) {
      await tooltip.focus();
      await page.keyboard.press('Enter');
      
      const tooltipContent = await page.isVisible('[role="tooltip"]');
      expect(tooltipContent).toBeTruthy();
      
      await page.keyboard.press('Escape');
      const tooltipHidden = await page.isHidden('[role="tooltip"]');
      expect(tooltipHidden).toBeTruthy();
    }
  });

  test('Signature component accessibility', async ({ page }) => {
    await page.click('[data-testid="signature-type-typed"]');
    
    await checkA11y(page, '.signature-container', {
      rules: {
        'label': { enabled: true },
        'aria-required-attr': { enabled: true },
        'focus-order-semantics': { enabled: true },
      },
    });
  });
});
```

## 3. DEPLOYMENT & ROLLOUT STRATEGY

### 3.1 Migration Strategy for Existing Studies

```typescript
// migrations/001_migrate_existing_studies.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateExistingStudies1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new columns with defaults
    await queryRunner.query(`
      ALTER TABLE studies 
      ADD COLUMN IF NOT EXISTS welcome_message_html TEXT,
      ADD COLUMN IF NOT EXISTS consent_form_html TEXT,
      ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP;
    `);

    // Step 2: Migrate plain text to HTML preserving formatting
    await queryRunner.query(`
      UPDATE studies 
      SET 
        welcome_message_html = '<p>' || REPLACE(
          REPLACE(welcome_message, E'\n\n', '</p><p>'),
          E'\n', '<br/>'
        ) || '</p>',
        consent_form_html = '<p>' || REPLACE(
          REPLACE(consent_text, E'\n\n', '</p><p>'),
          E'\n', '<br/>'
        ) || '</p>',
        migrated_at = CURRENT_TIMESTAMP
      WHERE welcome_message_html IS NULL;
    `);

    // Step 3: Create backup table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS studies_backup_phase_6_8 AS 
      SELECT * FROM studies;
    `);

    // Step 4: Add indexes for new fields
    await queryRunner.query(`
      CREATE INDEX idx_studies_template_id ON studies(welcome_template_id, consent_template_id);
      CREATE INDEX idx_studies_signature_required ON studies(require_signature);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: Restore from backup
    await queryRunner.query(`
      UPDATE studies s
      SET 
        welcome_message = sb.welcome_message,
        consent_text = sb.consent_text
      FROM studies_backup_phase_6_8 sb
      WHERE s.id = sb.id;
    `);

    // Remove new columns
    await queryRunner.query(`
      ALTER TABLE studies 
      DROP COLUMN IF EXISTS welcome_message_html,
      DROP COLUMN IF EXISTS consent_form_html,
      DROP COLUMN IF EXISTS welcome_template_id,
      DROP COLUMN IF EXISTS consent_template_id,
      DROP COLUMN IF EXISTS require_signature,
      DROP COLUMN IF EXISTS migrated_at;
    `);
  }
}
```

### 3.2 Rollback Procedures

```bash
#!/bin/bash
# rollback-phase-6.8.sh

echo "🔄 Starting Phase 6.8 Rollback..."

# 1. Check current version
CURRENT_VERSION=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT version FROM migrations ORDER BY executed_at DESC LIMIT 1;")

if [ "$CURRENT_VERSION" != "6.8.0" ]; then
  echo "❌ Not on Phase 6.8, current version: $CURRENT_VERSION"
  exit 1
fi

# 2. Create rollback point
pg_dump -U $DB_USER -d $DB_NAME > backups/pre_rollback_$(date +%Y%m%d_%H%M%S).sql

# 3. Restore previous frontend build
echo "📦 Restoring previous frontend build..."
cp -r deployments/previous/frontend/* frontend/
npm --prefix frontend run build

# 4. Run database rollback
echo "🗄️ Rolling back database changes..."
npm run migration:revert

# 5. Restore backend to previous version
echo "⚙️ Restoring backend..."
git checkout tags/v6.7.0 -- backend/

# 6. Restart services
echo "🔄 Restarting services..."
pm2 restart all

# 7. Verify rollback
echo "✅ Verifying rollback..."
npm run test:smoke

echo "✅ Rollback complete!"
```

### 3.3 Gradual Rollout Plan

```typescript
// backend/src/modules/features/feature-flags.service.ts
@Injectable()
export class FeatureFlagsService {
  private readonly flags = {
    'phase_6_8_rich_editor': {
      enabled: false,
      percentage: 0,
      whitelist: [],
      blacklist: [],
    },
    'phase_6_8_templates': {
      enabled: false,
      percentage: 0,
      whitelist: [],
    },
    'phase_6_8_signatures': {
      enabled: false,
      percentage: 0,
      whitelist: [],
    },
  };

  async isEnabled(feature: string, userId: string): Promise<boolean> {
    const flag = this.flags[feature];
    if (!flag || !flag.enabled) return false;

    // Check whitelist
    if (flag.whitelist?.includes(userId)) return true;

    // Check blacklist
    if (flag.blacklist?.includes(userId)) return false;

    // Check percentage rollout
    if (flag.percentage > 0) {
      const hash = this.hashUserId(userId);
      return hash <= flag.percentage;
    }

    return flag.enabled;
  }

  private hashUserId(userId: string): number {
    // Consistent hash for gradual rollout
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }
}
```

**Rollout Schedule:**
```yaml
week_1:
  - internal_testing: 100%
  - beta_users: 10%
  
week_2:
  - beta_users: 50%
  - general_users: 10%
  
week_3:
  - beta_users: 100%
  - general_users: 50%
  
week_4:
  - all_users: 100%
  - remove_feature_flags: true
```

## 4. ENHANCED SECURITY CONSIDERATIONS

### 4.1 Image Upload Security Validation

```typescript
// backend/src/modules/upload/services/image-security.service.ts
import * as sharp from 'sharp';
import * as fileType from 'file-type';
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ImageSecurityService {
  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  private readonly ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  async validateImage(file: Express.Multer.File): Promise<void> {
    // 1. Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 2MB limit');
    }

    // 2. Verify MIME type from magic bytes (not just extension)
    const type = await fileType.fromBuffer(file.buffer);
    if (!type || !this.ALLOWED_MIME_TYPES.includes(type.mime)) {
      throw new BadRequestException('Invalid file type');
    }

    // 3. Check file extension
    const extension = path.extname(file.originalname).toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
      throw new BadRequestException('Invalid file extension');
    }

    // 4. Verify image integrity with sharp
    try {
      const metadata = await sharp(file.buffer).metadata();
      
      // Check for suspicious dimensions
      if (metadata.width > 4096 || metadata.height > 4096) {
        throw new BadRequestException('Image dimensions too large');
      }

      // Check for EXIF data and strip it
      await this.stripMetadata(file);
    } catch (error) {
      throw new BadRequestException('Invalid image file');
    }

    // 5. Scan for embedded scripts (additional security)
    await this.scanForMaliciousContent(file.buffer);
  }

  private async stripMetadata(file: Express.Multer.File): Promise<Buffer> {
    return sharp(file.buffer)
      .rotate() // Auto-rotate based on EXIF
      .removeMetadata() // Strip all metadata
      .toBuffer();
  }

  private async scanForMaliciousContent(buffer: Buffer): Promise<void> {
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1000));
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /onerror=/i,
      /onclick=/i,
      /<iframe/i,
      /base64,/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        throw new BadRequestException('Suspicious content detected in image');
      }
    }
  }

  async processAndStore(file: Express.Multer.File, userId: string): Promise<string> {
    // Validate first
    await this.validateImage(file);

    // Generate safe filename
    const safeFilename = this.generateSafeFilename(file.originalname, userId);

    // Process image (resize, optimize)
    const processed = await sharp(file.buffer)
      .resize(800, 800, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Store in secure location
    const url = await this.storeSecurely(processed, safeFilename);
    
    return url;
  }

  private generateSafeFilename(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName).toLowerCase();
    return `${userId}_${timestamp}_${random}${extension}`;
  }
}
```

### 4.2 CSRF Protection for Signature Endpoints

```typescript
// backend/src/modules/security/csrf.middleware.ts
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly TOKEN_LENGTH = 32;
  private readonly TOKEN_HEADER = 'x-csrf-token';
  private readonly TOKEN_COOKIE = 'csrf-token';

  use(req: any, res: any, next: () => void) {
    // Skip CSRF for GET requests
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }

    // Check if this is a signature submission endpoint
    if (req.path.includes('/signatures')) {
      const token = this.extractToken(req);
      const sessionToken = req.session?.csrfToken;

      if (!token || !sessionToken || !this.verifyToken(token, sessionToken)) {
        throw new ForbiddenException('Invalid CSRF token');
      }
    }

    // Generate new token for response
    if (!req.session?.csrfToken) {
      req.session.csrfToken = this.generateToken();
    }

    // Set token in response header for client
    res.setHeader(this.TOKEN_HEADER, req.session.csrfToken);
    
    next();
  }

  private generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  private extractToken(req: any): string | null {
    return req.headers[this.TOKEN_HEADER] || 
           req.body?._csrf || 
           req.query?._csrf ||
           req.cookies?.[this.TOKEN_COOKIE];
  }

  private verifyToken(token: string, sessionToken: string): boolean {
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(sessionToken)
    );
  }
}
```

### 4.3 Signature Verification Service

```typescript
// backend/src/modules/signatures/signature-verification.service.ts
@Injectable()
export class SignatureVerificationService {
  async verifySignature(
    studyId: string,
    participantId: string,
  ): Promise<SignatureVerificationResult> {
    // Get signature record
    const signature = await this.signaturesRepository.findOne({
      where: { studyId, participantId },
    });

    if (!signature) {
      return { valid: false, reason: 'No signature found' };
    }

    // Verify consent form hasn't changed
    const currentConsent = await this.studiesRepository.findOne({
      where: { id: studyId },
      select: ['consent_form_html'],
    });

    const currentHash = this.hashContent(currentConsent.consent_form_html);
    
    if (currentHash !== signature.consent_hash) {
      return { 
        valid: false, 
        reason: 'Consent form has been modified since signing' 
      };
    }

    // Check if signature has been revoked
    if (signature.revoked_at) {
      return { 
        valid: false, 
        reason: `Signature revoked at ${signature.revoked_at}` 
      };
    }

    // Verify signature data integrity
    const isValid = await this.verifySignatureData(signature.signature_data);

    return {
      valid: isValid,
      signedAt: signature.signed_at,
      signerName: signature.signer_name,
      ipAddress: signature.ip_address,
      consentVersion: signature.consent_version,
    };
  }

  private hashContent(content: string): string {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }

  private async verifySignatureData(data: string): Promise<boolean> {
    try {
      // Verify base64 encoding
      const decoded = Buffer.from(data, 'base64');
      
      // Check if it's a valid image
      const type = await fileType.fromBuffer(decoded);
      
      return type?.mime?.startsWith('image/') || false;
    } catch {
      return false;
    }
  }
}
```

## 5. MONITORING & METRICS

### 5.1 Performance Monitoring

```typescript
// backend/src/modules/monitoring/study-creation-metrics.service.ts
@Injectable()
export class StudyCreationMetricsService {
  private readonly metrics = {
    studyCreationTime: new Histogram({
      name: 'study_creation_duration_seconds',
      help: 'Time taken to create a study',
      labelNames: ['template_used', 'has_signature'],
    }),
    templateUsage: new Counter({
      name: 'template_usage_total',
      help: 'Number of times each template is used',
      labelNames: ['template_id', 'template_type'],
    }),
    signatureProcessingTime: new Histogram({
      name: 'signature_processing_duration_ms',
      help: 'Time to process and store signatures',
      labelNames: ['signature_type'],
    }),
    richTextEditorErrors: new Counter({
      name: 'rich_text_editor_errors_total',
      help: 'Errors in rich text editor',
      labelNames: ['error_type'],
    }),
  };

  recordStudyCreation(
    duration: number,
    templateUsed: boolean,
    hasSignature: boolean,
  ) {
    this.metrics.studyCreationTime
      .labels(String(templateUsed), String(hasSignature))
      .observe(duration);
  }

  recordTemplateUsage(templateId: string, templateType: string) {
    this.metrics.templateUsage
      .labels(templateId, templateType)
      .inc();
  }

  recordSignatureProcessing(duration: number, type: string) {
    this.metrics.signatureProcessingTime
      .labels(type)
      .observe(duration);
  }

  recordEditorError(errorType: string) {
    this.metrics.richTextEditorErrors
      .labels(errorType)
      .inc();
  }
}
```

## 6. ERROR HANDLING & RECOVERY

```typescript
// frontend/components/study-creation/ErrorBoundary.tsx
import React, { Component, ErrorInfo } from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryAttempts: number;
}

export class StudyCreationErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    recoveryAttempts: 0,
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      recoveryAttempts: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error tracking service
    console.error('Study creation error:', error, errorInfo);
    
    // Save current form state to localStorage for recovery
    this.saveFormState();
    
    // Send error metrics
    this.sendErrorMetrics(error, errorInfo);
  }

  saveFormState() {
    const formData = this.extractFormData();
    localStorage.setItem('study_creation_recovery', JSON.stringify({
      data: formData,
      timestamp: Date.now(),
    }));
  }

  recoverFormState() {
    const saved = localStorage.getItem('study_creation_recovery');
    if (saved) {
      const { data, timestamp } = JSON.parse(saved);
      // Only recover if less than 1 hour old
      if (Date.now() - timestamp < 3600000) {
        return data;
      }
    }
    return null;
  }

  handleRecovery = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: prevState.recoveryAttempts + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback p-8 text-center">
          <h2 className="text-2xl font-bold text-system-red mb-4">
            Something went wrong
          </h2>
          <p className="text-secondary-label mb-6">
            We've saved your progress. You can try to recover your work.
          </p>
          <div className="space-x-4">
            <Button onClick={this.handleRecovery} variant="primary">
              Try Recovery
            </Button>
            <Button onClick={() => window.location.reload()} variant="secondary">
              Refresh Page
            </Button>
          </div>
          {this.state.recoveryAttempts > 2 && (
            <p className="mt-4 text-sm text-tertiary-label">
              If problems persist, please contact support with error code: 
              {this.state.error?.message}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

This comprehensive implementation detail document addresses all the gaps identified, providing concrete technical specifications for backend integration, testing strategies, deployment procedures, and security considerations.