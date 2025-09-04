#!/usr/bin/env node
/**
 * Phase 1 Thoroughness Test Runner (NO CODE CHANGE)
 * - Parses Lead/IMPLEMENTATION_PHASES.md Phase 1 section
 * - Extracts and evaluates Phase 1 checklists
 * - Cross-validates critical filesystem requirements for Phase 1
 * - Exits non-zero if Phase 1 is not thoroughly complete
 */

import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import url from 'url';

const cwd = process.cwd();
const r = (...p) => path.resolve(cwd, ...p);

// Simple chalk-less coloring for portability
const colors = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`
};

function header(title) {
  console.log(`\n${colors.bold(colors.cyan(`=== ${title} ===`))}\n`);
}

function lineOK(msg) {
  console.log(`${colors.green('✔')} ${msg}`);
}
function lineWarn(msg) {
  console.log(`${colors.yellow('△')} ${msg}`);
}
function lineFail(msg) {
  console.log(`${colors.red('✖')} ${msg}`);
}

async function readText(filePath) {
  return fs.readFile(filePath, 'utf8');
}

function extractPhaseSection(markdown, phaseTitle) {
  // Extract section starting at "# PHASE 1: FOUNDATION & DESIGN SYSTEM" until the next "# PHASE " header
  const startRe = new RegExp(`^#\\s*${phaseTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'mi');
  const nextPhaseRe = /^#\s*PHASE\s+\d+:/mi;

  const startMatch = markdown.match(startRe);
  if (!startMatch) return null;

  const startIdx = startMatch.index;
  const rest = markdown.slice(startIdx + startMatch[0].length);
  const nextPhaseMatch = rest.match(nextPhaseRe);
  if (!nextPhaseMatch) {
    return markdown.slice(startIdx);
  }
  const endIdx = startIdx + startMatch[0].length + nextPhaseMatch.index;
  return markdown.slice(startIdx, endIdx);
}

function parseCheckboxes(markdownSection) {
  // Matches markdown checkboxes: - [x] item or - [ ] item (and nested)
  const lines = markdownSection.split(/\r?\n/);
  const items = [];
  const checkboxRe = /^\s*-\s*\[([ xX])\]\s+(.*)$/;
  for (const line of lines) {
    const m = line.match(checkboxRe);
    if (m) {
      items.push({
        checked: m[1].toLowerCase() === 'x',
        text: m[2].trim()
      });
    }
  }
  return items;
}

function extractSubsection(markdownSection, subheading) {
  // Extract a subsection by "### <subheading>" or "#### <subheading>"
  const subRe = new RegExp(`^#{2,4}\\s*${subheading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'mi');
  const m = markdownSection.match(subRe);
  if (!m) return null;
  const start = m.index + m[0].length;
  const rest = markdownSection.slice(start);
  const nextHead = rest.search(/^#{2,6}\s+/m);
  if (nextHead === -1) return rest;
  return rest.slice(0, nextHead);
}

// Utility FS checks
async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function fileContains(p, needle) {
  try {
    const content = await fs.readFile(p, 'utf8');
    return content.includes(needle);
  } catch {
    return false;
  }
}

async function readJSON(p) {
  const content = await fs.readFile(p, 'utf8');
  return JSON.parse(content);
}

async function main() {
  header('Phase 1 Thoroughness Tests');

  // 1) Load Lead/IMPLEMENTATION_PHASES.md and extract Phase 1 section
  const phasesPath = r('Lead', 'IMPLEMENTATION_PHASES.md');
  let md;
  try {
    md = await readText(phasesPath);
  } catch (e) {
    lineFail(`Cannot read ${phasesPath}: ${e.message}`);
    process.exit(2);
  }

  const phase1 = extractPhaseSection(md, 'PHASE 1: FOUNDATION & DESIGN SYSTEM');
  if (!phase1) {
    lineFail('Could not locate "PHASE 1: FOUNDATION & DESIGN SYSTEM" section in IMPLEMENTATION_PHASES.md');
    process.exit(2);
  }

  // 2) Parse top-level checkboxes in Phase 1
  const allPhase1Checkboxes = parseCheckboxes(phase1);

  // Focus on key subsection "Files & structure"
  const filesStructSection = extractSubsection(phase1, 'Files & structure');
  const filesStructChecks = filesStructSection ? parseCheckboxes(filesStructSection) : [];

  // Focus on "Testing & quality"
  const testingQualitySection = extractSubsection(phase1, 'Testing & quality');
  const testingQualityChecks = testingQualitySection ? parseCheckboxes(testingQualitySection) : [];

  // Focus on "Demo page"
  const demoPageSection = extractSubsection(phase1, 'Demo page');
  const demoPageChecks = demoPageSection ? parseCheckboxes(demoPageSection) : [];

  // Focus on "Zero-warnings"
  const zeroWarningsSection = extractSubsection(phase1, 'Zero-warnings');
  const zeroWarningsChecks = zeroWarningsSection ? parseCheckboxes(zeroWarningsSection) : [];

  // 3) Filesystem validations for Phase 1
  header('Filesystem Validation (Critical Phase 1 Requirements)');

  const criticalChecks = [];

  // Files & structure
  criticalChecks.push({
    name: 'frontend/styles/tokens.css exists',
    type: 'file',
    path: r('frontend', 'styles', 'tokens.css'),
  });
  criticalChecks.push({
    name: 'frontend/app/globals.css exists',
    type: 'file',
    path: r('frontend', 'app', 'globals.css'),
  });
  criticalChecks.push({
    name: 'frontend/app/globals.css imports tokens.css',
    type: 'content',
    path: r('frontend', 'app', 'globals.css'),
    contains: 'tokens.css'
  });
  criticalChecks.push({
    name: 'frontend/tailwind.config.js exists',
    type: 'file',
    path: r('frontend', 'tailwind.config.js')
  });
  criticalChecks.push({
    name: 'ThemeToggle component exists',
    type: 'dir',
    path: r('frontend', 'components', 'apple-ui', 'ThemeToggle')
  });
  // Apple UI components directories
  for (const comp of ['Button', 'Card', 'Badge', 'TextField', 'ProgressBar']) {
    criticalChecks.push({
      name: `Apple UI component "${comp}" exists`,
      type: 'dir',
      path: r('frontend', 'components', 'apple-ui', comp)
    });
  }
  // Vitest + setup
  criticalChecks.push({
    name: 'Vitest config exists (frontend/vitest.config.ts)',
    type: 'file',
    path: r('frontend', 'vitest.config.ts')
  });
  criticalChecks.push({
    name: 'Test setup exists (frontend/test/setup.ts)',
    type: 'file',
    path: r('frontend', 'test', 'setup.ts')
  });
  // Playwright config
  criticalChecks.push({
    name: 'Playwright config exists (frontend/playwright.config.ts)',
    type: 'file',
    path: r('frontend', 'playwright.config.ts')
  });
  // Scripts in frontend/package.json
  criticalChecks.push({
    name: 'frontend/package.json has scripts: typecheck, build:strict, test, e2e',
    type: 'pkgScripts',
    path: r('frontend', 'package.json'),
    scripts: ['typecheck', 'build:strict', 'test', 'e2e']
  });

  let fsFailures = 0;
  for (const check of criticalChecks) {
    if (check.type === 'file') {
      // must be a file that exists
      const ok = await exists(check.path);
      ok ? lineOK(`${check.name} (${path.relative(cwd, check.path)})`)
         : (lineFail(`${check.name} MISSING (${path.relative(cwd, check.path)})`), fsFailures++);
    } else if (check.type === 'dir') {
      const ok = await exists(check.path);
      ok ? lineOK(`${check.name} (${path.relative(cwd, check.path)})`)
         : (lineFail(`${check.name} MISSING (${path.relative(cwd, check.path)})`), fsFailures++);
    } else if (check.type === 'content') {
      const ok = await fileContains(check.path, check.contains);
      ok ? lineOK(`${check.name} (${path.relative(cwd, check.path)})`)
         : (lineFail(`${check.name} does not contain "${check.contains}" (${path.relative(cwd, check.path)})`), fsFailures++);
    } else if (check.type === 'pkgScripts') {
      try {
        const pkg = await readJSON(check.path);
        const missing = [];
        for (const s of check.scripts) {
          if (!pkg.scripts || typeof pkg.scripts[s] !== 'string' || !pkg.scripts[s].trim()) {
            missing.push(s);
          }
        }
        if (missing.length) {
          lineFail(`${check.name} - missing: ${missing.join(', ')} (${path.relative(cwd, check.path)})`);
          fsFailures++;
        } else {
          lineOK(`${check.name} (${path.relative(cwd, check.path)})`);
        }
      } catch (e) {
        lineFail(`${check.name} - cannot read package.json: ${e.message} (${path.relative(cwd, check.path)})`);
        fsFailures++;
      }
    }
  }

  // 4) Report on Phase 1 checklists (from documentation)
  header('Documentation Checklist Status (Phase 1)');

  function summarize(title, checks) {
    if (!checks || checks.length === 0) {
      lineWarn(`${title}: No checkboxes found.`);
      return { total: 0, checked: 0 };
    }
    const total = checks.length;
    const checked = checks.filter(c => c.checked).length;
    console.log(`${colors.bold(title)}: ${checked}/${total} complete`);
    // Show a few failed items for quick view
    const failed = checks.filter(c => !c.checked).slice(0, 10).map(c => ` - ${c.text}`);
    if (failed.length) {
      console.log(colors.gray(failed.join('\n')));
    }
    return { total, checked };
  }

  const sumFiles = summarize('Files &amp; structure', filesStructChecks);
  const sumTesting = summarize('Testing &amp; quality', testingQualityChecks);
  const sumDemo = summarize('Demo page', demoPageChecks);
  const sumZeroWarn = summarize('Zero-warnings', zeroWarningsChecks);

  // Aggregate: all checkboxes in Phase 1
  const totalAll = allPhase1Checkboxes.length;
  const checkedAll = allPhase1Checkboxes.filter(c => c.checked).length;
  console.log(`${colors.bold('All Phase 1 checkboxes')}: ${checkedAll}/${totalAll} complete`);
  if (totalAll > 0 && checkedAll < totalAll) {
    const remaining = allPhase1Checkboxes.filter(c => !c.checked).map(c => ` - ${c.text}`).join('\n');
    if (remaining) console.log(colors.gray(remaining));
  }

  // 5) Determine pass/fail criteria for "Phase 1 thoroughly completed"
  // Policy:
  // - All critical filesystem checks must pass
  // - Files &amp; structure doc checklist should be fully checked
  // - Testing &amp; quality should have majority completed (>= 80%) for "thorough" (config + scripts must exist anyway)
  // - Demo page should be fully checked
  // - Zero-warnings ideally complete; allow small gap but warn (does not block)
  //
  // These thresholds can be tuned; here we choose strict on Files &amp; structure and Demo page, moderately strict on Testing &amp; quality.

  let hardFailures = 0;
  if (fsFailures > 0) {
    hardFailures += fsFailures;
  }

  if (sumFiles.total > 0 && sumFiles.checked < sumFiles.total) {
    lineFail('Documentation "Files &amp; structure" is not fully complete.');
    hardFailures++;
  }

  if (sumDemo.total > 0 && sumDemo.checked < sumDemo.total) {
    lineFail('Documentation "Demo page" is not fully complete.');
    hardFailures++;
  }

  // Fail fast if any Phase 1 checklist items remain unchecked
  if (totalAll > 0 && checkedAll < totalAll) {
    lineFail('Not all Phase 1 checklist items are checked in documentation.');
    hardFailures++;
  }

  // Testing &amp; quality threshold: at least 80%
  const testingPct = sumTesting.total ? (sumTesting.checked / sumTesting.total) * 100 : 0;
  if (sumTesting.total > 0 && testingPct < 80) {
    lineWarn(`"Testing &amp; quality" completion ${testingPct.toFixed(1)}% < 80% threshold for thoroughness.`);
  } else if (sumTesting.total > 0) {
    lineOK(`"Testing &amp; quality" completion ${testingPct.toFixed(1)}% meets threshold.`);
  }

  if (sumZeroWarn.total > 0 && sumZeroWarn.checked < sumZeroWarn.total) {
    lineWarn('"Zero-warnings" checklist not fully complete.');
  }

  // 6) Final verdict
  header('Final Verdict');
  if (hardFailures > 0) {
    lineFail('Phase 1 is NOT thoroughly completed based on documentation and filesystem checks.');
    process.exit(1);
  } else {
    lineOK('Phase 1 appears thoroughly completed based on documentation and filesystem checks.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
