/**
 * CollapsibleMetadata Component
 * Phase 10.123 Phase 3: Netflix-Grade UI Simplification
 *
 * Progressive disclosure for extended metadata:
 * - MeSH terms
 * - Grants/funding
 * - Author affiliations
 * - Publication types
 *
 * FEATURES:
 * - Hidden by default, collapsed state
 * - Smooth expand/collapse animation (GPU-accelerated)
 * - Keyboard accessible
 * - Dark mode support
 * - Performance optimized with useMemo
 * - Memory leak prevention
 *
 * @module CollapsibleMetadata
 */

'use client';

import React, { useState, useMemo, useCallback, useId, memo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import type { Paper } from '@/lib/types/literature.types';
import { getExtendedMetadataSummary } from '@/lib/types/literature.types';
import {
  MAX_DISPLAYED_PUBLICATION_TYPES,
  MAX_DISPLAYED_MESH_TERMS,
  MAX_DISPLAYED_GRANTS,
  MAX_AFFILIATION_LENGTH,
  MAX_GRANT_AGENCY_LENGTH,
} from './constants';

// ============================================================================
// Types
// ============================================================================

interface CollapsibleMetadataProps {
  /** Paper object containing extended metadata */
  paper: Paper;
  /** Optional callback when expanded (for analytics) */
  onExpand?: (() => void) | undefined;
  /** Optional callback when collapsed (for analytics) */
  onCollapse?: (() => void) | undefined;
}

// No separate animation constants needed - using inline props for better type safety

// ============================================================================
// Component
// ============================================================================

function CollapsibleMetadataComponent({
  paper,
  onExpand,
  onCollapse,
}: CollapsibleMetadataProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = useId();

  // ============================================================================
  // Memoized Metadata Summary
  // ============================================================================
  const summary = useMemo(() => getExtendedMetadataSummary(paper), [paper]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => {
      const newValue = !prev;
      if (newValue) {
        onExpand?.();
      } else {
        onCollapse?.();
      }
      return newValue;
    });
  }, [onExpand, onCollapse]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  // ============================================================================
  // Don't render if no extended metadata
  // ============================================================================
  if (!summary.hasAnyMetadata) {
    return null;
  }

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 dark:focus:ring-offset-gray-900 rounded-sm"
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        {isExpanded ? (
          <ChevronDown
            className="w-4 h-4 transition-transform"
            aria-hidden="true"
          />
        ) : (
          <ChevronRight
            className="w-4 h-4 transition-transform"
            aria-hidden="true"
          />
        )}
        <span className="font-medium">
          {isExpanded ? 'Hide details' : 'More details'}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          ({summary.summaryText})
        </span>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={contentId}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
            style={{ willChange: 'height, opacity' }}
          >
            <div className="mt-3 space-y-2">
              {/* Publication Types */}
              {paper.publicationType &&
                paper.publicationType.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0 mt-0.5 min-w-[70px]">
                      Type:
                    </span>
                    <div className="flex gap-1 flex-wrap">
                      {paper.publicationType
                        .slice(0, MAX_DISPLAYED_PUBLICATION_TYPES)
                        .map((type, idx) => (
                          <Badge
                            key={`pub-type-${idx}`}
                            variant="outline"
                            className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                          >
                            {type}
                          </Badge>
                        ))}
                      {paper.publicationType.length >
                        MAX_DISPLAYED_PUBLICATION_TYPES && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 self-center">
                          +
                          {paper.publicationType.length -
                            MAX_DISPLAYED_PUBLICATION_TYPES}{' '}
                          more
                        </span>
                      )}
                    </div>
                  </div>
                )}

              {/* MeSH Terms */}
              {paper.meshTerms && paper.meshTerms.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0 mt-0.5 min-w-[70px]">
                    MeSH:
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {paper.meshTerms
                      .slice(0, MAX_DISPLAYED_MESH_TERMS)
                      .map((term, idx) => (
                        <Badge
                          key={`mesh-${idx}`}
                          variant="outline"
                          className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                          title={`MeSH: ${term.descriptor}${
                            term.qualifiers.length > 0
                              ? ' [' + term.qualifiers.join(', ') + ']'
                              : ''
                          }`}
                        >
                          {term.descriptor}
                        </Badge>
                      ))}
                    {paper.meshTerms.length > MAX_DISPLAYED_MESH_TERMS && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 self-center">
                        +{paper.meshTerms.length - MAX_DISPLAYED_MESH_TERMS}{' '}
                        more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Author Affiliations */}
              {paper.authorAffiliations &&
                paper.authorAffiliations.length > 0 &&
                paper.authorAffiliations[0] && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0 mt-0.5 min-w-[70px]">
                      Institution:
                    </span>
                    <span
                      className="text-xs text-gray-600 dark:text-gray-300"
                      title={`${paper.authorAffiliations[0].author}: ${paper.authorAffiliations[0].affiliation}`}
                    >
                      {paper.authorAffiliations[0].affiliation.substring(
                        0,
                        MAX_AFFILIATION_LENGTH
                      )}
                      {paper.authorAffiliations[0].affiliation.length >
                      MAX_AFFILIATION_LENGTH
                        ? '...'
                        : ''}
                      {paper.authorAffiliations.length > 1 && (
                        <span className="text-gray-400 dark:text-gray-500 ml-1">
                          (+{paper.authorAffiliations.length - 1} more)
                        </span>
                      )}
                    </span>
                  </div>
                )}

              {/* Grants/Funding */}
              {paper.grants && paper.grants.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0 mt-0.5 min-w-[70px]">
                    Funding:
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {paper.grants.slice(0, MAX_DISPLAYED_GRANTS).map((grant, idx) => (
                      <Badge
                        key={`grant-${idx}`}
                        variant="outline"
                        className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
                        title={`${grant.agency ?? 'Unknown agency'}${
                          grant.grantId ? ' - ' + grant.grantId : ''
                        }`}
                      >
                        {grant.agency?.substring(0, MAX_GRANT_AGENCY_LENGTH) ??
                          'Grant'}
                        {grant.agency &&
                        grant.agency.length > MAX_GRANT_AGENCY_LENGTH
                          ? '...'
                          : ''}
                      </Badge>
                    ))}
                    {paper.grants.length > MAX_DISPLAYED_GRANTS && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 self-center">
                        +{paper.grants.length - MAX_DISPLAYED_GRANTS} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Memoized Export
// ============================================================================

export const CollapsibleMetadata = memo(
  CollapsibleMetadataComponent,
  (prev, next) => {
    // Only re-render if paper extended metadata changed
    return (
      prev.paper.id === next.paper.id &&
      prev.paper.meshTerms === next.paper.meshTerms &&
      prev.paper.grants === next.paper.grants &&
      prev.paper.authorAffiliations === next.paper.authorAffiliations &&
      prev.paper.publicationType === next.paper.publicationType
    );
  }
);

CollapsibleMetadata.displayName = 'CollapsibleMetadata';
