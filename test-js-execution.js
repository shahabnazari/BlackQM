const puppeteer = require('puppeteer');

async function testButtonClicks() {
  console.log('Starting browser test...');

  try {
    const browser = await puppeteer.launch({
      headless: false,
      devtools: true,
    });
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => console.log('Browser console:', msg.text()));
    page.on('pageerror', error => console.log('Page error:', error.message));

    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Check if JavaScript is executing
    const jsEnabled = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    });
    console.log('JavaScript enabled:', jsEnabled);

    // Check for Next.js
    const hasNextJs = await page.evaluate(() => {
      return typeof window.__NEXT_DATA__ !== 'undefined';
    });
    console.log('Next.js detected:', hasNextJs);

    // Find all buttons
    const buttons = await page.$$eval('button', buttons =>
      buttons.map(btn => ({
        text: btn.textContent?.trim(),
        hasOnClick: btn.onclick !== null,
        hasReactHandlers: Object.keys(btn).some(key =>
          key.startsWith('__react')
        ),
      }))
    );

    console.log('\nButtons found:', buttons.length);
    buttons.forEach((btn, i) => {
      console.log(`  Button ${i + 1}: "${btn.text}"`);
      console.log(`    Has onClick: ${btn.hasOnClick}`);
      console.log(`    Has React handlers: ${btn.hasReactHandlers}`);
    });

    // Try clicking the first "Sign In" button
    console.log('\nAttempting to click "Sign In" button...');
    const signInButton = await page.$('button:has-text("Sign In")');

    if (signInButton) {
      await signInButton.click();
      await page.waitForTimeout(2000);

      const newUrl = page.url();
      console.log('Current URL after click:', newUrl);

      if (newUrl.includes('/auth/login')) {
        console.log('✓ Navigation successful!');
      } else {
        console.log('✗ Navigation failed - still on:', newUrl);
      }
    } else {
      console.log('Sign In button not found');
    }

    await browser.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Check if puppeteer is installed
try {
  require.resolve('puppeteer');
  testButtonClicks();
} catch (e) {
  console.log(
    'Puppeteer not installed. Install it with: npm install puppeteer'
  );
  console.log('Or use the test HTML files created earlier in a browser.');
}
