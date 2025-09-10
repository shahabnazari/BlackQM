/**
 * CONSOLE-BASED IMAGE UPLOAD TEST SUITE
 * Run this script in the browser console to test image upload functionality
 */

(function() {
    'use strict';
    
    // Test Configuration
    const CONFIG = {
        baseUrl: 'http://localhost:3000',
        timeout: 5000,
        testImages: {
            small: { width: 100, height: 100 },
            medium: { width: 500, height: 300 },
            large: { width: 1920, height: 1080 },
            square: { width: 400, height: 400 },
            portrait: { width: 300, height: 600 },
            landscape: { width: 800, height: 400 }
        }
    };
    
    // Test Results
    let testResults = {
        passed: 0,
        failed: 0,
        total: 0,
        details: [],
        startTime: null,
        endTime: null
    };
    
    // Utility Functions
    function logTest(testName, status, details = '') {
        testResults.total++;
        const timestamp = new Date().toISOString();
        
        if (status === 'PASS') {
            testResults.passed++;
            console.log(`✅ ${testName}: PASSED`);
        } else {
            testResults.failed++;
            console.log(`❌ ${testName}: FAILED - ${details}`);
        }
        
        testResults.details.push({ 
            testName, 
            status, 
            details, 
            timestamp 
        });
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
    
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }
    
    function simulateFileUpload(fileInput, file) {
        return new Promise((resolve) => {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            
            const changeEvent = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(changeEvent);
            
            setTimeout(resolve, 1000);
        });
    }
    
    // Test Functions
    async function testBasicImageUpload() {
        console.log('\n🧪 TESTING: Basic Image Upload Functionality');
        
        try {
            // Test 1: Find image upload button
            const uploadButton = document.querySelector('[data-testid="image-upload-button"]') || 
                               document.querySelector('button[title*="image" i]') ||
                               document.querySelector('button[aria-label*="image" i]') ||
                               document.querySelector('button[class*="image"]') ||
                               document.querySelector('button[class*="upload"]');
            
            if (uploadButton) {
                logTest('Image Upload Button Found', 'PASS', `Found: ${uploadButton.tagName} with classes: ${uploadButton.className}`);
            } else {
                logTest('Image Upload Button Found', 'FAIL', 'No image upload button found');
                return false;
            }
            
            // Test 2: Click upload button
            try {
                uploadButton.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                logTest('Image Upload Button Clickable', 'PASS');
            } catch (error) {
                logTest('Image Upload Button Clickable', 'FAIL', error.message);
            }
            
            // Test 3: Find file input
            const fileInput = document.querySelector('input[type="file"][accept*="image"]') ||
                             document.querySelector('input[type="file"]');
            
            if (fileInput) {
                logTest('File Input Found', 'PASS', `Accept: ${fileInput.accept}`);
            } else {
                logTest('File Input Found', 'FAIL', 'No file input found');
                return false;
            }
            
            return true;
            
        } catch (error) {
            logTest('Basic Image Upload', 'FAIL', error.message);
            return false;
        }
    }
    
    async function testImageUploadSizes() {
        console.log('\n🧪 TESTING: Image Upload Size Handling');
        
        try {
            const fileInput = document.querySelector('input[type="file"][accept*="image"]') ||
                             document.querySelector('input[type="file"]');
            
            if (!fileInput) {
                logTest('Image Size Testing', 'FAIL', 'File input not found');
                return false;
            }
            
            let successCount = 0;
            const totalTests = Object.keys(CONFIG.testImages).length;
            
            for (const [sizeName, sizeInfo] of Object.entries(CONFIG.testImages)) {
                try {
                    const testImage = createTestImage(sizeInfo.width, sizeInfo.height);
                    const blob = await fetch(testImage).then(r => r.blob());
                    const file = new File([blob], `test-${sizeName}.png`, { type: 'image/png' });
                    
                    await simulateFileUpload(fileInput, file);
                    
                    // Check if image was inserted
                    const insertedImage = document.querySelector('img[src*="data:image"]') ||
                                        document.querySelector('.simple-image img') ||
                                        document.querySelector('img[src*="blob:"]');
                    
                    if (insertedImage) {
                        logTest(`Image Upload - ${sizeName} (${sizeInfo.width}×${sizeInfo.height})`, 'PASS');
                        successCount++;
                    } else {
                        logTest(`Image Upload - ${sizeName} (${sizeInfo.width}×${sizeInfo.height})`, 'FAIL', 'Image not inserted');
                    }
                    
                } catch (error) {
                    logTest(`Image Upload - ${sizeName}`, 'FAIL', error.message);
                }
            }
            
            logTest('Image Size Testing Overall', successCount === totalTests ? 'PASS' : 'FAIL', 
                   `${successCount}/${totalTests} tests passed`);
            
            return successCount > 0;
            
        } catch (error) {
            logTest('Image Size Testing', 'FAIL', error.message);
            return false;
        }
    }
    
    async function testImageResizeFunctionality() {
        console.log('\n🧪 TESTING: Image Resize Functionality');
        
        try {
            // Find images
            const images = document.querySelectorAll('img[src*="data:image"], .simple-image img, img[src*="blob:"]');
            
            if (images.length === 0) {
                logTest('Image Resize - Images Found', 'FAIL', 'No images found for resize testing');
                return false;
            }
            
            logTest('Image Resize - Images Found', 'PASS', `Found ${images.length} image(s)`);
            
            let resizeTestsPassed = 0;
            let totalResizeTests = 0;
            
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const imageContainer = image.closest('.simple-image-wrapper') || 
                                     image.closest('.simple-image') ||
                                     image.parentElement;
                
                if (imageContainer) {
                    totalResizeTests++;
                    
                    // Hover over image to show controls
                    const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
                    imageContainer.dispatchEvent(mouseEnterEvent);
                    
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Test resize handles
                    const resizeHandle = imageContainer.querySelector('.react-resizable-handle') ||
                                       imageContainer.querySelector('[style*="cursor: nwse-resize"]') ||
                                       imageContainer.querySelector('[class*="resize"]') ||
                                       imageContainer.querySelector('.react-rnd');
                    
                    if (resizeHandle) {
                        logTest(`Image Resize - Handle ${i + 1}`, 'PASS');
                        resizeTestsPassed++;
                    } else {
                        logTest(`Image Resize - Handle ${i + 1}`, 'FAIL', 'Resize handle not found');
                    }
                    
                    // Test drag handle
                    const dragHandle = imageContainer.querySelector('.drag-handle') ||
                                      imageContainer.querySelector('[title*="move" i]') ||
                                      imageContainer.querySelector('[aria-label*="move" i]');
                    
                    if (dragHandle) {
                        logTest(`Image Drag - Handle ${i + 1}`, 'PASS');
                        resizeTestsPassed++;
                    } else {
                        logTest(`Image Drag - Handle ${i + 1}`, 'FAIL', 'Drag handle not found');
                    }
                    
                    // Test action buttons
                    const rotateButton = imageContainer.querySelector('button[title*="rotate" i]') ||
                                       imageContainer.querySelector('button[aria-label*="rotate" i]') ||
                                       imageContainer.querySelector('button[class*="rotate"]');
                    
                    if (rotateButton) {
                        logTest(`Image Rotate - Button ${i + 1}`, 'PASS');
                        resizeTestsPassed++;
                    } else {
                        logTest(`Image Rotate - Button ${i + 1}`, 'FAIL', 'Rotate button not found');
                    }
                    
                    const removeButton = imageContainer.querySelector('button[title*="remove" i]') ||
                                       imageContainer.querySelector('button[aria-label*="remove" i]') ||
                                       imageContainer.querySelector('button[title*="delete" i]') ||
                                       imageContainer.querySelector('button[class*="remove"]');
                    
                    if (removeButton) {
                        logTest(`Image Remove - Button ${i + 1}`, 'PASS');
                        resizeTestsPassed++;
                    } else {
                        logTest(`Image Remove - Button ${i + 1}`, 'FAIL', 'Remove button not found');
                    }
                }
            }
            
            logTest('Image Resize Functionality Overall', 
                   resizeTestsPassed > 0 ? 'PASS' : 'FAIL', 
                   `${resizeTestsPassed} resize features working`);
            
            return resizeTestsPassed > 0;
            
        } catch (error) {
            logTest('Image Resize Functionality', 'FAIL', error.message);
            return false;
        }
    }
    
    async function testImageTextIntegration() {
        console.log('\n🧪 TESTING: Image Text Integration');
        
        try {
            // Find rich text editor
            const editor = document.querySelector('.ProseMirror') || 
                          document.querySelector('[contenteditable="true"]') ||
                          document.querySelector('.tiptap') ||
                          document.querySelector('.rich-text-editor');
            
            if (!editor) {
                logTest('Image Text Integration - Editor Found', 'FAIL', 'Rich text editor not found');
                return false;
            }
            
            logTest('Image Text Integration - Editor Found', 'PASS');
            
            // Test images in editor
            const images = editor.querySelectorAll('img');
            if (images.length > 0) {
                logTest('Image Text Integration - Images in Editor', 'PASS', `Found ${images.length} image(s) in editor`);
                
                // Test inline display
                const firstImage = images[0];
                const computedStyle = window.getComputedStyle(firstImage);
                
                if (computedStyle.display === 'inline' || computedStyle.display === 'inline-block') {
                    logTest('Image Text Integration - Inline Display', 'PASS');
                } else {
                    logTest('Image Text Integration - Inline Display', 'FAIL', `Display: ${computedStyle.display}`);
                }
            } else {
                logTest('Image Text Integration - Images in Editor', 'FAIL', 'No images found in editor');
            }
            
            // Test text flow
            const textContent = editor.textContent || editor.innerText;
            if (textContent && textContent.length > 0) {
                logTest('Image Text Integration - Text Flow', 'PASS', 'Text content present');
            } else {
                logTest('Image Text Integration - Text Flow', 'FAIL', 'No text content found');
            }
            
            return true;
            
        } catch (error) {
            logTest('Image Text Integration', 'FAIL', error.message);
            return false;
        }
    }
    
    async function testImageErrorHandling() {
        console.log('\n🧪 TESTING: Image Error Handling');
        
        try {
            const fileInput = document.querySelector('input[type="file"][accept*="image"]') ||
                             document.querySelector('input[type="file"]');
            
            if (!fileInput) {
                logTest('Image Error Handling - File Input', 'FAIL', 'File input not found');
                return false;
            }
            
            // Test invalid file type
            const textFile = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
            await simulateFileUpload(fileInput, textFile);
            
            // Check for error handling
            const errorMessage = document.querySelector('.error') || 
                                document.querySelector('[role="alert"]') ||
                                document.querySelector('.text-red-500') ||
                                document.querySelector('.alert') ||
                                document.querySelector('.notification');
            
            if (errorMessage) {
                logTest('Image Error Handling - Invalid File Type', 'PASS', 'Error message displayed');
            } else {
                logTest('Image Error Handling - Invalid File Type', 'FAIL', 'No error message shown');
            }
            
            return true;
            
        } catch (error) {
            logTest('Image Error Handling', 'FAIL', error.message);
            return false;
        }
    }
    
    async function testImageAccessibility() {
        console.log('\n🧪 TESTING: Image Accessibility');
        
        try {
            const images = document.querySelectorAll('img');
            
            if (images.length === 0) {
                logTest('Image Accessibility - Images Found', 'FAIL', 'No images found for accessibility testing');
                return false;
            }
            
            let accessibilityTestsPassed = 0;
            let totalAccessibilityTests = 0;
            
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                totalAccessibilityTests++;
                
                // Test alt text
                if (image.alt && image.alt.trim() !== '') {
                    logTest(`Image Accessibility - Alt Text ${i + 1}`, 'PASS');
                    accessibilityTestsPassed++;
                } else {
                    logTest(`Image Accessibility - Alt Text ${i + 1}`, 'FAIL', 'Missing or empty alt text');
                }
                
                // Test keyboard navigation
                if (image.tabIndex >= 0) {
                    logTest(`Image Accessibility - Keyboard Navigation ${i + 1}`, 'PASS');
                    accessibilityTestsPassed++;
                } else {
                    logTest(`Image Accessibility - Keyboard Navigation ${i + 1}`, 'FAIL', 'Image not keyboard accessible');
                }
            }
            
            logTest('Image Accessibility Overall', 
                   accessibilityTestsPassed > 0 ? 'PASS' : 'FAIL', 
                   `${accessibilityTestsPassed}/${totalAccessibilityTests} accessibility features working`);
            
            return accessibilityTestsPassed > 0;
            
        } catch (error) {
            logTest('Image Accessibility', 'FAIL', error.message);
            return false;
        }
    }
    
    async function testImagePerformance() {
        console.log('\n🧪 TESTING: Image Performance');
        
        try {
            const images = document.querySelectorAll('img');
            
            if (images.length === 0) {
                logTest('Image Performance - Images Found', 'FAIL', 'No images found for performance testing');
                return false;
            }
            
            let performanceTestsPassed = 0;
            let totalPerformanceTests = 0;
            
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                totalPerformanceTests++;
                
                // Test image dimensions
                if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                    logTest(`Image Performance - Dimensions ${i + 1}`, 'PASS', `${image.naturalWidth}×${image.naturalHeight}`);
                    performanceTestsPassed++;
                } else {
                    logTest(`Image Performance - Dimensions ${i + 1}`, 'FAIL', 'Invalid dimensions');
                }
                
                // Test image loading
                if (image.complete) {
                    logTest(`Image Performance - Loaded ${i + 1}`, 'PASS');
                    performanceTestsPassed++;
                } else {
                    logTest(`Image Performance - Loaded ${i + 1}`, 'FAIL', 'Image not loaded');
                }
            }
            
            logTest('Image Performance Overall', 
                   performanceTestsPassed > 0 ? 'PASS' : 'FAIL', 
                   `${performanceTestsPassed}/${totalPerformanceTests} performance tests passed`);
            
            return performanceTestsPassed > 0;
            
        } catch (error) {
            logTest('Image Performance', 'FAIL', error.message);
            return false;
        }
    }
    
    // Main Test Runner
    async function runImageUploadTestSuite() {
        console.log('🚀 STARTING COMPREHENSIVE IMAGE UPLOAD TEST SUITE');
        console.log('=' .repeat(60));
        
        testResults.startTime = performance.now();
        testResults.passed = 0;
        testResults.failed = 0;
        testResults.total = 0;
        testResults.details = [];
        
        try {
            // Check if we're on the right page
            if (!window.location.href.includes('/studies/create')) {
                console.log('⚠️  Not on study creation page. Navigating...');
                window.location.href = `${CONFIG.baseUrl}/studies/create`;
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            // Run all test suites
            await testBasicImageUpload();
            await testImageUploadSizes();
            await testImageResizeFunctionality();
            await testImageTextIntegration();
            await testImageErrorHandling();
            await testImageAccessibility();
            await testImagePerformance();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            logTest('Test Suite Execution', 'FAIL', error.message);
        }
        
        testResults.endTime = performance.now();
        const totalTime = testResults.endTime - testResults.startTime;
        
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
        
        // Save results
        window.imageUploadTestResults = testResults;
        localStorage.setItem('imageUploadTestResults', JSON.stringify(testResults));
        
        console.log('\n🎉 Test suite completed!');
        console.log('Results saved to window.imageUploadTestResults and localStorage');
        
        return testResults;
    }
    
    // Export functions to global scope
    window.runImageUploadTestSuite = runImageUploadTestSuite;
    window.testResults = testResults;
    window.createTestImage = createTestImage;
    
    // Auto-run if requested
    if (window.location.search.includes('autorun=true')) {
        runImageUploadTestSuite();
    } else {
        console.log('🧪 Image Upload Test Suite loaded!');
        console.log('Run window.runImageUploadTestSuite() to start testing');
        console.log('Or visit this page with ?autorun=true to auto-run tests');
    }
    
})();
