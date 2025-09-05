# 🚀 VQMethod Quick Start

## Start Development (Conflict-Free)

```bash
npm run dev:safe
```

This single command handles everything - port conflicts, allocation, and starting all services.

## Manual Commands

```bash
npm run ports:check     # Check for conflicts
npm run ports:list      # See all projects using ports
npm run ports:clean     # Clean inactive projects
```

## URLs (After Starting)

- Frontend: Check console output (usually http://localhost:3000)
- Backend API: Check console output (usually http://localhost:4000/api)
- API Docs: Check console output (usually http://localhost:4000/api/docs)

## Stop Services

Press `Ctrl+C` in the terminal where services are running.

---

**Never worry about "port already in use" errors again!**
