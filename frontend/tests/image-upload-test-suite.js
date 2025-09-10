/**
 * COMPREHENSIVE IMAGE UPLOAD TEST SUITE
 * Tests for image upload functionality in the rich text editor
 */

// Test Configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 10000,
  testImages: {
    small: { width: 100, height: 100, size: '1KB' },
    medium: { width: 500, height: 300, size: '50KB' },
    large: { width: 1920, height: 1080, size: '2MB' },
    square: { width: 400, height: 400, size: '100KB' },
    portrait: { width: 300, height: 600, size: '80KB' },
    landscape: { width: 800, height: 400, size: '150KB' }
  }
};

// Test Results Storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility Functions
function logTest(testName, status, details = '') {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ ${testName}: PASSED`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: FAILED - ${details}`);
  }
  testResults.details.push({ testName, status, details, timestamp: new Date().toISOString() });
}

function createTestImage(width, height, format = 'png') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Create a gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#ff6b6b');
  gradient.addColorStop(0.5, '#4ecdc4');
  gradient.addColorStop(1, '#45b7d1');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add some text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${width}×${height}`, width/2, height/2);
  
  return canvas.toDataURL(`image/${format}`);
}

// Test Suite Functions
async function testImageUploadBasic() {
  console.log('\n🧪 TESTING: Basic Image Upload Functionality');
  
  try {
    // Test 1: Image upload button visibility
    const uploadButton = document.querySelector('[data-testid="image-upload-button"]') || 
                       document.querySelector('button[title*="image" i]') ||
                       document.querySelector('button[aria-label*="image" i]');
    
    if (uploadButton) {
      logTest('Image Upload Button Visible', 'PASS');
    } else {
      logTest('Image Upload Button Visible', 'FAIL', 'Upload button not found');
    }
    
    // Test 2: Image upload dialog opens
    if (uploadButton) {
      uploadButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const uploadDialog = document.querySelector('[role="dialog"]') || 
                          document.querySelector('.modal') ||
                          document.querySelector('[data-testid="image-upload-dialog"]');
      
      if (uploadDialog) {
        logTest('Image Upload Dialog Opens', 'PASS');
      } else {
        logTest('Image Upload Dialog Opens', 'FAIL', 'Upload dialog not found');
      }
    }
    
    // Test 3: File input accepts images
    const fileInput = document.querySelector('input[type="file"][accept*="image"]');
    if (fileInput) {
      logTest('File Input Accepts Images', 'PASS');
    } else {
      logTest('File Input Accepts Images', 'FAIL', 'File input not found or doesn\'t accept images');
    }
    
  } catch (error) {
    logTest('Basic Image Upload', 'FAIL', error.message);
  }
}

async function testImageUploadSizes() {
  console.log('\n🧪 TESTING: Image Upload Size Handling');
  
  try {
    const fileInput = document.querySelector('input[type="file"][accept*="image"]');
    if (!fileInput) {
      logTest('Image Size Testing', 'FAIL', 'File input not found');
      return;
    }
    
    // Test different image sizes
    for (const [sizeName, sizeInfo] of Object.entries(TEST_CONFIG.testImages)) {
      try {
        const testImage = createTestImage(sizeInfo.width, sizeInfo.height);
        
        // Create a mock file
        const blob = await fetch(testImage).then(r => r.blob());
        const file = new File([blob], `test-${sizeName}.png`, { type: 'image/png' });
        
        // Simulate file selection
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        
        // Trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(changeEvent);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if image was inserted
        const insertedImage = document.querySelector('img[src*="data:image"]');
        if (insertedImage) {
          logTest(`Image Upload - ${sizeName} (${sizeInfo.width}×${sizeInfo.height})`, 'PASS');
        } else {
          logTest(`Image Upload - ${sizeName} (${sizeInfo.width}×${sizeInfo.height})`, 'FAIL', 'Image not inserted');
        }
        
      } catch (error) {
        logTest(`Image Upload - ${sizeName}`, 'FAIL', error.message);
      }
    }
    
  } catch (error) {
    logTest('Image Size Testing', 'FAIL', error.message);
  }
}

async function testImageResizeFunctionality() {
  console.log('\n🧪 TESTING: Image Resize Functionality');
  
  try {
    // Find inserted images
    const images = document.querySelectorAll('img[src*="data:image"], .simple-image img');
    
    if (images.length === 0) {
      logTest('Image Resize - Images Found', 'FAIL', 'No images found for resize testing');
      return;
    }
    
    logTest('Image Resize - Images Found', 'PASS', `Found ${images.length} image(s)`);
    
    // Test resize handles
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imageContainer = image.closest('.simple-image-wrapper') || image.parentElement;
      
      if (imageContainer) {
        // Hover over image to show resize handles
        const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
        imageContainer.dispatchEvent(mouseEnterEvent);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Look for resize handles
        const resizeHandle = imageContainer.querySelector('.react-resizable-handle') ||
                           imageContainer.querySelector('[style*="cursor: nwse-resize"]') ||
                           imageContainer.querySelector('[class*="resize"]');
        
        if (resizeHandle) {
          logTest(`Image Resize - Handle ${i + 1}`, 'PASS');
        } else {
          logTest(`Image Resize - Handle ${i + 1}`, 'FAIL', 'Resize handle not found');
        }
        
        // Test drag handle
        const dragHandle = imageContainer.querySelector('.drag-handle') ||
                          imageContainer.querySelector('[title*="move" i]') ||
                          imageContainer.querySelector('[aria-label*="move" i]');
        
        if (dragHandle) {
          logTest(`Image Drag - Handle ${i + 1}`, 'PASS');
        } else {
          logTest(`Image Drag - Handle ${i + 1}`, 'FAIL', 'Drag handle not found');
        }
        
        // Test action buttons
        const rotateButton = imageContainer.querySelector('button[title*="rotate" i]') ||
                           imageContainer.querySelector('button[aria-label*="rotate" i]');
        
        if (rotateButton) {
          logTest(`Image Rotate - Button ${i + 1}`, 'PASS');
        } else {
          logTest(`Image Rotate - Button ${i + 1}`, 'FAIL', 'Rotate button not found');
        }
        
        const removeButton = imageContainer.querySelector('button[title*="remove" i]') ||
                           imageContainer.querySelector('button[aria-label*="remove" i]') ||
                           imageContainer.querySelector('button[title*="delete" i]');
        
        if (removeButton) {
          logTest(`Image Remove - Button ${i + 1}`, 'PASS');
        } else {
          logTest(`Image Remove - Button ${i + 1}`, 'FAIL', 'Remove button not found');
        }
      }
    }
    
  } catch (error) {
    logTest('Image Resize Functionality', 'FAIL', error.message);
  }
}

async function testImageTextIntegration() {
  console.log('\n🧪 TESTING: Image Text Integration');
  
  try {
    // Test 1: Images flow with text
    const editor = document.querySelector('.ProseMirror') || 
                  document.querySelector('[contenteditable="true"]') ||
                  document.querySelector('.tiptap');
    
    if (!editor) {
      logTest('Image Text Integration - Editor Found', 'FAIL', 'Rich text editor not found');
      return;
    }
    
    logTest('Image Text Integration - Editor Found', 'PASS');
    
    // Test 2: Images are inline elements
    const images = editor.querySelectorAll('img');
    if (images.length > 0) {
      const firstImage = images[0];
      const computedStyle = window.getComputedStyle(firstImage);
      
      if (computedStyle.display === 'inline' || computedStyle.display === 'inline-block') {
        logTest('Image Text Integration - Inline Display', 'PASS');
      } else {
        logTest('Image Text Integration - Inline Display', 'FAIL', `Display: ${computedStyle.display}`);
      }
    }
    
    // Test 3: Images don't break text flow
    const textContent = editor.textContent || editor.innerText;
    if (textContent && textContent.length > 0) {
      logTest('Image Text Integration - Text Flow', 'PASS', 'Text content present');
    } else {
      logTest('Image Text Integration - Text Flow', 'FAIL', 'No text content found');
    }
    
  } catch (error) {
    logTest('Image Text Integration', 'FAIL', error.message);
  }
}

async function testImageErrorHandling() {
  console.log('\n🧪 TESTING: Image Error Handling');
  
  try {
    // Test 1: Invalid file type handling
    const fileInput = document.querySelector('input[type="file"][accept*="image"]');
    if (fileInput) {
      // Create a text file
      const textFile = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(textFile);
      fileInput.files = dataTransfer.files;
      
      const changeEvent = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(changeEvent);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if error message appears
      const errorMessage = document.querySelector('.error') || 
                          document.querySelector('[role="alert"]') ||
                          document.querySelector('.text-red-500');
      
      if (errorMessage) {
        logTest('Image Error Handling - Invalid File Type', 'PASS');
      } else {
        logTest('Image Error Handling - Invalid File Type', 'FAIL', 'No error message shown');
      }
    }
    
    // Test 2: Broken image handling
    const brokenImage = document.createElement('img');
    brokenImage.src = 'data:image/png;base64,invalid';
    brokenImage.onerror = () => {
      logTest('Image Error Handling - Broken Image', 'PASS');
    };
    brokenImage.onload = () => {
      logTest('Image Error Handling - Broken Image', 'FAIL', 'Broken image loaded successfully');
    };
    
  } catch (error) {
    logTest('Image Error Handling', 'FAIL', error.message);
  }
}

async function testImageAccessibility() {
  console.log('\n🧪 TESTING: Image Accessibility');
  
  try {
    const images = document.querySelectorAll('img');
    
    if (images.length === 0) {
      logTest('Image Accessibility - Images Found', 'FAIL', 'No images found for accessibility testing');
      return;
    }
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      // Test alt text
      if (image.alt && image.alt.trim() !== '') {
        logTest(`Image Accessibility - Alt Text ${i + 1}`, 'PASS');
      } else {
        logTest(`Image Accessibility - Alt Text ${i + 1}`, 'FAIL', 'Missing or empty alt text');
      }
      
      // Test keyboard navigation
      if (image.tabIndex >= 0) {
        logTest(`Image Accessibility - Keyboard Navigation ${i + 1}`, 'PASS');
      } else {
        logTest(`Image Accessibility - Keyboard Navigation ${i + 1}`, 'FAIL', 'Image not keyboard accessible');
      }
    }
    
  } catch (error) {
    logTest('Image Accessibility', 'FAIL', error.message);
  }
}

async function testImagePerformance() {
  console.log('\n🧪 TESTING: Image Performance');
  
  try {
    const images = document.querySelectorAll('img');
    
    if (images.length === 0) {
      logTest('Image Performance - Images Found', 'FAIL', 'No images found for performance testing');
      return;
    }
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      // Test image loading time
      const startTime = performance.now();
      
      image.onload = () => {
        const loadTime = performance.now() - startTime;
        if (loadTime < 1000) {
          logTest(`Image Performance - Load Time ${i + 1}`, 'PASS', `${loadTime.toFixed(2)}ms`);
        } else {
          logTest(`Image Performance - Load Time ${i + 1}`, 'FAIL', `Too slow: ${loadTime.toFixed(2)}ms`);
        }
      };
      
      // Test image dimensions
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        logTest(`Image Performance - Dimensions ${i + 1}`, 'PASS', `${image.naturalWidth}×${image.naturalHeight}`);
      } else {
        logTest(`Image Performance - Dimensions ${i + 1}`, 'FAIL', 'Invalid dimensions');
      }
    }
    
  } catch (error) {
    logTest('Image Performance', 'FAIL', error.message);
  }
}

// Main Test Runner
async function runImageUploadTestSuite() {
  console.log('🚀 STARTING COMPREHENSIVE IMAGE UPLOAD TEST SUITE');
  console.log('=' .repeat(60));
  
  const startTime = performance.now();
  
  try {
    // Navigate to the study creation page
    window.location.href = `${TEST_CONFIG.baseUrl}/studies/create`;
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Run all test suites
    await testImageUploadBasic();
    await testImageUploadSizes();
    await testImageResizeFunctionality();
    await testImageTextIntegration();
    await testImageErrorHandling();
    await testImageAccessibility();
    await testImagePerformance();
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  // Generate test report
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUITE RESULTS');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
  
  // Detailed results
  console.log('\n📋 DETAILED RESULTS:');
  testResults.details.forEach((test, index) => {
    const status = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${test.testName}`);
    if (test.details) {
      console.log(`   Details: ${test.details}`);
    }
  });
  
  // Save results to localStorage for later analysis
  localStorage.setItem('imageUploadTestResults', JSON.stringify({
    ...testResults,
    totalTime,
    timestamp: new Date().toISOString()
  }));
  
  console.log('\n🎉 Test suite completed!');
  console.log('Results saved to localStorage for analysis.');
  
  return testResults;
}

// Export for use in browser console
window.runImageUploadTestSuite = runImageUploadTestSuite;
window.testResults = testResults;

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('Image Upload Test Suite loaded. Run window.runImageUploadTestSuite() to start testing.');
}
