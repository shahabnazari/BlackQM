'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Info,
  TrendingUp,
  Search,
  Lightbulb,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
}

interface SuggestedTerm {
  term: string;
  confidence: number;
  category: 'methodology' | 'concept' | 'domain' | 'technique';
}

// ==================== MOCK API (Replace with real API calls) ====================

const mockExpandQuery = async (
  query: string,
  domain?: string
): Promise<ExpandedQuery> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  // Mock vague query detection
  const vagueness = ['climate', 'health', 'education', 'ai', 'machine learning'];
  const isTooVague = vagueness.some(v => query.toLowerCase().includes(v) && query.split(' ').length < 3);

  return {
    expanded: `${query} research methods impact analysis systematic review`,
    suggestions: [
      `${query} adaptation strategies in urban environments`,
      `${query} impacts on vulnerable populations: a meta-analysis`,
      `${query} mitigation policies and their effectiveness`,
    ],
    isTooVague,
    narrowingQuestions: isTooVague ? [
      `What specific aspect of ${query} are you researching?`,
      `Which geographic region or population?`,
      `What time period are you focusing on?`,
    ] : [],
    confidence: isTooVague ? 0.4 : 0.85,
    relatedTerms: [
      `${query} adaptation`,
      `${query} resilience`,
      `${query} vulnerability`,
      `${query} mitigation`,
      `${query} impacts`,
    ],
  };
};

const mockSuggestTerms = async (query: string): Promise<SuggestedTerm[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));

  return [
    { term: 'systematic review', confidence: 0.92, category: 'methodology' },
    { term: 'meta-analysis', confidence: 0.88, category: 'methodology' },
    { term: 'longitudinal study', confidence: 0.75, category: 'methodology' },
    { term: 'case study approach', confidence: 0.68, category: 'methodology' },
    { term: 'mixed methods research', confidence: 0.82, category: 'methodology' },
  ];
};

// ==================== UTILITIES ====================

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// ==================== MAIN COMPONENT ====================

export const AISearchAssistant: React.FC<AISearchAssistantProps> = ({
  initialQuery = '',
  onQueryChange,
  domain = 'general',
  className = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [expandedResult, setExpandedResult] = useState<ExpandedQuery | null>(null);
  const [suggestedTerms, setSuggestedTerms] = useState<SuggestedTerm[]>([]);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // ==================== HANDLERS ====================

  const expandQuery = async (queryText: string) => {
    if (!queryText.trim() || queryText.length < 3) {
      setExpandedResult(null);
      return;
    }

    setIsExpanding(true);
    setError(null);

    try {
      const result = await mockExpandQuery(queryText, domain);
      setExpandedResult(result);
    } catch (err) {
      setError('Failed to expand query. Please try again.');
      console.error(err);
    } finally {
      setIsExpanding(false);
    }
  };

  const fetchSuggestedTerms = async (queryText: string) => {
    if (!queryText.trim() || queryText.length < 3) {
      setSuggestedTerms([]);
      return;
    }

    setIsSuggesting(true);

    try {
      const terms = await mockSuggestTerms(queryText);
      setSuggestedTerms(terms);
    } catch (err) {
      console.error('Failed to fetch suggested terms:', err);
    } finally {
      setIsSuggesting(false);
    }
  };

  // Debounced expansion
  const debouncedExpand = useCallback(
    debounce((q: string) => {
      expandQuery(q);
      fetchSuggestedTerms(q);
    }, 800),
    [domain]
  );

  useEffect(() => {
    if (query !== initialQuery) {
      debouncedExpand(query);
    }
  }, [query]);

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

  // ==================== RENDER ====================

  return (
    <div className={`space-y-4 ${className}`}>
        {/* Main Search Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Search Assistant
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs font-normal">
                Demo Mode
              </Badge>
            </CardTitle>
            <CardDescription>
              Enter your research query. AI will suggest improvements and related terms.
              <span className="block text-xs text-amber-600 mt-1">
                ⚠️ Currently using demo responses. Real AI integration coming soon.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="e.g., climate change adaptation strategies..."
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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

        {/* Vagueness Warning */}
        {expandedResult?.isTooVague && (
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <div className="font-semibold mb-2">Your query might be too vague.</div>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                AI Suggestions
                <Tooltip
                  content="These suggestions are generated by AI to help you create more specific and effective research queries."
                  className="max-w-xs"
                >
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </Tooltip>
              </CardTitle>
              <CardDescription>
                Confidence: {Math.round(expandedResult.confidence * 100)}%
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
                  <h4 className="text-sm font-semibold mb-2">Alternative Angles:</h4>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                Research Methodology Terms
              </CardTitle>
              <CardDescription>
                Add these academic terms to refine your search
              </CardDescription>
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
                <p><strong>Query Expansion:</strong> AI analyzes your query and adds academic terminology and methodology keywords to improve search results.</p>
                <p><strong>Vagueness Detection:</strong> If your query is too broad (e.g., just "climate"), AI will suggest narrowing questions.</p>
                <p><strong>Suggested Terms:</strong> AI recommends research methodology terms based on your domain.</p>
                <p><strong>Confidence Score:</strong> Higher scores indicate the AI is more confident in its suggestions.</p>
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
