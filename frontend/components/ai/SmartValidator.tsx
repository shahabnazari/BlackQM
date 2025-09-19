'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
  Shield
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

  // Use cached AI request for smart validation
  const { loading, execute } = useCachedAIRequest(
    aiBackendService.validateSmartly.bind(aiBackendService),
    'smart-validation',
    30000 // 30 second cache
  );

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