/**
 * MethodologyModal Component
 * Phase 10.942 Day 4 - Methodology Documentation Modal
 *
 * Displays comprehensive search and quality scoring methodology with:
 * - v4.0 Quality Weights visualization (30/50/20)
 * - BM25 relevance algorithm explanation
 * - Optional bonuses breakdown
 * - PDF download functionality
 * - Scientific references
 *
 * @module MethodologyModal
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  X,
  Download,
  Award,
  TrendingUp,
  BookOpen,
  Target,
  Sparkles,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface MethodologyModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
}

// ============================================================================
// Constants - Phase 10.942 v4.0 Methodology
// ============================================================================

const QUALITY_WEIGHTS = {
  CITATION_IMPACT: { weight: 30, label: 'Citation Impact', description: 'Field-Weighted Citation Impact (FWCI)' },
  JOURNAL_PRESTIGE: { weight: 50, label: 'Journal Prestige', description: 'Impact Factor, h-index, Quartile' },
  RECENCY_BOOST: { weight: 20, label: 'Recency Boost', description: 'Exponential decay (half-life: 4.6 years)' },
} as const;

const OPTIONAL_BONUSES = {
  OPEN_ACCESS: { bonus: 10, label: 'Open Access', description: 'Freely available to all researchers' },
  REPRODUCIBILITY: { bonus: 5, label: 'Data/Code Shared', description: 'Reproducibility materials available' },
  ALTMETRIC: { bonus: 5, label: 'Altmetric Impact', description: 'Social/policy engagement metrics' },
} as const;

const SCIENTIFIC_REFERENCES = [
  {
    authors: 'Robertson, S.E. & Walker, S.',
    year: 1994,
    title: 'Some simple effective approximations to the 2-Poisson model for probabilistic weighted retrieval',
    journal: 'SIGIR',
    note: 'BM25 Algorithm',
  },
  {
    authors: 'Waltman, L. & van Eck, N.J.',
    year: 2019,
    title: 'Field normalization of scientometric indicators',
    journal: 'Springer Handbook of Science and Technology Indicators',
    note: 'FWCI',
  },
  {
    authors: 'Garfield, E.',
    year: 1980,
    title: 'Premature discovery or delayed recognition?',
    journal: 'Current Contents',
    note: 'Citation half-life theory',
  },
  {
    authors: 'Hirsch, J.E.',
    year: 2005,
    title: 'An index to quantify an individual\'s scientific research output',
    journal: 'PNAS',
    note: 'h-index',
  },
] as const;

// ============================================================================
// Component
// ============================================================================

export function MethodologyModal({ open, onClose }: MethodologyModalProps) {
  const [activeTab, setActiveTab] = useState<'quality' | 'relevance' | 'sources' | 'references'>('quality');

  // Handle PDF download
  const handleDownloadPDF = useCallback(() => {
    // For now, show toast and open GitHub/docs link
    // In production, this would link to a hosted PDF file at /docs/SEARCH_ENGINE_METHODOLOGY_DOCUMENTATION.pdf
    toast.info('Opening methodology documentation...', {
      description: 'Use your browser\'s print function (Ctrl+P) to save as PDF',
    });

    // Open the markdown file for now (would be PDF in production)
    window.open('https://github.com/blackqmethod/vqmethod/blob/main/SEARCH_ENGINE_METHODOLOGY_DOCUMENTATION.md', '_blank');
  }, []);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-purple-600" />
                Search Engine Methodology
              </DialogTitle>
              <DialogDescription className="mt-1">
                v4.0 Enterprise-Grade, Science-Backed Quality Scoring
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1.5" />
                Download PDF
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4 border-b border-gray-200 -mb-4">
            {[
              { id: 'quality', label: 'Quality Scoring', icon: Award },
              { id: 'relevance', label: 'Relevance Algorithm', icon: Target },
              { id: 'sources', label: 'Data Sources', icon: FileText },
              { id: 'references', label: 'Scientific References', icon: BookOpen },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === id
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quality Scoring Tab */}
          {activeTab === 'quality' && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Executive Summary</h3>
                <p className="text-sm text-gray-700">
                  Papers are scored 0-100 based on three core dimensions, with optional bonuses
                  for open science practices. This methodology ensures fair comparison across
                  disciplines using field-normalized metrics.
                </p>
              </div>

              {/* Core Quality Weights */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Core Quality Weights (100%)
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {Object.entries(QUALITY_WEIGHTS).map(([key, { weight, label, description }]) => (
                    <div
                      key={key}
                      className={`border rounded-lg p-4 text-center ${
                        key === 'CITATION_IMPACT'
                          ? 'bg-blue-50 border-blue-200'
                          : key === 'JOURNAL_PRESTIGE'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-orange-50 border-orange-200'
                      }`}
                    >
                      <div className={`text-3xl font-bold ${
                        key === 'CITATION_IMPACT'
                          ? 'text-blue-700'
                          : key === 'JOURNAL_PRESTIGE'
                          ? 'text-green-700'
                          : 'text-orange-700'
                      }`}>
                        {weight}%
                      </div>
                      <div className={`font-semibold mt-1 ${
                        key === 'CITATION_IMPACT'
                          ? 'text-blue-600'
                          : key === 'JOURNAL_PRESTIGE'
                          ? 'text-green-600'
                          : 'text-orange-600'
                      }`}>
                        {label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Bonuses */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                  Optional Bonuses (up to +20)
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {Object.entries(OPTIONAL_BONUSES).map(([key, { bonus, label, description }]) => (
                    <div
                      key={key}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-700">{label}</span>
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          +{bonus}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">{description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formula */}
              <div className="bg-gray-900 text-white rounded-lg p-4">
                <h3 className="font-semibold text-purple-300 mb-2">Final Score Formula</h3>
                <code className="text-sm text-green-400">
                  FinalScore = min(100, CoreScore + OpenAccessBonus + ReproducibilityBonus + AltmetricBonus)
                </code>
                <div className="mt-2 text-xs text-gray-400">
                  CoreScore = (CitationImpact × 0.30) + (JournalPrestige × 0.50) + (RecencyBoost × 0.20)
                </div>
              </div>
            </div>
          )}

          {/* Relevance Algorithm Tab */}
          {activeTab === 'relevance' && (
            <div className="space-y-6">
              {/* BM25 Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  BM25 Algorithm (Best Match 25)
                </h3>
                <p className="text-sm text-gray-700">
                  The gold standard for information retrieval, used by PubMed, Elasticsearch,
                  and major search engines. BM25 balances term frequency with document length
                  normalization for optimal relevance ranking.
                </p>
              </div>

              {/* BM25 Formula */}
              <div className="bg-gray-900 text-white rounded-lg p-4">
                <h3 className="font-semibold text-blue-300 mb-2">BM25 Formula</h3>
                <code className="text-sm text-green-400 block">
                  score(D,Q) = SUM[ IDF(qi) * (f(qi,D) * (k1+1)) / (f(qi,D) + k1 * (1 - b + b * |D|/avgdl)) ]
                </code>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-purple-400">k1 = 1.2</span>
                    <span className="text-gray-400 ml-2">Term frequency saturation</span>
                  </div>
                  <div>
                    <span className="text-purple-400">b = 0.75</span>
                    <span className="text-gray-400 ml-2">Document length normalization</span>
                  </div>
                </div>
              </div>

              {/* Position Weighting */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Position Weighting
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="font-semibold text-green-700">Title Matches</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">3x</div>
                    <div className="text-xs text-gray-500 mt-1">Higher weight for title matches</div>
                  </div>
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="font-semibold text-blue-700">Abstract Matches</div>
                    <div className="text-2xl font-bold text-blue-600 mt-1">1x</div>
                    <div className="text-xs text-gray-500 mt-1">Standard weight for abstract</div>
                  </div>
                </div>
              </div>

              {/* Relevance Tiers */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Relevance Score Tiers</h3>
                <div className="space-y-2">
                  {[
                    { tier: 'Highly Relevant', min: 90, textClass: 'text-emerald-700', bgClass: 'bg-emerald-500' },
                    { tier: 'Very Relevant', min: 70, textClass: 'text-green-700', bgClass: 'bg-green-500' },
                    { tier: 'Relevant', min: 50, textClass: 'text-blue-700', bgClass: 'bg-blue-500' },
                    { tier: 'Somewhat Relevant', min: 30, textClass: 'text-amber-700', bgClass: 'bg-amber-500' },
                    { tier: 'Low Relevance', min: 0, textClass: 'text-gray-700', bgClass: 'bg-gray-500' },
                  ].map(({ tier, min, textClass, bgClass }) => (
                    <div key={tier} className="flex items-center gap-3">
                      <div className={`w-32 text-sm font-medium ${textClass}`}>{tier}</div>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full">
                        <div
                          className={`h-2 ${bgClass} rounded-full`}
                          style={{ width: `${min}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 w-16">{min}+ score</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Data Sources Tab */}
          {activeTab === 'sources' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-900 mb-2">250M+ Papers from 9 Databases</h3>
                <p className="text-sm text-gray-700">
                  Real-time API access to major academic databases, ensuring comprehensive
                  coverage across all scientific disciplines.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'PubMed/MEDLINE', papers: '37M+', type: 'Biomedical', borderBg: 'border-blue-200 bg-blue-50', text: 'text-blue-600' },
                  { name: 'Semantic Scholar', papers: '200M+', type: 'All disciplines', borderBg: 'border-purple-200 bg-purple-50', text: 'text-purple-600' },
                  { name: 'arXiv', papers: '2.4M+', type: 'Physics, CS, Math', borderBg: 'border-red-200 bg-red-50', text: 'text-red-600' },
                  { name: 'Springer Open', papers: '20M+', type: 'Open Access', borderBg: 'border-green-200 bg-green-50', text: 'text-green-600' },
                  { name: 'CORE', papers: '250M+', type: 'Aggregated OA', borderBg: 'border-orange-200 bg-orange-50', text: 'text-orange-600' },
                  { name: 'CrossRef', papers: '150M+', type: 'DOI Metadata', borderBg: 'border-cyan-200 bg-cyan-50', text: 'text-cyan-600' },
                  { name: 'ERIC', papers: '1.6M+', type: 'Education', borderBg: 'border-yellow-200 bg-yellow-50', text: 'text-yellow-600' },
                  { name: 'Europe PMC', papers: '42M+', type: 'Life Sciences', borderBg: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-600' },
                  { name: 'OpenAlex', papers: '250M+', type: 'Citation Data', borderBg: 'border-pink-200 bg-pink-50', text: 'text-pink-600' },
                ].map(({ name, papers, type, borderBg, text }) => (
                  <div key={name} className={`border rounded-lg p-3 ${borderBg}`}>
                    <div className="font-semibold text-gray-900">{name}</div>
                    <div className={`text-lg font-bold ${text}`}>{papers}</div>
                    <div className="text-xs text-gray-500">{type}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scientific References Tab */}
          {activeTab === 'references' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-2">Peer-Reviewed Foundations</h3>
                <p className="text-sm text-gray-700">
                  Our methodology is built on established scientometric principles from
                  peer-reviewed research spanning 30+ years of information retrieval science.
                </p>
              </div>

              <div className="space-y-4">
                {SCIENTIFIC_REFERENCES.map((ref, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{ref.title}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {ref.authors} ({ref.year}). <em>{ref.journal}</em>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-4 bg-purple-50 text-purple-700 border-purple-300">
                        {ref.note}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional References Note */}
              <div className="text-sm text-gray-500 flex items-start gap-2 p-4 bg-gray-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  Full reference list with 30+ citations available in the downloadable PDF documentation.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t p-4 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Version 4.0 | Last updated: November 2024
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download Full PDF
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
