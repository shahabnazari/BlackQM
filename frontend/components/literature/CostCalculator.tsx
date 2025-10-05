/**
 * Academic Resource Cost Calculator - COMPACT VERSION
 * Phase 9 Day 25.1: Space-efficient cost transparency
 *
 * Displays inline cost summary with detailed breakdown on demand
 */

'use client';

import React, { useMemo, useState } from 'react';
import { DollarSign, TrendingDown, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Paper } from '@/lib/services/literature-api.service';

// Enterprise-grade type definitions
interface DatabaseCosts {
  [key: string]: number;
}

interface CostBreakdown {
  database: string;
  count: number;
  costPerArticle: number;
  totalCost: number;
}

interface CostCalculatorProps {
  selectedPapers: Set<string>;
  papers: Paper[];
  institutionAccessActive: boolean;
  onLoginClick?: () => void;
}

// Industry-standard article access costs (2025 estimates)
const ARTICLE_COSTS: DatabaseCosts = {
  pubmed: 30,
  'pubmed central': 0,
  semantic_scholar: 0, // Free access
  crossref: 35,
  arxiv: 0,
  ieee: 33,
  biorxiv: 0,
  pmc: 0,
  jstor: 40,
  springer: 39.95,
  elsevier: 31.50,
  wiley: 30,
  nature: 32,
  web_of_science: 35,
  scopus: 35,
  psycinfo: 40,
  eric: 0,
};

export function CostCalculator({
  selectedPapers,
  papers,
  institutionAccessActive,
  onLoginClick,
}: CostCalculatorProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Calculate cost breakdown by database
  const costBreakdown = useMemo<CostBreakdown[]>(() => {
    const breakdown = new Map<string, CostBreakdown>();

    papers.forEach(paper => {
      if (!selectedPapers.has(paper.id)) return;

      // Determine database source
      const source = paper.source?.toLowerCase() || 'unknown';
      const database = source.includes('pmc') || source.includes('pubmed central')
        ? 'pmc'
        : source.includes('pubmed')
        ? 'pubmed'
        : source.includes('arxiv')
        ? 'arxiv'
        : source.includes('ieee')
        ? 'ieee'
        : source.includes('biorxiv')
        ? 'biorxiv'
        : source.includes('semantic')
        ? 'semantic_scholar'
        : source.includes('jstor')
        ? 'jstor'
        : source.includes('springer')
        ? 'springer'
        : source.includes('elsevier') || source.includes('sciencedirect')
        ? 'elsevier'
        : source.includes('wiley')
        ? 'wiley'
        : source.includes('nature')
        ? 'nature'
        : source.includes('web of science')
        ? 'web_of_science'
        : source.includes('scopus')
        ? 'scopus'
        : 'crossref';

      const costPerArticle = ARTICLE_COSTS[database] || 30; // Default $30

      if (breakdown.has(database)) {
        const existing = breakdown.get(database)!;
        existing.count += 1;
        existing.totalCost += costPerArticle;
      } else {
        breakdown.set(database, {
          database,
          count: 1,
          costPerArticle,
          totalCost: costPerArticle,
        });
      }
    });

    return Array.from(breakdown.values()).sort((a, b) => b.totalCost - a.totalCost);
  }, [selectedPapers, papers]);

  // Calculate totals
  const totalCost = useMemo(() => {
    return costBreakdown.reduce((sum, item) => sum + item.totalCost, 0);
  }, [costBreakdown]);

  const freeArticles = useMemo(() => {
    return costBreakdown
      .filter(item => item.costPerArticle === 0)
      .reduce((sum, item) => sum + item.count, 0);
  }, [costBreakdown]);

  const paidArticles = useMemo(() => {
    return costBreakdown
      .filter(item => item.costPerArticle > 0)
      .reduce((sum, item) => sum + item.count, 0);
  }, [costBreakdown]);

  // Don't show if no papers selected
  if (selectedPapers.size === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Compact cost summary */}
      <div className={
        institutionAccessActive
          ? 'flex items-center justify-between gap-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg'
          : 'flex items-center justify-between gap-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg'
      }>
        <div className="flex items-center gap-3">
          <DollarSign className={
            institutionAccessActive ? 'w-4 h-4 text-green-600' : 'w-4 h-4 text-orange-600'
          } />

          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedPapers.size} paper{selectedPapers.size !== 1 ? 's' : ''}:
            </span>
            {institutionAccessActive ? (
              <Badge className="bg-green-600 text-white text-xs">FREE</Badge>
            ) : (
              <>
                <span className="text-base font-bold text-orange-600 dark:text-orange-400">
                  ${totalCost.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">
                  ({paidArticles} paid, {freeArticles} free)
                </span>
              </>
            )}
          </div>

          {!institutionAccessActive && totalCost > 0 && (
            <div className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-green-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Save with institution
              </span>
            </div>
          )}
        </div>

        {/* Expand/Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="h-6 px-2 text-xs"
        >
          {showBreakdown ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              Hide
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              Details
            </>
          )}
        </Button>
      </div>

      {/* Detailed breakdown (collapsible) */}
      {showBreakdown && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2">
          {/* Cost breakdown */}
          {costBreakdown.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Cost by Database:
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {costBreakdown.map(item => (
                  <div
                    key={item.database}
                    className="flex items-center justify-between py-1 px-2 bg-white dark:bg-gray-900 rounded text-xs"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {item.database.toUpperCase()}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        {item.count}× ${item.costPerArticle.toFixed(2)}
                      </span>
                    </div>
                    <span className={
                      item.costPerArticle === 0
                        ? 'font-semibold text-green-600 dark:text-green-400'
                        : 'font-semibold text-gray-900 dark:text-gray-100'
                    }>
                      {item.costPerArticle === 0 ? 'FREE' : `$${item.totalCost.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Login CTA */}
          {!institutionAccessActive && totalCost > 0 && onLoginClick && (
            <Button
              onClick={onLoginClick}
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-7"
            >
              Login with Institution → Get Free Access
            </Button>
          )}

          {/* Note */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Institutional access provides unlimited free access to premium databases
          </p>
        </div>
      )}
    </div>
  );
}
