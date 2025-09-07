#!/usr/bin/env node

/**
 * Comprehensive Page & Navigation Testing Script
 * Phase 6.6: Enterprise Testing
 *
 * Tests all pages, navigation flows, and functionality
 */

import puppeteer from 'puppeteer';
import chalk from 'chalk';

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  page: string;
  status: 'pass' | 'fail';
  time: number;
  error?: string;
}

const PAGES_TO_TEST = [
  // Public Pages
  { path: '/', name: 'Homepage' },
  { path: '/about', name: 'About' },
  { path: '/contact', name: 'Contact' },
  { path: '/privacy', name: 'Privacy' },
  { path: '/terms', name: 'Terms' },
  { path: '/help', name: 'Help' },

  // Auth Pages
  { path: '/auth/login', name: 'Login' },
  { path: '/auth/register', name: 'Register' },
  { path: '/auth/forgot-password', name: 'Forgot Password' },

  // Researcher Pages (Protected)
  { path: '/dashboard', name: 'Dashboard', protected: true },
  { path: '/studies', name: 'Studies', protected: true },
  { path: '/studies/create', name: 'Create Study', protected: true },
  { path: '/analytics', name: 'Analytics', protected: true },
  { path: '/analysis', name: 'Analysis Hub', protected: true },
  { path: '/analysis/q-methodology', name: 'Q-Methodology', protected: true },

  // Participant Pages
  { path: '/join', name: 'Join Study' },
];

class NavigationTester {
  private browser: any;
  private page: any;
  private results: TestResult[] = [];

  async setup() {
    console.log(chalk.blue('🚀 Starting browser...'));
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      defaultViewport: {
        width: 1280,
        height: 800,
      },
    });
    this.page = await this.browser.newPage();
  }

  async teardown() {
    await this.browser.close();
  }

  async login() {
    console.log(chalk.yellow('🔐 Logging in as researcher...'));
    await this.page.goto(`${BASE_URL}/auth/login`);
    await this.page.waitForSelector('input[type="email"]');

    await this.page.type('input[type="email"]', 'researcher@test.com');
    await this.page.type('input[type="password"]', 'password123');
    await this.page.click('button[type="submit"]');

    await this.page.waitForNavigation();
    console.log(chalk.green('✓ Logged in successfully'));
  }

  async testPage(path: string, name: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      console.log(chalk.gray(`  Testing ${name}...`));

      // Navigate to page
      const response = await this.page.goto(`${BASE_URL}${path}`, {
        waitUntil: 'networkidle2',
        timeout: 10000,
      });

      // Check response status
      if (!response || response.status() >= 400) {
        throw new Error(`HTTP ${response?.status() || 'Unknown'}`);
      }

      // Wait for content to load
      await this.page.waitForSelector('body', { timeout: 5000 });

      // Check for error messages
      const hasError = await this.page.evaluate(() => {
        const errorElements = document.querySelectorAll(
          '.error, .error-message, [data-error]'
        );
        return errorElements.length > 0;
      });

      if (hasError) {
        throw new Error('Page contains error elements');
      }

      const time = Date.now() - startTime;
      console.log(chalk.green(`    ✓ ${name} (${time}ms)`));

      return {
        page: name,
        status: 'pass',
        time,
      };
    } catch (error: any) {
      const time = Date.now() - startTime;
      console.log(chalk.red(`    ✗ ${name} - ${error.message}`));

      return {
        page: name,
        status: 'fail',
        time,
        error: error.message,
      };
    }
  }

  async testNavigation() {
    console.log(chalk.blue('\n📍 Testing Navigation Links...'));

    await this.page.goto(BASE_URL);

    // Test desktop navigation
    const navLinks = await this.page.evaluate(() => {
      const links = document.querySelectorAll('nav a');
      return Array.from(links).map(link => ({
        text: (link as HTMLAnchorElement).textContent,
        href: (link as HTMLAnchorElement).href,
      }));
    });

    console.log(chalk.gray(`  Found ${navLinks.length} navigation links`));

    for (const link of navLinks) {
      try {
        await this.page.goto(link.href);
        console.log(chalk.green(`    ✓ ${link.text}`));
      } catch (error) {
        console.log(chalk.red(`    ✗ ${link.text}`));
      }
    }
  }

  async testMobileMenu() {
    console.log(chalk.blue('\n📱 Testing Mobile Menu...'));

    // Set mobile viewport
    await this.page.setViewport({ width: 375, height: 667 });
    await this.page.goto(BASE_URL);

    // Look for hamburger menu
    const hamburgerButton = await this.page.$(
      '[aria-label*="menu" i], .hamburger, button svg'
    );

    if (hamburgerButton) {
      await hamburgerButton.click();
      await this.page.waitForTimeout(500); // Wait for animation

      const mobileMenuVisible = await this.page.evaluate(() => {
        const menu = document.querySelector(
          '[role="navigation"], .mobile-menu, .drawer'
        );
        return menu && (menu as HTMLElement).offsetWidth > 0;
      });

      if (mobileMenuVisible) {
        console.log(chalk.green('  ✓ Mobile menu opens'));

        // Test closing
        const closeButton = await this.page.$('[aria-label*="close" i]');
        if (closeButton) {
          await closeButton.click();
          await this.page.waitForTimeout(500);
          console.log(chalk.green('  ✓ Mobile menu closes'));
        }
      } else {
        console.log(chalk.red('  ✗ Mobile menu not visible'));
      }
    } else {
      console.log(chalk.yellow('  ⚠ No hamburger menu found'));
    }

    // Reset viewport
    await this.page.setViewport({ width: 1280, height: 800 });
  }

  async testQMethodology() {
    console.log(chalk.blue('\n🧪 Testing Q-Methodology Analysis...'));

    await this.page.goto(`${BASE_URL}/analysis/q-methodology`);
    await this.page.waitForSelector('body');

    // Check for key components
    const components = [
      {
        selector: '[data-testid="data-upload"], button:contains("Upload")',
        name: 'Data Upload',
      },
      {
        selector:
          '[data-testid="factor-extraction"], button:contains("Extract")',
        name: 'Factor Extraction',
      },
      {
        selector: '[data-testid="factor-rotation"], button:contains("Rotate")',
        name: 'Factor Rotation',
      },
      {
        selector: '[data-testid="export"], button:contains("Export")',
        name: 'Export Panel',
      },
    ];

    for (const component of components) {
      const exists = await this.page.$(component.selector);
      if (exists) {
        console.log(chalk.green(`  ✓ ${component.name} present`));
      } else {
        console.log(chalk.yellow(`  ⚠ ${component.name} not found`));
      }
    }
  }

  async testPerformance() {
    console.log(chalk.blue('\n⚡ Testing Performance Metrics...'));

    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint:
          performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint:
          performance.getEntriesByName('first-contentful-paint')[0]
            ?.startTime || 0,
      };
    });

    console.log(
      chalk.gray('  DOM Content Loaded: ' + metrics.domContentLoaded + 'ms')
    );
    console.log(
      chalk.gray('  Page Load Complete: ' + metrics.loadComplete + 'ms')
    );
    console.log(chalk.gray('  First Paint: ' + metrics.firstPaint + 'ms'));
    console.log(
      chalk.gray(
        '  First Contentful Paint: ' + metrics.firstContentfulPaint + 'ms'
      )
    );

    // Check against thresholds
    if (metrics.firstContentfulPaint < 2000) {
      console.log(chalk.green('  ✓ Performance meets targets'));
    } else {
      console.log(chalk.yellow('  ⚠ Performance could be improved'));
    }
  }

  async run() {
    console.log(chalk.bold.blue('\n🧪 VQMethod Comprehensive Testing Suite\n'));
    console.log(chalk.gray('Testing ' + PAGES_TO_TEST.length + ' pages...\n'));

    await this.setup();

    try {
      // Test public pages
      console.log(chalk.blue('📄 Testing Public Pages...'));
      for (const page of PAGES_TO_TEST.filter(p => !p.protected)) {
        const result = await this.testPage(page.path, page.name);
        this.results.push(result);
      }

      // Login for protected pages
      await this.login();

      // Test protected pages
      console.log(chalk.blue('\n🔒 Testing Protected Pages...'));
      for (const page of PAGES_TO_TEST.filter(p => p.protected)) {
        const result = await this.testPage(page.path, page.name);
        this.results.push(result);
      }

      // Test navigation
      await this.testNavigation();

      // Test mobile menu
      await this.testMobileMenu();

      // Test Q-Methodology specifically
      await this.testQMethodology();

      // Test performance
      await this.testPerformance();

      // Summary
      this.printSummary();
    } catch (error) {
      console.error(chalk.red('\n❌ Test suite failed:'), error);
    } finally {
      await this.teardown();
    }
  }

  printSummary() {
    console.log(chalk.bold.blue('\n📊 Test Summary\n'));

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const totalTime = this.results.reduce((sum, r) => sum + r.time, 0);

    console.log(chalk.green(`  ✓ Passed: ${passed}`));
    console.log(chalk.red(`  ✗ Failed: ${failed}`));
    console.log(chalk.gray(`  Total Time: ${totalTime}ms`));
    console.log(
      chalk.gray(
        `  Average: ${Math.round(totalTime / this.results.length)}ms per page`
      )
    );

    if (failed > 0) {
      console.log(chalk.red('\n❌ Failed Pages:'));
      this.results
        .filter(r => r.status === 'fail')
        .forEach(r => {
          console.log(chalk.red(`  - ${r.page}: ${r.error}`));
        });
    }

    const successRate = (passed / this.results.length) * 100;

    if (successRate === 100) {
      console.log(chalk.bold.green('\n✅ All tests passed! 🎉'));
    } else if (successRate >= 80) {
      console.log(
        chalk.bold.yellow(`\n⚠️ ${successRate.toFixed(1)}% tests passed`)
      );
    } else {
      console.log(
        chalk.bold.red(`\n❌ Only ${successRate.toFixed(1)}% tests passed`)
      );
    }
  }
}

// Run tests
const tester = new NavigationTester();
tester.run().catch(console.error);
