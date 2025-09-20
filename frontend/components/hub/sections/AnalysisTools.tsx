'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Calculator, 
  Settings, 
  Play, 
  Download,
  RotateCw,
  BarChart3,
  Brain,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { hubAPIService } from '@/lib/services/hub-api.service';
import { CorrelationMatrix } from './CorrelationMatrix';
import { ResponseAnalyzer } from './ResponseAnalyzer';
import { SmartValidator } from './SmartValidator';

interface AnalysisToolsProps {
  studyId: string;
  onAnalysisComplete?: (results: any) => void;
}

/**
 * Analysis Tools Component - Phase 7 Day 3 Implementation
 * 
 * World-class Q-methodology analysis integration
 * Connects to 8 existing analysis services from backend
 * Part of ANALYZE phase in Research Lifecycle
 * 
 * @features
 * - Factor extraction (Centroid, PCA, ML)
 * - Rotation algorithms (Varimax, Quartimax, Promax, Oblimin)
 * - Statistical analysis with PQMethod compatibility
 * - Real-time progress tracking
 * - Interactive configuration
 * - AI-powered insights
 */
export function AnalysisTools({ studyId, onAnalysisComplete }: AnalysisToolsProps) {
  const [activeTab, setActiveTab] = useState('factor');
  const [mainTab, setMainTab] = useState('traditional');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Analysis Configuration State
  const [config, setConfig] = useState({
    // Factor Extraction
    extractionMethod: 'centroid',
    numFactors: 3,
    eigenValueThreshold: 1.0,
    minLoadingThreshold: 0.35,
    
    // Rotation
    rotationMethod: 'varimax',
    maxIterations: 100,
    convergenceCriteria: 0.0001,
    obliminGamma: 0,
    
    // Bootstrap
    enableBootstrap: false,
    bootstrapIterations: 1000,
    confidenceLevel: 0.95,
    
    // Output Options
    generateReport: true,
    includeCorrelationMatrix: true,
    includeFlaggedLoadings: true,
    includeConsensusStatements: true,
    pqmethodCompatibility: true,
  });

  const [validationStatus, setValidationStatus] = useState<{
    isValid: boolean;
    checks: Array<{ name: string; status: 'pass' | 'fail' | 'warning'; message: string }>;
  }>({
    isValid: false,
    checks: []
  });

  // Validate data before analysis
  useEffect(() => {
    validateStudyData();
  }, [studyId]);

  const validateStudyData = async () => {
    try {
      const validation = await hubAPIService.validateAnalysis(studyId);
      setValidationStatus(validation);
    } catch (err: any) {
      setError('Failed to validate study data');
    }
  };

  const runAnalysis = async () => {
    setIsRunning(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Factor Extraction
      setProgress(20);
      const extractionResult = await hubAPIService.runFactorExtraction(studyId, {
        method: config.extractionMethod,
        numFactors: config.numFactors,
        eigenValueThreshold: config.eigenValueThreshold,
      });

      // Step 2: Rotation
      setProgress(40);
      const rotationResult = await hubAPIService.runRotation(studyId, {
        method: config.rotationMethod,
        loadings: extractionResult.loadings,
        maxIterations: config.maxIterations,
        convergenceCriteria: config.convergenceCriteria,
        obliminGamma: config.obliminGamma,
      });

      // Step 3: Statistical Analysis
      setProgress(60);
      const statisticsResult = await hubAPIService.runStatistics(studyId, {
        factorLoadings: rotationResult.rotatedLoadings,
        minLoadingThreshold: config.minLoadingThreshold,
        includeFlaggedLoadings: config.includeFlaggedLoadings,
        includeConsensusStatements: config.includeConsensusStatements,
      });

      // Step 4: Bootstrap (if enabled)
      let bootstrapResult = null;
      if (config.enableBootstrap) {
        setProgress(80);
        bootstrapResult = await hubAPIService.runBootstrap(studyId, {
          iterations: config.bootstrapIterations,
          confidenceLevel: config.confidenceLevel,
        });
      }

      // Step 5: Generate Report
      setProgress(90);
      const finalResults = {
        extraction: extractionResult,
        rotation: rotationResult,
        statistics: statisticsResult,
        bootstrap: bootstrapResult,
        config: config,
        timestamp: new Date().toISOString(),
      };

      if (config.generateReport) {
        await hubAPIService.generateAnalysisReport(studyId, finalResults);
      }

      setProgress(100);
      setResults(finalResults);
      onAnalysisComplete?.(finalResults);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setIsRunning(false);
    }
  };

  const renderValidationChecks = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Pre-Analysis Validation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {validationStatus.checks.map((check, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
              <span className="flex items-center gap-2">
                {check.status === 'pass' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : check.status === 'warning' ? (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                {check.name}
              </span>
              <Badge variant={check.status === 'pass' ? 'default' : check.status === 'warning' ? 'secondary' : 'destructive'}>
                {check.message}
              </Badge>
            </div>
          ))}
        </div>
        {!validationStatus.isValid && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              Data validation failed. Please ensure all participants have completed their Q-sorts.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderExtractionConfig = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">Extraction Method</label>
        <Select value={config.extractionMethod} onValueChange={(v) => setConfig({...config, extractionMethod: v})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="centroid">Centroid (Classic Q)</SelectItem>
            <SelectItem value="pca">Principal Components (PCA)</SelectItem>
            <SelectItem value="ml">Maximum Likelihood (ML)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Number of Factors: {config.numFactors}
        </label>
        <Slider
          value={[config.numFactors]}
          onValueChange={([v]) => setConfig({...config, numFactors: v || config.numFactors})}
          min={1}
          max={10}
          step={1}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Eigenvalue Threshold: {config.eigenValueThreshold}
        </label>
        <Slider
          value={[config.eigenValueThreshold]}
          onValueChange={([v]) => setConfig({...config, eigenValueThreshold: v || config.eigenValueThreshold})}
          min={0.5}
          max={2.0}
          step={0.1}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Minimum Loading Threshold: {config.minLoadingThreshold}
        </label>
        <Slider
          value={[config.minLoadingThreshold]}
          onValueChange={([v]) => setConfig({...config, minLoadingThreshold: v || config.minLoadingThreshold})}
          min={0.2}
          max={0.5}
          step={0.05}
          className="w-full"
        />
      </div>
    </div>
  );

  const renderRotationConfig = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">Rotation Method</label>
        <Select value={config.rotationMethod} onValueChange={(v) => setConfig({...config, rotationMethod: v})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="varimax">Varimax (Orthogonal)</SelectItem>
            <SelectItem value="quartimax">Quartimax (Orthogonal)</SelectItem>
            <SelectItem value="promax">Promax (Oblique)</SelectItem>
            <SelectItem value="oblimin">Direct Oblimin (Oblique)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.rotationMethod === 'oblimin' && (
        <div>
          <label className="text-sm font-medium mb-2 block">
            Gamma Value: {config.obliminGamma}
          </label>
          <Slider
            value={[config.obliminGamma]}
            onValueChange={([v]) => setConfig({...config, obliminGamma: v ?? config.obliminGamma})}
            min={-1}
            max={1}
            step={0.1}
            className="w-full"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-2 block">
          Max Iterations: {config.maxIterations}
        </label>
        <Slider
          value={[config.maxIterations]}
          onValueChange={([v]) => setConfig({...config, maxIterations: v || config.maxIterations})}
          min={25}
          max={500}
          step={25}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Enable Bootstrap Analysis</label>
        <Switch
          checked={config.enableBootstrap}
          onCheckedChange={(v: boolean) => setConfig({...config, enableBootstrap: v})}
        />
      </div>

      {config.enableBootstrap && (
        <div>
          <label className="text-sm font-medium mb-2 block">
            Bootstrap Iterations: {config.bootstrapIterations}
          </label>
          <Slider
            value={[config.bootstrapIterations]}
            onValueChange={([v]) => setConfig({...config, bootstrapIterations: v || config.bootstrapIterations})}
            min={100}
            max={5000}
            step={100}
            className="w-full"
          />
        </div>
      )}
    </div>
  );

  const renderAdvancedConfig = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Generate Comprehensive Report</label>
          <Switch
            checked={config.generateReport}
            onCheckedChange={(v: boolean) => setConfig({...config, generateReport: v})}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Include Correlation Matrix</label>
          <Switch
            checked={config.includeCorrelationMatrix}
            onCheckedChange={(v: boolean) => setConfig({...config, includeCorrelationMatrix: v})}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Include Flagged Loadings</label>
          <Switch
            checked={config.includeFlaggedLoadings}
            onCheckedChange={(v: boolean) => setConfig({...config, includeFlaggedLoadings: v})}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Include Consensus Statements</label>
          <Switch
            checked={config.includeConsensusStatements}
            onCheckedChange={(v: boolean) => setConfig({...config, includeConsensusStatements: v})}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">PQMethod Compatibility Mode</label>
          <Switch
            checked={config.pqmethodCompatibility}
            onCheckedChange={(v: boolean) => setConfig({...config, pqmethodCompatibility: v})}
          />
        </div>
      </div>

      <Alert>
        <AlertDescription>
          PQMethod compatibility ensures output formats match traditional Q-methodology software
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderResults = () => {
    if (!results) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Factors Extracted</div>
              <div className="text-2xl font-bold">{results.extraction?.numFactors || 0}</div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Variance Explained</div>
              <div className="text-2xl font-bold">
                {results.extraction?.totalVariance ? `${(results.extraction.totalVariance * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Rotation Iterations</div>
              <div className="text-2xl font-bold">{results.rotation?.iterations || 0}</div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => hubAPIService.downloadResults(studyId, 'excel')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Excel Report
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => hubAPIService.downloadResults(studyId, 'pqmethod')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export to PQMethod Format
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Q-Methodology Analysis Suite</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enterprise-grade factor analysis with PQMethod compatibility
        </p>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="traditional">Factor Analysis</TabsTrigger>
          <TabsTrigger value="correlation">Correlation</TabsTrigger>
          <TabsTrigger value="ai-response">AI Response</TabsTrigger>
          <TabsTrigger value="ai-validator">AI Validator</TabsTrigger>
        </TabsList>

        <TabsContent value="traditional">
          {renderValidationChecks()}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Analysis Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="extraction">
                    <Calculator className="h-4 w-4 mr-2" />
                    Extraction
                  </TabsTrigger>
                  <TabsTrigger value="rotation">
                    <RotateCw className="h-4 w-4 mr-2" />
                    Rotation
                  </TabsTrigger>
                  <TabsTrigger value="advanced">
                    <Brain className="h-4 w-4 mr-2" />
                    Advanced
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="extraction" className="mt-6">
                  {renderExtractionConfig()}
                </TabsContent>
                
                <TabsContent value="rotation" className="mt-6">
                  {renderRotationConfig()}
                </TabsContent>
                
                <TabsContent value="advanced" className="mt-6">
                  {renderAdvancedConfig()}
                </TabsContent>
              </Tabs>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isRunning && (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Analysis in progress... {progress}%
                      </span>
                    </>
                  )}
                </div>
                
                <Button
                  onClick={runAnalysis}
                  disabled={!validationStatus.isValid || isRunning}
                  className="min-w-[150px]"
                >
                  {isRunning ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Analysis
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {renderResults()}
        </TabsContent>

        <TabsContent value="correlation">
          <CorrelationMatrix studyId={studyId} />
        </TabsContent>

        <TabsContent value="ai-response">
          <ResponseAnalyzer studyId={studyId} />
        </TabsContent>

        <TabsContent value="ai-validator">
          <SmartValidator studyId={studyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}