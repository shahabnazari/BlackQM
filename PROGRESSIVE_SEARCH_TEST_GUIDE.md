# Progressive Search Test Guide - Phase 10.7 Day 5

## 🎯 Test Objective

Verify that progressive search follows: **Tier 1 Premium → Tier 2 Good → Tier 3 Preprint → Tier 4 Aggregator**

## 📊 Source Tier Allocations

### Tier 1: Premium (600 papers each)
- pubmed, pmc, web_of_science, scopus, nature, springer

### Tier 2: Good (450 papers each)  
- ieee_xplore, sage, taylor_francis, wiley, semantic_scholar

### Tier 3: Preprint (350 papers each)
- arxiv, biorxiv, medrxiv, chemrxiv, ssrn

### Tier 4: Aggregator (400 papers each)
- crossref, eric, google_scholar

## 🧪 Quick Test Procedure

**Step 1: Start Log Monitor**
```bash
tail -f /tmp/backend_restart.log | grep --line-buffered -E "(Progressive|TIER|Premium|Good|Preprint|Aggregator|sufficient|insufficient)"
```

**Step 2: Open Frontend**
- URL: http://localhost:3000/discover/literature

**Step 3: Search**
- Query: "artificial intelligence in healthcare"  
- Sources: Select pubmed, semantic_scholar, arxiv, google_scholar
- Click Search

**Step 4: Watch Logs**
Should see:
```
🎯 Progressive Search Strategy:
   • Tier 1 (Premium): 1 sources
   • Tier 2 (Good): 1 sources
   • Tier 3 (Preprint): 1 sources  
   • Tier 4 (Aggregator): 1 sources

🔍 [TIER 1 - Premium] Searching 1 sources...
📊 [TIER 1 - Premium] Total: X papers

⚠️  Premium sources insufficient
   ⏩ Expanding to Tier 2...

🔍 [TIER 2 - Good] Searching 1 sources...
📊 [TIER 2 - Good] Total: Y papers

✅ Tier 1+2 sufficient: Y papers
   ⏩ Skipping preprint and aggregator sources
```

## ✅ Success Criteria

1. Tier 1 searched FIRST
2. Tier 2 only if < 350 papers
3. Tier 3 only if still < 350
4. Tier 4 last resort only
5. Early termination when sufficient
