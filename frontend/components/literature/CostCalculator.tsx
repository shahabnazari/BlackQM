/**
 * Academic Resource Cost Calculator
 * Phase 9 Day 25: Enterprise-grade cost transparency
 *
 * Calculates and displays:
 * - Per-article costs by database
 * - Total estimated cost without institutional access
 * - Comparison: with vs without institution
 * - Cost breakdown by source
 */

'use client';

import React, { useMemo } from 'react';
import { DollarSign, TrendingDown, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  pubmed: 30, // Average $30 per article via publishers
  'pubmed central': 0, // Free full-text
  semantic_scholar: 25, // Average across sources
  crossref: 35, // DOI resolution to paid sources
  arxiv: 0, // Free preprints
  ieee: 33, // IEEE Xplore individual article
  biorxiv: 0, // Free biology preprints
  pmc: 0, // PubMed Central - free
  jstor: 40, // Premium humanities/social sciences
  springer: 39.95, // Springer Nature standard
  elsevier: 31.50, // Elsevier ScienceDirect
  wiley: 30, // Wiley Online Library
};

export function CostCalculator({
  selectedPapers,
  papers,
  institutionAccessActive,
  onLoginClick,
}: CostCalculatorProps) {
  // Calculate cost breakdown by database
  const costBreakdown = useMemo<CostBreakdown[]>(() => {
    const breakdown = new Map<string, CostBreakdown>();

    papers.forEach(paper => {
      if (!selectedPapers.has(paper.id)) return;

      // Determine database source (simplified - would be more robust in production)
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

  // Calculate total costs
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
    <Card className={
      institutionAccessActive
        ? 'border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20'
        : 'border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20'
    }>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <DollarSign className={
              institutionAccessActive
                ? 'w-5 h-5 text-green-600'
                : 'w-5 h-5 text-orange-600'
            } />
            Cost Transparency
          </span>
          {institutionAccessActive ? (
            <Badge className="bg-green-600 text-white">
              Free Access Active
            </Badge>
          ) : (
            <Badge className="bg-orange-600 text-white">
              Estimated Cost
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cost comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Without institution */}
          <div className={
            institutionAccessActive
              ? 'opacity-60'
              : 'p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-orange-300'
          }>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Without Institution
            </p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              ${totalCost.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {paidArticles} paid articles
            </p>
          </div>

          {/* With institution */}
          <div className={
            institutionAccessActive
              ? 'p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-green-300'
              : 'opacity-60'
          }>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              With Institution
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              $0.00
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Free access
            </p>
          </div>
        </div>

        {/* Savings indicator */}
        {!institutionAccessActive && totalCost > 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <TrendingDown className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                Save ${totalCost.toFixed(2)} with institutional access
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                Login with your university to get free access
              </p>
            </div>
          </div>
        )}

        {/* Cost breakdown */}
        {costBreakdown.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Cost Breakdown ({selectedPapers.size} articles selected)
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {costBreakdown.map(item => (
                <div
                  key={item.database}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.database.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.count} article{item.count > 1 ? 's' : ''} × ${item.costPerArticle.toFixed(2)}
                    </p>
                  </div>
                  <p className={
                    item.costPerArticle === 0
                      ? 'text-sm font-semibold text-green-600 dark:text-green-400'
                      : 'text-sm font-semibold text-gray-900 dark:text-gray-100'
                  }>
                    {item.costPerArticle === 0 ? 'FREE' : `$${item.totalCost.toFixed(2)}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Free articles summary */}
        {freeArticles > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <AlertCircle className="w-4 h-4" />
            <span>
              {freeArticles} article{freeArticles > 1 ? 's are' : ' is'} free (ArXiv, bioRxiv, PMC)
            </span>
          </div>
        )}

        {/* Login CTA */}
        {!institutionAccessActive && totalCost > 0 && onLoginClick && (
          <Button
            onClick={onLoginClick}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Login with Institution to Get Free Access
          </Button>
        )}

        {/* Help text */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <p>
            <strong>Note:</strong> Costs shown are estimates for individual article purchases.
          </p>
          <p>
            Institutional access provides unlimited free access to all premium databases.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
