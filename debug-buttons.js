// Paste this in the browser console on http://localhost:3000

console.log('=== Button Debug Script ===');

// Check if React and Next.js are loaded
console.log('React loaded:', typeof React !== 'undefined');
console.log('Next.js router available:', typeof window.next !== 'undefined');
console.log('Next.js data:', !!window.__NEXT_DATA__);

// Find all buttons
const buttons = document.querySelectorAll('button');
console.log(`\nFound ${buttons.length} buttons on the page`);

// Check each button
buttons.forEach((button, index) => {
  const text = button.textContent.trim();
  console.log(`\nButton ${index + 1}: "${text}"`);

  // Check if button is disabled
  console.log('  Disabled attribute:', button.disabled);
  console.log('  Has disabled class:', button.className.includes('disabled'));

  // Check for event listeners
  const listeners = getEventListeners ? getEventListeners(button) : null;
  if (listeners) {
    console.log('  Event listeners:', Object.keys(listeners));
  }

  // Check for React Fiber
  const reactKeys = Object.keys(button).filter(key =>
    key.startsWith('__react')
  );
  console.log('  React keys:', reactKeys.length > 0 ? reactKeys : 'None');

  // Try to find onClick in props
  if (reactKeys.length > 0) {
    const fiber = button[reactKeys[0]];
    console.log('  React Fiber type:', fiber?.elementType?.name || 'Unknown');
    console.log('  Has onClick:', !!fiber?.memoizedProps?.onClick);
  }
});

// Try to manually trigger navigation
console.log('\n=== Testing Manual Navigation ===');
try {
  // Get Next.js router if available
  const router = window.next?.router;
  if (router) {
    console.log('Router found, current path:', router.pathname);
    console.log('Router ready:', router.isReady);
  } else {
    console.log('Router not accessible from window.next');
  }
} catch (e) {
  console.error('Error accessing router:', e);
}

// Check for hydration errors
const errors = [];
const originalError = console.error;
console.error = function (...args) {
  errors.push(args.join(' '));
  originalError.apply(console, args);
};

console.log('\n=== Checking for Errors ===');
if (errors.length > 0) {
  console.log('Console errors detected:', errors);
} else {
  console.log('No console errors detected');
}

// Test clicking a button programmatically
console.log('\n=== Testing Button Click ===');
const testButton = buttons[0];
if (testButton) {
  console.log(`Clicking button: "${testButton.textContent.trim()}"`);

  // Add a listener to detect if click is processed
  const clickDetected = new Promise(resolve => {
    const handler = () => {
      resolve('Click event fired!');
      testButton.removeEventListener('click', handler);
    };
    testButton.addEventListener('click', handler);

    // Simulate click
    testButton.click();

    // Timeout if no click detected
    setTimeout(() => resolve('No click event detected'), 100);
  });

  clickDetected.then(result => console.log('  Result:', result));
}

console.log('\n=== Debug Complete ===');
console.log('If buttons are not working, possible issues:');
console.log('1. JavaScript is disabled in the browser');
console.log('2. React hydration failed silently');
console.log('3. Event handlers are not being attached');
console.log('4. Router is not initialized properly');
