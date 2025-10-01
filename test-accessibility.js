#!/usr/bin/env node

/**
 * Accessibility Testing Script
 * Automated testing for WCAG 2.1 AA compliance
 * Run: node test-accessibility.js
 */

const chalk = require('chalk');
const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PAGES_TO_TEST = [
  { url: '/', name: 'Home Page' },
  { url: '/auth/login', name: 'Login Page' },
  { url: '/auth/register', name: 'Register Page' },
  { url: '/dashboard', name: 'Dashboard' },
  { url: '/studies', name: 'Studies List' },
  { url: '/studies/create', name: 'Create Study' },
];

// Color coding for results
const colors = {
  pass: chalk.green,
  fail: chalk.red,
  warning: chalk.yellow,
  info: chalk.cyan,
  header: chalk.bold.blue,
};

// Test results storage
const results = {
  passed: [],
  failed: [],
  warnings: [],
  totalViolations: 0,
  totalPages: PAGES_TO_TEST.length,
};

/**
 * Test keyboard navigation
 */
async function testKeyboardNavigation(page, pageName) {
  console.log(
    colors.info(`\n  Testing keyboard navigation for ${pageName}...`)
  );

  const keyboardTests = [];

  try {
    // Test Tab navigation
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(
      () => document.activeElement?.tagName
    );
    keyboardTests.push({
      test: 'Tab navigation',
      passed: firstFocused !== 'BODY',
      detail:
        firstFocused !== 'BODY'
          ? 'Focus moved from body'
          : 'Focus stuck on body',
    });

    // Test skip links (should be first focusable element)
    await page.keyboard.press('Home');
    await page.keyboard.press('Tab');
    const skipLinkText = await page.evaluate(() => {
      const element = document.activeElement;
      return element?.textContent || '';
    });

    keyboardTests.push({
      test: 'Skip links present',
      passed: skipLinkText.toLowerCase().includes('skip'),
      detail: skipLinkText || 'No skip link found',
    });

    // Test Escape key on modals/dropdowns
    const hasModals = await page.evaluate(() => {
      return document.querySelector('[role="dialog"]') !== null;
    });

    if (hasModals) {
      await page.keyboard.press('Escape');
      const modalClosed = await page.evaluate(() => {
        return document.querySelector('[role="dialog"]') === null;
      });

      keyboardTests.push({
        test: 'Escape closes modals',
        passed: modalClosed,
        detail: modalClosed ? 'Modal closed' : 'Modal still open',
      });
    }

    // Test focus indicators
    const focusVisible = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.activeElement);
      return styles.outlineStyle !== 'none' || styles.boxShadow !== 'none';
    });

    keyboardTests.push({
      test: 'Focus indicators visible',
      passed: focusVisible,
      detail: focusVisible
        ? 'Focus indicator present'
        : 'No visible focus indicator',
    });
  } catch (error) {
    keyboardTests.push({
      test: 'Keyboard navigation',
      passed: false,
      detail: `Error: ${error.message}`,
    });
  }

  return keyboardTests;
}

/**
 * Test screen reader support
 */
async function testScreenReaderSupport(page, pageName) {
  console.log(
    colors.info(`\n  Testing screen reader support for ${pageName}...`)
  );

  const screenReaderTests = [];

  try {
    // Check for ARIA landmarks
    const landmarks = await page.evaluate(() => {
      const main = document.querySelector('main, [role="main"]');
      const nav = document.querySelector('nav, [role="navigation"]');
      const header = document.querySelector('header, [role="banner"]');
      const footer = document.querySelector('footer, [role="contentinfo"]');

      return {
        hasMain: main !== null,
        hasNav: nav !== null,
        hasHeader: header !== null,
        hasFooter: footer !== null,
      };
    });

    screenReaderTests.push({
      test: 'ARIA landmarks',
      passed: landmarks.hasMain && landmarks.hasNav,
      detail: `Main: ${landmarks.hasMain}, Nav: ${landmarks.hasNav}, Header: ${landmarks.hasHeader}, Footer: ${landmarks.hasFooter}`,
    });

    // Check for heading hierarchy
    const headingHierarchy = await page.evaluate(() => {
      const headings = Array.from(
        document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      );
      const h1Count = headings.filter(h => h.tagName === 'H1').length;
      const hasProperHierarchy = headings.every((h, i) => {
        if (i === 0) return true;
        const prevLevel = parseInt(headings[i - 1].tagName[1]);
        const currLevel = parseInt(h.tagName[1]);
        return currLevel - prevLevel <= 1;
      });

      return { h1Count, hasProperHierarchy, totalHeadings: headings.length };
    });

    screenReaderTests.push({
      test: 'Heading hierarchy',
      passed:
        headingHierarchy.h1Count === 1 && headingHierarchy.hasProperHierarchy,
      detail: `${headingHierarchy.h1Count} H1 tags, ${headingHierarchy.totalHeadings} total headings`,
    });

    // Check for image alt text
    const imageAltText = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      const withAlt = images.filter(img => img.alt !== '');
      const decorative = images.filter(
        img => img.alt === '' && img.getAttribute('role') === 'presentation'
      );

      return {
        total: images.length,
        withAlt: withAlt.length,
        decorative: decorative.length,
        missing: images.length - withAlt.length - decorative.length,
      };
    });

    screenReaderTests.push({
      test: 'Image alt text',
      passed: imageAltText.missing === 0,
      detail: `${imageAltText.withAlt} with alt text, ${imageAltText.decorative} decorative, ${imageAltText.missing} missing`,
    });

    // Check form labels
    const formLabels = await page.evaluate(() => {
      const inputs = Array.from(
        document.querySelectorAll('input, select, textarea')
      );
      const labeled = inputs.filter(input => {
        const id = input.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label');
        const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
        return hasLabel || hasAriaLabel || hasAriaLabelledBy;
      });

      return {
        total: inputs.length,
        labeled: labeled.length,
        unlabeled: inputs.length - labeled.length,
      };
    });

    screenReaderTests.push({
      test: 'Form labels',
      passed: formLabels.unlabeled === 0,
      detail: `${formLabels.labeled}/${formLabels.total} inputs labeled`,
    });
  } catch (error) {
    screenReaderTests.push({
      test: 'Screen reader support',
      passed: false,
      detail: `Error: ${error.message}`,
    });
  }

  return screenReaderTests;
}

/**
 * Test color contrast
 */
async function testColorContrast(page, pageName) {
  console.log(colors.info(`\n  Testing color contrast for ${pageName}...`));

  try {
    // Use axe-core for contrast testing
    const axeResults = await new AxePuppeteer(page)
      .withRules(['color-contrast'])
      .analyze();

    const contrastViolations = axeResults.violations.filter(
      v => v.id === 'color-contrast'
    );

    return [
      {
        test: 'Color contrast (WCAG AA)',
        passed: contrastViolations.length === 0,
        detail:
          contrastViolations.length === 0
            ? 'All text meets contrast requirements'
            : `${contrastViolations[0].nodes.length} elements with insufficient contrast`,
      },
    ];
  } catch (error) {
    return [
      {
        test: 'Color contrast',
        passed: false,
        detail: `Error: ${error.message}`,
      },
    ];
  }
}

/**
 * Run axe accessibility tests
 */
async function runAxeTests(page, url, pageName) {
  console.log(colors.header(`\n📋 Testing: ${pageName}`));
  console.log(colors.info(`  URL: ${url}`));

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Run axe accessibility tests
    const axeResults = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Run custom tests
    const keyboardResults = await testKeyboardNavigation(page, pageName);
    const screenReaderResults = await testScreenReaderSupport(page, pageName);
    const contrastResults = await testColorContrast(page, pageName);

    // Process results
    const pageResults = {
      pageName,
      url,
      violations: axeResults.violations,
      passes: axeResults.passes,
      customTests: [
        ...keyboardResults,
        ...screenReaderResults,
        ...contrastResults,
      ],
    };

    // Display results
    console.log(colors.info('\n  Axe Violations:'));
    if (axeResults.violations.length === 0) {
      console.log(colors.pass('    ✅ No violations found!'));
      results.passed.push(pageName);
    } else {
      results.failed.push(pageName);
      results.totalViolations += axeResults.violations.length;

      axeResults.violations.forEach(violation => {
        console.log(colors.fail(`    ❌ ${violation.description}`));
        console.log(colors.warning(`       Impact: ${violation.impact}`));
        console.log(
          colors.info(`       Affected: ${violation.nodes.length} element(s)`)
        );
        console.log(colors.info(`       Help: ${violation.helpUrl}`));
      });
    }

    console.log(colors.info('\n  Custom Tests:'));
    pageResults.customTests.forEach(test => {
      const icon = test.passed ? '✅' : '❌';
      const color = test.passed ? colors.pass : colors.fail;
      console.log(color(`    ${icon} ${test.test}: ${test.detail}`));
    });

    return pageResults;
  } catch (error) {
    console.log(
      colors.fail(`\n  ❌ Error testing ${pageName}: ${error.message}`)
    );
    results.failed.push(pageName);
    return null;
  }
}

/**
 * Generate summary report
 */
function generateSummary() {
  console.log(colors.header('\n' + '='.repeat(60)));
  console.log(colors.header('📊 ACCESSIBILITY TEST SUMMARY'));
  console.log(colors.header('='.repeat(60)));

  const passRate = ((results.passed.length / results.totalPages) * 100).toFixed(
    1
  );
  const status =
    passRate >= 90
      ? colors.pass
      : passRate >= 70
        ? colors.warning
        : colors.fail;

  console.log(colors.info(`\nPages Tested: ${results.totalPages}`));
  console.log(colors.pass(`Pages Passed: ${results.passed.length}`));
  console.log(colors.fail(`Pages Failed: ${results.failed.length}`));
  console.log(colors.fail(`Total Violations: ${results.totalViolations}`));
  console.log(status(`Pass Rate: ${passRate}%`));

  if (results.failed.length > 0) {
    console.log(colors.fail('\n❌ Failed Pages:'));
    results.failed.forEach(page => {
      console.log(colors.fail(`   - ${page}`));
    });
  }

  if (results.passed.length === results.totalPages) {
    console.log(colors.pass('\n🎉 All pages passed accessibility tests!'));
  } else {
    console.log(
      colors.warning('\n⚠️  Some pages need accessibility improvements.')
    );
    console.log(
      colors.info('   Run with --verbose for detailed violation information.')
    );
  }

  console.log(colors.header('\n' + '='.repeat(60)));

  // Return exit code based on results
  return results.failed.length === 0 ? 0 : 1;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(colors.header('🔍 VQMethod Accessibility Testing'));
  console.log(colors.info(`Testing against: ${BASE_URL}`));
  console.log(colors.info(`WCAG Standards: 2.1 Level AA\n`));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Test each page
    for (const pageConfig of PAGES_TO_TEST) {
      const fullUrl = `${BASE_URL}${pageConfig.url}`;
      await runAxeTests(page, fullUrl, pageConfig.name);
    }

    // Generate and display summary
    const exitCode = generateSummary();
    process.exit(exitCode);
  } catch (error) {
    console.log(colors.fail(`\n❌ Test runner error: ${error.message}`));
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Check if required packages are installed
try {
  require.resolve('puppeteer');
  require.resolve('@axe-core/puppeteer');
  require.resolve('chalk');
} catch (error) {
  console.log(colors.fail('\n❌ Missing required packages. Please install:'));
  console.log(
    colors.info('   npm install --save-dev puppeteer @axe-core/puppeteer chalk')
  );
  process.exit(1);
}

// Run tests
runTests().catch(error => {
  console.error(colors.fail(`\n❌ Fatal error: ${error.message}`));
  process.exit(1);
});
