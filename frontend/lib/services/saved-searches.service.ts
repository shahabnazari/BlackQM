/**
 * Saved Searches Service - Netflix-Grade
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Phase 10.104 Day 2: Search Analytics & Saved Searches
 *
 * Features:
 * - Bookmark frequently used queries
 * - Organize searches with tags/categories
 * - Quick access to saved searches
 * - Import/export saved searches
 * - Search within saved searches
 * - Usage tracking (last used, usage count)
 *
 * Inspired by: Gmail filters, Twitter saved searches, Chrome bookmarks
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { logger } from '@/lib/utils/logger';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface SavedSearch {
  id: string; // Unique identifier (UUID)
  query: string;
  name: string; // User-friendly name
  description?: string;
  tags: string[]; // Categorization (e.g., ['methodology', 'qualitative'])
  filters?: SearchFilters; // Associated filter settings
  createdAt: number; // timestamp
  lastUsedAt?: number; // timestamp
  usageCount: number;
  isPinned: boolean; // Pinned to top
  color?: string; // Visual customization (hex color)
}

export interface SearchFilters {
  yearRange?: { start: number; end: number };
  sources?: string[]; // Academic databases, alternative sources
  openAccessOnly?: boolean;
  hasFullText?: boolean;
  minCitations?: number;
}

export interface SavedSearchesStats {
  totalSaved: number;
  totalUsage: number;
  mostUsed: SavedSearch[];
  recentlyAdded: SavedSearch[];
  tagDistribution: Record<string, number>;
}

export interface ImportExportFormat {
  version: string;
  exportedAt: number;
  searches: SavedSearch[];
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'vqmethod_saved_searches';
const MAX_SAVED = 100; // Max saved searches per user
const FORMAT_VERSION = '1.0';

// Predefined color palette (Netflix-style)
export const SEARCH_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#ef4444', // red
  '#6366f1'  // indigo
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export class SavedSearchesService {
  /**
   * Save a new search (Netflix-grade: with metadata)
   *
   * @param search - Partial saved search (query required, rest optional)
   * @returns Created saved search with ID
   */
  static saveSearch(search: Partial<SavedSearch> & { query: string }): SavedSearch {
    try {
      // Validate required fields
      if (!search.query || search.query.trim().length === 0) {
        throw new Error('Query is required');
      }

      // Build complete saved search
      const savedSearch: SavedSearch = {
        id: this.generateId(),
        query: search.query.trim(),
        name: search.name || search.query.trim(),
        ...(search.description !== undefined && { description: search.description }),
        tags: search.tags || [],
        ...(search.filters !== undefined && { filters: search.filters }),
        createdAt: Date.now(),
        ...(search.lastUsedAt !== undefined && { lastUsedAt: search.lastUsedAt }),
        usageCount: 0,
        isPinned: search.isPinned || false,
        color: search.color || this.getRandomColor()
      };

      // Get existing searches
      const searches = this.getAllSearches();

      // Check max limit
      if (searches.length >= MAX_SAVED) {
        throw new Error(`Maximum ${MAX_SAVED} saved searches reached. Please delete some first.`);
      }

      // Check for duplicates (same query)
      const duplicate = searches.find(s => s.query === savedSearch.query);
      if (duplicate) {
        logger.info('Updating existing saved search with new metadata', 'SavedSearches', {
          query: savedSearch.query,
          oldName: duplicate.name,
          newName: savedSearch.name
        });

        // Update existing search with new metadata (preserve usage stats)
        return this.updateSearch(duplicate.id, {
          name: savedSearch.name,
          ...(savedSearch.description !== undefined && { description: savedSearch.description }),
          tags: savedSearch.tags,
          ...(savedSearch.filters !== undefined && { filters: savedSearch.filters }),
          ...(savedSearch.color !== undefined && { color: savedSearch.color })
        });
      }

      // Add to list
      searches.push(savedSearch);

      // Persist
      this.persistSearches(searches);

      logger.info('Search saved', 'SavedSearches', {
        id: savedSearch.id,
        name: savedSearch.name
      });

      return savedSearch;
    } catch (error: unknown) {
      logger.error('Failed to save search', 'SavedSearches', { error });
      throw error;
    }
  }

  /**
   * Update an existing saved search
   */
  static updateSearch(id: string, updates: Partial<SavedSearch>): SavedSearch {
    try {
      const searches = this.getAllSearches();
      const index = searches.findIndex(s => s.id === id);

      if (index === -1) {
        throw new Error(`Saved search with ID ${id} not found`);
      }

      // Merge updates (preserve required fields)
      const current = searches[index];
      if (!current) {
        throw new Error(`Saved search at index ${index} is undefined`);
      }

      const updatedSearch: SavedSearch = {
        id,
        query: updates.query ?? current.query,
        name: updates.name ?? current.name,
        tags: updates.tags ?? current.tags,
        createdAt: current.createdAt,
        usageCount: updates.usageCount ?? current.usageCount,
        isPinned: updates.isPinned ?? current.isPinned
      };

      // Add optional fields if they exist
      if (updates.description !== undefined) {
        updatedSearch.description = updates.description;
      } else if (current.description !== undefined) {
        updatedSearch.description = current.description;
      }

      if (updates.filters !== undefined) {
        updatedSearch.filters = updates.filters;
      } else if (current.filters !== undefined) {
        updatedSearch.filters = current.filters;
      }

      if (updates.lastUsedAt !== undefined) {
        updatedSearch.lastUsedAt = updates.lastUsedAt;
      } else if (current.lastUsedAt !== undefined) {
        updatedSearch.lastUsedAt = current.lastUsedAt;
      }

      if (updates.color !== undefined) {
        updatedSearch.color = updates.color;
      } else if (current.color !== undefined) {
        updatedSearch.color = current.color;
      }

      searches[index] = updatedSearch;

      this.persistSearches(searches);

      logger.info('Search updated', 'SavedSearches', { id });

      return updatedSearch;
    } catch (error: unknown) {
      logger.error('Failed to update search', 'SavedSearches', { error });
      throw error;
    }
  }

  /**
   * Delete a saved search
   */
  static deleteSearch(id: string): void {
    try {
      const searches = this.getAllSearches();
      const filtered = searches.filter(s => s.id !== id);

      if (filtered.length === searches.length) {
        logger.warn('Attempted to delete non-existent search', 'SavedSearches', { id });
        return;
      }

      this.persistSearches(filtered);

      logger.info('Search deleted', 'SavedSearches', { id });
    } catch (error: unknown) {
      logger.error('Failed to delete search', 'SavedSearches', { error });
    }
  }

  /**
   * Use a saved search (track usage)
   */
  static useSearch(id: string): SavedSearch | null {
    try {
      const searches = this.getAllSearches();
      const search = searches.find(s => s.id === id);

      if (!search) {
        logger.warn('Attempted to use non-existent search', 'SavedSearches', { id });
        return null;
      }

      // Update usage tracking
      search.lastUsedAt = Date.now();
      search.usageCount += 1;

      this.persistSearches(searches);

      logger.debug('Search used', 'SavedSearches', {
        id,
        usageCount: search.usageCount
      });

      return search;
    } catch (error: unknown) {
      logger.error('Failed to track search usage', 'SavedSearches', { error });
      return null;
    }
  }

  /**
   * Get all saved searches (Netflix-grade: sorted intelligently)
   *
   * @param sortBy - Sort criteria
   * @returns Sorted list of saved searches
   */
  static getAllSearches(sortBy: 'recent' | 'usage' | 'alpha' = 'recent'): SavedSearch[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const searches: SavedSearch[] = JSON.parse(stored);

      // Sort based on criteria
      let sorted: SavedSearch[];
      switch (sortBy) {
        case 'usage':
          sorted = searches.sort((a, b) => b.usageCount - a.usageCount);
          break;
        case 'alpha':
          sorted = searches.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'recent':
        default:
          sorted = searches.sort((a, b) => b.createdAt - a.createdAt);
          break;
      }

      // Pinned searches always first
      const pinned = sorted.filter(s => s.isPinned);
      const unpinned = sorted.filter(s => !s.isPinned);

      return [...pinned, ...unpinned];
    } catch (error: unknown) {
      logger.error('Failed to retrieve saved searches', 'SavedSearches', { error });
      return [];
    }
  }

  /**
   * Get saved search by ID
   */
  static getSearchById(id: string): SavedSearch | null {
    try {
      const searches = this.getAllSearches();
      return searches.find(s => s.id === id) || null;
    } catch (error: unknown) {
      logger.error('Failed to get search by ID', 'SavedSearches', { error });
      return null;
    }
  }

  /**
   * Search within saved searches (Netflix-grade: fuzzy matching)
   *
   * @param searchTerm - Search term
   * @returns Matching saved searches
   */
  static searchSaved(searchTerm: string): SavedSearch[] {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return this.getAllSearches();
      }

      const term = searchTerm.toLowerCase();
      const searches = this.getAllSearches();

      return searches.filter(s =>
        s.query.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term) ||
        (s.description && s.description.toLowerCase().includes(term)) ||
        s.tags.some(tag => tag.toLowerCase().includes(term))
      );
    } catch (error: unknown) {
      logger.error('Failed to search saved searches', 'SavedSearches', { error });
      return [];
    }
  }

  /**
   * Get searches by tag
   */
  static getSearchesByTag(tag: string): SavedSearch[] {
    try {
      const searches = this.getAllSearches();
      return searches.filter(s => s.tags.includes(tag));
    } catch (error: unknown) {
      logger.error('Failed to get searches by tag', 'SavedSearches', { error });
      return [];
    }
  }

  /**
   * Get all tags (with counts)
   */
  static getAllTags(): Array<{ tag: string; count: number }> {
    try {
      const searches = this.getAllSearches();
      const tagCounts = new Map<string, number>();

      searches.forEach(s => {
        s.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      return Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error: unknown) {
      logger.error('Failed to get all tags', 'SavedSearches', { error });
      return [];
    }
  }

  /**
   * Toggle pin status
   */
  static togglePin(id: string): void {
    try {
      const searches = this.getAllSearches();
      const search = searches.find(s => s.id === id);

      if (search) {
        search.isPinned = !search.isPinned;
        this.persistSearches(searches);

        logger.debug('Search pin toggled', 'SavedSearches', {
          id,
          isPinned: search.isPinned
        });
      }
    } catch (error: unknown) {
      logger.error('Failed to toggle pin', 'SavedSearches', { error });
    }
  }

  /**
   * Get statistics
   */
  static getStats(): SavedSearchesStats {
    try {
      const searches = this.getAllSearches();

      // Tag distribution
      const tagDistribution: Record<string, number> = {};
      searches.forEach(s => {
        s.tags.forEach(tag => {
          tagDistribution[tag] = (tagDistribution[tag] || 0) + 1;
        });
      });

      return {
        totalSaved: searches.length,
        totalUsage: searches.reduce((sum, s) => sum + s.usageCount, 0),
        mostUsed: searches
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 5),
        recentlyAdded: searches
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 5),
        tagDistribution
      };
    } catch (error: unknown) {
      logger.error('Failed to get stats', 'SavedSearches', { error });
      return {
        totalSaved: 0,
        totalUsage: 0,
        mostUsed: [],
        recentlyAdded: [],
        tagDistribution: {}
      };
    }
  }

  /**
   * Export saved searches (Netflix-grade: versioned format)
   */
  static exportSearches(): string {
    try {
      const searches = this.getAllSearches();

      const exportData: ImportExportFormat = {
        version: FORMAT_VERSION,
        exportedAt: Date.now(),
        searches
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error: unknown) {
      logger.error('Failed to export searches', 'SavedSearches', { error });
      return '';
    }
  }

  /**
   * Import saved searches (Netflix-grade: merge with existing)
   *
   * @param jsonData - Exported JSON data
   * @param mergeStrategy - How to handle duplicates
   * @returns Number of searches imported
   */
  static importSearches(
    jsonData: string,
    mergeStrategy: 'skip' | 'overwrite' | 'rename' = 'skip'
  ): number {
    try {
      const importData: ImportExportFormat = JSON.parse(jsonData);

      // Validate format version
      if (importData.version !== FORMAT_VERSION) {
        logger.warn('Import version mismatch', 'SavedSearches', {
          expected: FORMAT_VERSION,
          actual: importData.version
        });
      }

      const existing = this.getAllSearches();
      const existingQueries = new Set(existing.map(s => s.query));
      let imported = 0;
      let invalidCount = 0;

      importData.searches.forEach(importedSearch => {
        // Validate structure before importing
        if (!isValidSavedSearch(importedSearch)) {
          logger.warn('Skipping invalid saved search during import', 'SavedSearches', {
            search: importedSearch
          });
          invalidCount++;
          return; // Skip invalid entries
        }

        const isDuplicate = existingQueries.has(importedSearch.query);

        if (isDuplicate) {
          switch (mergeStrategy) {
            case 'skip':
              // Skip duplicate
              break;
            case 'overwrite':
              // Update existing
              const existingSearch = existing.find(s => s.query === importedSearch.query);
              if (existingSearch) {
                this.updateSearch(existingSearch.id, importedSearch);
                imported++;
              }
              break;
            case 'rename':
              // Add with modified name
              this.saveSearch({
                ...importedSearch,
                name: `${importedSearch.name} (imported)`,
                id: this.generateId() // New ID
              });
              imported++;
              break;
          }
        } else {
          // New search - add it
          this.saveSearch({
            ...importedSearch,
            id: this.generateId() // Generate new ID
          });
          imported++;
        }
      });

      logger.info('Searches imported', 'SavedSearches', {
        imported,
        total: importData.searches.length,
        invalidCount
      });

      return imported;
    } catch (error: unknown) {
      logger.error('Failed to import searches', 'SavedSearches', { error });
      return 0;
    }
  }

  /**
   * Clear all saved searches
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      logger.info('All saved searches cleared', 'SavedSearches');
    } catch (error: unknown) {
      logger.error('Failed to clear searches', 'SavedSearches', { error });
    }
  }

  /**
   * Check if service is available
   */
  static isAvailable(): boolean {
    try {
      localStorage.setItem('_saved_search_test', 'test');
      localStorage.removeItem('_saved_search_test');
      return true;
    } catch {
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Persist searches to localStorage
   */
  private static persistSearches(searches: SavedSearch[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('QuotaExceededError') || errorMessage.includes('quota')) {
        logger.error('localStorage quota exceeded for saved searches', 'SavedSearches');
        throw new Error('Storage quota exceeded. Please delete some saved searches.');
      }

      throw error;
    }
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get random color from palette
   */
  private static getRandomColor(): string {
    const index = Math.floor(Math.random() * SEARCH_COLORS.length);
    return SEARCH_COLORS[index] || SEARCH_COLORS[0];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate saved search data
 */
export function isValidSavedSearch(data: unknown): data is SavedSearch {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const search = data as Partial<SavedSearch>;

  return (
    typeof search.id === 'string' &&
    typeof search.query === 'string' &&
    typeof search.name === 'string' &&
    Array.isArray(search.tags) &&
    typeof search.createdAt === 'number' &&
    typeof search.usageCount === 'number' &&
    typeof search.isPinned === 'boolean'
  );
}
