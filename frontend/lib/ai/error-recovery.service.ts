/**
 * AI Error Recovery Service
 * Phase 6.86: Enterprise-grade error handling and recovery
 */

import { AIError, AIRequest, AIResponse } from '@/lib/types/ai.types';

interface RecoveryStrategy {
  canRecover: (error: AIError) => boolean;
  recover: (error: AIError, request: AIRequest) => Promise<AIResponse | null>;
  priority: number;
}

interface FallbackResponse {
  content: string;
  tokens: number;
  cost: number;
  responseTime: number;
  cached: boolean;
  fallback: true;
  fallbackReason: string;
}

export class AIErrorRecoveryService {
  private static instance: AIErrorRecoveryService;
  private recoveryStrategies: RecoveryStrategy[] = [];
  private errorLog: Array<{ error: AIError; timestamp: Date; recovered: boolean }> = [];
  private circuitBreaker = {
    isOpen: false,
    failureCount: 0,
    lastFailureTime: 0,
    threshold: 5,
    timeout: 60000 // 1 minute
  };
  
  private constructor() {
    this.initializeStrategies();
  }
  
  static getInstance(): AIErrorRecoveryService {
    if (!AIErrorRecoveryService.instance) {
      AIErrorRecoveryService.instance = new AIErrorRecoveryService();
    }
    return AIErrorRecoveryService.instance;
  }
  
  private initializeStrategies() {
    // Strategy 1: Retry with exponential backoff
    this.addStrategy({
      canRecover: (error) => error.retry === true,
      recover: async (error, request) => {
        await this.sleep(this.calculateBackoff());
        // Retry the request through the main service
        return null; // Let main service retry
      },
      priority: 1
    });
    
    // Strategy 2: Fallback to cheaper model
    this.addStrategy({
      canRecover: (error) => 
        error.code === 'BUDGET_EXCEEDED' || 
        error.code === 'RATE_LIMITED',
      recover: async (error, request) => {
        if (request.model === 'gpt-4' || request.model === 'gpt-4-turbo') {
          // Downgrade to cheaper model
          const fallbackRequest = {
            ...request,
            model: 'gpt-3.5-turbo' as const
          };
          
          // Return null to trigger retry with new model
          console.log('Downgrading to gpt-3.5-turbo due to:', error.code);
          return null;
        }
        return null;
      },
      priority: 2
    });
    
    // Strategy 3: Use cached response if available
    this.addStrategy({
      canRecover: (error) => 
        error.code === 'API_ERROR' || 
        error.code === 'TIMEOUT',
      recover: async (error, request) => {
        // Check if we have a similar cached response
        const cachedResponse = await this.findSimilarCached(request);
        if (cachedResponse) {
          return {
            ...cachedResponse,
            fallback: true,
            fallbackReason: 'Using cached similar response'
          } as FallbackResponse;
        }
        return null;
      },
      priority: 3
    });
    
    // Strategy 4: Provide degraded response
    this.addStrategy({
      canRecover: (error) => 
        error.code === 'SERVICE_UNAVAILABLE' ||
        this.circuitBreaker.isOpen,
      recover: async (error, request) => {
        return this.generateDegradedResponse(request);
      },
      priority: 4
    });
    
    // Strategy 5: Queue for later processing
    this.addStrategy({
      canRecover: (error) => 
        error.code === 'RATE_LIMITED' &&
        !request.immediate,
      recover: async (error, request) => {
        await this.queueForLater(request);
        return {
          content: 'Your request has been queued and will be processed when resources are available.',
          tokens: 0,
          cost: 0,
          responseTime: 0,
          cached: false,
          fallback: true,
          fallbackReason: 'Queued for later processing'
        } as FallbackResponse;
      },
      priority: 5
    });
  }
  
  addStrategy(strategy: RecoveryStrategy) {
    this.recoveryStrategies.push(strategy);
    this.recoveryStrategies.sort((a, b) => a.priority - b.priority);
  }
  
  async handleError(error: AIError, request: AIRequest): Promise<AIResponse | null> {
    // Log the error
    this.logError(error);
    
    // Check circuit breaker
    if (this.shouldOpenCircuit(error)) {
      this.openCircuit();
    }
    
    // If circuit is open and enough time has passed, try to close it
    if (this.circuitBreaker.isOpen && this.canCloseCircuit()) {
      this.closeCircuit();
    }
    
    // Try recovery strategies in order of priority
    for (const strategy of this.recoveryStrategies) {
      if (strategy.canRecover(error)) {
        try {
          const recovered = await strategy.recover(error, request);
          if (recovered) {
            this.errorLog[this.errorLog.length - 1].recovered = true;
            return recovered;
          }
        } catch (recoveryError) {
          console.error('Recovery strategy failed:', recoveryError);
        }
      }
    }
    
    // No recovery possible
    return null;
  }
  
  private shouldOpenCircuit(error: AIError): boolean {
    const now = Date.now();
    
    // Reset counter if enough time has passed
    if (now - this.circuitBreaker.lastFailureTime > this.circuitBreaker.timeout) {
      this.circuitBreaker.failureCount = 0;
    }
    
    // Increment failure count for circuit-breaking errors
    if (
      error.code === 'API_ERROR' ||
      error.code === 'SERVICE_UNAVAILABLE' ||
      error.code === 'TIMEOUT'
    ) {
      this.circuitBreaker.failureCount++;
      this.circuitBreaker.lastFailureTime = now;
    }
    
    return this.circuitBreaker.failureCount >= this.circuitBreaker.threshold;
  }
  
  private openCircuit() {
    this.circuitBreaker.isOpen = true;
    console.warn('Circuit breaker opened due to repeated failures');
    
    // Emit event for monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai-circuit-breaker-open', {
        detail: { timestamp: new Date() }
      }));
    }
  }
  
  private canCloseCircuit(): boolean {
    const now = Date.now();
    return now - this.circuitBreaker.lastFailureTime > this.circuitBreaker.timeout;
  }
  
  private closeCircuit() {
    this.circuitBreaker.isOpen = false;
    this.circuitBreaker.failureCount = 0;
    console.log('Circuit breaker closed, resuming normal operation');
    
    // Emit event for monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai-circuit-breaker-closed', {
        detail: { timestamp: new Date() }
      }));
    }
  }
  
  private async findSimilarCached(request: AIRequest): Promise<AIResponse | null> {
    // This would check a cache for similar prompts
    // For now, return null (no cache found)
    return null;
  }
  
  private async generateDegradedResponse(request: AIRequest): Promise<FallbackResponse> {
    // Generate a basic response without AI
    const degradedResponses: Record<string, string> = {
      'questionnaire': 'Unable to generate AI questions at this time. Please use our question templates or create custom questions.',
      'statement': 'AI statement generation is temporarily unavailable. Consider using our statement library or creating custom statements.',
      'bias': 'Bias detection service is offline. Please review statements manually for potential biases.',
      'grid': 'AI grid recommendations unavailable. Using standard Q-sort distribution: 2-3-4-5-4-3-2.',
      'default': 'AI service is temporarily unavailable. Your request could not be processed.'
    };
    
    // Detect request type from prompt
    const promptLower = request.prompt.toLowerCase();
    let responseType = 'default';
    
    if (promptLower.includes('question')) responseType = 'questionnaire';
    else if (promptLower.includes('statement')) responseType = 'statement';
    else if (promptLower.includes('bias')) responseType = 'bias';
    else if (promptLower.includes('grid')) responseType = 'grid';
    
    return {
      content: degradedResponses[responseType],
      tokens: 0,
      cost: 0,
      responseTime: 100,
      cached: false,
      fallback: true,
      fallbackReason: 'Service degraded - providing fallback response'
    };
  }
  
  private async queueForLater(request: AIRequest): Promise<void> {
    // Store request in localStorage or IndexedDB for later processing
    if (typeof window !== 'undefined') {
      const queue = JSON.parse(localStorage.getItem('ai-request-queue') || '[]');
      queue.push({
        request,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9)
      });
      localStorage.setItem('ai-request-queue', JSON.stringify(queue));
    }
  }
  
  private logError(error: AIError) {
    this.errorLog.push({
      error,
      timestamp: new Date(),
      recovered: false
    });
    
    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('AI Error:', error);
    }
    
    // Send to monitoring service
    this.sendToMonitoring(error);
  }
  
  private sendToMonitoring(error: AIError) {
    // Send error to monitoring endpoint
    if (typeof window !== 'undefined') {
      fetch('/api/ai/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(() => {
        // Silently fail - don't break the app if monitoring fails
      });
    }
  }
  
  private calculateBackoff(): number {
    const attempt = this.circuitBreaker.failureCount;
    return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Public methods for monitoring
  getErrorStats() {
    const total = this.errorLog.length;
    const recovered = this.errorLog.filter(e => e.recovered).length;
    const recent = this.errorLog.slice(-10);
    
    return {
      total,
      recovered,
      recoveryRate: total > 0 ? (recovered / total) * 100 : 0,
      circuitBreakerStatus: this.circuitBreaker.isOpen ? 'open' : 'closed',
      recentErrors: recent
    };
  }
  
  clearErrorLog() {
    this.errorLog = [];
  }
  
  resetCircuitBreaker() {
    this.circuitBreaker.isOpen = false;
    this.circuitBreaker.failureCount = 0;
    this.circuitBreaker.lastFailureTime = 0;
  }
}

// Export singleton instance
export const aiErrorRecovery = AIErrorRecoveryService.getInstance();

// Export helper functions
export function handleAIError(error: AIError, request: AIRequest): Promise<AIResponse | null> {
  return aiErrorRecovery.handleError(error, request);
}

export function getAIErrorStats() {
  return aiErrorRecovery.getErrorStats();
}

export function resetAIErrors() {
  aiErrorRecovery.clearErrorLog();
  aiErrorRecovery.resetCircuitBreaker();
}