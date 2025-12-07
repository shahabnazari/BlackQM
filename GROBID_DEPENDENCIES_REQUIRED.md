# GROBID IMPLEMENTATION - REQUIRED NPM DEPENDENCIES

**Phase 10.94 - Critical Dependencies**

---

## Backend Dependencies Required

The following NPM packages must be installed in the backend for GROBID integration to work:

### **1. fast-xml-parser** (Required)

**Purpose:** Parse GROBID's TEI XML response into JavaScript objects

```bash
cd backend
npm install fast-xml-parser@^4.3.2
```

**Used in:** `backend/src/modules/literature/services/grobid-extraction.service.ts`

**Documentation:** https://github.com/NaturalIntelligence/fast-xml-parser

**Why this version:** v4.3.2+ has the parsing options we need (ignoreAttributes, trimValues, etc.)

---

### **2. form-data** (Required)

**Purpose:** Create multipart/form-data requests to send PDFs to GROBID API

```bash
cd backend
npm install form-data@^4.0.0
```

**Used in:** `backend/src/modules/literature/services/grobid-extraction.service.ts`

**Documentation:** https://github.com/form-data/form-data

**Why this package:** GROBID API requires multipart/form-data for PDF uploads

---

### **3. @types/form-data** (Required for TypeScript)

**Purpose:** TypeScript type definitions for form-data

```bash
cd backend
npm install --save-dev @types/form-data@^2.5.0
```

**Used in:** TypeScript compilation

**Why needed:** Enables type-safe usage of form-data in TypeScript

---

## Installation Commands

### **Quick Install (All Dependencies)**

```bash
cd backend
npm install fast-xml-parser@^4.3.2 form-data@^4.0.0
npm install --save-dev @types/form-data@^2.5.0
```

### **Verify Installation**

```bash
# Check if packages are in package.json
grep -E "(fast-xml-parser|form-data)" backend/package.json

# Expected output:
# "fast-xml-parser": "^4.3.2",
# "form-data": "^4.0.0",
# "@types/form-data": "^2.5.0"
```

---

## package.json Additions

Add these to your `backend/package.json`:

```json
{
  "dependencies": {
    "fast-xml-parser": "^4.3.2",
    "form-data": "^4.0.0"
  },
  "devDependencies": {
    "@types/form-data": "^2.5.0"
  }
}
```

---

## Existing Dependencies (Already Present)

These dependencies are already in the project and used by GROBID integration:

- **axios** - HTTP client (for downloading PDFs and calling GROBID API)
- **@nestjs/axios** - NestJS wrapper for axios
- **@nestjs/common** - NestJS core decorators
- **@nestjs/config** - Configuration service

---

## Verification

After installing dependencies, verify the setup:

```bash
# Run verification script
chmod +x scripts/verify-grobid-setup.sh
./scripts/verify-grobid-setup.sh

# Or manually verify
npm list fast-xml-parser
npm list form-data
npm list @types/form-data
```

---

## Troubleshooting

### **Issue: "Cannot find module 'fast-xml-parser'"**

**Solution:**
```bash
cd backend
npm install fast-xml-parser@^4.3.2
```

### **Issue: "Cannot find module 'form-data'"**

**Solution:**
```bash
cd backend
npm install form-data@^4.0.0
```

### **Issue: TypeScript compilation errors with form-data**

**Solution:**
```bash
cd backend
npm install --save-dev @types/form-data@^2.5.0
```

### **Issue: "Module not found" after installing**

**Solution:**
```bash
# Clear node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

## Production Considerations

### **Security:**
- ✅ All packages are from trusted npm sources
- ✅ No known critical vulnerabilities (as of Jan 2025)
- ✅ Regular security audits recommended: `npm audit`

### **Performance:**
- `fast-xml-parser` is highly optimized for large XML files
- `form-data` uses streams for efficient file uploads
- Both packages are production-ready

### **Maintenance:**
- Update regularly: `npm update fast-xml-parser form-data`
- Check for security advisories: `npm audit`
- Pin versions in production for stability

---

## References

- **fast-xml-parser:** https://github.com/NaturalIntelligence/fast-xml-parser
- **form-data:** https://github.com/form-data/form-data
- **npm documentation:** https://docs.npmjs.com/

---

**Status:** ✅ READY FOR INSTALLATION
**Last Updated:** January 2025
