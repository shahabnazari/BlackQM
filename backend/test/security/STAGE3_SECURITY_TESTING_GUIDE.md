# Stage 3: Security Testing Guide
## Phase 10 Day 5.7 - Enterprise-Grade Security Validation

**Purpose:** Identify and remediate security vulnerabilities before production deployment
**Duration:** 2-3 hours
**Priority:** CRITICAL - Production Blocker if Critical/High vulnerabilities found
**Success Criteria:** Zero critical/high vulnerabilities, all medium/low documented with remediation plan

---

## Security Testing Philosophy

Security testing is not optional for enterprise applications handling academic research data. This guide validates **OWASP Top 10** compliance and identifies common web application vulnerabilities.

**Key Questions:**
- Can an attacker gain unauthorized access to research data?
- Is user authentication and session management secure?
- Are API endpoints protected against injection attacks?
- Does the application leak sensitive information?

---

## Security Testing Scope

### In-Scope (Automated + Manual Testing)

✅ **Authentication & Authorization**
- JWT token security (expiration, signature validation)
- Password hashing (bcrypt strength)
- Session management
- RBAC (Role-Based Access Control) enforcement

✅ **Input Validation & Injection**
- SQL injection (Prisma ORM protection)
- NoSQL injection (if applicable)
- XSS (Cross-Site Scripting)
- Command injection
- LDAP injection

✅ **API Security**
- Rate limiting effectiveness
- CORS configuration
- Authentication bypass attempts
- Insecure direct object references (IDOR)

✅ **Data Protection**
- Sensitive data exposure
- Encryption in transit (HTTPS)
- Secure headers (CSP, HSTS, X-Frame-Options)
- Cookie security (HttpOnly, Secure, SameSite)

✅ **Error Handling**
- Stack trace leakage
- Detailed error messages in production
- Logging of sensitive data

### Out-of-Scope (Separate Penetration Testing)

❌ **Infrastructure Security** (requires separate assessment)
- Server hardening
- Network segmentation
- Firewall configuration
- DDoS protection

❌ **Physical Security** (not applicable for SaaS)
❌ **Social Engineering** (requires dedicated team)
❌ **Advanced Persistent Threats (APTs)** (requires threat intelligence)

---

## Part 1: OWASP ZAP Setup (30 minutes)

### Installation

**macOS:**
```bash
brew install --cask owasp-zap

# Or download from: https://www.zaproxy.org/download/
```

**Linux (Debian/Ubuntu):**
```bash
sudo snap install zaproxy --classic

# Or download .deb package
wget https://github.com/zaproxy/zaproxy/releases/download/v2.14.0/ZAP_2_14_0_unix.sh
chmod +x ZAP_2_14_0_unix.sh
./ZAP_2_14_0_unix.sh
```

**Docker:**
```bash
docker pull zaproxy/zap-stable
```

**Verify Installation:**
```bash
# GUI mode
/Applications/OWASP\ ZAP.app/Contents/MacOS/OWASP\ ZAP

# Headless mode (for CI/CD)
zap.sh -cmd -quickurl http://localhost:3000 -quickprogress
```

---

### ZAP Configuration for VQMethod Platform

**1. Create ZAP Context**

```xml
<!-- Save as: vqmethod-zap-context.xml -->
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<configuration>
  <context>
    <name>VQMethod Platform</name>
    <desc>Security testing for VQMethod research platform</desc>
    <inscope>true</inscope>
    <incregexes>http://localhost:3000.*</incregexes>
    <incregexes>http://localhost:4000/api.*</incregexes>
    <tech>
      <include>Language.JavaScript</include>
      <include>Language.TypeScript</include>
      <include>OS.Linux</include>
      <include>Db.PostgreSQL</include>
    </tech>
    <urlparser>
      <class>org.zaproxy.zap.model.StandardParameterParser</class>
      <config></config>
    </urlparser>
    <authentication>
      <type>1</type>
      <strategy>EACH_RESP</strategy>
      <loginrequest>http://localhost:4000/api/auth/login</loginrequest>
      <loginbody>{"email":"test@vqmethod.com","password":"test123"}</loginbody>
    </authentication>
  </context>
</configuration>
```

**2. Import Context into ZAP:**
- Open ZAP GUI
- File → Import Context → Select `vqmethod-zap-context.xml`
- Right-click context → Include in Context → Add URL regex patterns

---

## Part 2: Automated Security Scanning (45 minutes)

### Scan 1: Baseline Scan (Quick Vulnerability Check)

**Objective:** Identify obvious security issues in 5-10 minutes

**Execution (Command Line):**
```bash
docker run -v $(pwd):/zap/wrk/:rw \
  -t zaproxy/zap-stable \
  zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -g gen.conf \
  -r baseline-report.html

# Results: baseline-report.html
```

**Execution (GUI):**
1. Quick Start → Automated Scan
2. URL: `http://localhost:3000`
3. Select "Attack Mode"
4. Click "Attack"
5. Wait 5-10 minutes

**Expected Results:**
```
Baseline Scan Summary:
  High Alerts:    0   ✅
  Medium Alerts:  2-5 ⚠️  (acceptable if documented)
  Low Alerts:     5-10 ℹ️  (review but not blocking)
  Info Alerts:    10-20 ℹ️

Common Medium Alerts (Expected):
  • Missing Anti-CSRF Tokens (Next.js handles this)
  • Content Security Policy Not Set (should fix)
  • X-Frame-Options Header Not Set (should fix)
```

---

### Scan 2: Full Active Scan (Comprehensive Vulnerability Assessment)

**Objective:** Deep security testing including injection attacks

**⚠️ WARNING:** Active scan will:
- Submit malicious payloads to all forms
- Attempt SQL injection, XSS, command injection
- May trigger rate limits or alarms
- **Only run on test environment, NEVER production**

**Execution:**
```bash
# 1. Start backend in test mode
cd backend
npm run start:dev

# 2. Start frontend in test mode
cd frontend
npm run dev

# 3. Run ZAP full scan
docker run -v $(pwd):/zap/wrk/:rw \
  -t zaproxy/zap-stable \
  zap-full-scan.py \
  -t http://host.docker.internal:3000 \
  -g gen.conf \
  -r full-scan-report.html

# Duration: 30-60 minutes
# Results: full-scan-report.html
```

**Scan Configuration (GUI):**
1. Tools → Options → Active Scan
2. Number of hosts scanned concurrently: 5
3. Concurrent scanning threads per host: 10
4. Strength: Medium (High for thoroughness, but takes longer)
5. Delay when scanning (in ms): 0

**Success Criteria:**
- ✅ **Pass:** Zero Critical/High vulnerabilities
- ⚠️ **Review:** <10 Medium vulnerabilities (all documented)
- ℹ️  **Acceptable:** Any number of Low/Info alerts

---

### Scan 3: API-Specific Security Testing

**Objective:** Validate REST API security (authentication, authorization, injection)

**Setup API Definition (OpenAPI/Swagger):**
```yaml
# Save as: api-definition.yaml (if you have Swagger docs)
openapi: 3.0.0
info:
  title: VQMethod API
  version: 1.0.0
servers:
  - url: http://localhost:4000/api
paths:
  /auth/login:
    post:
      summary: User login
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                password:
                  type: string
  /literature/search/public:
    post:
      summary: Search academic papers
      # ... etc
```

**Execution with ZAP API Scan:**
```bash
docker run -v $(pwd):/zap/wrk/:rw \
  -t zaproxy/zap-stable \
  zap-api-scan.py \
  -t http://host.docker.internal:4000/api \
  -f openapi \
  -d api-definition.yaml \
  -r api-scan-report.html

# If no OpenAPI spec, use manual exploration:
# ZAP will spider the API and test all discovered endpoints
```

**Manual API Testing Checklist:**

- [ ] **Broken Authentication**
  ```bash
  # Test 1: Try accessing protected endpoint without token
  curl http://localhost:4000/api/papers
  # Expected: 401 Unauthorized

  # Test 2: Try with invalid token
  curl -H "Authorization: Bearer invalid_token" \
    http://localhost:4000/api/papers
  # Expected: 401 Unauthorized

  # Test 3: Try with expired token
  # (Use token from >1 hour ago if JWT expiry is 1h)
  curl -H "Authorization: Bearer expired_token" \
    http://localhost:4000/api/papers
  # Expected: 401 Unauthorized
  ```

- [ ] **Broken Authorization (IDOR)**
  ```bash
  # Test: Try accessing another user's paper
  # 1. Login as User A, create paper, note paper ID
  # 2. Login as User B
  # 3. Try to GET User A's paper
  curl -H "Authorization: Bearer user_b_token" \
    http://localhost:4000/api/papers/user_a_paper_id
  # Expected: 403 Forbidden or 404 Not Found
  ```

- [ ] **SQL Injection**
  ```bash
  # Test: Malicious input in search query
  curl -X POST http://localhost:4000/api/literature/search/public \
    -H "Content-Type: application/json" \
    -d '{"query":"test'\'' OR 1=1--","sources":["arxiv"],"limit":10}'
  # Expected: 200 OK (Prisma ORM should sanitize)
  # Verify: Response should treat as literal string, not execute SQL
  ```

- [ ] **XSS (Cross-Site Scripting)**
  ```bash
  # Test: Script injection in paper title
  curl -X POST http://localhost:4000/api/papers \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "title":"<script>alert(\"XSS\")</script>",
      "authors":["Test"],
      "year":2024,
      "abstract":"Test"
    }'
  # Expected: 201 Created (stored)
  # Verify: Frontend should HTML-escape the title, not execute script
  ```

- [ ] **Rate Limiting**
  ```bash
  # Test: Rapid-fire requests
  for i in {1..100}; do
    curl -X POST http://localhost:4000/api/literature/search/public \
      -H "Content-Type: application/json" \
      -d '{"query":"test","sources":["arxiv"],"limit":10}' &
  done
  wait
  # Expected: Some 429 Too Many Requests responses
  ```

---

## Part 3: Manual Security Testing (60 minutes)

### OWASP Top 10 Validation Checklist

#### 1. Broken Access Control

**Test Scenario:** Vertical privilege escalation

```bash
# Create regular user account
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"attacker@test.com",
    "password":"Test123!",
    "name":"Attacker"
  }'

# Login and get token
ATTACKER_TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"attacker@test.com","password":"Test123!"}' \
  | jq -r '.accessToken')

# Try to access admin-only endpoint (if exists)
curl -H "Authorization: Bearer $ATTACKER_TOKEN" \
  http://localhost:4000/api/admin/users
# Expected: 403 Forbidden

# Try to modify another user's data
curl -X PATCH http://localhost:4000/api/users/other_user_id \
  -H "Authorization: Bearer $ATTACKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacked"}'
# Expected: 403 Forbidden or 404 Not Found
```

**Result:**
- [ ] ✅ PASS: All unauthorized access attempts blocked
- [ ] ❌ FAIL: Able to access other users' data

---

#### 2. Cryptographic Failures

**Test Scenario:** Verify encryption and hashing

```bash
# Check if HTTPS is enforced (production only)
curl -I http://localhost:3000
# Expected: 301 Redirect to https:// (in production)

# Verify password is hashed (not plaintext)
# 1. Register a new user with password "TestPassword123"
# 2. Check database:
psql -d vqmethod_db -c \
  "SELECT email, password FROM users WHERE email='test@vqmethod.com';"

# Expected output:
#     email          |                   password
# -------------------+------------------------------------------------
#  test@vqmethod.com | $2b$10$abcdef...xyz (bcrypt hash)
#
# ❌ FAIL if password is plaintext: TestPassword123
```

**Result:**
- [ ] ✅ PASS: Passwords are bcrypt hashed
- [ ] ✅ PASS: Sensitive data not in logs
- [ ] ❌ FAIL: Plaintext passwords found

---

#### 3. Injection Attacks

**Test Scenario:** Comprehensive injection testing

```bash
# SQL Injection
curl -X POST http://localhost:4000/api/literature/search/public \
  -H "Content-Type: application/json" \
  -d '{"query":"test'\'' UNION SELECT * FROM users--","sources":["arxiv"]}'

# NoSQL Injection (if using MongoDB)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":{"$ne":null}}'

# Command Injection
curl -X POST http://localhost:4000/api/papers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"test; ls -la","authors":["test"],"year":2024}'

# LDAP Injection (if using LDAP auth)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"*)(uid=*))(|(uid=*","password":"test"}'
```

**Result:**
- [ ] ✅ PASS: All injection attempts sanitized/blocked
- [ ] ❌ FAIL: Injection successful (CRITICAL - fix immediately)

---

#### 4. Insecure Design

**Test Scenario:** Business logic vulnerabilities

```bash
# Excessive data exposure
curl -X GET http://localhost:4000/api/users/me \
  -H "Authorization: Bearer $TOKEN"

# Expected: Returns ONLY current user's data (email, name, id)
# ❌ FAIL: Returns sensitive fields (password hash, resetToken, etc.)

# Account enumeration
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@test.com"}'

# Expected: Generic message "If email exists, reset link sent"
# ❌ FAIL: "Email not found" (allows attacker to enumerate users)
```

**Result:**
- [ ] ✅ PASS: No excessive data exposure
- [ ] ✅ PASS: No account enumeration
- [ ] ❌ FAIL: Business logic flaws found

---

#### 5. Security Misconfiguration

**Test Scenario:** Secure headers and configuration

```bash
# Check security headers
curl -I http://localhost:3000 | grep -E 'X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security|Content-Security-Policy'

# Expected headers:
#  X-Frame-Options: DENY
#  X-Content-Type-Options: nosniff
#  Strict-Transport-Security: max-age=31536000; includeSubDomains
#  Content-Security-Policy: default-src 'self'; ...

# Check for directory listing
curl http://localhost:4000/api
# Expected: 404 or specific route, NOT file listing

# Check for stack traces in errors
curl -X POST http://localhost:4000/api/papers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}'

# Expected: Generic error "Bad Request"
# ❌ FAIL: Stack trace leaked (at Object.validate (/app/dist/...))
```

**Result:**
- [ ] ✅ PASS: All security headers present
- [ ] ✅ PASS: No stack traces leaked
- [ ] ⚠️ WARNING: Some headers missing (document and fix)

---

#### 6. Vulnerable and Outdated Components

**Test Scenario:** Dependency vulnerability scan

```bash
cd backend
npm audit

# Expected output:
# found 0 vulnerabilities
#
# ⚠️  ACCEPTABLE: 0-3 low severity in dev dependencies
# ❌ FAIL: Any high/critical in production dependencies

cd ../frontend
npm audit

# Same criteria
```

**Also check:**
```bash
# Check Node.js version
node --version
# Expected: v18.x or v20.x (LTS versions)

# Check npm version
npm --version
# Expected: v9.x or v10.x
```

**Result:**
- [ ] ✅ PASS: 0 critical/high vulnerabilities
- [ ] ⚠️ WARNING: 1-3 medium vulnerabilities (document)
- [ ] ❌ FAIL: Critical/high vulnerabilities (fix before production)

---

#### 7. Identification and Authentication Failures

**Test Scenario:** Weak authentication

```bash
# Test 1: Weak password acceptance
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"weak@test.com","password":"123","name":"Test"}'

# Expected: 400 Bad Request (password too weak)
# ❌ FAIL: 201 Created (weak password accepted)

# Test 2: Brute force protection
for i in {1..20}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@vqmethod.com","password":"wrong"}' &
done
wait

# Expected: Rate limit 429 after 5-10 attempts
# ❌ FAIL: No rate limiting, all 20 attempts processed

# Test 3: Session fixation
# (Complex test, requires manual verification of session tokens)
```

**Result:**
- [ ] ✅ PASS: Strong password policy enforced
- [ ] ✅ PASS: Brute force protection active
- [ ] ❌ FAIL: Weak authentication found

---

#### 8. Software and Data Integrity Failures

**Test Scenario:** Insecure dependencies and updates

```bash
# Check if using official npm packages (not typosquatting)
cd backend
npm list --depth=0 | grep -E 'prisma|nestjs|bcrypt|jsonwebtoken'

# Verify package integrity
npm audit signatures

# Check for unsigned commits (if using Git)
git log --show-signature | grep -A 2 "Signature"

# Expected: All commits signed or policy allows unsigned
```

**Result:**
- [ ] ✅ PASS: All dependencies from official sources
- [ ] ✅ PASS: Package signatures verified
- [ ] ℹ️  INFO: Unsigned commits (acceptable for now)

---

#### 9. Security Logging and Monitoring Failures

**Test Scenario:** Verify security events are logged

```bash
# Check if failed login attempts are logged
# 1. Attempt failed login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@vqmethod.com","password":"wrong"}'

# 2. Check logs
tail -n 50 backend/logs/app.log | grep -i "login"

# Expected: Log entry with failed attempt
# [2025-10-29 12:34:56] WARN: Failed login attempt for test@vqmethod.com

# Check if security events trigger alerts (manual verification)
# - Failed authentication
# - Authorization failures
# - Input validation errors
# - Rate limit hits
```

**Result:**
- [ ] ✅ PASS: Security events logged
- [ ] ⚠️ WARNING: Logging exists but incomplete
- [ ] ❌ FAIL: No security logging

---

#### 10. Server-Side Request Forgery (SSRF)

**Test Scenario:** SSRF attack via user-controlled URLs

```bash
# Test: If application fetches URLs (e.g., video captions)
curl -X POST http://localhost:4000/api/videos/fetch-captions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://169.254.169.254/latest/meta-data/iam/security-credentials/"}'

# Expected: 400 Bad Request (URL validation failed)
# ❌ FAIL: 200 OK (SSRF successful, can access internal metadata)

# Test: Internal network scanning
curl -X POST http://localhost:4000/api/videos/fetch-captions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:6379"}'

# Expected: 400 Bad Request (localhost blocked)
# ❌ FAIL: Connection attempt logged (SSRF vulnerability)
```

**Result:**
- [ ] ✅ PASS: SSRF attempts blocked
- [ ] ⚠️ WARNING: URL validation exists but incomplete
- [ ] ❌ FAIL: SSRF vulnerability found

---

## Part 4: Security Test Results Template

```markdown
# Security Test Results - [Date]

## Executive Summary

**Overall Risk Level:** [LOW / MEDIUM / HIGH / CRITICAL]

**Vulnerabilities Found:**
- Critical: 0 ✅
- High: 0 ✅
- Medium: 2 ⚠️
- Low: 5 ℹ️
- Info: 12 ℹ️

**Production Readiness:** [YES / NO / CONDITIONAL]

---

## Detailed Findings

### Critical Vulnerabilities (P0 - Fix Immediately)

*None found ✅*

---

### High Vulnerabilities (P1 - Fix Before Production)

*None found ✅*

---

### Medium Vulnerabilities (P2 - Fix Within 30 Days)

#### VULN-001: Content Security Policy Not Set
- **Severity:** Medium
- **CVSS Score:** 5.3
- **Affected:** Frontend (http://localhost:3000)
- **Description:** Missing Content-Security-Policy header allows inline scripts
- **Impact:** Increased XSS risk if input sanitization fails
- **Remediation:**
  ```typescript
  // next.config.js
  const securityHeaders = [
    {
      key: 'Content-Security-Policy',
      value: "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
    }
  ];
  ```
- **Status:** Documented, fix scheduled

#### VULN-002: X-Frame-Options Not Set
- **Severity:** Medium
- **CVSS Score:** 4.3
- **Affected:** Frontend
- **Description:** Missing X-Frame-Options header allows clickjacking
- **Impact:** Site can be embedded in malicious iframe
- **Remediation:**
  ```typescript
  headers: [
    { key: 'X-Frame-Options', value: 'DENY' }
  ]
  ```
- **Status:** Documented, fix scheduled

---

### Low/Info Findings (P3 - Backlog)

- INFO-001: Server version disclosed in headers
- INFO-002: Verbose error messages in development
- LOW-003: No HSTS header (HTTPS not enforced)
- ... (truncated)

---

## Compliance Status

### OWASP Top 10 (2021)

1. ✅ Broken Access Control - PASS
2. ✅ Cryptographic Failures - PASS
3. ✅ Injection - PASS (Prisma ORM protection)
4. ✅ Insecure Design - PASS
5. ⚠️  Security Misconfiguration - PARTIAL (missing CSP, HSTS)
6. ✅ Vulnerable Components - PASS (0 critical/high)
7. ✅ Authentication Failures - PASS
8. ✅ Data Integrity Failures - PASS
9. ⚠️  Logging Failures - PARTIAL (incomplete logging)
10. ✅ SSRF - PASS (URL validation in place)

**Overall Compliance:** 80% (8/10 PASS, 2/10 PARTIAL)

---

## Recommendations

### Immediate Actions (Before Production)
1. Add Content-Security-Policy header
2. Add X-Frame-Options header
3. Add Strict-Transport-Security header
4. Enhance security event logging

### Short-term (30 days)
1. Implement security monitoring alerts
2. Add automated security scanning to CI/CD
3. Conduct penetration testing by third party

### Long-term (90 days)
1. Annual security audit
2. Bug bounty program
3. Security awareness training for dev team
```

---

## Next Steps

After completing security testing:
1. Document all findings in GitHub Issues with severity labels
2. Prioritize fixes (P0 immediate, P1 before production, P2 within 30 days)
3. Implement automated security scanning in CI/CD pipeline
4. Proceed to Browser Compatibility Testing

**Stage 3 Security Testing Status:** [ ] Complete [ ] Needs Remediation

---

**Testing Guide Version:** 1.0
**Last Updated:** October 29, 2025
**Owner:** Phase 10 Day 5.7 Stage 3
