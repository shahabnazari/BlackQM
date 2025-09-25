'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  TrendingUp,
  Brain,
  Award,
  Gauge,
  Target,
  Zap,
  X
} from 'lucide-react';
import { useCachedAIRequest } from '@/hooks/useAIBackend';
import { aiBackendService } from '@/lib/services/ai-backend.service';

interface ValidationRule {
  field: string;
  rule: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message?: string;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'number' | 'select' | 'checkbox';
  value: any;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: ValidationRule[];
}

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  suggestions?: Record<string, string>;
  nextQuestions?: Array<{ field: string; question: string; type: string }>;
  qualityScore?: number;
  qualityMetrics?: QualityMetrics;
}

interface QualityMetrics {
  completeness: number;
  consistency: number;
  relevance: number;
  clarity: number;
  depth: number;
  overall: number;
  confidence: number;
  predictions: {
    willPassReview: boolean;
    estimatedReviewTime: number;
    requiredImprovements: string[];
    strengthAreas: string[];
  };
}

interface FieldQualityScore {
  field: string;
  score: number;
  factors: {
    length: number;
    complexity: number;
    relevance: number;
    consistency: number;
  };
  improvements: string[];
  trend: 'improving' | 'declining' | 'stable';
}

interface SmartValidatorProps {
  fields: FormField[];
  formData: Record<string, any>;
  onValidation?: (result: ValidationResult) => void;
  onFieldChange?: (name: string, value: any) => void;
  adaptiveMode?: boolean;
  context?: string;
  className?: string;
}

export function SmartValidator({
  fields,
  formData,
  onValidation,
  onFieldChange,
  adaptiveMode = true,
  context,
  className
}: SmartValidatorProps) {
  const [validationState, setValidationState] = useState<Record<string, 'valid' | 'invalid' | 'pending'>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [additionalFields, setAdditionalFields] = useState<FormField[]>([]);
  
  // Predictive Quality Scoring State
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [fieldQualityScores, setFieldQualityScores] = useState<Record<string, FieldQualityScore>>({});
  const [overallQualityScore, setOverallQualityScore] = useState(0);
  const [qualityHistory, setQualityHistory] = useState<number[]>([]);
  const [showQualityPanel, setShowQualityPanel] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);

  // Use cached AI request for smart validation
  const { loading, execute } = useCachedAIRequest(
    aiBackendService.validateSmartly.bind(aiBackendService),
    'smart-validation',
    30000 // 30 second cache
  );

  // Predictive Quality Scoring Functions
  const calculateFieldQualityScore = useCallback((field: FormField): FieldQualityScore => {
    const value = formData[field.name] || '';
    const valueStr = String(value);
    
    // Calculate individual quality factors
    const lengthScore = Math.min(100, (valueStr.length / 50) * 100);
    const complexityScore = calculateTextComplexity(valueStr);
    const relevanceScore = calculateRelevance(valueStr, field.label, context);
    const consistencyScore = calculateConsistency(valueStr, formData);
    
    // Calculate overall field score
    const score = (lengthScore * 0.2 + complexityScore * 0.3 + 
                  relevanceScore * 0.3 + consistencyScore * 0.2);
    
    // Determine improvements needed
    const improvements: string[] = [];
    if (lengthScore < 50) improvements.push('Add more detail');
    if (complexityScore < 50) improvements.push('Use more descriptive language');
    if (relevanceScore < 50) improvements.push('Ensure response addresses the question');
    if (consistencyScore < 50) improvements.push('Check for consistency with other responses');
    
    // Determine trend
    const previousScore = fieldQualityScores[field.name]?.score || score;
    const trend = score > previousScore ? 'improving' : 
                 score < previousScore ? 'declining' : 'stable';
    
    return {
      field: field.name,
      score,
      factors: {
        length: lengthScore,
        complexity: complexityScore,
        relevance: relevanceScore,
        consistency: consistencyScore,
      },
      improvements,
      trend,
    };
  }, [formData, fieldQualityScores, context]);

  const calculateTextComplexity = (text: string): number => {
    if (!text) return 0;
    
    // Simple complexity metrics
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1);
    const vocabularyDiversity = (uniqueWords.size / (words.length || 1)) * 100;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgSentenceLength = words.length / (sentenceCount || 1);
    
    // Weighted complexity score
    const complexityScore = Math.min(100, 
      (avgWordLength - 3) * 10 + 
      vocabularyDiversity * 0.5 + 
      Math.min(20, avgSentenceLength) * 2
    );
    
    return Math.max(0, complexityScore);
  };

  const calculateRelevance = (text: string, fieldLabel: string, context?: string): number => {
    if (!text) return 0;
    
    // Extract keywords from field label and context
    const keywords = [
      ...fieldLabel.toLowerCase().split(/\s+/),
      ...(context ? context.toLowerCase().split(/\s+/) : [])
    ].filter(w => w.length > 3);
    
    // Check keyword presence in text
    const textLower = text.toLowerCase();
    const keywordMatches = keywords.filter(kw => textLower.includes(kw)).length;
    const relevanceScore = Math.min(100, (keywordMatches / Math.max(1, keywords.length)) * 100 + 30);
    
    return relevanceScore;
  };

  const calculateConsistency = (text: string, allData: Record<string, any>): number => {
    if (!text) return 50; // Neutral score for empty text
    
    // Check for consistency patterns
    const otherValues = Object.values(allData).filter(v => v && v !== text);
    if (otherValues.length === 0) return 100;
    
    // Simple consistency check based on sentiment and length patterns
    const textLength = text.length;
    const avgLength = otherValues.reduce((sum, v) => sum + String(v).length, 0) / otherValues.length;
    const lengthConsistency = 100 - Math.min(50, Math.abs(textLength - avgLength) / avgLength * 100);
    
    return lengthConsistency;
  };

  const predictQualityMetrics = useCallback(async () => {
    setIsPredicting(true);
    
    try {
      // Calculate field scores
      const newFieldScores: Record<string, FieldQualityScore> = {};
      let totalScore = 0;
      let fieldCount = 0;
      
      for (const field of fields) {
        const fieldScore = calculateFieldQualityScore(field);
        newFieldScores[field.name] = fieldScore;
        totalScore += fieldScore.score;
        fieldCount++;
      }
      
      const avgScore = fieldCount > 0 ? totalScore / fieldCount : 0;
      
      // Update quality history
      const newHistory = [...qualityHistory, avgScore].slice(-10); // Keep last 10 scores
      setQualityHistory(newHistory);
      
      // Trend calculation removed (unused)
      
      // Create quality metrics
      const metrics: QualityMetrics = {
        completeness: fields.filter(f => formData[f.name]).length / fields.length * 100,
        consistency: Object.values(newFieldScores).reduce((sum, fs) => sum + fs.factors.consistency, 0) / fieldCount,
        relevance: Object.values(newFieldScores).reduce((sum, fs) => sum + fs.factors.relevance, 0) / fieldCount,
        clarity: Object.values(newFieldScores).reduce((sum, fs) => sum + fs.factors.complexity, 0) / fieldCount,
        depth: Object.values(newFieldScores).reduce((sum, fs) => sum + fs.factors.length, 0) / fieldCount,
        overall: avgScore,
        confidence: Math.min(95, avgScore + 10), // Confidence is slightly higher than score
        predictions: {
          willPassReview: avgScore >= 70,
          estimatedReviewTime: Math.max(5, Math.floor(30 - avgScore / 4)), // Minutes
          requiredImprovements: Object.values(newFieldScores)
            .flatMap(fs => fs.improvements)
            .filter((v, i, a) => a.indexOf(v) === i) // Unique improvements
            .slice(0, 3),
          strengthAreas: Object.entries(newFieldScores)
            .filter(([_, fs]) => fs.score >= 80)
            .map(([name, _]) => fields.find(f => f.name === name)?.label || name)
            .slice(0, 3),
        },
      };
      
      setFieldQualityScores(newFieldScores);
      setQualityMetrics(metrics);
      setOverallQualityScore(avgScore);
      
    } catch (error) {
      console.error('Quality prediction failed:', error);
    } finally {
      setIsPredicting(false);
    }
  }, [fields, formData, calculateFieldQualityScore, qualityHistory]);

  // Auto-predict quality on significant changes
  useEffect(() => {
    const hasSignificantData = Object.values(formData).some(v => v && String(v).length > 10);
    if (hasSignificantData && adaptiveMode) {
      const debounceTimer = setTimeout(() => {
        predictQualityMetrics();
      }, 1000); // Debounce for 1 second
      
      return () => clearTimeout(debounceTimer);
    }
    return undefined; // Explicit return for when condition is false
  }, [formData, adaptiveMode, predictQualityMetrics]);

  // Perform basic client-side validation
  const performBasicValidation = useCallback((field: FormField): string | null => {
    const value = formData[field.name];
    
    if (!field.validation) return null;

    for (const rule of field.validation) {
      switch (rule.rule) {
        case 'required':
          if (!value || (typeof value === 'string' && !value.trim())) {
            return rule.message || `${field.label} is required`;
          }
          break;
        
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (value && !emailRegex.test(value)) {
            return rule.message || 'Please enter a valid email address';
          }
          break;
        
        case 'minLength':
          if (value && value.length < rule.value) {
            return rule.message || `Minimum length is ${rule.value} characters`;
          }
          break;
        
        case 'maxLength':
          if (value && value.length > rule.value) {
            return rule.message || `Maximum length is ${rule.value} characters`;
          }
          break;
        
        case 'pattern':
          const regex = new RegExp(rule.value);
          if (value && !regex.test(value)) {
            return rule.message || 'Invalid format';
          }
          break;
      }
    }
    
    return null;
  }, [formData]);

  // Validate individual field
  const validateField = useCallback(async (field: FormField) => {
    const basicError = performBasicValidation(field);
    
    if (basicError) {
      setErrors(prev => ({ ...prev, [field.name]: basicError }));
      setValidationState(prev => ({ ...prev, [field.name]: 'invalid' }));
      return false;
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field.name];
        return newErrors;
      });
      setValidationState(prev => ({ ...prev, [field.name]: 'valid' }));
      return true;
    }
  }, [performBasicValidation]);

  // Perform smart AI validation
  const performSmartValidation = async () => {
    if (!adaptiveMode) return;

    setIsValidating(true);
    
    try {
      // Build validation rules from fields
      const validationRules: ValidationRule[] = fields.flatMap(field => 
        field.validation || []
      ).map(rule => ({ ...rule }));

      const result = await execute({
        formData,
        validationRules,
        ...(context && { context }),
        adaptiveMode
      });

      if (result) {
        // Update errors
        setErrors(result.errors || {});
        
        // Update suggestions
        setSuggestions(result.suggestions || {});
        
        // Update validation state
        const newValidationState: Record<string, 'valid' | 'invalid' | 'pending'> = {};
        fields.forEach(field => {
          if (result.errors[field.name]) {
            newValidationState[field.name] = 'invalid';
          } else if (formData[field.name]) {
            newValidationState[field.name] = 'valid';
          }
        });
        setValidationState(newValidationState);

        // Add adaptive fields if any
        if (result.nextQuestions && result.nextQuestions.length > 0) {
          const newFields: FormField[] = result.nextQuestions.map(q => ({
            name: q.field,
            label: q.question,
            type: q.type as any,
            value: '',
            required: false
          }));
          setAdditionalFields(newFields);
        }

        if (onValidation) {
          onValidation(result);
        }
      }
    } catch (err) {
      console.error('Smart validation failed:', err);
    } finally {
      setIsValidating(false);
    }
  };

  // Validate all fields
  const validateAll = useCallback(async () => {
    let allValid = true;
    
    for (const field of fields) {
      const isValid = await validateField(field);
      if (!isValid) allValid = false;
    }
    
    if (allValid && adaptiveMode) {
      await performSmartValidation();
    }
    
    return allValid;
  }, [fields, validateField, adaptiveMode]);

  // Handle field blur for individual validation
  const handleFieldBlur = (field: FormField) => {
    validateField(field);
  };

  // Handle form submission validation
  const handleValidateAll = () => {
    validateAll();
  };

  const getFieldIcon = (fieldName: string) => {
    const state = validationState[fieldName];
    if (!state || state === 'pending') return null;
    
    if (state === 'valid') {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const allFields = [...fields, ...additionalFields];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Smart Form Validation
          {adaptiveMode && (
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Enhanced
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {allFields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
              {getFieldIcon(field.name)}
            </Label>
            
            {field.type === 'textarea' ? (
              <Textarea
                id={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => onFieldChange?.(field.name, e.target.value)}
                onBlur={() => handleFieldBlur(field)}
                placeholder={field.placeholder}
                className={errors[field.name] ? 'border-red-500' : ''}
              />
            ) : field.type === 'select' ? (
              <select
                id={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => onFieldChange?.(field.name, e.target.value)}
                onBlur={() => handleFieldBlur(field)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select...</option>
                {field.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <Input
                id={field.name}
                type={field.type}
                value={formData[field.name] || ''}
                onChange={(e) => onFieldChange?.(field.name, e.target.value)}
                onBlur={() => handleFieldBlur(field)}
                placeholder={field.placeholder}
                className={errors[field.name] ? 'border-red-500' : ''}
              />
            )}
            
            {/* Error Message */}
            {errors[field.name] && (
              <Alert variant="destructive" className="py-1">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  {errors[field.name]}
                </AlertDescription>
              </Alert>
            )}
            
            {/* AI Suggestion */}
            {suggestions[field.name] && adaptiveMode && (
              <Alert className="py-1">
                <Info className="h-3 w-3" />
                <AlertDescription className="text-xs flex items-center justify-between">
                  <span>{suggestions[field.name]}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setShowSuggestions(prev => ({
                      ...prev,
                      [field.name]: !prev[field.name]
                    }))}
                  >
                    {showSuggestions[field.name] ? 
                      <EyeOff className="h-3 w-3" /> : 
                      <Eye className="h-3 w-3" />
                    }
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        ))}
        
        {/* Predictive Quality Score Panel */}
        {adaptiveMode && showQualityPanel && (
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold">Predictive Quality Score</h4>
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Real-time ML Analysis
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowQualityPanel(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Overall Quality Score */}
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Quality</span>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-gray-600" />
                    <span className={`text-lg font-bold ${
                      overallQualityScore >= 80 ? 'text-green-600' :
                      overallQualityScore >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {Math.round(overallQualityScore)}%
                    </span>
                  </div>
                </div>
                <Progress value={overallQualityScore} className="h-2" />
                {qualityHistory.length > 1 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                    <TrendingUp className="w-3 h-3" />
                    <span>
                      {(qualityHistory[qualityHistory.length - 1] ?? 0) > (qualityHistory[qualityHistory.length - 2] ?? 0)
                        ? 'Improving' : 'Needs attention'}
                    </span>
                  </div>
                )}
              </div>

              {/* Quality Metrics */}
              {qualityMetrics && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white rounded p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Completeness</span>
                        <span className="font-medium">{Math.round(qualityMetrics.completeness)}%</span>
                      </div>
                      <Progress value={qualityMetrics.completeness} className="h-1 mt-1" />
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Consistency</span>
                        <span className="font-medium">{Math.round(qualityMetrics.consistency)}%</span>
                      </div>
                      <Progress value={qualityMetrics.consistency} className="h-1 mt-1" />
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Relevance</span>
                        <span className="font-medium">{Math.round(qualityMetrics.relevance)}%</span>
                      </div>
                      <Progress value={qualityMetrics.relevance} className="h-1 mt-1" />
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Clarity</span>
                        <span className="font-medium">{Math.round(qualityMetrics.clarity)}%</span>
                      </div>
                      <Progress value={qualityMetrics.clarity} className="h-1 mt-1" />
                    </div>
                  </div>

                  {/* Predictions */}
                  <div className="bg-white rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Target className="w-4 h-4 text-purple-600" />
                      Predictions
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Will Pass Review</span>
                        <Badge variant={qualityMetrics.predictions.willPassReview ? 'default' : 'destructive'}>
                          {qualityMetrics.predictions.willPassReview ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Est. Review Time</span>
                        <span className="font-medium">{qualityMetrics.predictions.estimatedReviewTime} min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Confidence</span>
                        <span className="font-medium">{Math.round(qualityMetrics.confidence)}%</span>
                      </div>
                    </div>

                    {/* Improvements */}
                    {qualityMetrics.predictions.requiredImprovements.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium mb-1">Required Improvements:</p>
                        <ul className="space-y-0.5">
                          {qualityMetrics.predictions.requiredImprovements.map((imp, idx) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                              <AlertCircle className="w-3 h-3 mt-0.5 text-yellow-500" />
                              {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Strengths */}
                    {qualityMetrics.predictions.strengthAreas.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium mb-1">Strength Areas:</p>
                        <div className="flex flex-wrap gap-1">
                          {qualityMetrics.predictions.strengthAreas.map((strength, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              <Award className="w-3 h-3 mr-1" />
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quality Score per Field */}
              {Object.keys(fieldQualityScores).length > 0 && (
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs font-medium mb-2">Field Quality Breakdown:</p>
                  <div className="space-y-1">
                    {Object.entries(fieldQualityScores).map(([fieldName, score]) => {
                      const field = fields.find(f => f.name === fieldName);
                      if (!field) return null;
                      
                      return (
                        <div key={fieldName} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate max-w-[120px]">{field.label}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={score.score} className="w-16 h-1" />
                            <span className={`font-medium ${
                              score.score >= 80 ? 'text-green-600' :
                              score.score >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {Math.round(score.score)}
                            </span>
                            {score.trend === 'improving' && <TrendingUp className="w-3 h-3 text-green-500" />}
                            {score.trend === 'declining' && <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={predictQualityMetrics}
                disabled={isPredicting}
                className="w-full"
              >
                {isPredicting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Quality...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Refresh Predictions
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Validation Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleValidateAll}
            disabled={isValidating || loading}
            className="flex-1"
          >
            {isValidating || loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Validate All
              </>
            )}
          </Button>
          
          {adaptiveMode && (
            <Button
              onClick={performSmartValidation}
              variant="outline"
              disabled={isValidating || loading}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Smart Check
            </Button>
          )}
        </div>
        
        {/* Validation Summary */}
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please fix {Object.keys(errors).length} validation {Object.keys(errors).length === 1 ? 'error' : 'errors'} before proceeding
            </AlertDescription>
          </Alert>
        )}
        
        {Object.keys(errors).length === 0 && Object.keys(validationState).some(k => validationState[k] === 'valid') && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              All fields are valid!
            </AlertDescription>
          </Alert>
        )}
        
        {/* Adaptive Fields Notice */}
        {additionalFields.length > 0 && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              {additionalFields.length} adaptive {additionalFields.length === 1 ? 'field' : 'fields'} added based on your responses
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default SmartValidator;