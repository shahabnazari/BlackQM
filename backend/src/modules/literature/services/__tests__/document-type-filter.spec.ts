/**
 * Document Type Filter Tests
 * Phase 10.181: Verify books, chapters, datasets are excluded from search results
 */
import { describe, it, expect } from 'vitest';
import { Paper, LiteratureSource } from '../../dto/literature.dto';

/**
 * Replicate the EXCLUDED_DOCUMENT_TYPES from search-stream.service.ts
 */
const EXCLUDED_DOCUMENT_TYPES = new Set([
  'book',
  'book-chapter',
  'book-section',
  'book-part',
  'book-track',
  'monograph',
  'edited-book',
  'reference-book',
  'reference-entry',
  'dataset',
  'database',
  'standard',
  'grant',
  'component',
  'Book',
  'Book Chapter',
]);

/**
 * Replicate the isExcludedDocumentType logic from search-stream.service.ts
 */
function isExcludedDocumentType(paper: Partial<Paper>): boolean {
  // Check publicationType array
  if (paper.publicationType && paper.publicationType.length > 0) {
    for (const docType of paper.publicationType) {
      if (EXCLUDED_DOCUMENT_TYPES.has(docType)) {
        return true;
      }
      if (EXCLUDED_DOCUMENT_TYPES.has(docType.toLowerCase())) {
        return true;
      }
    }
  }

  // Check URL patterns for book content
  if (paper.url) {
    const urlLower = paper.url.toLowerCase();
    if (
      urlLower.includes('/book/') ||
      urlLower.includes('/chapter/') ||
      urlLower.includes('/referencework/') ||
      urlLower.includes('/encyclopedia/')
    ) {
      return true;
    }
  }

  // Check venue for book indicators
  const venue = paper.venue?.toLowerCase() || '';
  if (
    venue.includes('handbook of') ||
    venue.includes('encyclopedia of') ||
    venue.includes('encyclopedia ') ||
    venue.includes(' handbook')
  ) {
    return true;
  }

  return false;
}

describe('Document Type Filter (Phase 10.181)', () => {
  describe('isExcludedDocumentType', () => {
    describe('should EXCLUDE', () => {
      it('book from CrossRef', () => {
        const paper: Partial<Paper> = {
          title: 'Climate Change Impacts',
          publicationType: ['book'],
          source: LiteratureSource.CROSSREF,
        };
        expect(isExcludedDocumentType(paper)).toBe(true);
      });

      it('book-chapter from CrossRef', () => {
        const paper: Partial<Paper> = {
          title: 'Chapter 1: Introduction',
          publicationType: ['book-chapter'],
          source: LiteratureSource.CROSSREF,
        };
        expect(isExcludedDocumentType(paper)).toBe(true);
      });

      it('book-section from CrossRef', () => {
        const paper: Partial<Paper> = {
          title: 'Section 2.1',
          publicationType: ['book-section'],
          source: LiteratureSource.CROSSREF,
        };
        expect(isExcludedDocumentType(paper)).toBe(true);
      });

      it('Springer book by URL pattern', () => {
        const paper: Partial<Paper> = {
          title: 'Climate Change Research Methods',
          url: 'https://link.springer.com/book/10.1007/978-3-031-19059-9',
          source: LiteratureSource.SPRINGER,
        };
        expect(isExcludedDocumentType(paper)).toBe(true);
      });

      it('Springer chapter by URL pattern', () => {
        const paper: Partial<Paper> = {
          title: 'Introduction to Climate Science',
          url: 'https://link.springer.com/chapter/10.1007/978-3-031-19059-9_1',
          source: LiteratureSource.SPRINGER,
        };
        expect(isExcludedDocumentType(paper)).toBe(true);
      });

      it('monograph', () => {
        const paper: Partial<Paper> = {
          title: 'Comprehensive Climate Study',
          publicationType: ['monograph'],
        };
        expect(isExcludedDocumentType(paper)).toBe(true);
      });

      it('dataset', () => {
        const paper: Partial<Paper> = {
          title: 'Global Temperature Dataset',
          publicationType: ['dataset'],
        };
        expect(isExcludedDocumentType(paper)).toBe(true);
      });

      it('reference-entry', () => {
        const paper: Partial<Paper> = {
          title: 'Climate Change Definition',
          publicationType: ['reference-entry'],
        };
        expect(isExcludedDocumentType(paper)).toBe(true);
      });

      it('encyclopedia by venue name', () => {
        const paper: Partial<Paper> = {
          title: 'Climate',
          venue: 'Encyclopedia of Environmental Science',
        };
        expect(isExcludedDocumentType(paper)).toBe(true);
      });

      it('handbook by venue name', () => {
        const paper: Partial<Paper> = {
          title: 'Research Methods',
          venue: 'Handbook of Climate Research Methods',
        };
        expect(isExcludedDocumentType(paper)).toBe(true);
      });

      it('reference work by URL', () => {
        const paper: Partial<Paper> = {
          title: 'Climate Encyclopedia Entry',
          url: 'https://link.springer.com/referencework/10.1007/978-1-4614-5684-1',
        };
        expect(isExcludedDocumentType(paper)).toBe(true);
      });
    });

    describe('should INCLUDE (not exclude)', () => {
      it('journal-article from CrossRef', () => {
        const paper: Partial<Paper> = {
          title: 'Climate Change Impacts on Ecosystems',
          publicationType: ['journal-article'],
          source: LiteratureSource.CROSSREF,
        };
        expect(isExcludedDocumentType(paper)).toBe(false);
      });

      it('proceedings-article', () => {
        const paper: Partial<Paper> = {
          title: 'Conference Paper on Climate',
          publicationType: ['proceedings-article'],
        };
        expect(isExcludedDocumentType(paper)).toBe(false);
      });

      it('posted-content (preprint)', () => {
        const paper: Partial<Paper> = {
          title: 'Climate Preprint',
          publicationType: ['posted-content'],
        };
        expect(isExcludedDocumentType(paper)).toBe(false);
      });

      it('PubMed Journal Article', () => {
        const paper: Partial<Paper> = {
          title: 'Medical Climate Study',
          publicationType: ['Journal Article'],
          source: LiteratureSource.PUBMED,
        };
        expect(isExcludedDocumentType(paper)).toBe(false);
      });

      it('paper with normal journal URL', () => {
        const paper: Partial<Paper> = {
          title: 'Climate Research Paper',
          url: 'https://www.nature.com/articles/s41558-023-01234-5',
        };
        expect(isExcludedDocumentType(paper)).toBe(false);
      });

      it('paper with regular venue name', () => {
        const paper: Partial<Paper> = {
          title: 'Climate Research',
          venue: 'Nature Climate Change',
        };
        expect(isExcludedDocumentType(paper)).toBe(false);
      });

      it('paper with no publicationType (default to include)', () => {
        const paper: Partial<Paper> = {
          title: 'Climate Paper Without Type',
          source: LiteratureSource.SEMANTIC_SCHOLAR,
        };
        expect(isExcludedDocumentType(paper)).toBe(false);
      });

      it('dissertation', () => {
        const paper: Partial<Paper> = {
          title: 'PhD Thesis on Climate',
          publicationType: ['dissertation'],
        };
        expect(isExcludedDocumentType(paper)).toBe(false);
      });

      it('peer-review', () => {
        const paper: Partial<Paper> = {
          title: 'Peer Review of Climate Study',
          publicationType: ['peer-review'],
        };
        expect(isExcludedDocumentType(paper)).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('handles case-insensitive matching', () => {
        const paper: Partial<Paper> = {
          title: 'Climate Book',
          publicationType: ['BOOK'],
        };
        expect(isExcludedDocumentType(paper)).toBe(true);
      });

      it('handles mixed-case URL patterns', () => {
        const paper: Partial<Paper> = {
          title: 'Climate Chapter',
          url: 'https://link.springer.com/BOOK/10.1007/978-3-031-19059-9',
        };
        expect(isExcludedDocumentType(paper)).toBe(true);
      });

      it('handles empty publicationType array', () => {
        const paper: Partial<Paper> = {
          title: 'Climate Paper',
          publicationType: [],
        };
        expect(isExcludedDocumentType(paper)).toBe(false);
      });

      it('handles undefined fields gracefully', () => {
        const paper: Partial<Paper> = {
          title: 'Climate Paper',
        };
        expect(isExcludedDocumentType(paper)).toBe(false);
      });

      it('handles real Springer book URL from user report', () => {
        // This is the actual URL the user reported
        const paper: Partial<Paper> = {
          title: 'Climate Change Handbook',
          url: 'https://link.springer.com/book/10.1007/978-3-031-19059-9',
          source: LiteratureSource.SPRINGER,
        };
        expect(isExcludedDocumentType(paper)).toBe(true);
      });
    });
  });
});
