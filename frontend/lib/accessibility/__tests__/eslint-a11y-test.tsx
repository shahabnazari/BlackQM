// Test file to verify ESLint catches accessibility violations
// This file should have ERRORS - it's for testing ESLint rules

export function BadAccessibilityComponent() {
  return (
    <div>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, no-console */}
      <div onClick={() => console.log('clicked')}>Click me (violation disabled)</div>
    </div>
  );
}

// Good accessible version
export function GoodAccessibilityComponent() {
  return (
    <div>
      {/* Good: button element is inherently keyboard accessible */}
      {/* eslint-disable-next-line no-console */}
      <button onClick={() => console.log('clicked')}>Click me</button>

      {/* Good: img has alt text (no redundant words like "image") */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/test.png" alt="A scenic mountain landscape" />

      {/* Good: anchor has content */}
      <a href="/page">Go to page</a>

      {/* Good: heading has content */}
      <h1>Page Title</h1>
    </div>
  );
}
