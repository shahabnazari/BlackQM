# DOCUMENT TOKEN LIMIT POLICY

## 📏 TOKEN LIMIT RULE

**MANDATORY:** All implementation guides and phase documents must adhere to the following token limits to ensure compatibility with Claude's reading capabilities:

### Token Limits
- **Maximum tokens per document:** 22,000 tokens
- **Claude's reading limit:** 25,000 tokens
- **Safety margin:** 3,000 tokens

### Document Splitting Rules

When a document approaches or exceeds 22,000 tokens:

1. **Create a new sequential part:**
   - IMPLEMENTATION_PHASES_PART1.md → PART2.md → PART3.md
   - Development_Implementation_Guide_Part1.md → Part2.md → Part3.md → Part4.md

2. **Split at logical boundaries:**
   - Complete phases or sections
   - Natural content breaks
   - Related functionality groups

3. **Update cross-references:**
   - Update all document references
   - Maintain navigation links
   - Update table of contents

### Token Counting Method
```bash
# Approximate token count (1 token ≈ 4 characters)
wc -c filename.md | awk '{print "~" int($1/4) " tokens"}'

# Check all implementation documents
for file in Lead/*.md; do
  tokens=$(wc -c "$file" | awk '{print int($1/4)}')
  if [ $tokens -gt 22000 ]; then
    echo "⚠️ $file exceeds limit: $tokens tokens"
  else
    echo "✅ $file: $tokens tokens"
  fi
done
```

### Document Header Template
```markdown
# [Document Title]

⚠️ **DOCUMENT SIZE LIMIT:** This document follows the 22,000 token limit policy for Claude compatibility.
**Current Size:** ~[X] tokens (Check: `wc -c filename.md | awk '{print int($1/4)}'`)
**Part:** [X] of [Y]
**Next Part:** [Link to next part if applicable]
**Previous Part:** [Link to previous part if applicable]

[Rest of content...]
```

### Current Document Status (December 2024)

| Document | Tokens | Status | Action Required |
|----------|--------|--------|-----------------|
| IMPLEMENTATION_PHASES_PART1.md | ~17,689 | ✅ OK | Add Phase 6.8 |
| IMPLEMENTATION_PHASES_PART2.md | ~10,031 | ✅ OK | None |
| Development_Implementation_Guide_Part1.md | ~16,450 | ✅ OK | Add Phase 6.8 |
| Development_Implementation_Guide_Part2.md | ~22,833 | ⚠️ OVER | Split required |
| Development_Implementation_Guide_Part3.md | ~17,390 | ✅ OK | Rename to Part5 |

### Splitting Plan for Development_Implementation_Guide_Part2.md

**Current Structure (Parts VI-XIV):**
- Split after Part IX (System Monitoring)
- Part2 will contain: Parts VI-IX (~11,000 tokens)
- New Part4 will contain: Parts X-XIV (~11,000 tokens)
- Current Part3 becomes Part5

---

**Policy Effective Date:** December 2024
**Policy Owner:** Development Team
**Review Frequency:** When any document exceeds 20,000 tokens