/**
 * Secure Storage Service
 * Provides safe localStorage operations with error handling and validation
 * Phase 10 Day 5.9 - Enterprise Grade
 */

import { Theme } from '../api/services/theme-to-survey.service';
import type { OperationalizationResult, HypothesisToItemResult } from '../types/questionnaire-import.types';

interface StorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  maxAge?: number; // in milliseconds
}

interface StoredItem<T> {
  data: T;
  timestamp: number;
  version: string;
  checksum?: string;
}

class SecureStorageService {
  private readonly version = '1.0.0';
  private readonly prefix = 'vqm_';

  /**
   * Safely check if localStorage is available
   */
  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Generate a checksum for data integrity
   */
  private generateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Validate data integrity
   */
  private validateChecksum(data: any, checksum: string): boolean {
    return this.generateChecksum(data) === checksum;
  }

  /**
   * Safely store data in localStorage
   */
  setItem<T>(key: string, value: T, _options?: StorageOptions): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      const storedItem: StoredItem<T> = {
        data: value,
        timestamp: Date.now(),
        version: this.version,
        checksum: this.generateChecksum(value)
      };

      const serialized = JSON.stringify(storedItem);

      // Check size limit (5MB typical localStorage limit)
      if (serialized.length > 5 * 1024 * 1024) {
        throw new Error('Data too large for localStorage');
      }

      localStorage.setItem(this.prefix + key, serialized);
      return true;
    } catch (error) {
      console.error('Failed to store item:', error);
      return false;
    }
  }

  /**
   * Safely retrieve data from localStorage
   */
  getItem<T>(key: string, options?: StorageOptions): T | null {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage is not available');
      return null;
    }

    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const storedItem: StoredItem<T> = JSON.parse(item);

      // Version check
      if (storedItem.version !== this.version) {
        console.warn('Stored item version mismatch, clearing item');
        this.removeItem(key);
        return null;
      }

      // Checksum validation
      if (storedItem.checksum && !this.validateChecksum(storedItem.data, storedItem.checksum)) {
        console.error('Data integrity check failed');
        this.removeItem(key);
        return null;
      }

      // Check expiration if maxAge was set
      if (options?.maxAge) {
        const age = Date.now() - storedItem.timestamp;
        if (age > options.maxAge) {
          this.removeItem(key);
          return null;
        }
      }

      return storedItem.data;
    } catch (error) {
      console.error('Failed to retrieve item:', error);
      this.removeItem(key);
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): boolean {
    if (!this.isStorageAvailable()) return false;

    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('Failed to remove item:', error);
      return false;
    }
  }

  /**
   * Clear all items with our prefix
   */
  clear(): boolean {
    if (!this.isStorageAvailable()) return false;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Get storage size for our items
   */
  getStorageSize(): number {
    if (!this.isStorageAvailable()) return 0;

    let size = 0;
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          const item = localStorage.getItem(key);
          if (item) {
            size += item.length;
          }
        }
      });
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
    }
    return size;
  }

  /**
   * Theme-specific methods
   */
  saveThemes(themes: Theme[]): boolean {
    return this.setItem('extracted_themes', themes, { maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
  }

  getThemes(): Theme[] {
    return this.getItem<Theme[]>('extracted_themes', { maxAge: 7 * 24 * 60 * 60 * 1000 }) || [];
  }

  clearThemes(): boolean {
    return this.removeItem('extracted_themes');
  }

  /**
   * Research Question Operationalization methods (Phase 10 Day 5.10)
   */
  saveOperationalizationResult(result: OperationalizationResult): boolean {
    const history = this.getOperationalizationResults();
    history.unshift(result); // Add to beginning
    // Keep only last 10 results
    const limited = history.slice(0, 10);
    return this.setItem('operationalization_history', limited, { maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
  }

  getOperationalizationResults(): OperationalizationResult[] {
    return this.getItem<OperationalizationResult[]>('operationalization_history', { maxAge: 30 * 24 * 60 * 60 * 1000 }) || [];
  }

  clearOperationalizationHistory(): boolean {
    return this.removeItem('operationalization_history');
  }

  saveResearchQuestions(questions: Array<{ question: string; studyType: string; timestamp: number }>): boolean {
    // Keep only last 20 questions
    const limited = questions.slice(-20);
    return this.setItem('research_questions', limited, { maxAge: 90 * 24 * 60 * 60 * 1000 }); // 90 days
  }

  getResearchQuestions(): Array<{ question: string; studyType: string; timestamp: number }> {
    return this.getItem<Array<{ question: string; studyType: string; timestamp: number }>>('research_questions', { maxAge: 90 * 24 * 60 * 60 * 1000 }) || [];
  }

  clearResearchQuestions(): boolean {
    return this.removeItem('research_questions');
  }

  /**
   * Hypothesis to Items methods (Phase 10 Day 5.11)
   */
  saveHypothesisResult(result: HypothesisToItemResult): boolean {
    const history = this.getHypothesisResults();
    history.unshift(result);
    const limited = history.slice(0, 10);
    return this.setItem('hypothesis_history', limited, { maxAge: 30 * 24 * 60 * 60 * 1000 });
  }

  getHypothesisResults(): HypothesisToItemResult[] {
    return this.getItem<HypothesisToItemResult[]>('hypothesis_history', { maxAge: 30 * 24 * 60 * 60 * 1000 }) || [];
  }

  clearHypothesisHistory(): boolean {
    return this.removeItem('hypothesis_history');
  }

  saveHypothesesList(hypotheses: Array<{ hypothesis: string; hypothesisType: string; timestamp: number }>): boolean {
    const limited = hypotheses.slice(-20);
    return this.setItem('hypotheses_list', limited, { maxAge: 90 * 24 * 60 * 60 * 1000 });
  }

  getHypothesesList(): Array<{ hypothesis: string; hypothesisType: string; timestamp: number }> {
    return this.getItem<Array<{ hypothesis: string; hypothesisType: string; timestamp: number }>>('hypotheses_list', { maxAge: 90 * 24 * 60 * 60 * 1000 }) || [];
  }

  clearHypothesesList(): boolean {
    return this.removeItem('hypotheses_list');
  }
}

export const secureStorage = new SecureStorageService();