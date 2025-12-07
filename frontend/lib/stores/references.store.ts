/**
 * References Zustand Store - Phase 10.97 Day 1
 *
 * Enterprise-grade centralized state management for reference management with:
 * - User's saved references library
 * - Collection organization
 * - Selection state for bulk operations
 * - Zotero sync status tracking
 * - Citation style preferences
 *
 * @module ReferencesStore
 * @since Phase 10.97 Day 1
 */

import React from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import {
  referencesAPI,
  type Reference,
  type CitationStyle,
  type ZoteroSyncStatus,
  type ParsedBibTeXEntry,
  type ParsedRISEntry,
  CITATION_STYLE_LABELS,
} from '@/lib/api/services/references-api.service';
import { literatureAPI, type Paper } from '@/lib/services/literature-api.service';

// ============================================================================
// CONSTANTS
// ============================================================================

const LOGGER_CONTEXT = 'ReferencesStore';
const STORE_NAME = 'references-store';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/** Collection data structure */
export interface ReferenceCollection {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly color: string;
  readonly icon: string;
  readonly referenceCount: number;
  readonly createdDate: Date;
  readonly isShared: boolean;
  readonly collaborators?: ReadonlyArray<string>;
}

/** View mode for references display */
export type ViewMode = 'list' | 'grid';

/** Sort options for references */
export type SortOption = 'date' | 'title' | 'author' | 'year';

/** Import status for file imports */
export type ImportStatus = 'idle' | 'importing' | 'success' | 'error';

/** References store state */
export interface ReferencesState {
  // ===========================
  // STATE
  // ===========================

  /** User's saved references */
  references: Reference[];

  /** User's collections */
  collections: ReferenceCollection[];

  /** Currently selected collection ID */
  currentCollectionId: string;

  /** Array of selected reference IDs for bulk operations (serializable) */
  selectedReferenceIds: string[];

  /** Get selected references as Set for O(1) lookup (computed) */
  readonly selectedReferences: Set<string>;

  /** Search query for filtering */
  searchQuery: string;

  /** Active tag filters */
  filterTags: string[];

  /** Current view mode */
  viewMode: ViewMode;

  /** Current sort option */
  sortBy: SortOption;

  /** Preferred citation style */
  citationStyle: CitationStyle;

  /** Zotero sync status */
  zoteroSyncStatus: ZoteroSyncStatus;

  /** Import status for file imports */
  importStatus: ImportStatus;

  /** Loading state for references */
  isLoading: boolean;

  /** Error state */
  error: string | null;

  // ===========================
  // ACTIONS
  // ===========================

  /** Load user's saved references from library */
  loadReferences: () => Promise<void>;

  /** Set references directly */
  setReferences: (refs: Reference[] | ((prev: Reference[]) => Reference[])) => void;

  /** Add a reference to the library */
  addReference: (ref: Reference) => void;

  /** Remove a reference from the library */
  removeReference: (refId: string) => void;

  /** Update a reference */
  updateReference: (refId: string, updates: Partial<Reference>) => void;

  /** Toggle star status on a reference */
  toggleStar: (refId: string) => void;

  /** Update read status */
  updateReadStatus: (refId: string, status: Reference['readStatus']) => void;

  // ===========================
  // SELECTION ACTIONS
  // ===========================

  /** Toggle reference selection */
  toggleSelection: (refId: string) => void;

  /** Select all references in current view */
  selectAll: (refIds: string[]) => void;

  /** Clear all selections */
  clearSelection: () => void;

  // ===========================
  // COLLECTION ACTIONS
  // ===========================

  /** Set current collection */
  setCurrentCollection: (collectionId: string) => void;

  /** Add a new collection */
  addCollection: (collection: Omit<ReferenceCollection, 'referenceCount'>) => void;

  /** Remove a collection */
  removeCollection: (collectionId: string) => void;

  /** Update collection reference counts */
  updateCollectionCounts: () => void;

  // ===========================
  // FILTER & SORT ACTIONS
  // ===========================

  /** Set search query */
  setSearchQuery: (query: string) => void;

  /** Toggle a tag filter */
  toggleTagFilter: (tag: string) => void;

  /** Clear all tag filters */
  clearTagFilters: () => void;

  /** Set view mode */
  setViewMode: (mode: ViewMode) => void;

  /** Set sort option */
  setSortBy: (option: SortOption) => void;

  /** Set citation style */
  setCitationStyle: (style: CitationStyle) => void;

  // ===========================
  // CITATION OPERATIONS
  // ===========================

  /** Format citation for a reference */
  formatCitation: (ref: Reference) => Promise<string>;

  /** Copy citation to clipboard */
  copyCitation: (ref: Reference) => Promise<void>;

  /** Export selected references as BibTeX */
  exportAsBibTeX: () => Promise<string>;

  /** Export selected references as RIS */
  exportAsRIS: () => Promise<string>;

  // ===========================
  // IMPORT OPERATIONS
  // ===========================

  /** Import references from BibTeX file */
  importFromBibTeX: (bibtex: string) => Promise<ParsedBibTeXEntry[]>;

  /** Import references from RIS file */
  importFromRIS: (ris: string) => Promise<ParsedRISEntry[]>;

  // ===========================
  // ZOTERO OPERATIONS
  // ===========================

  /** Sync with Zotero */
  syncWithZotero: (apiKey: string, zoteroUserId: string) => Promise<void>;

  // ===========================
  // COMPUTED / HELPERS
  // ===========================

  /** Check if reference is selected */
  isSelected: (refId: string) => boolean;

  /** Get filtered and sorted references */
  getFilteredReferences: () => Reference[];

  /** Get all unique tags from references */
  getAllTags: () => string[];

  /** Reset store state */
  reset: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const DEFAULT_COLLECTIONS: ReferenceCollection[] = [
  {
    id: 'default',
    name: 'My Library',
    color: 'purple',
    icon: 'library',
    referenceCount: 0,
    createdDate: new Date(),
    isShared: false,
  },
  {
    id: 'q-methodology',
    name: 'Q Methodology',
    description: 'Papers related to Q methodology research',
    color: 'blue',
    icon: 'folder',
    referenceCount: 0,
    createdDate: new Date(),
    isShared: false,
  },
];

const initialState = {
  references: [] as Reference[],
  collections: DEFAULT_COLLECTIONS,
  currentCollectionId: 'default',
  // Use string array instead of Set for JSON serialization compatibility with persist middleware
  selectedReferenceIds: [] as string[],
  searchQuery: '',
  filterTags: [] as string[],
  viewMode: 'list' as ViewMode,
  sortBy: 'date' as SortOption,
  citationStyle: 'apa' as CitationStyle,
  zoteroSyncStatus: 'idle' as ZoteroSyncStatus,
  importStatus: 'idle' as ImportStatus,
  isLoading: false,
  error: null as string | null,
};

// ============================================================================
// PERFORMANCE: MEMOIZATION CACHES (SSR-safe using WeakMap)
// ============================================================================

/**
 * WeakMap-based caches automatically garbage collect when keys are no longer referenced.
 * This is SSR-safe because each request gets fresh state arrays that won't collide.
 */

/** Cache for selectedReferences Set - keyed by array reference */
const selectedSetCache = new WeakMap<readonly string[], Set<string>>();

/** Cache for all tags - keyed by references array */
const allTagsCache = new WeakMap<readonly Reference[], string[]>();

/** Cache for collection counts - keyed by references array */
const collectionCountsCache = new WeakMap<readonly Reference[], Map<string, number>>();

/**
 * Get or create cached Set from selected IDs array
 * SSR-safe: Uses WeakMap keyed by array reference
 * @param selectedIds - Array of selected reference IDs
 * @returns Cached Set for O(1) lookups
 */
function getSelectedSet(selectedIds: readonly string[]): Set<string> {
  let cached = selectedSetCache.get(selectedIds);
  if (!cached) {
    cached = new Set(selectedIds);
    selectedSetCache.set(selectedIds, cached);
  }
  return cached;
}

/**
 * Get or create cached tags array
 * SSR-safe: Uses WeakMap keyed by references array
 * @param references - Array of references
 * @returns Cached array of unique tags
 */
function getCachedTags(references: readonly Reference[]): string[] {
  let cached = allTagsCache.get(references);
  if (!cached) {
    const tagSet = new Set<string>();
    for (const ref of references) {
      for (const tag of ref.tags) {
        tagSet.add(tag);
      }
    }
    cached = Array.from(tagSet);
    allTagsCache.set(references, cached);
  }
  return cached;
}

/**
 * Get collection counts in O(n) single pass
 * SSR-safe: Uses WeakMap keyed by references array
 * @param references - Array of references
 * @returns Map of collection ID to reference count
 */
function getCollectionCounts(references: readonly Reference[]): Map<string, number> {
  let cached = collectionCountsCache.get(references);
  if (!cached) {
    cached = new Map<string, number>();
    for (const ref of references) {
      for (const collectionId of ref.collections) {
        cached.set(collectionId, (cached.get(collectionId) || 0) + 1);
      }
    }
    collectionCountsCache.set(references, cached);
  }
  return cached;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useReferencesStore = create<ReferencesState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Computed property: Convert array to Set for O(1) lookups (cached)
        get selectedReferences(): Set<string> {
          return getSelectedSet(get().selectedReferenceIds);
        },

        // ===========================
        // LOAD REFERENCES
        // ===========================

        loadReferences: async () => {
          set({ isLoading: true, error: null });
          logger.info('Loading user references', LOGGER_CONTEXT);

          try {
            // Load saved papers from library API
            const response = await literatureAPI.getUserLibrary(1, 100);
            const papers = response?.papers || [];

            // Convert papers to references format
            const references: Reference[] = papers.map((paper: Paper) => {
              const baseRef = {
                id: paper.id,
                title: paper.title,
                authors: paper.authors || [],
                year: paper.year || new Date().getFullYear(),
                keywords: paper.keywords || [],
                collections: ['default'] as string[],
                tags: [] as string[],
                starred: false,
                citationKey: generateCitationKey(paper),
                addedDate: new Date(),
                modifiedDate: new Date(),
                readStatus: 'unread' as const,
                type: 'article' as const,
              };

              // Only include optional properties if they exist
              return {
                ...baseRef,
                ...(paper.venue && { journal: paper.venue }),
                ...(paper.doi && { doi: paper.doi }),
                ...(paper.url && { url: paper.url }),
                ...(paper.abstract && { abstract: paper.abstract }),
              } as Reference;
            });

            set({ references, isLoading: false });
            get().updateCollectionCounts();

            logger.info('References loaded successfully', LOGGER_CONTEXT, {
              count: references.length,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load references';
            set({ error: message, isLoading: false });
            logger.error('Failed to load references', LOGGER_CONTEXT, error);
            toast.error('Failed to load references');
          }
        },

        setReferences: (refs) => {
          set((state) => ({
            references: typeof refs === 'function' ? refs(state.references) : refs,
          }));
          get().updateCollectionCounts();
        },

        addReference: (ref) => {
          set((state) => ({
            references: [...state.references, ref],
          }));
          get().updateCollectionCounts();
          logger.info('Reference added', LOGGER_CONTEXT, { refId: ref.id });
        },

        removeReference: (refId) => {
          set((state) => ({
            references: state.references.filter((r) => r.id !== refId),
            selectedReferenceIds: state.selectedReferenceIds.filter((id) => id !== refId),
          }));
          get().updateCollectionCounts();
          logger.info('Reference removed', LOGGER_CONTEXT, { refId });
        },

        updateReference: (refId, updates) => {
          set((state) => ({
            references: state.references.map((r) =>
              r.id === refId
                ? { ...r, ...updates, modifiedDate: new Date() }
                : r
            ),
          }));
        },

        toggleStar: (refId) => {
          set((state) => ({
            references: state.references.map((r) =>
              r.id === refId ? { ...r, starred: !r.starred } : r
            ),
          }));
        },

        updateReadStatus: (refId, status) => {
          set((state) => ({
            references: state.references.map((r) =>
              r.id === refId ? { ...r, readStatus: status } : r
            ),
          }));
        },

        // ===========================
        // SELECTION ACTIONS
        // ===========================

        toggleSelection: (refId) => {
          set((state) => {
            const isCurrentlySelected = state.selectedReferenceIds.includes(refId);
            return {
              selectedReferenceIds: isCurrentlySelected
                ? state.selectedReferenceIds.filter((id) => id !== refId)
                : [...state.selectedReferenceIds, refId],
            };
          });
        },

        selectAll: (refIds) => {
          set({ selectedReferenceIds: [...refIds] });
        },

        clearSelection: () => {
          set({ selectedReferenceIds: [] });
        },

        // ===========================
        // COLLECTION ACTIONS
        // ===========================

        setCurrentCollection: (collectionId) => {
          set({ currentCollectionId: collectionId });
        },

        addCollection: (collection) => {
          const newCollection: ReferenceCollection = {
            ...collection,
            referenceCount: 0,
          };
          set((state) => ({
            collections: [...state.collections, newCollection],
          }));
          logger.info('Collection added', LOGGER_CONTEXT, { name: collection.name });
        },

        removeCollection: (collectionId) => {
          if (collectionId === 'default') {
            toast.error('Cannot remove default collection');
            return;
          }
          set((state) => ({
            collections: state.collections.filter((c) => c.id !== collectionId),
            currentCollectionId:
              state.currentCollectionId === collectionId
                ? 'default'
                : state.currentCollectionId,
          }));
        },

        updateCollectionCounts: () => {
          set((state) => {
            // O(n) single pass using cached counts instead of O(n × m)
            const counts = getCollectionCounts(state.references);
            return {
              collections: state.collections.map((collection) => ({
                ...collection,
                referenceCount: counts.get(collection.id) || 0,
              })),
            };
          });
        },

        // ===========================
        // FILTER & SORT ACTIONS
        // ===========================

        setSearchQuery: (query) => {
          set({ searchQuery: query });
        },

        toggleTagFilter: (tag) => {
          set((state) => ({
            filterTags: state.filterTags.includes(tag)
              ? state.filterTags.filter((t) => t !== tag)
              : [...state.filterTags, tag],
          }));
        },

        clearTagFilters: () => {
          set({ filterTags: [] });
        },

        setViewMode: (mode) => {
          set({ viewMode: mode });
        },

        setSortBy: (option) => {
          set({ sortBy: option });
        },

        setCitationStyle: (style) => {
          set({ citationStyle: style });
          logger.info('Citation style changed', LOGGER_CONTEXT, { style });
        },

        // ===========================
        // CITATION OPERATIONS
        // ===========================

        formatCitation: async (ref) => {
          const style = get().citationStyle;
          try {
            const response = await referencesAPI.formatCitation(ref, style);
            return response.citation;
          } catch (error) {
            logger.error('Failed to format citation', LOGGER_CONTEXT, error);
            // Fallback to basic format
            return `${ref.authors.join(', ')} (${ref.year}). ${ref.title}.`;
          }
        },

        copyCitation: async (ref) => {
          try {
            const citation = await get().formatCitation(ref);
            await navigator.clipboard.writeText(citation);
            toast.success(`Citation copied (${CITATION_STYLE_LABELS[get().citationStyle]})`);
          } catch (error) {
            logger.error('Failed to copy citation', LOGGER_CONTEXT, error);
            toast.error('Failed to copy citation');
          }
        },

        exportAsBibTeX: async () => {
          const { selectedReferenceIds, references } = get();
          const selectedSet = new Set(selectedReferenceIds);
          const toExport =
            selectedReferenceIds.length > 0
              ? references.filter((r) => selectedSet.has(r.id))
              : get().getFilteredReferences();

          if (toExport.length === 0) {
            toast.error('No references to export');
            return '';
          }

          try {
            const bibtex = await referencesAPI.generateBulkBibTeX(toExport);
            logger.info('BibTeX exported', LOGGER_CONTEXT, { count: toExport.length });
            return bibtex;
          } catch (error) {
            logger.error('Failed to export BibTeX', LOGGER_CONTEXT, error);
            toast.error('Failed to export BibTeX');
            return '';
          }
        },

        exportAsRIS: async () => {
          const { selectedReferenceIds, references } = get();
          const selectedSet = new Set(selectedReferenceIds);
          const toExport =
            selectedReferenceIds.length > 0
              ? references.filter((r) => selectedSet.has(r.id))
              : get().getFilteredReferences();

          if (toExport.length === 0) {
            toast.error('No references to export');
            return '';
          }

          try {
            const ris = await referencesAPI.generateBulkRIS(toExport);
            logger.info('RIS exported', LOGGER_CONTEXT, { count: toExport.length });
            return ris;
          } catch (error) {
            logger.error('Failed to export RIS', LOGGER_CONTEXT, error);
            toast.error('Failed to export RIS');
            return '';
          }
        },

        // ===========================
        // IMPORT OPERATIONS
        // ===========================

        importFromBibTeX: async (bibtex) => {
          set({ importStatus: 'importing' });
          logger.info('Importing BibTeX', LOGGER_CONTEXT);

          try {
            const response = await referencesAPI.parseBibTeX(bibtex);
            set({ importStatus: 'success' });
            toast.success(`Imported ${response.totalParsed} references`);
            return [...response.entries];
          } catch (error) {
            set({ importStatus: 'error' });
            logger.error('BibTeX import failed', LOGGER_CONTEXT, error);
            toast.error('Failed to import BibTeX');
            return [];
          }
        },

        importFromRIS: async (ris) => {
          set({ importStatus: 'importing' });
          logger.info('Importing RIS', LOGGER_CONTEXT);

          try {
            const response = await referencesAPI.parseRIS(ris);
            set({ importStatus: 'success' });
            toast.success(`Imported ${response.totalParsed} references`);
            return [...response.entries];
          } catch (error) {
            set({ importStatus: 'error' });
            logger.error('RIS import failed', LOGGER_CONTEXT, error);
            toast.error('Failed to import RIS');
            return [];
          }
        },

        // ===========================
        // ZOTERO OPERATIONS
        // ===========================

        syncWithZotero: async (apiKey, zoteroUserId) => {
          set({ zoteroSyncStatus: 'syncing' });
          logger.info('Starting Zotero sync', LOGGER_CONTEXT);

          try {
            const response = await referencesAPI.syncWithZotero({
              apiKey,
              zoteroUserId,
            });

            if (response.success) {
              set({ zoteroSyncStatus: 'success' });
              toast.success(`Synced ${response.itemsSynced} items from Zotero`);
              // Reload references to include synced items
              await get().loadReferences();
            } else {
              set({ zoteroSyncStatus: 'error' });
              toast.error('Zotero sync failed');
            }

            // Reset status after delay
            setTimeout(() => {
              set({ zoteroSyncStatus: 'idle' });
            }, 3000);
          } catch (error) {
            set({ zoteroSyncStatus: 'error' });
            logger.error('Zotero sync failed', LOGGER_CONTEXT, error);
            toast.error('Failed to sync with Zotero');

            setTimeout(() => {
              set({ zoteroSyncStatus: 'idle' });
            }, 3000);
          }
        },

        // ===========================
        // COMPUTED / HELPERS
        // ===========================

        isSelected: (refId) => {
          // O(1) lookup using cached Set instead of O(n) array.includes()
          return getSelectedSet(get().selectedReferenceIds).has(refId);
        },

        getFilteredReferences: () => {
          const {
            references,
            currentCollectionId,
            searchQuery,
            filterTags,
            sortBy,
          } = get();

          let filtered = references.filter((ref) =>
            ref.collections.includes(currentCollectionId)
          );

          // Apply search
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
              (ref) =>
                ref.title.toLowerCase().includes(query) ||
                ref.authors.some((a) => a.toLowerCase().includes(query)) ||
                ref.keywords.some((k) => k.toLowerCase().includes(query)) ||
                ref.abstract?.toLowerCase().includes(query)
            );
          }

          // Apply tag filters
          if (filterTags.length > 0) {
            filtered = filtered.filter((ref) =>
              filterTags.every((tag) => ref.tags.includes(tag))
            );
          }

          // Sort
          filtered.sort((a, b) => {
            switch (sortBy) {
              case 'title':
                return a.title.localeCompare(b.title);
              case 'author':
                return (a.authors[0] || '').localeCompare(b.authors[0] || '');
              case 'year':
                return b.year - a.year;
              case 'date':
              default:
                return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
            }
          });

          return filtered;
        },

        getAllTags: () => {
          // Use cached tags - only recomputes when references array changes
          return getCachedTags(get().references);
        },

        reset: () => {
          set(initialState);
          logger.info('References store reset', LOGGER_CONTEXT);
        },
      }),
      {
        name: STORE_NAME,
        partialize: (state) => ({
          citationStyle: state.citationStyle,
          viewMode: state.viewMode,
          sortBy: state.sortBy,
        }),
      }
    ),
    { name: STORE_NAME }
  )
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a citation key from paper data
 */
function generateCitationKey(paper: { authors?: string[]; year?: number; title: string }): string {
  const firstAuthor = paper.authors?.[0]?.split(' ').pop()?.toLowerCase() || 'unknown';
  const year = paper.year || new Date().getFullYear();
  const titleWord = paper.title.split(' ')[0]?.toLowerCase().replace(/[^a-z]/g, '') || 'paper';
  return `${firstAuthor}${year}${titleWord}`;
}

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

/**
 * Select filtered references with stable reference.
 * Uses React.useMemo to prevent unnecessary re-computation.
 *
 * PERFORMANCE: Memoizes filter/sort operations.
 */
export const useFilteredReferences = (): Reference[] => {
  // Select each value individually - Zustand's default shallow compare handles this
  const references = useReferencesStore((state) => state.references);
  const currentCollectionId = useReferencesStore((state) => state.currentCollectionId);
  const searchQuery = useReferencesStore((state) => state.searchQuery);
  const filterTags = useReferencesStore((state) => state.filterTags);
  const sortBy = useReferencesStore((state) => state.sortBy);

  // Use React.useMemo to only recompute when dependencies change
  return React.useMemo((): Reference[] => {
    let filtered = references.filter((ref: Reference) =>
      ref.collections.includes(currentCollectionId)
    );

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ref: Reference) =>
          ref.title.toLowerCase().includes(query) ||
          ref.authors.some((a: string) => a.toLowerCase().includes(query)) ||
          ref.keywords.some((k: string) => k.toLowerCase().includes(query)) ||
          ref.abstract?.toLowerCase().includes(query)
      );
    }

    // Apply tag filters
    if (filterTags.length > 0) {
      filtered = filtered.filter((ref: Reference) =>
        filterTags.every((tag: string) => ref.tags.includes(tag))
      );
    }

    // Sort (create new array to avoid mutation)
    const sorted = [...filtered].sort((a: Reference, b: Reference) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return (a.authors[0] || '').localeCompare(b.authors[0] || '');
        case 'year':
          return b.year - a.year;
        case 'date':
        default:
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
      }
    });

    return sorted;
  }, [references, currentCollectionId, searchQuery, filterTags, sortBy]);
};

/** Select citation style */
export const useCitationStyle = () =>
  useReferencesStore((state) => state.citationStyle);

/** Select Zotero sync status */
export const useZoteroSyncStatus = () =>
  useReferencesStore((state) => state.zoteroSyncStatus);

/** Select loading state */
export const useReferencesLoading = () =>
  useReferencesStore((state) => state.isLoading);

/** Select selected reference count */
export const useSelectedCount = () =>
  useReferencesStore((state) => state.selectedReferenceIds.length);

/** Select all unique tags with stable reference */
export const useAllTags = () => {
  const references = useReferencesStore((state) => state.references);
  return React.useMemo(() => getCachedTags(references), [references]);
};

/** Select isSelected function for O(1) lookup */
export const useIsSelected = () => {
  const selectedReferenceIds = useReferencesStore((state) => state.selectedReferenceIds);
  return React.useCallback(
    (refId: string) => getSelectedSet(selectedReferenceIds).has(refId),
    [selectedReferenceIds]
  );
};
