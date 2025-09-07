// Test login on the real frontend
const puppeteer = require('puppeteer');

(async () => {
  console.log(
    '🔍 Testing login on real frontend at http://localhost:3001/auth/login'
  );

  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    devtools: true, // Open devtools
  });

  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });

  // Listen for errors
  page.on('error', err => {
    console.error('Page error:', err);
  });

  // Navigate to login page
  console.log('📍 Navigating to login page...');
  await page.goto('http://localhost:3001/auth/login', {
    waitUntil: 'networkidle2',
  });

  // Wait for login form
  console.log('⏳ Waiting for login form...');
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });

  // Fill in credentials
  console.log('📝 Filling in credentials...');
  await page.type('input[type="email"]', 'admin@test.com');
  await page.type('input[type="password"]', 'Password123!');

  // Click login button
  console.log('🔐 Clicking login button...');
  const loginButton = await page.$('button[type="submit"]');
  if (loginButton) {
    await loginButton.click();
  } else {
    // Try alternative selectors
    const altButton = await page.$('button:contains("Sign In")');
    if (altButton) {
      await altButton.click();
    }
  }

  // Wait for navigation or error
  console.log('⏳ Waiting for response...');
  await page.waitForTimeout(3000);

  // Check current URL
  const currentUrl = page.url();
  console.log('📍 Current URL:', currentUrl);

  // Check for error messages
  const errorMessage = await page
    .$eval('.error-message', el => el.textContent)
    .catch(() => null);
  if (errorMessage) {
    console.error('❌ Error message:', errorMessage);
  }

  // Check local storage for tokens
  const tokens = await page.evaluate(() => {
    return {
      accessToken: localStorage.getItem('access_token'),
      refreshToken: localStorage.getItem('refresh_token'),
      user: localStorage.getItem('user'),
    };
  });

  if (tokens.accessToken) {
    console.log('✅ Login successful! Tokens found in localStorage');
    console.log('User:', tokens.user);
  } else {
    console.log('❌ No tokens found in localStorage');
  }

  console.log('✅ Test complete - check browser window');
  // Keep browser open for manual inspection
})();
