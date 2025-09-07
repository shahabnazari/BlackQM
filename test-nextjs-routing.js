// Test script to check Next.js client-side routing
// Run this in the browser console on http://localhost:3000

console.log('Testing Next.js routing...');

// Check if Next.js router is available
if (typeof window !== 'undefined' && window.next) {
  console.log('✓ Next.js detected');

  // Try to access the router
  const router = window.next.router;
  if (router) {
    console.log('✓ Router found:', router);
    console.log('Current path:', router.pathname);
    console.log('Router ready:', router.isReady);
  } else {
    console.log('✗ Router not accessible');
  }
} else {
  console.log('✗ Next.js not detected on window object');
}

// Check if React is loaded
if (typeof React !== 'undefined') {
  console.log('✓ React is loaded');
} else {
  console.log('✗ React not found');
}

// Try to find and click a button
const buttons = document.querySelectorAll('button');
console.log(`Found ${buttons.length} buttons`);

// Check if buttons have event listeners
buttons.forEach((button, index) => {
  const hasClickListener =
    button.onclick !== null || button.hasAttribute('onclick');
  const text = button.textContent.trim();
  console.log(`Button ${index + 1}: "${text}"`);

  // Check for React props
  const reactProps = Object.keys(button).find(key => key.startsWith('__react'));
  if (reactProps) {
    console.log(`  ✓ Has React event handlers`);
  } else {
    console.log(`  ✗ No React event handlers found`);
  }

  // Try to trigger click
  console.log(`  Attempting to click...`);
  button.click();
});

// Check for any errors in the console
if (window.__NEXT_DATA__) {
  console.log('✓ Next.js data found');
  console.log('Build ID:', window.__NEXT_DATA__.buildId);
  console.log('Page:', window.__NEXT_DATA__.page);
} else {
  console.log('✗ No Next.js data found');
}
