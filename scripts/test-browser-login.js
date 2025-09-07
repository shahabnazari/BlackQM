#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testBrowserLogin() {
  console.log('🌐 Testing Browser Login Flow\n');
  console.log('='.repeat(60));

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('[AuthService]')) {
        console.log('Browser Console:', msg.text());
      }
    });

    // Navigate to login page
    console.log('\n1. Navigating to login page...');
    await page.goto('http://localhost:3000/auth/login', {
      waitUntil: 'networkidle0',
    });
    console.log('   ✅ Login page loaded');

    // Fill in credentials
    console.log('\n2. Entering credentials...');
    await page.type('input[type="email"]', 'admin@test.com');
    await page.type('input[type="password"]', 'Password123!');
    console.log('   ✅ Credentials entered');

    // Listen for network requests
    page.on('response', response => {
      if (response.url().includes('/auth/login')) {
        console.log('\n3. Login API Response:');
        console.log('   URL:', response.url());
        console.log('   Status:', response.status());
        console.log('   Headers:', response.headers());
      }
    });

    // Click submit button
    console.log('\n4. Submitting form...');
    await Promise.all([
      page
        .waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 })
        .catch(() => {}),
      page.click('button[type="submit"]'),
    ]);

    // Check current URL
    const currentUrl = page.url();
    console.log('\n5. Result:');
    console.log('   Current URL:', currentUrl);

    if (currentUrl.includes('/dashboard') || currentUrl.includes('/studies')) {
      console.log('   ✅ Login successful! Redirected to dashboard');
    } else if (currentUrl.includes('/auth/login')) {
      console.log('   ❌ Still on login page - login failed');

      // Check for error messages
      const errorElement = await page.$('.text-red-600');
      if (errorElement) {
        const errorText = await page.evaluate(
          el => el.textContent,
          errorElement
        );
        console.log('   Error message:', errorText);
      }
    }
  } catch (error) {
    console.error('❌ Browser test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('\n' + '='.repeat(60));
}

// Check if puppeteer is installed
try {
  require.resolve('puppeteer');
  testBrowserLogin();
} catch (e) {
  console.log('Puppeteer not installed. Testing with curl instead...\n');

  const { execSync } = require('child_process');

  try {
    // Test with curl
    const response = execSync(
      `curl -X POST http://localhost:3000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@test.com","password":"Password123!"}' \
      -v 2>&1`,
      { encoding: 'utf8' }
    );

    console.log('Curl Response:', response);
  } catch (error) {
    console.log('Testing API directly with Node.js...\n');

    // Fallback to direct API test
    const axios = require('axios');

    axios
      .post(
        'http://localhost:4000/api/auth/login',
        {
          email: 'admin@test.com',
          password: 'Password123!',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:3000',
          },
        }
      )
      .then(response => {
        console.log('✅ Direct API test successful!');
        console.log('Response:', {
          status: response.status,
          user: response.data.user,
          hasToken: !!response.data.accessToken,
        });
        console.log(
          '\nThe backend API works. The issue is in the frontend connection.'
        );
        console.log(
          'Please check the browser console for [AuthService] logs when attempting to login.'
        );
      })
      .catch(error => {
        console.error(
          '❌ API test failed:',
          error.response?.data || error.message
        );
      });
  }
}
