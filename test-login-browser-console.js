// Run this in the browser console at http://localhost:3001/auth/login
// This tests the actual frontend login functionality

(async function testFrontendLogin() {
  console.log('🔍 Testing frontend login functionality...');
  console.log('Current URL:', window.location.href);

  // Check if we're on the login page
  if (!window.location.pathname.includes('/auth/login')) {
    console.warn(
      '⚠️ Not on login page. Navigate to http://localhost:3001/auth/login first'
    );
    return;
  }

  // Try to find and fill the form using React
  console.log('\n1️⃣ Looking for login form elements...');

  // Find email input
  const emailInput =
    document.querySelector('input[type="email"]') ||
    document.querySelector('input[name="email"]') ||
    document.querySelector('#email');

  if (emailInput) {
    console.log('✅ Found email input');
    // Trigger React onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    nativeInputValueSetter.call(emailInput, 'admin@test.com');
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    console.error('❌ Email input not found');
    return;
  }

  // Find password input
  const passwordInput =
    document.querySelector('input[type="password"]') ||
    document.querySelector('input[name="password"]') ||
    document.querySelector('#password');

  if (passwordInput) {
    console.log('✅ Found password input');
    // Trigger React onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    nativeInputValueSetter.call(passwordInput, 'Password123!');
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    console.error('❌ Password input not found');
    return;
  }

  console.log('\n2️⃣ Form filled. Looking for submit button...');

  // Find submit button
  const submitButton =
    document.querySelector('button[type="submit"]') ||
    Array.from(document.querySelectorAll('button')).find(
      btn =>
        btn.textContent.toLowerCase().includes('sign in') ||
        btn.textContent.toLowerCase().includes('login')
    );

  if (submitButton) {
    console.log('✅ Found submit button:', submitButton.textContent);
    console.log('🔐 Clicking login button...');
    submitButton.click();

    // Wait for response
    console.log('\n3️⃣ Waiting for login response...');

    // Monitor for changes
    setTimeout(() => {
      // Check if we navigated away
      if (!window.location.pathname.includes('/auth/login')) {
        console.log('✅ Navigation detected! New URL:', window.location.href);
        console.log('✅ Login appears successful!');
      } else {
        console.log('⚠️ Still on login page');

        // Check for error messages
        const errorElements = document.querySelectorAll(
          '[class*="error"], [class*="Error"], .text-red-500, .text-danger'
        );
        if (errorElements.length > 0) {
          console.error('❌ Error messages found:');
          errorElements.forEach(el => {
            if (el.textContent.trim()) {
              console.error('  -', el.textContent.trim());
            }
          });
        }
      }

      // Check localStorage
      console.log('\n4️⃣ Checking localStorage for tokens...');
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      const user = localStorage.getItem('user');

      if (accessToken) {
        console.log('✅ Access token found');
        console.log('✅ Refresh token found:', !!refreshToken);
        if (user) {
          try {
            const userData = JSON.parse(user);
            console.log('✅ User data:', userData);
          } catch (e) {
            console.log('User data (raw):', user);
          }
        }
        console.log('\n🎉 LOGIN SUCCESSFUL!');
      } else {
        console.log('❌ No access token in localStorage');
        console.log(
          '\n😕 Login may have failed. Check network tab for details.'
        );
      }
    }, 2000);
  } else {
    console.error('❌ Submit button not found');
    console.log(
      'Available buttons:',
      Array.from(document.querySelectorAll('button')).map(b => b.textContent)
    );
  }
})();

console.log('Script loaded. The test will run automatically.');
console.log(
  'If nothing happens, make sure you are on http://localhost:3001/auth/login'
);
