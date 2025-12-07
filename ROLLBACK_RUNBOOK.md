# Phase 10.93 Day 7 - Rollback Runbook

**Document:** Emergency Rollback Procedures for Theme Extraction Feature
**Version:** 1.0
**Date:** November 18, 2025
**Status:** Production-Ready
**Audience:** On-Call Engineers, SREs, DevOps

---

## 🚨 EMERGENCY ROLLBACK - QUICK START

If theme extraction is experiencing critical errors, follow this 3-step procedure:

### Immediate Rollback (< 2 minutes)

```bash
# Step 1: Set feature flag to false
echo "NEXT_PUBLIC_USE_NEW_THEME_EXTRACTION=false" >> frontend/.env.local

# Step 2: Restart Next.js server
pm2 restart vqmethod-frontend
# OR if using systemd:
# sudo systemctl restart vqmethod-frontend

# Step 3: Verify rollback
curl -I https://vqmethod.com/discover/literature
# Should return 200 OK
```

**Expected Result:** Old monolithic implementation is now active. Users can continue working.

**Monitor:** Check error rate drops within 5 minutes.

---

## 📋 TABLE OF CONTENTS

1. [When to Rollback](#when-to-rollback)
2. [Rollback Triggers](#rollback-triggers)
3. [Pre-Rollback Checklist](#pre-rollback-checklist)
4. [Rollback Procedures](#rollback-procedures)
5. [Post-Rollback Verification](#post-rollback-verification)
6. [Communication Templates](#communication-templates)
7. [Troubleshooting](#troubleshooting)
8. [Recovery (Rolling Forward)](#recovery-rolling-forward)

---

## 🎯 WHEN TO ROLLBACK

Rollback the theme extraction feature if:

### Critical (Immediate Rollback Required)

- ✅ Error rate > 10% for theme extraction workflow
- ✅ P95 response time > 30s (vs baseline 5s)
- ✅ Database connection pool exhaustion
- ✅ Memory leak detected (heap size growing unbounded)
- ✅ Cascading failures in dependent services
- ✅ Data corruption detected in saved papers

### High Priority (Rollback Within 15 Minutes)

- ⚠️ Error rate 5-10%
- ⚠️ P95 response time 10-30s
- ⚠️ Increased customer support tickets
- ⚠️ Silent failures (no errors but no results)

### Medium Priority (Investigate First)

- 🔍 Error rate 2-5%
- 🔍 Intermittent failures
- 🔍 Specific edge case failures

---

## 🔔 ROLLBACK TRIGGERS

Automated monitoring should trigger alerts for:

### Error Rate Threshold

```
ERROR_RATE = (failed_extractions / total_extractions) * 100

Alert if ERROR_RATE > 5% for 5 consecutive minutes
Rollback if ERROR_RATE > 10% for 2 consecutive minutes
```

### Response Time Threshold

```
P95_RESPONSE_TIME = 95th percentile extraction duration

Alert if P95_RESPONSE_TIME > 10s
Rollback if P95_RESPONSE_TIME > 30s
```

### Memory Leak Detection

```
MEMORY_GROWTH_RATE = (current_heap - baseline_heap) / time_elapsed

Alert if MEMORY_GROWTH_RATE > 10MB/minute
Rollback if MEMORY_GROWTH_RATE > 50MB/minute
```

---

## ✅ PRE-ROLLBACK CHECKLIST

Before initiating rollback, verify:

- [ ] **Incident Confirmed:** Multiple users affected, not isolated issue
- [ ] **Monitoring Data Collected:** Capture error logs, metrics, traces
- [ ] **Team Notified:** Alert #incidents channel on Slack
- [ ] **Backup Verified:** Old implementation code is available
- [ ] **Database Backup:** Recent backup exists (< 1 hour old)
- [ ] **Rollback Authorization:** Obtained from on-call manager (if time permits)

**Note:** In emergency (data loss risk), proceed with rollback immediately and notify team concurrently.

---

## 🔄 ROLLBACK PROCEDURES

### Procedure 1: Environment Variable Rollback (Recommended)

**Duration:** 2-3 minutes
**Downtime:** ~30 seconds (server restart)
**Risk Level:** Low

#### Step-by-Step

**1. SSH into production server:**

```bash
ssh user@production-server.vqmethod.com
```

**2. Navigate to frontend directory:**

```bash
cd /var/www/vqmethod/frontend
```

**3. Backup current .env.local:**

```bash
cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
```

**4. Set rollback flag:**

```bash
# Option A: Using sed (recommended)
sed -i 's/NEXT_PUBLIC_USE_NEW_THEME_EXTRACTION=true/NEXT_PUBLIC_USE_NEW_THEME_EXTRACTION=false/' .env.local

# Option B: Using echo
echo "NEXT_PUBLIC_USE_NEW_THEME_EXTRACTION=false" >> .env.local
```

**5. Verify change:**

```bash
grep "USE_NEW_THEME_EXTRACTION" .env.local
# Should output: NEXT_PUBLIC_USE_NEW_THEME_EXTRACTION=false
```

**6. Restart Next.js server:**

```bash
# PM2
pm2 restart vqmethod-frontend

# OR Systemd
sudo systemctl restart vqmethod-frontend

# OR Docker
docker-compose restart frontend
```

**7. Verify service is up:**

```bash
curl -I https://vqmethod.com/discover/literature
# Should return: HTTP/2 200
```

**8. Check logs for errors:**

```bash
tail -f /var/log/vqmethod/frontend.log
# OR
pm2 logs vqmethod-frontend --lines 50
```

**9. Verify rollback in browser:**

- Open browser console
- Navigate to https://vqmethod.com/discover/literature
- Check console output: `[ThemeExtraction] Using OLD implementation`

**10. Monitor error rate:**

```bash
# Check Grafana dashboard
# OR query logs
grep "ThemeExtraction" /var/log/vqmethod/frontend.log | tail -100
```

---

### Procedure 2: Load Balancer Rollback (Zero Downtime)

**Duration:** 5-10 minutes
**Downtime:** 0 seconds (gradual rollout)
**Risk Level:** Very Low

#### Step-by-Step

**1. Update load balancer configuration:**

Route new requests to server pool with old implementation.

**2. Drain active connections:**

Wait 2-5 minutes for in-progress requests to complete.

**3. Update all servers:**

Follow Procedure 1 on each server.

**4. Restore load balancer:**

Route requests back to updated servers.

---

### Procedure 3: Database-Level Rollback (If Data Corruption)

**Duration:** 10-30 minutes
**Downtime:** 5-10 minutes
**Risk Level:** High (use only if data corruption detected)

#### Step-by-Step

**1. Stop application:**

```bash
pm2 stop vqmethod-frontend
```

**2. Restore database backup:**

```bash
pg_restore -d vqmethod_production /backups/vqmethod_$(date +%Y%m%d).dump
```

**3. Verify data integrity:**

```bash
psql -d vqmethod_production -c "SELECT COUNT(*) FROM papers;"
```

**4. Apply Procedure 1:**

Follow environment variable rollback steps above.

**5. Restart application:**

```bash
pm2 start vqmethod-frontend
```

---

## ✅ POST-ROLLBACK VERIFICATION

After rollback, verify system stability:

### Functional Verification (5 minutes)

- [ ] **Login:** Test user authentication
- [ ] **Search:** Search for papers successfully
- [ ] **Selection:** Select papers without errors
- [ ] **Extraction:** Start theme extraction (should use old implementation)
- [ ] **Results:** Verify extraction completes successfully
- [ ] **Database:** Check papers are saved correctly

### Monitoring Verification (15 minutes)

- [ ] **Error Rate:** < 1% (should drop within 5 minutes)
- [ ] **Response Time:** P95 < 5s
- [ ] **Memory Usage:** Stable (no growth)
- [ ] **CPU Usage:** < 50%
- [ ] **Database Connections:** < 80% of pool size
- [ ] **Logs:** No critical errors

### User Verification (30 minutes)

- [ ] **Support Tickets:** No new tickets related to extraction
- [ ] **User Sessions:** Active users can complete workflows
- [ ] **Analytics:** Extraction success rate > 95%

---

## 📣 COMMUNICATION TEMPLATES

### Internal Notification (Slack #incidents)

```
🚨 INCIDENT: Theme Extraction Rollback

Status: IN PROGRESS
Trigger: [Error rate 15% / P95 response time 45s / etc.]
Action: Rolling back to old implementation (Procedure 1)
Impact: Users may experience brief 30s downtime
ETA: 5 minutes
On-Call: @your-name

Monitoring:
- Grafana: [link]
- Logs: [link]
- Error Rate: [before/after]
```

### User Notification (Status Page)

```
🔧 Investigating Theme Extraction Issues

We're currently investigating issues with our theme extraction feature.
Some users may experience slow performance or errors.

Status: Investigating → Identified → Mitigating → Resolved
Updated: [timestamp]
Next Update: [timestamp + 15 min]

For urgent support, contact: support@vqmethod.com
```

### Post-Incident Report Template

```
## Incident Report: Theme Extraction Rollback

**Date:** [timestamp]
**Duration:** [start time] - [end time] ([duration])
**Severity:** [Critical/High/Medium]
**Impact:** [number of users affected]

**Root Cause:**
[Brief description of what caused the need for rollback]

**Timeline:**
- [HH:MM] - Issue detected (monitoring alert)
- [HH:MM] - On-call engineer paged
- [HH:MM] - Rollback initiated
- [HH:MM] - Rollback completed
- [HH:MM] - Service restored
- [HH:MM] - Incident resolved

**Rollback Procedure Used:** Procedure [1/2/3]

**Resolution:**
[What was done to resolve the incident]

**Verification:**
- Error rate: [before] → [after]
- Response time: [before] → [after]
- User impact: [number of users] for [duration]

**Action Items:**
- [ ] Root cause analysis
- [ ] Fix issue in new implementation
- [ ] Add monitoring for [specific metric]
- [ ] Update runbook with lessons learned
- [ ] Schedule postmortem meeting

**Follow-Up:**
- Owner: [name]
- Due Date: [date]
```

---

## 🔧 TROUBLESHOOTING

### Issue: Rollback Completed But Errors Continue

**Possible Causes:**
1. Cache not cleared
2. Old implementation also has issues
3. Database state issue

**Resolution:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
pm2 restart vqmethod-frontend

# Clear Redis cache
redis-cli FLUSHDB

# Check database connections
psql -d vqmethod_production -c "SELECT count(*) FROM pg_stat_activity;"
```

### Issue: Server Won't Restart After Rollback

**Possible Causes:**
1. Syntax error in .env.local
2. Port already in use
3. Insufficient permissions

**Resolution:**
```bash
# Check syntax
cat .env.local

# Check port
lsof -i :3000

# Check permissions
ls -la .env.local

# Restart with verbose logging
NODE_ENV=production npm start
```

### Issue: Old Implementation Missing or Corrupted

**Possible Causes:**
1. Code deployment deleted backup
2. Git history issue

**Resolution:**
```bash
# Restore from Git
git checkout main
git log --oneline --grep="backup" -- frontend/lib/hooks/useThemeExtractionWorkflow.old.ts
git checkout <commit-hash> -- frontend/lib/hooks/useThemeExtractionWorkflow.old.ts

# Rebuild
npm run build
pm2 restart vqmethod-frontend
```

---

## 🚀 RECOVERY (ROLLING FORWARD)

After fixing the root cause, roll forward to new implementation:

### Step 1: Verify Fix

```bash
# Run tests locally
npm test

# Run E2E tests
npm run e2e

# Check rollback tests pass
npx playwright test rollback-testing.spec.ts
```

### Step 2: Gradual Rollout

```bash
# Stage 1: 10% of users
NEXT_PUBLIC_USE_NEW_THEME_EXTRACTION=true (on 1 of 10 servers)

# Monitor for 1 hour
# If stable, proceed to Stage 2

# Stage 2: 50% of users
NEXT_PUBLIC_USE_NEW_THEME_EXTRACTION=true (on 5 of 10 servers)

# Monitor for 2 hours
# If stable, proceed to Stage 3

# Stage 3: 100% of users
NEXT_PUBLIC_USE_NEW_THEME_EXTRACTION=true (on all servers)
```

### Step 3: Monitor

- Error rate < 1%
- P95 response time < 5s
- No memory leaks
- No critical errors

### Step 4: Remove Rollback Code

After new implementation stable for 1 week:

```bash
# Remove old implementation
rm frontend/lib/hooks/useThemeExtractionWorkflow.old.ts

# Remove feature flag wrapper
rm frontend/lib/hooks/useThemeExtractionWorkflow.wrapper.ts

# Update imports in page.tsx
# (use new implementation directly)
```

---

## 📞 CONTACTS

**On-Call Rotation:**
- Primary: [PagerDuty rotation]
- Secondary: [Backup on-call]

**Escalation:**
- Engineering Manager: [name] [phone]
- CTO: [name] [phone]

**External:**
- Hosting Provider: [AWS/GCP support]
- Database Provider: [support contact]

---

## 📚 REFERENCES

- **Feature Flag Config:** `frontend/lib/config/feature-flags.ts`
- **Rollback Tests:** `frontend/e2e/rollback-testing.spec.ts`
- **Monitoring Dashboard:** [Grafana URL]
- **Error Logs:** [Sentry/Splunk URL]
- **Phase Tracker:** `Main Docs/PHASE_TRACKER_PART4.md` (Phase 10.93 Day 7)

---

## 📝 CHANGELOG

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-18 | 1.0 | Initial runbook created | Claude |

---

**Last Updated:** November 18, 2025
**Next Review:** December 18, 2025
**Owner:** Platform Engineering Team
