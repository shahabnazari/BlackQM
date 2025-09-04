# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Features

### 1. Authentication & Authorization
- JWT-based authentication with refresh tokens
- Two-factor authentication (2FA) support
- Role-based access control (RBAC)
- Session management with secure cookies

### 2. File Upload Security
- **ClamAV virus scanning** on all uploaded files
- MIME type validation using magic bytes
- File size restrictions (10MB default)
- Executable file detection and blocking
- Metadata stripping from images
- Quarantine system for infected files

### 3. Rate Limiting
- Global rate limiting: 100 requests/minute
- Authentication endpoints: 5 attempts/15 minutes
- File uploads: 5 uploads/minute, 10 uploads/hour
- Configurable per-endpoint limits

### 4. CSRF Protection
- CSRF tokens for state-changing operations
- SameSite cookie attributes
- Double-submit cookie pattern

### 5. Security Headers
- Helmet.js integration for security headers
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)

### 6. Input Validation & Sanitization
- Request validation using class-validator
- SQL injection prevention via Prisma ORM
- XSS protection through template escaping
- Path traversal prevention

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

1. **DO NOT** create a public GitHub issue
2. Email security details to: security@vqmethod.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline
- Initial response: Within 48 hours
- Status update: Within 5 business days
- Resolution target: 30 days for critical issues

## Security Checklist for Developers

### Before Committing Code
- [ ] No hardcoded secrets or API keys
- [ ] Input validation implemented
- [ ] Authentication required for sensitive endpoints
- [ ] Rate limiting applied where appropriate
- [ ] Error messages don't leak sensitive information

### File Upload Checklist
- [ ] File type validation
- [ ] Size limits enforced
- [ ] Virus scanning enabled
- [ ] Files stored outside web root
- [ ] Access control implemented

### Deployment Checklist
- [ ] Environment variables properly configured
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Database connections use SSL
- [ ] Logs don't contain sensitive data

## Dependencies

Regular dependency updates are crucial for security:
- Run `npm audit` weekly
- Update dependencies monthly
- Critical security updates within 48 hours

## Monitoring & Logging

### What We Log
- Authentication attempts
- File upload activities
- Access to sensitive resources
- Rate limit violations
- Security exceptions

### What We DON'T Log
- Passwords (even hashed)
- Credit card information
- Personal identification numbers
- Session tokens
- CSRF tokens

## Compliance

This application implements security controls aligned with:
- OWASP Top 10
- GDPR requirements for data protection
- HIPAA guidelines for research data (where applicable)

## Security Tools Integration

### CI/CD Pipeline
- Automated security scanning on every commit
- OWASP dependency checks
- ClamAV virus scanning tests
- npm audit for vulnerabilities

### Local Development
Run security checks locally:
```bash
# Install ClamAV
./scripts/setup-clamav.sh

# Run security audit
npm audit

# Check for vulnerabilities
npm run security:check
```

## Contact

For security concerns, contact:
- Security Team: security@vqmethod.com
- Project Maintainer: admin@vqmethod.com

---

Last Updated: 2025-09-03
Version: 1.0.0