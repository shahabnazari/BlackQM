/**
 * Smart Validation & Adaptive Logic Service
 * Phase 6.86 Day 9 Implementation
 * Provides intelligent validation and adaptive questioning logic
 */

import { AIService } from '@/lib/services/ai.service';
import { z } from 'zod';

// Types
export interface ValidationRule {
  field: string;
  validator: (value: unknown) => ValidationResult;
  adaptive: boolean;
  priority: number;
  dependencies?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  suggestions?: string[];
  confidence: number;
}

export interface AdaptiveQuestionLogic {
  currentQuestionId: string;
  nextQuestionId: string | null;
  skipQuestions: string[];
  showQuestions: string[];
  reason: string;
}

export interface ProgressiveDisclosure {
  level: number;
  visibleFields: string[];
  hiddenFields: string[];
  unlockConditions: Record<string, any>;
}

export interface ConditionalLogic {
  conditions: LogicCondition[];
  actions: LogicAction[];
  evaluated: boolean;
}

interface LogicCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: any;
  combineWith?: 'AND' | 'OR';
}

interface LogicAction {
  type: 'show' | 'hide' | 'enable' | 'disable' | 'setValue' | 'validate';
  target: string;
  value?: any;
}

export class SmartValidatorService {
  private static instance: SmartValidatorService;
  private aiService: AIService;
  private validationRules: Map<string, ValidationRule[]>;
  private adaptiveState: Map<string, any>;
  private ruleEngine: RuleEngine;
  
  private constructor(aiService: AIService) {
    this.aiService = aiService;
    this.validationRules = new Map();
    this.adaptiveState = new Map();
    this.ruleEngine = new RuleEngine();
  }
  
  static getInstance(aiService: AIService): SmartValidatorService {
    if (!SmartValidatorService.instance) {
      SmartValidatorService.instance = new SmartValidatorService(aiService);
    }
    return SmartValidatorService.instance;
  }
  
  /**
   * Implement adaptive questioning logic
   */
  async determineNextQuestion(
    currentResponses: Record<string, any>,
    availableQuestions: any[],
    context?: any
  ): Promise<AdaptiveQuestionLogic> {
    try {
      // Use AI to analyze responses and determine optimal path
      const prompt = `
        Given the current survey responses, determine the optimal next question.
        
        Current Responses:
        ${JSON.stringify(currentResponses, null, 2)}
        
        Available Questions:
        ${JSON.stringify(availableQuestions.slice(0, 10), null, 2)}
        
        Context: ${JSON.stringify(context)}
        
        Determine:
        1. Which question to show next (most relevant)
        2. Which questions can be skipped (already answered indirectly)
        3. Which new questions should be shown based on responses
        4. Reasoning for the decision
        
        Return as JSON with structure:
        {
          "currentQuestionId": "q1",
          "nextQuestionId": "q5",
          "skipQuestions": ["q2", "q3"],
          "showQuestions": ["q8", "q9"],
          "reason": "Based on demographic data, technical questions are more relevant"
        }
      `;
      
      const response = await this.aiService.generateJSON<AdaptiveQuestionLogic>(prompt);
      
      // Update adaptive state
      this.updateAdaptiveState(currentResponses, response);
      
      return response;
    } catch (error) {
      console.error('Adaptive logic failed:', error);
      return this.getDefaultQuestionFlow(availableQuestions);
    }
  }
  
  /**
   * Add real-time validation rules
   */
  addValidationRule(formId: string, rule: ValidationRule): void {
    if (!this.validationRules.has(formId)) {
      this.validationRules.set(formId, []);
    }
    
    const rules = this.validationRules.get(formId)!;
    rules.push(rule);
    
    // Sort by priority
    rules.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Create validation rule engine
   */
  async validateWithRules(
    formId: string,
    data: Record<string, any>,
    _options?: { realtime?: boolean; strict?: boolean }
  ): Promise<Record<string, ValidationResult>> {
    const rules = this.validationRules.get(formId) || [];
    const results: Record<string, ValidationResult> = {};
    
    // Process rules in priority order
    for (const rule of rules) {
      // Check dependencies
      if (rule.dependencies) {
        const dependenciesMet = rule.dependencies.every(dep => {
          const depResult = results[dep];
          return depResult && depResult.valid;
        });
        
        if (!dependenciesMet) {
          continue; // Skip if dependencies not met
        }
      }
      
      // Validate field
      const value = data[rule.field];
      const result = rule.validator(value);
      
      // Apply adaptive logic if enabled
      if (rule.adaptive && result.valid) {
        const adaptiveResult = await this.applyAdaptiveValidation(
          rule.field,
          value,
          data
        );
        result.suggestions = adaptiveResult.suggestions || [];
      }
      
      results[rule.field] = result;
    }
    
    return results;
  }
  
  /**
   * Build conditional logic AI
   */
  async buildConditionalLogic(
    formSchema: any,
    userResponses: Record<string, any>
  ): Promise<ConditionalLogic[]> {
    try {
      const prompt = `
        Analyze the form schema and user responses to build conditional logic rules.
        
        Form Schema:
        ${JSON.stringify(formSchema, null, 2)}
        
        User Responses So Far:
        ${JSON.stringify(userResponses, null, 2)}
        
        Generate conditional logic rules that:
        1. Show/hide fields based on previous answers
        2. Enable/disable options based on context
        3. Set default values based on patterns
        4. Add validation based on combinations
        
        Return as JSON array of conditional logic objects.
      `;
      
      const response = await this.aiService.generateJSON<ConditionalLogic[]>(prompt);
      
      // Process and apply logic
      return this.ruleEngine.processConditionalLogic(response, userResponses);
    } catch (error) {
      console.error('Conditional logic generation failed:', error);
      return [];
    }
  }
  
  /**
   * Add progressive disclosure system
   */
  async implementProgressiveDisclosure(
    formData: any,
    userProfile: any,
    currentLevel: number = 0
  ): Promise<ProgressiveDisclosure> {
    try {
      // Determine what to show based on user expertise and responses
      const prompt = `
        Implement progressive disclosure for a form based on user profile.
        
        User Profile:
        ${JSON.stringify(userProfile, null, 2)}
        
        Current Disclosure Level: ${currentLevel}
        
        Form Fields Available:
        ${JSON.stringify(Object.keys(formData), null, 2)}
        
        Determine:
        1. Which fields to show at this level
        2. Which fields to keep hidden
        3. Conditions to unlock next level
        
        Return as JSON with progressive disclosure configuration.
      `;
      
      const response = await this.aiService.generateJSON<ProgressiveDisclosure>(prompt);
      
      return {
        level: currentLevel,
        visibleFields: response.visibleFields || [],
        hiddenFields: response.hiddenFields || [],
        unlockConditions: response.unlockConditions || {}
      };
    } catch (error) {
      console.error('Progressive disclosure failed:', error);
      return this.getDefaultDisclosure(formData, currentLevel);
    }
  }
  
  /**
   * Smart email validation with suggestions
   */
  validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const result: ValidationResult = {
      valid: false,
      errors: [],
      suggestions: [],
      confidence: 0
    };
    
    if (!email) {
      result.errors.push('Email is required');
      return result;
    }
    
    if (!emailRegex.test(email)) {
      result.errors.push('Invalid email format');
      
      // Provide smart suggestions
      if (!email.includes('@')) {
        result.suggestions?.push('Did you forget the @ symbol?');
      }
      if (email.includes(' ')) {
        result.suggestions?.push('Email should not contain spaces');
      }
      
      // Check for common typos
      const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
      const domain = email.split('@')[1];
      if (domain) {
        const closestDomain = this.findClosestMatch(domain, commonDomains);
        if (closestDomain && closestDomain !== domain) {
          result.suggestions?.push(`Did you mean @${closestDomain}?`);
        }
      }
    } else {
      result.valid = true;
      result.confidence = 0.95;
    }
    
    return result;
  }
  
  /**
   * Smart phone validation with formatting
   */
  validatePhone(phone: string, country: string = 'US'): ValidationResult {
    const result: ValidationResult = {
      valid: false,
      errors: [],
      suggestions: [],
      confidence: 0
    };
    
    // Remove all non-digits for validation
    const digits = phone.replace(/\D/g, '');
    
    if (!digits) {
      result.errors.push('Phone number is required');
      return result;
    }
    
    // Country-specific validation
    const validations: Record<string, { length: number; format: string }> = {
      US: { length: 10, format: '(XXX) XXX-XXXX' },
      UK: { length: 11, format: 'XXXXX XXXXXX' },
      CA: { length: 10, format: '(XXX) XXX-XXXX' }
    };
    
    const validation = validations[country] || validations.US;
    
    if (validation && digits.length !== validation.length) {
      result.errors.push(`Phone number should be ${validation.length} digits`);
      result.suggestions?.push(`Format: ${validation.format}`);
    } else {
      result.valid = true;
      result.confidence = 0.9;
      
      // Suggest formatted version
      if (country === 'US' || country === 'CA') {
        const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        if (formatted !== phone) {
          result.suggestions?.push(`Formatted: ${formatted}`);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Create custom validation rules using AI
   */
  async createCustomValidator(
    fieldType: string,
    requirements: string
  ): Promise<(value: unknown) => ValidationResult> {
    try {
      const prompt = `
        Create a validation function for a ${fieldType} field with these requirements:
        ${requirements}
        
        Return the validation logic description that checks:
        1. Required/optional status
        2. Format requirements
        3. Length/size constraints
        4. Custom business rules
        
        Format as JSON with validation rules.
      `;
      
      const response = await this.aiService.generateJSON<any>(prompt);
      
      // Build validator function from AI response
      return (value: unknown) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          confidence: 0.8
        };
        
        // Apply AI-generated rules
        if (response.required && !value) {
          result.valid = false;
          result.errors.push('This field is required');
        }
        
        if (response.format && typeof value === 'string') {
          const formatRegex = new RegExp(response.format);
          if (!formatRegex.test(value)) {
            result.valid = false;
            result.errors.push(`Invalid format: ${response.formatDescription}`);
          }
        }
        
        if (response.minLength && typeof value === 'string' && value.length < response.minLength) {
          result.valid = false;
          result.errors.push(`Minimum length is ${response.minLength}`);
        }
        
        return result;
      };
    } catch (error) {
      console.error('Custom validator creation failed:', error);
      return this.getDefaultValidator(fieldType);
    }
  }
  
  // Private helper methods
  
  private updateAdaptiveState(responses: Record<string, any>, logic: AdaptiveQuestionLogic): void {
    this.adaptiveState.set('responses', responses);
    this.adaptiveState.set('logic', logic);
    this.adaptiveState.set('timestamp', Date.now());
  }
  
  private async applyAdaptiveValidation(
    field: string,
    value: any,
    allData: Record<string, any>
  ): Promise<{ suggestions?: string[] }> {
    // Use AI to provide contextual suggestions
    const prompt = `
      Based on the field "${field}" with value "${value}" in the context of:
      ${JSON.stringify(allData, null, 2)}
      
      Provide helpful suggestions or improvements if any.
    `;
    
    try {
      const response = await this.aiService.generateJSON<{ suggestions: string[] }>(prompt);
      return response;
    } catch {
      return { suggestions: [] };
    }
  }
  
  private findClosestMatch(str: string, options: string[]): string | null {
    // Simple Levenshtein distance for typo detection
    let minDistance = Infinity;
    let closest: string | null = null;
    
    for (const option of options) {
      const distance = this.levenshteinDistance(str.toLowerCase(), option.toLowerCase());
      if (distance < minDistance && distance <= 2) {
        minDistance = distance;
        closest = option;
      }
    }
    
    return closest;
  }
  
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    if (matrix[0]) {
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const prevRow = matrix[i - 1];
        const currRow = matrix[i];
        if (prevRow && currRow && b.charAt(i - 1) === a.charAt(j - 1)) {
          currRow[j] = prevRow[j - 1] ?? 0;
        } else if (prevRow && currRow) {
          currRow[j] = Math.min(
            (prevRow[j - 1] ?? 0) + 1,
            (currRow[j - 1] ?? 0) + 1,
            (prevRow[j] ?? 0) + 1
          );
        }
      }
    }
    
    const lastRow = matrix[b.length];
    return lastRow ? (lastRow[a.length] ?? 0) : 0;
  }
  
  private getDefaultQuestionFlow(questions: any[]): AdaptiveQuestionLogic {
    return {
      currentQuestionId: questions[0]?.id || '',
      nextQuestionId: questions[1]?.id || null,
      skipQuestions: [],
      showQuestions: questions.slice(0, 5).map(q => q.id),
      reason: 'Default sequential flow'
    };
  }
  
  private getDefaultDisclosure(formData: any, level: number): ProgressiveDisclosure {
    const allFields = Object.keys(formData);
    const fieldsPerLevel = Math.ceil(allFields.length / 3);
    
    return {
      level,
      visibleFields: allFields.slice(0, fieldsPerLevel * (level + 1)),
      hiddenFields: allFields.slice(fieldsPerLevel * (level + 1)),
      unlockConditions: {}
    };
  }
  
  private getDefaultValidator(fieldType: string): (value: unknown) => ValidationResult {
    return (value: unknown) => ({
      valid: !!value,
      errors: value ? [] : ['This field is required'],
      confidence: 0.5
    });
  }
}

/**
 * Rule Engine for processing complex validation logic
 */
class RuleEngine {
  processConditionalLogic(
    logic: ConditionalLogic[],
    data: Record<string, any>
  ): ConditionalLogic[] {
    return logic.map(rule => {
      const allConditionsMet = this.evaluateConditions(rule.conditions, data);
      
      if (allConditionsMet && !rule.evaluated) {
        // Apply actions
        rule.actions.forEach(action => {
          this.applyAction(action, data);
        });
        rule.evaluated = true;
      }
      
      return rule;
    });
  }
  
  private evaluateConditions(conditions: LogicCondition[], data: Record<string, any>): boolean {
    let result = true;
    let currentOperator: 'AND' | 'OR' = 'AND';
    
    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, data);
      
      if (currentOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }
      
      currentOperator = condition.combineWith || 'AND';
    }
    
    return result;
  }
  
  private evaluateCondition(condition: LogicCondition, data: Record<string, any>): boolean {
    const value = data[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'notEquals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'greaterThan':
        return Number(value) > Number(condition.value);
      case 'lessThan':
        return Number(value) < Number(condition.value);
      default:
        return false;
    }
  }
  
  private applyAction(action: LogicAction, data: Record<string, any>): void {
    // In a real implementation, these would update the UI
    console.log(`Applying action: ${action.type} on ${action.target}`);
    
    if (action.type === 'setValue' && action.value !== undefined) {
      data[action.target] = action.value;
    }
  }
}

// Export singleton instance factory
export function createSmartValidator(aiService: AIService): SmartValidatorService {
  return SmartValidatorService.getInstance(aiService);
}

// Export validation schemas using Zod for common use cases
export const commonValidationSchemas = {
  email: z.string().email('Invalid email address'),
  
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number'),
  
  url: z.string().url('Invalid URL'),
  
  postalCode: z.string().regex(/^[A-Z0-9\s\-]+$/i, 'Invalid postal code'),
  
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  
  age: z.number()
    .int('Age must be a whole number')
    .min(1, 'Age must be at least 1')
    .max(150, 'Age must be at most 150'),
  
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be in HH:MM or HH:MM:SS format'),
  
  likertScale: z.number().int().min(1).max(7),
  
  percentage: z.number().min(0).max(100)
};