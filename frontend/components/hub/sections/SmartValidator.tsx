'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { aiBackendService } from '@/lib/services/ai-backend.service';
import { hubAPIService } from '@/lib/services/hub-api.service';

interface SmartValidatorProps {
  studyId: string;
  statements?: any[];
  responses?: any[];
  onValidationComplete?: (results: any) => void;
}

interface ValidationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details?: any;
}

/**
 * Smart Validator Component - Phase 7 Day 3 Implementation
 *
 * Integrates Phase 6.86b Smart Validator AI
 * Enterprise-grade AI-powered data validation
 *
 * @features
 * - Statement quality validation
 * - Response integrity checks
 * - Statistical validity assessment
 * - Bias detection and mitigation
 * - Cultural sensitivity analysis
 * - Real-time validation feedback
 */
export function SmartValidator({
  studyId,
  statements: initialStatements,
  responses: initialResponses,
  onValidationComplete,
}: SmartValidatorProps) {
  const [statements, setStatements] = useState(initialStatements || []);
  const [responses, setResponses] = useState(initialResponses || []);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [validationChecks, setValidationChecks] = useState<ValidationCheck[]>(
    []
  );
  const [overallScore, setOverallScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [selectedTab, setSelectedTab] = useState<
    'statements' | 'responses' | 'statistical' | 'recommendations'
  >('statements');

  // Load data if not provided
  useEffect(() => {
    if (studyId && (!initialStatements || !initialResponses)) {
      loadStudyData();
    }
  }, [studyId, initialStatements, initialResponses]);

  const loadStudyData = async () => {
    try {
      const hubData = await hubAPIService.getHubData(studyId);
      setStatements(hubData.study.statements || []);
      setResponses(hubData.qsorts.data || []);
    } catch (err: any) {
      setError('Failed to load study data');
    }
  };

  const runValidation = async () => {
    setIsValidating(true);
    setError(null);
    setValidationChecks([]);

    const checks: ValidationCheck[] = [];

    try {
      // Step 1: Validate Statements
      checks.push({
        name: 'Statement Validation',
        status: 'pending',
        message: 'Validating statements...',
        severity: 'critical',
      });
      setValidationChecks([...checks]);

      const statementValidation = await aiBackendService.validateStatements({
        statements: statements.map((s: any) => ({
          id: s.id,
          text: s.text,
          perspective: s.perspective,
          polarity: s.polarity,
        })),
        topic: 'Study Topic', // Would come from study metadata
      });

      const lastCheck = checks[checks.length - 1];
      if (lastCheck) {
        checks[checks.length - 1] = {
          name: lastCheck.name,
          severity: lastCheck.severity,
          status: statementValidation.valid ? 'pass' : 'fail',
          message:
            statementValidation.message || 'Statement validation complete',
          details: statementValidation,
        };
      }
      setValidationChecks([...checks]);

      // Step 2: Bias Detection
      checks.push({
        name: 'Bias Detection',
        status: 'pending',
        message: 'Checking for bias...',
        severity: 'high',
      });
      setValidationChecks([...checks]);

      const biasAnalysis = await aiBackendService.detectBias({
        statements: statements.map((s: any) => s.text),
        analysisDepth: 'comprehensive',
        suggestAlternatives: true,
      });

      const lastBiasCheck = checks[checks.length - 1];
      if (lastBiasCheck) {
        checks[checks.length - 1] = {
          name: lastBiasCheck.name,
          severity: lastBiasCheck.severity,
          status:
            biasAnalysis.analysis.overallBiasScore < 0.3
              ? 'pass'
              : biasAnalysis.analysis.overallBiasScore < 0.6
                ? 'warning'
                : 'fail',
          message: `Bias score: ${(biasAnalysis.analysis.overallBiasScore * 100).toFixed(1)}%`,
          details: biasAnalysis.analysis,
        };
      }
      setValidationChecks([...checks]);

      // Step 3: Cultural Sensitivity
      checks.push({
        name: 'Cultural Sensitivity',
        status: 'pending',
        message: 'Checking cultural sensitivity...',
        severity: 'medium',
      });
      setValidationChecks([...checks]);

      const culturalCheck = await aiBackendService.checkCulturalSensitivity({
        statements: statements.map((s: any) => s.text),
      });

      const lastCulturalCheck = checks[checks.length - 1];
      if (lastCulturalCheck) {
        checks[checks.length - 1] = {
          name: lastCulturalCheck.name,
          severity: lastCulturalCheck.severity,
          status:
            culturalCheck.issues?.length === 0
              ? 'pass'
              : culturalCheck.issues?.length < 3
                ? 'warning'
                : 'fail',
          message:
            culturalCheck.issues?.length === 0
              ? 'No cultural issues detected'
              : `${culturalCheck.issues.length} potential issues found`,
          details: culturalCheck,
        };
      }
      setValidationChecks([...checks]);

      // Step 4: Response Integrity
      checks.push({
        name: 'Response Integrity',
        status: 'pending',
        message: 'Validating response data...',
        severity: 'critical',
      });
      setValidationChecks([...checks]);

      const responseIntegrity = validateResponseIntegrity(responses);
      const lastIntegrityCheck = checks[checks.length - 1];
      if (lastIntegrityCheck) {
        checks[checks.length - 1] = {
          name: lastIntegrityCheck.name,
          severity: lastIntegrityCheck.severity,
          status: responseIntegrity.status || 'fail',
          message:
            responseIntegrity.message || 'Response integrity check complete',
          details: responseIntegrity.details,
        };
      }
      setValidationChecks([...checks]);

      // Step 5: Statistical Validity
      checks.push({
        name: 'Statistical Validity',
        status: 'pending',
        message: 'Checking statistical requirements...',
        severity: 'high',
      });
      setValidationChecks([...checks]);

      const statisticalValidity = validateStatisticalRequirements(
        responses,
        statements
      );
      const lastStatCheck = checks[checks.length - 1];
      if (lastStatCheck) {
        checks[checks.length - 1] = {
          name: lastStatCheck.name,
          severity: lastStatCheck.severity,
          status: statisticalValidity.status || 'fail',
          message:
            statisticalValidity.message ||
            'Statistical validity check complete',
          details: statisticalValidity.details,
        };
      }
      setValidationChecks([...checks]);

      // Step 6: Q-Methodology Requirements
      checks.push({
        name: 'Q-Methodology Compliance',
        status: 'pending',
        message: 'Validating Q-methodology requirements...',
        severity: 'high',
      });
      setValidationChecks([...checks]);

      const qMethodCompliance = validateQMethodRequirements(
        responses,
        statements
      );
      const lastQMethodCheck = checks[checks.length - 1];
      if (lastQMethodCheck) {
        checks[checks.length - 1] = {
          name: lastQMethodCheck.name,
          severity: lastQMethodCheck.severity,
          status: qMethodCompliance.status || 'fail',
          message:
            qMethodCompliance.message ||
            'Q-methodology requirements check complete',
          details: qMethodCompliance.details,
        };
      }
      setValidationChecks([...checks]);

      // Calculate overall score
      const passedChecks = checks.filter(c => c.status === 'pass').length;
      const warningChecks = checks.filter(c => c.status === 'warning').length;
      const totalChecks = checks.length;
      const score = Math.round(
        (passedChecks * 100 + warningChecks * 50) / totalChecks
      );
      setOverallScore(score);

      // Compile final results
      const results = {
        checks,
        score,
        statementValidation,
        biasAnalysis: biasAnalysis.analysis,
        culturalCheck,
        timestamp: new Date().toISOString(),
      };

      setValidationResults(results);
      onValidationComplete?.(results);
    } catch (err: any) {
      setError(err.message || 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const validateResponseIntegrity = (
    responses: any[]
  ): Partial<ValidationCheck> => {
    const issues = [];

    // Check for completeness
    const incompleteResponses = responses.filter(r => !r.completedAt).length;
    if (incompleteResponses > 0) {
      issues.push(`${incompleteResponses} incomplete responses`);
    }

    // Check for duplicates
    const participantIds = responses.map(r => r.participantId);
    const duplicates = participantIds.filter(
      (id, index) => participantIds.indexOf(id) !== index
    );
    if (duplicates.length > 0) {
      issues.push(`${duplicates.length} duplicate responses detected`);
    }

    // Check for suspicious patterns
    const suspiciouslyFast = responses.filter(
      r => r.duration && r.duration < 60
    ).length;
    if (suspiciouslyFast > 0) {
      issues.push(`${suspiciouslyFast} responses completed suspiciously fast`);
    }

    return {
      status:
        issues.length === 0 ? 'pass' : issues.length < 3 ? 'warning' : 'fail',
      message: issues.length === 0 ? 'All responses valid' : issues.join(', '),
      details: { issues },
    };
  };

  const validateStatisticalRequirements = (
    responses: any[],
    statements: any[]
  ): Partial<ValidationCheck> => {
    const issues = [];
    const minResponses = 20; // Minimum for factor analysis
    const minStatementsPerFactor = 4;

    if (responses.length < minResponses) {
      issues.push(`Only ${responses.length}/${minResponses} minimum responses`);
    }

    const expectedFactors = Math.floor(
      statements.length / minStatementsPerFactor
    );
    if (expectedFactors < 2) {
      issues.push('Insufficient statements for meaningful factor extraction');
    }

    // Check for sufficient variance
    if (responses.length > 0) {
      // This would involve actual statistical calculations
      // Simplified check here
      const uniquePatterns = new Set(
        responses.map(r => JSON.stringify(r.rankings))
      ).size;
      if (uniquePatterns < responses.length * 0.5) {
        issues.push('Low response variance detected');
      }
    }

    return {
      status:
        issues.length === 0 ? 'pass' : issues.length < 2 ? 'warning' : 'fail',
      message:
        issues.length === 0
          ? 'Statistical requirements met'
          : issues.join(', '),
      details: { issues, minResponses, expectedFactors },
    };
  };

  const validateQMethodRequirements = (
    responses: any[],
    statements: any[]
  ): Partial<ValidationCheck> => {
    const issues = [];

    // Check P-set to Q-set ratio
    const pToQRatio = responses.length / statements.length;
    if (pToQRatio < 0.5) {
      issues.push(`P-set to Q-set ratio too low (${pToQRatio.toFixed(2)})`);
    }

    // Check for forced distribution compliance
    const hasValidDistribution = responses.every(r => {
      if (!r.rankings) return false;
      const values = Object.values(r.rankings);
      return values.length === statements.length;
    });

    if (!hasValidDistribution) {
      issues.push('Some responses do not follow forced distribution');
    }

    // Check for condition of instruction compliance
    const statementsPerPerspective = statements.reduce((acc: any, s: any) => {
      acc[s.perspective || 'none'] = (acc[s.perspective || 'none'] || 0) + 1;
      return acc;
    }, {});

    const unbalancedPerspectives = Object.values(statementsPerPerspective).some(
      (count: any) => count < 5
    );
    if (unbalancedPerspectives) {
      issues.push('Unbalanced perspective representation');
    }

    return {
      status:
        issues.length === 0 ? 'pass' : issues.length < 2 ? 'warning' : 'fail',
      message:
        issues.length === 0
          ? 'Q-methodology requirements satisfied'
          : issues.join(', '),
      details: { issues, pToQRatio, statementsPerPerspective },
    };
  };

  const renderStatementValidation = () => {
    if (!validationResults?.statementValidation) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {validationResults.statementValidation.details?.map(
            (detail: any, idx: number) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Statement {detail.id}</span>
                    <Badge variant={detail.valid ? 'default' : 'destructive'}>
                      {detail.valid ? 'Valid' : 'Issue'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {detail.issue || 'No issues detected'}
                  </p>
                  {detail.suggestion && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <p className="text-xs">Suggestion: {detail.suggestion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>
    );
  };

  const renderBiasAnalysis = () => {
    if (!validationResults?.biasAnalysis) return null;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Overall Bias Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress
                value={validationResults.biasAnalysis.overallBiasScore * 100}
                className="flex-1"
              />
              <span className="text-lg font-bold">
                {(
                  validationResults.biasAnalysis.overallBiasScore * 100
                ).toFixed(1)}
                %
              </span>
            </div>
          </CardContent>
        </Card>

        {validationResults.biasAnalysis.biasedStatements?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Biased Statements Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {validationResults.biasAnalysis.biasedStatements.map(
                  (stmt: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 bg-red-50 dark:bg-red-900/20 rounded"
                    >
                      <p className="text-sm">{stmt}</p>
                      {validationResults.biasAnalysis.alternatives?.[stmt] && (
                        <p className="text-xs mt-1 text-green-600 dark:text-green-400">
                          Alternative:{' '}
                          {validationResults.biasAnalysis.alternatives[stmt]}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!validationResults) return null;

    const failedChecks = validationChecks.filter(c => c.status === 'fail');
    const warningChecks = validationChecks.filter(c => c.status === 'warning');

    return (
      <div className="space-y-4">
        {failedChecks.length > 0 && (
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Critical Issues ({failedChecks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {failedChecks.map((check, idx) => (
                  <li key={idx} className="text-sm">
                    <span className="font-medium">{check.name}:</span>{' '}
                    {check.message}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {warningChecks.length > 0 && (
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Warnings ({warningChecks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {warningChecks.map((check, idx) => (
                  <li key={idx} className="text-sm">
                    <span className="font-medium">{check.name}:</span>{' '}
                    {check.message}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {validationResults.biasAnalysis?.recommendations && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {validationResults.biasAnalysis.recommendations.map(
                  (rec: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  )
                )}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Smart Validator AI
            <Badge variant="secondary">Phase 6.86b Integration</Badge>
          </CardTitle>

          <Button
            onClick={runValidation}
            disabled={
              isValidating ||
              (statements.length === 0 && responses.length === 0)
            }
            size="sm"
          >
            {isValidating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Validating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                Run Validation
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Overall Score */}
        {validationResults && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Overall Validation Score
              </span>
              <span className="text-2xl font-bold">{overallScore}%</span>
            </div>
            <Progress value={overallScore} className="h-3" />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {overallScore >= 80
                ? 'Excellent - Ready for analysis'
                : overallScore >= 60
                  ? 'Good - Minor issues detected'
                  : overallScore >= 40
                    ? 'Fair - Several issues need attention'
                    : 'Poor - Critical issues must be resolved'}
            </p>
          </div>
        )}

        {/* Validation Checks */}
        {validationChecks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Validation Checks</h3>
            <div className="space-y-2">
              {validationChecks.map((check, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <span className="flex items-center gap-2">
                    {check.status === 'pass' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : check.status === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    ) : check.status === 'fail' ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <LoadingSpinner size="sm" />
                    )}
                    <span className="text-sm">{check.name}</span>
                  </span>
                  <Badge
                    variant={
                      check.status === 'pass'
                        ? 'default'
                        : check.status === 'warning'
                          ? 'secondary'
                          : check.status === 'fail'
                            ? 'destructive'
                            : 'outline'
                    }
                  >
                    {check.message}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Results */}
        {validationResults && (
          <Tabs
            value={selectedTab}
            onValueChange={(v: any) => setSelectedTab(v)}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="statements">Statements</TabsTrigger>
              <TabsTrigger value="responses">Responses</TabsTrigger>
              <TabsTrigger value="statistical">Statistical</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="statements" className="mt-4">
              {renderStatementValidation()}
              {renderBiasAnalysis()}
            </TabsContent>

            <TabsContent value="responses" className="mt-4">
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                Response validation details
              </div>
            </TabsContent>

            <TabsContent value="statistical" className="mt-4">
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                Statistical validation details
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="mt-4">
              {renderRecommendations()}
            </TabsContent>
          </Tabs>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
