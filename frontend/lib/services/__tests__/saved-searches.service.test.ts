/**
 * SavedSearchesService - Unit Tests (Netflix-Grade)
 * Phase 10.104 Day 2 - Vitest-compatible
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SavedSearchesService, isValidSavedSearch } from '../saved-searches.service';

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('SavedSearchesService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Basic CRUD Operations', () => {
    test('should save a basic search', () => {
      const saved = SavedSearchesService.saveSearch({
        query: 'machine learning',
        name: 'ML Research'
      });

      expect(saved.id).toBeDefined();
      expect(saved.query).toBe('machine learning');
      expect(saved.name).toBe('ML Research');
      expect(saved.tags).toEqual([]);
      expect(saved.usageCount).toBe(0);
    });

    test('should update an existing search', () => {
      const saved = SavedSearchesService.saveSearch({
        query: 'test',
        name: 'Original Name'
      });

      const updated = SavedSearchesService.updateSearch(saved.id, {
        name: 'Updated Name',
        tags: ['new-tag']
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.tags).toEqual(['new-tag']);
      expect(updated.query).toBe('test');
    });

    test('should delete a search', () => {
      const saved = SavedSearchesService.saveSearch({
        query: 'to delete',
        name: 'Delete Me'
      });

      SavedSearchesService.deleteSearch(saved.id);

      const searches = SavedSearchesService.getAllSearches();
      expect(searches.length).toBe(0);
    });
  });

  describe('C2 Fix: Stale Data Return', () => {
    test('should return correct object when update succeeds', () => {
      const saved = SavedSearchesService.saveSearch({
        query: 'test',
        name: 'Original'
      });

      const updated = SavedSearchesService.updateSearch(saved.id, {
        name: 'Updated'
      });

      expect(updated.name).toBe('Updated');
      expect(updated).toEqual(expect.objectContaining({
        id: saved.id,
        query: 'test',
        name: 'Updated'
      }));
    });
  });

  describe('H2 Fix: Duplicate Handling', () => {
    test('should update metadata when saving duplicate query', () => {
      SavedSearchesService.saveSearch({
        query: 'machine learning',
        name: 'ML Research',
        tags: ['AI']
      });

      const result = SavedSearchesService.saveSearch({
        query: 'machine learning',
        name: 'Deep Learning Papers',
        tags: ['neural networks'],
        description: 'Focus on attention'
      });

      expect(result.name).toBe('Deep Learning Papers');
      expect(result.tags).toEqual(['neural networks']);
      expect(result.description).toBe('Focus on attention');

      const searches = SavedSearchesService.getAllSearches();
      expect(searches.length).toBe(1);
    });
  });

  describe('M2 Fix: Import Validation', () => {
    test('should validate imported searches', () => {
      const importData = JSON.stringify({
        version: '1.0',
        exportedAt: Date.now(),
        searches: [
          {
            id: 'valid1',
            query: 'valid query',
            name: 'Valid',
            tags: [],
            createdAt: Date.now(),
            usageCount: 0,
            isPinned: false
          },
          { query: 'missing-fields' },
          {
            id: 'bad-type',
            query: 'test',
            name: 'Test',
            tags: 'should-be-array',
            createdAt: Date.now(),
            usageCount: 0,
            isPinned: false
          }
        ]
      });

      const imported = SavedSearchesService.importSearches(importData);

      expect(imported).toBe(1);

      const searches = SavedSearchesService.getAllSearches();
      expect(searches.length).toBe(1);
      expect(searches[0]?.query).toBe('valid query');
    });
  });

  describe('Search & Filter', () => {
    beforeEach(() => {
      SavedSearchesService.saveSearch({
        query: 'machine learning',
        name: 'ML Research',
        tags: ['AI', 'ML']
      });

      SavedSearchesService.saveSearch({
        query: 'deep learning',
        name: 'DL Papers',
        description: 'Neural networks',
        tags: ['AI']
      });
    });

    test('should search by query text', () => {
      const results = SavedSearchesService.searchSaved('machine');
      expect(results.length).toBe(1);
      expect(results[0]?.query).toBe('machine learning');
    });

    test('should search by tags', () => {
      const results = SavedSearchesService.searchSaved('AI');
      expect(results.length).toBe(2);
    });

    test('should filter by tag', () => {
      const results = SavedSearchesService.getSearchesByTag('AI');
      expect(results.length).toBe(2);
    });
  });

  describe('Usage Tracking', () => {
    test('should track search usage', () => {
      const saved = SavedSearchesService.saveSearch({
        query: 'test',
        name: 'Test'
      });

      expect(saved.usageCount).toBe(0);

      const used = SavedSearchesService.useSearch(saved.id);

      expect(used?.usageCount).toBe(1);
      expect(used?.lastUsedAt).toBeDefined();
    });
  });

  describe('Import/Export', () => {
    beforeEach(() => {
      SavedSearchesService.saveSearch({ query: 'test1', name: 'Test 1' });
      SavedSearchesService.saveSearch({ query: 'test2', name: 'Test 2' });
    });

    test('should export searches as JSON', () => {
      const exported = SavedSearchesService.exportSearches();
      const data = JSON.parse(exported);

      expect(data.version).toBe('1.0');
      expect(data.searches.length).toBe(2);
    });

    test('should import with skip strategy', () => {
      const exported = SavedSearchesService.exportSearches();
      const imported = SavedSearchesService.importSearches(exported, 'skip');

      expect(imported).toBe(0); // All duplicates
    });
  });

  describe('Error Handling', () => {
    test('should throw error when saving empty query', () => {
      expect(() => {
        SavedSearchesService.saveSearch({
          query: '',
          name: 'Empty'
        });
      }).toThrow('Query is required');
    });

    test('should throw error when max limit reached', () => {
      for (let i = 0; i < 100; i++) {
        SavedSearchesService.saveSearch({
          query: `query ${i}`,
          name: `Name ${i}`
        });
      }

      expect(() => {
        SavedSearchesService.saveSearch({
          query: 'overflow',
          name: 'Overflow'
        });
      }).toThrow('Maximum 100');
    });
  });

  describe('Validation Utility', () => {
    test('should validate correct saved search', () => {
      const validSearch = {
        id: 'id1',
        query: 'test',
        name: 'Test',
        tags: [],
        createdAt: Date.now(),
        usageCount: 0,
        isPinned: false
      };

      expect(isValidSavedSearch(validSearch)).toBe(true);
    });

    test('should reject missing required fields', () => {
      expect(isValidSavedSearch({ query: 'test' })).toBe(false);
    });

    test('should reject wrong types', () => {
      expect(isValidSavedSearch({
        id: 'id',
        query: 'test',
        name: 'Test',
        tags: 'should-be-array',
        createdAt: Date.now(),
        usageCount: 0,
        isPinned: false
      })).toBe(false);
    });
  });
});
