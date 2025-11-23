'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip } from '@/components/ui/tooltip';
import * as QueryExpansionAPI from '@/lib/api/services/query-expansion-api.service';
import { logger } from '@/lib/utils/logger';
import {
  AlertCircle,
  ArrowRight,
  Filter,
  Info,
  Lightbulb,
  Loader2,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// ==================== TYPES ====================

interface AISearchAssistantProps {
  initialQuery?: string;
  onQueryChange: (query: string) => void;
  domain?: 'climate' | 'health' | 'education' | 'general'; // Future use for domain-specific expansion
  className?: string;
}

interface ExpandedQuery {
  expanded: string;
  suggestions: string[];
  isTooVague: boolean;
  narrowingQuestions: string[];
  confidence: number;
  relatedTerms: string[];
  correctedQuery?: string; // Spell-corrected version if errors found
  hadSpellingErrors?: boolean; // True if corrections were made
}

interface SuggestedTerm {
  term: string;
  confidence: number;
  category: 'methodology' | 'concept' | 'domain' | 'technique';
}

// ==================== REAL AI API INTEGRATION (Day 26) ====================
// Mock functions removed - now using real OpenAI/Claude backend

// ==================== MAIN COMPONENT ====================

export const AISearchAssistant: React.FC<AISearchAssistantProps> = ({
  initialQuery = '',
  onQueryChange,
  domain = 'general',
  className = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [expandedResult, setExpandedResult] = useState<ExpandedQuery | null>(
    null
  );
  const [suggestedTerms, setSuggestedTerms] = useState<SuggestedTerm[]>([]);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Refs for debounce timeout and click outside detection
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const termsRef = useRef<HTMLDivElement>(null);

  // ==================== HANDLERS ====================

  const expandQuery = useCallback(
    async (queryText: string) => {
      if (!queryText.trim() || queryText.length < 3) {
        setExpandedResult(null);
        return;
      }

      setIsExpanding(true);
      setError(null);

      try {
        const result = await QueryExpansionAPI.expandQuery(queryText, domain);
        setExpandedResult(result);
      } catch (err) {
        setError('Failed to expand query. Please try again.');
        logger.error('AI search error', 'AISearchAssistant', { error: err });
      } finally {
        setIsExpanding(false);
      }
    },
    [domain]
  );

  const fetchSuggestedTerms = useCallback(
    async (queryText: string) => {
      if (!queryText.trim() || queryText.length < 3) {
        setSuggestedTerms([]);
        return;
      }

      setIsSuggesting(true);

      try {
        const terms = await QueryExpansionAPI.suggestTerms(queryText, domain);
        setSuggestedTerms(terms);
      } catch (err) {
        logger.error('Failed to fetch suggested terms', 'AISearchAssistant', { error: err });
      } finally {
        setIsSuggesting(false);
      }
    },
    [domain]
  );

  // Debounced expansion with useEffect
  useEffect(() => {
    // Clear previous timeout
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Only run if query has changed and is different from initial
    if (query && query.trim().length >= 3 && query !== initialQuery) {
      debounceTimer.current = setTimeout(() => {
        expandQuery(query);
        fetchSuggestedTerms(query);
      }, 800);
    } else if (!query || query.trim().length < 3) {
      setExpandedResult(null);
      setSuggestedTerms([]);
    }

    // Cleanup on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, initialQuery, expandQuery, fetchSuggestedTerms]);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
  };

  const applySuggestion = (suggestion: string) => {
    setQuery(suggestion);
    onQueryChange(suggestion);
  };

  const addTerm = (term: string) => {
    const newQuery = `${query} ${term}`.trim();
    setQuery(newQuery);
    onQueryChange(newQuery);
  };

  const handleSearch = () => {
    onQueryChange(query);
  };

  const dismissSuggestions = useCallback(() => {
    setExpandedResult(null);
  }, []);

  const dismissTerms = useCallback(() => {
    setSuggestedTerms([]);
  }, []);

  // ESC key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismissSuggestions();
        dismissTerms();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [dismissSuggestions, dismissTerms]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        // Don't dismiss if clicking on input or search button
        const target = event.target as HTMLElement;
        if (!target.closest('input') && !target.closest('button')) {
          // Delay dismissal to allow button clicks to work
          setTimeout(() => {
            if (expandedResult) {
              dismissSuggestions();
            }
          }, 100);
        }
      }
      if (
        termsRef.current &&
        !termsRef.current.contains(event.target as Node)
      ) {
        const target = event.target as HTMLElement;
        if (!target.closest('input') && !target.closest('button')) {
          setTimeout(() => {
            if (suggestedTerms.length > 0) {
              dismissTerms();
            }
          }, 100);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedResult, suggestedTerms.length, dismissSuggestions, dismissTerms]);

  // ==================== RENDER ====================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Search Assistant
            <Badge
              variant="outline"
              className="bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-purple-300 text-xs font-semibold"
            >
              🤖 Real OpenAI GPT-4
            </Badge>
          </CardTitle>
          <CardDescription className="flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
            <span>
              <strong>How it works:</strong> Your query is analyzed by OpenAI's
              GPT-4 (real AI, not scripted). It corrects spelling, expands
              terms, and suggests research angles based on academic literature
              patterns. Results appear automatically as you type.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="e.g., climate change adaptation strategies..."
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pr-10"
              />
              {isExpanding && (
                <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-gray-400" />
              )}
            </div>
            <Button
              onClick={handleSearch}
              disabled={!query.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Spelling Correction Notice */}
      {expandedResult?.hadSpellingErrors && expandedResult?.correctedQuery && (
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="font-semibold mb-1 flex items-center gap-2">
                  <span>✓ AI corrected spelling errors</span>
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-700 border-blue-300 text-xs"
                  >
                    OpenAI GPT-4
                  </Badge>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 line-through">{query}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="font-medium text-blue-700">
                      {expandedResult.correctedQuery}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (expandedResult.correctedQuery) {
                      setQuery(expandedResult.correctedQuery);
                      onQueryChange(expandedResult.correctedQuery);
                    }
                  }}
                  className="mt-2 h-8 text-xs bg-blue-600 text-white hover:bg-blue-700"
                >
                  Use corrected query
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Vagueness Warning */}
      {expandedResult?.isTooVague && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <div className="font-semibold mb-2">
              Your query might be too vague.
            </div>
            <div className="space-y-1 text-sm">
              {expandedResult.narrowingQuestions.map((question, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{question}</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Query Expansion Suggestions */}
      {expandedResult && !isExpanding && (
        <Card ref={suggestionsRef}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <CardTitle className="text-lg">AI Suggestions</CardTitle>
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-300 text-xs"
                >
                  GPT-4 Analysis
                </Badge>
                <Tooltip
                  content="These suggestions are generated by OpenAI's GPT-4 (real AI, not scripted). It analyzes your query and suggests improvements based on academic literature patterns. Press ESC or click X to dismiss."
                  className="max-w-xs"
                >
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </Tooltip>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissSuggestions}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close suggestions"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>
              AI Confidence: {Math.round(expandedResult.confidence * 100)}% •
              Powered by OpenAI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Expanded Query */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Expanded Query:</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applySuggestion(expandedResult.expanded)}
                >
                  Use This
                </Button>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm">{expandedResult.expanded}</p>
              </div>
            </div>

            {/* Alternative Suggestions */}
            {expandedResult.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Alternative Angles:
                </h4>
                <div className="space-y-2">
                  {expandedResult.suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      <Badge variant="outline" className="mt-0.5 flex-shrink-0">
                        {idx + 1}
                      </Badge>
                      <p className="text-sm flex-1">{suggestion}</p>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Terms */}
            {expandedResult.relatedTerms.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Related Terms:</h4>
                <div className="flex flex-wrap gap-2">
                  {expandedResult.relatedTerms.map((term, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900"
                      onClick={() => addTerm(term)}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Methodology Suggestions */}
      {suggestedTerms.length > 0 && !isSuggesting && (
        <Card ref={termsRef}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  Research Methodology Terms
                </CardTitle>
                <CardDescription>
                  Add these academic terms to refine your search. Press ESC or
                  click X to dismiss.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissTerms}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close methodology terms"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestedTerms.map((term, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => addTerm(term.term)}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {term.category}
                    </Badge>
                    <span className="text-sm font-medium">{term.term}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {Math.round(term.confidence * 100)}%
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              How does AI Search Assistant work?
            </span>
            <span>{showHelp ? '−' : '+'}</span>
          </Button>

          {showHelp && (
            <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>
                <strong>Query Expansion:</strong> AI analyzes your query and
                adds academic terminology and methodology keywords to improve
                search results.
              </p>
              <p>
                <strong>Vagueness Detection:</strong> If your query is too broad
                (e.g., just "climate"), AI will suggest narrowing questions.
              </p>
              <p>
                <strong>Suggested Terms:</strong> AI recommends research
                methodology terms based on your domain.
              </p>
              <p>
                <strong>Confidence Score:</strong> Higher scores indicate the AI
                is more confident in its suggestions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Examples */}
      {!query && (
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-lg">Example Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                'climate change adaptation strategies in coastal cities',
                'mental health interventions for adolescents: systematic review',
                'machine learning applications in drug discovery',
              ].map((example, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2 hover:bg-white/50 dark:hover:bg-black/20"
                  onClick={() => {
                    setQuery(example);
                    onQueryChange(example);
                  }}
                >
                  <Search className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm">{example}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
