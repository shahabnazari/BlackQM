#!/usr/bin/env node

/**
 * UI Component Visual Testing Script
 * Tests that all components render correctly with proper styles
 */

const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

async function testComponents() {
  console.log('🔍 Testing VQMethod UI Components...\n');
  
  try {
    // Fetch the homepage
    const response = await fetch('http://localhost:3001');
    const html = await response.text();
    
    // Parse HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Test Results
    const results = {
      passed: [],
      failed: []
    };
    
    // Test 1: Check if main buttons are present
    const buttons = document.querySelectorAll('button');
    if (buttons.length > 0) {
      results.passed.push('✅ Buttons are rendering');
      
      // Check for button variants
      const hasResearcherButton = Array.from(buttons).some(btn => 
        btn.textContent.includes('Researcher Portal')
      );
      const hasParticipantButton = Array.from(buttons).some(btn => 
        btn.textContent.includes('Participant Portal')
      );
      
      if (hasResearcherButton && hasParticipantButton) {
        results.passed.push('✅ Main portal buttons are present');
      } else {
        results.failed.push('❌ Missing portal buttons');
      }
    } else {
      results.failed.push('❌ No buttons found');
    }
    
    // Test 2: Check for badges
    const badges = document.querySelectorAll('[role="status"]');
    if (badges.length > 0) {
      results.passed.push('✅ Badges are rendering');
    } else {
      results.failed.push('❌ No badges found');
    }
    
    // Test 3: Check for progress bars
    const progressBars = document.querySelectorAll('[role="progressbar"]');
    if (progressBars.length > 0) {
      results.passed.push('✅ Progress bars are rendering');
    } else {
      results.failed.push('❌ No progress bars found');
    }
    
    // Test 4: Check for cards
    const cards = document.querySelectorAll('[role="article"]');
    if (cards.length > 0) {
      results.passed.push('✅ Cards are rendering');
    } else {
      results.failed.push('❌ No cards found');
    }
    
    // Test 5: Check for theme toggle
    const themeToggle = Array.from(buttons).find(btn => 
      btn.getAttribute('aria-label')?.includes('theme') || 
      btn.getAttribute('aria-label')?.includes('mode')
    );
    if (themeToggle) {
      results.passed.push('✅ Theme toggle is present');
    } else {
      results.failed.push('❌ Theme toggle not found');
    }
    
    // Test 6: Check for proper color classes
    const hasSystemColors = html.includes('system-blue') && 
                           html.includes('system-green');
    if (hasSystemColors) {
      results.passed.push('✅ System colors are being used');
    } else {
      results.failed.push('❌ System colors not properly applied');
    }
    
    // Display Results
    console.log('Test Results:');
    console.log('=============\n');
    
    results.passed.forEach(msg => console.log(msg));
    if (results.failed.length > 0) {
      console.log('\nIssues Found:');
      results.failed.forEach(msg => console.log(msg));
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`Total: ${results.passed.length} passed, ${results.failed.length} failed`);
    
    if (results.failed.length === 0) {
      console.log('\n🎉 All UI components are rendering correctly!');
    } else {
      console.log('\n⚠️  Some components need attention.');
    }
    
  } catch (error) {
    console.error('❌ Error testing components:', error.message);
    console.log('\nMake sure the development server is running on http://localhost:3001');
  }
}

// Run tests
testComponents();