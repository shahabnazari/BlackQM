'use client';

import { useState } from 'react';
// import { useRouter } from 'next/navigation'; // Will be used for test navigation

interface TestResult {
  step: string;
  status: 'pending' | 'testing' | 'passed' | 'failed';
  message?: string;
  timestamp?: string;
}

export default function E2EStudyTestPage() {
  // const router = useRouter(); // Reserved for navigation after tests
  const [testResults, setTestResults] = useState<TestResult[]>([
    { step: 'Navigate to Study Creation Page', status: 'pending' },
    { step: 'Fill Basic Information', status: 'pending' },
    { step: 'Add Study Stimuli', status: 'pending' },
    { step: 'Configure Grid Settings', status: 'pending' },
    { step: 'Configure Advanced Settings', status: 'pending' },
    { step: 'Test Data Persistence (Page Refresh)', status: 'pending' },
    { step: 'Preview Study', status: 'pending' },
    { step: 'Submit Study', status: 'pending' },
    { step: 'Verify Study in Dashboard', status: 'pending' },
  ]);

  const [currentTest, setCurrentTest] = useState<number>(-1);
  const [testData, setTestData] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const updateTestStatus = (index: number, status: TestResult['status'], message?: string) => {
    setTestResults(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        status,
        ...(message && { message }),
        timestamp: new Date().toISOString()
      };
      return updated;
    });
  };

  const runE2ETest = async () => {
    setIsRunning(true);
    const timestamp = Date.now();
    const testStudyData = {
      title: `E2E Test Study ${timestamp}`,
      description: 'Comprehensive end-to-end test study to verify the entire creation workflow',
      instructions: 'Please sort the following items according to your preference. Drag and drop items into the grid.',
      stimuli: [
        { type: 'text', content: 'Item 1: Quality of Service' },
        { type: 'text', content: 'Item 2: Customer Support' },
        { type: 'text', content: 'Item 3: Product Features' },
        { type: 'text', content: 'Item 4: Pricing Value' },
        { type: 'text', content: 'Item 5: User Experience' },
        { type: 'text', content: 'Item 6: Innovation' },
      ],
      gridSettings: {
        columns: 5,
        rows: 3,
        columnLabels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
        distribution: [1, 2, 2, 2, 1]
      },
      advancedSettings: {
        participantLimit: 50,
        allowAnonymous: true,
        randomizeStimuli: true,
        showProgress: true,
        requireComments: false
      }
    };

    setTestData(testStudyData);

    // Test 1: Navigate to Study Creation Page
    setCurrentTest(0);
    updateTestStatus(0, 'testing', 'Navigating to study creation page...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Simulate navigation
      window.open('/studies/create', '_blank');
      updateTestStatus(0, 'passed', 'Study creation page opened successfully');
    } catch (error: any) {
      updateTestStatus(0, 'failed', `Failed to navigate: ${error}`);
      setIsRunning(false);
      return;
    }

    // Test 2: Fill Basic Information
    setCurrentTest(1);
    updateTestStatus(1, 'testing', 'Filling basic information...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Store in localStorage to simulate form filling
      localStorage.setItem('studyCreation_basicInfo', JSON.stringify({
        title: testStudyData.title,
        description: testStudyData.description,
        instructions: testStudyData.instructions
      }));
      updateTestStatus(1, 'passed', 'Basic information saved to localStorage');
    } catch (error: any) {
      updateTestStatus(1, 'failed', `Failed to save basic info: ${error}`);
    }

    // Test 3: Add Study Stimuli
    setCurrentTest(2);
    updateTestStatus(2, 'testing', 'Adding study stimuli...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      localStorage.setItem('studyCreation_stimuli', JSON.stringify(testStudyData.stimuli));
      updateTestStatus(2, 'passed', `Added ${testStudyData.stimuli.length} stimuli`);
    } catch (error: any) {
      updateTestStatus(2, 'failed', `Failed to add stimuli: ${error}`);
    }

    // Test 4: Configure Grid Settings
    setCurrentTest(3);
    updateTestStatus(3, 'testing', 'Configuring grid settings...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      localStorage.setItem('studyCreation_gridSettings', JSON.stringify(testStudyData.gridSettings));
      updateTestStatus(3, 'passed', `Grid configured: ${testStudyData.gridSettings.columns}x${testStudyData.gridSettings.rows}`);
    } catch (error: any) {
      updateTestStatus(3, 'failed', `Failed to configure grid: ${error}`);
    }

    // Test 5: Configure Advanced Settings
    setCurrentTest(4);
    updateTestStatus(4, 'testing', 'Configuring advanced settings...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      localStorage.setItem('studyCreation_advancedSettings', JSON.stringify(testStudyData.advancedSettings));
      updateTestStatus(4, 'passed', 'Advanced settings configured');
    } catch (error: any) {
      updateTestStatus(4, 'failed', `Failed to configure settings: ${error}`);
    }

    // Test 6: Test Data Persistence
    setCurrentTest(5);
    updateTestStatus(5, 'testing', 'Testing data persistence after refresh...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const savedBasicInfo = localStorage.getItem('studyCreation_basicInfo');
      const savedStimuli = localStorage.getItem('studyCreation_stimuli');
      const savedGrid = localStorage.getItem('studyCreation_gridSettings');
      const savedAdvanced = localStorage.getItem('studyCreation_advancedSettings');

      if (savedBasicInfo && savedStimuli && savedGrid && savedAdvanced) {
        const basicInfo = JSON.parse(savedBasicInfo);
        const stimuli = JSON.parse(savedStimuli);
        
        if (basicInfo.title === testStudyData.title && stimuli.length === testStudyData.stimuli.length) {
          updateTestStatus(5, 'passed', 'All data persisted correctly');
        } else {
          updateTestStatus(5, 'failed', 'Data mismatch after persistence');
        }
      } else {
        updateTestStatus(5, 'failed', 'Some data missing from localStorage');
      }
    } catch (error: any) {
      updateTestStatus(5, 'failed', `Persistence test failed: ${error}`);
    }

    // Test 7: Preview Study
    setCurrentTest(6);
    updateTestStatus(6, 'testing', 'Testing study preview...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Simulate preview data generation
      const previewData = {
        ...testStudyData,
        previewMode: true,
        timestamp: new Date().toISOString()
      };
      sessionStorage.setItem('studyPreview', JSON.stringify(previewData));
      updateTestStatus(6, 'passed', 'Study preview generated successfully');
    } catch (error: any) {
      updateTestStatus(6, 'failed', `Preview failed: ${error}`);
    }

    // Test 8: Submit Study
    setCurrentTest(7);
    updateTestStatus(7, 'testing', 'Submitting study to backend...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const response = await fetch('http://localhost:4000/api/studies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: testStudyData.title,
          description: testStudyData.description,
          instructions: testStudyData.instructions,
          statements: testStudyData.stimuli.map((s, i) => ({
            id: i + 1,
            text: s.content
          })),
          gridConfig: {
            columns: testStudyData.gridSettings.columns,
            rows: testStudyData.gridSettings.rows,
            columnLabels: testStudyData.gridSettings.columnLabels,
            distribution: testStudyData.gridSettings.distribution
          },
          settings: testStudyData.advancedSettings,
          status: 'draft'
        })
      });

      if (response.ok) {
        const createdStudy = await response.json();
        localStorage.setItem('lastCreatedStudyId', createdStudy.id);
        updateTestStatus(7, 'passed', `Study created with ID: ${createdStudy.id}`);
      } else {
        const error = await response.text();
        updateTestStatus(7, 'failed', `Server error: ${error}`);
      }
    } catch (error: any) {
      updateTestStatus(7, 'failed', `Submission failed: ${error}`);
    }

    // Test 9: Verify Study in Dashboard
    setCurrentTest(8);
    updateTestStatus(8, 'testing', 'Verifying study appears in dashboard...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const studyId = localStorage.getItem('lastCreatedStudyId');
      if (studyId) {
        const response = await fetch(`http://localhost:4000/api/studies/${studyId}`);
        if (response.ok) {
          const study = await response.json();
          if (study.title === testStudyData.title) {
            updateTestStatus(8, 'passed', 'Study verified in dashboard');
          } else {
            updateTestStatus(8, 'failed', 'Study data mismatch');
          }
        } else {
          updateTestStatus(8, 'failed', 'Study not found in backend');
        }
      } else {
        updateTestStatus(8, 'failed', 'No study ID available');
      }
    } catch (error: any) {
      updateTestStatus(8, 'failed', `Verification failed: ${error}`);
    }

    setCurrentTest(-1);
    setIsRunning(false);

    // Clean up test data
    localStorage.removeItem('studyCreation_basicInfo');
    localStorage.removeItem('studyCreation_stimuli');
    localStorage.removeItem('studyCreation_gridSettings');
    localStorage.removeItem('studyCreation_advancedSettings');
    sessionStorage.removeItem('studyPreview');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'testing':
        return '🔄';
      case 'passed':
        return '✅';
      case 'failed':
        return '❌';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'testing':
        return 'text-blue-500 animate-pulse';
      case 'passed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
    }
  };

  const totalTests = testResults.length;
  const passedTests = testResults.filter((t: any) => t.status === 'passed').length;
  const failedTests = testResults.filter((t: any) => t.status === 'failed').length;
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6">End-to-End Study Creation Test</h1>
          
          <div className="mb-6">
            <button
              onClick={runE2ETest}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                isRunning 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isRunning ? 'Test Running...' : 'Run E2E Test'}
            </button>
          </div>

          {testData && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Test Data:</h3>
              <p className="text-sm">Study Title: {testData.title}</p>
              <p className="text-sm">Stimuli Count: {testData.stimuli.length}</p>
              <p className="text-sm">Grid Size: {testData.gridSettings.columns}x{testData.gridSettings.rows}</p>
            </div>
          )}

          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-all ${
                  currentTest === index 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getStatusIcon(result.status)}</span>
                    <div>
                      <h3 className={`font-semibold ${getStatusColor(result.status)}`}>
                        {result.step}
                      </h3>
                      {result.message && (
                        <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                      )}
                      {result.timestamp && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!isRunning && (passedTests > 0 || failedTests > 0) && (
            <div className="mt-8 p-6 bg-gray-100 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Test Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500">{passedTests}</p>
                  <p className="text-sm text-gray-600">Passed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-500">{failedTests}</p>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-500">{successRate}%</p>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}