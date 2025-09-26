/**
 * Literature Search Interface - DISCOVER Phase
 * Phase 9 Day 0-1: Complete Literature Review System
 * World-class implementation integrated with backend API
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  Download,
  Star,
  Filter,
  Calendar,
  Users,
  Tag,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Database,
  TrendingUp,
  GitBranch,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { literatureAPI, Paper, Theme, ResearchGap } from '@/lib/services/literature-api.service';
import DatabaseSourcesInfo from '@/components/literature/DatabaseSourcesInfo';

export default function LiteratureSearchPage() {
  // Search state
  const [query, setQuery] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedView, setSelectedView] = useState<'list' | 'grid'>('list');
  
  // Advanced filters
  const [filters, setFilters] = useState({
    yearFrom: 2020,
    yearTo: new Date().getFullYear(),
    sources: ['semantic_scholar', 'crossref'],
    sortBy: 'relevance' as 'relevance' | 'date' | 'citations',
    citationMin: 0,
    includeAIMode: true,
  });
  
  // Analysis state
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [themes, setThemes] = useState<Theme[]>([]);
  const [gaps, setGaps] = useState<ResearchGap[]>([]);
  const [analyzingThemes, setAnalyzingThemes] = useState(false);
  const [analyzingGaps, setAnalyzingGaps] = useState(false);
  
  // Library state
  const [savedPapers, setSavedPapers] = useState<Paper[]>([]);
  const [activeTab, setActiveTab] = useState('search');

  // Load saved papers on mount
  useEffect(() => {
    loadUserLibrary();
  }, []);

  const loadUserLibrary = async () => {
    try {
      const { papers } = await literatureAPI.getUserLibrary();
      setSavedPapers(papers);
    } catch (error) {
      console.error('Failed to load library:', error);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const result = await literatureAPI.searchLiterature({
        query,
        sources: filters.sources,
        yearFrom: filters.yearFrom,
        yearTo: filters.yearTo,
        sortBy: filters.sortBy,
        page: currentPage,
        limit: 20,
        includeCitations: true,
      });

      setPapers(result.papers);
      setTotalResults(result.total);
      toast.success(`Found ${result.total} papers across ${filters.sources.length} databases`);
    } catch (error) {
      toast.error('Search failed. Please try again.');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query, filters, currentPage]);

  const handleSavePaper = async (paper: Paper) => {
    try {
      await literatureAPI.savePaper(paper);
      setSavedPapers([...savedPapers, paper]);
      toast.success('Paper saved to library');
    } catch (error) {
      toast.error('Failed to save paper');
    }
  };

  const handleRemovePaper = async (paperId: string) => {
    try {
      await literatureAPI.removePaper(paperId);
      setSavedPapers(savedPapers.filter(p => p.id !== paperId));
      toast.success('Paper removed from library');
    } catch (error) {
      toast.error('Failed to remove paper');
    }
  };

  const handleExtractThemes = async () => {
    if (selectedPapers.size === 0) {
      toast.error('Please select papers to analyze');
      return;
    }

    setAnalyzingThemes(true);
    try {
      const paperIds = Array.from(selectedPapers);
      const extractedThemes = await literatureAPI.extractThemes(paperIds, 5);
      setThemes(extractedThemes);
      setActiveTab('themes');
      toast.success(`Extracted ${extractedThemes.length} themes from ${paperIds.length} papers`);
    } catch (error) {
      toast.error('Theme extraction failed');
    } finally {
      setAnalyzingThemes(false);
    }
  };

  const handleAnalyzeGaps = async () => {
    if (!query) {
      toast.error('Please enter a research field');
      return;
    }

    setAnalyzingGaps(true);
    try {
      const researchGaps = await literatureAPI.analyzeGaps(query, {
        timeRange: 5,
        includeFunding: true,
        includeCollaborations: true,
      });
      setGaps(researchGaps);
      setActiveTab('gaps');
      toast.success(`Identified ${researchGaps.length} research opportunities`);
    } catch (error) {
      toast.error('Gap analysis failed');
    } finally {
      setAnalyzingGaps(false);
    }
  };

  const handleExportCitations = async (format: 'bibtex' | 'ris' | 'apa') => {
    if (selectedPapers.size === 0) {
      toast.error('Please select papers to export');
      return;
    }

    try {
      const paperIds = Array.from(selectedPapers);
      const { content, filename } = await literatureAPI.exportCitations(paperIds, format);
      
      // Create download link
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${paperIds.length} citations as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleGenerateStatements = async () => {
    if (themes.length === 0) {
      toast.error('Please extract themes first');
      return;
    }

    try {
      const themeNames = themes.map(t => t.name);
      const statements = await literatureAPI.generateStatementsFromThemes(
        themeNames,
        { topic: query }
      );
      toast.success(`Generated ${statements.length} Q-statements from themes`);
      // TODO: Navigate to statement builder with generated statements
    } catch (error) {
      toast.error('Statement generation failed');
    }
  };

  const togglePaperSelection = (paperId: string) => {
    const newSelected = new Set(selectedPapers);
    if (newSelected.has(paperId)) {
      newSelected.delete(paperId);
    } else {
      newSelected.add(paperId);
    }
    setSelectedPapers(newSelected);
  };

  const PaperCard = ({ paper }: { paper: Paper }) => {
    const isSelected = selectedPapers.has(paper.id);
    const isSaved = savedPapers.some(p => p.id === paper.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer",
          isSelected && "border-blue-500 bg-blue-50/50"
        )}
        onClick={() => togglePaperSelection(paper.id)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center mt-1",
                isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"
              )}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg leading-tight">
                  {paper.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {paper.authors?.slice(0, 3).join(', ')}
                  {paper.authors?.length > 3 && ` +${paper.authors.length - 3} more`}
                </p>
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {paper.year}
                  </span>
                  {paper.venue && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {paper.venue}
                    </span>
                  )}
                  {paper.citationCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      {paper.citationCount} citations
                    </span>
                  )}
                </div>
                {paper.abstract && (
                  <p className="mt-3 text-sm text-gray-700 line-clamp-3">
                    {paper.abstract}
                  </p>
                )}
                {paper.keywords && paper.keywords.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {paper.keywords.slice(0, 5).map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                  {paper.doi && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://doi.org/${paper.doi}`, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Paper
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={isSaved ? "secondary" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      isSaved ? handleRemovePaper(paper.id) : handleSavePaper(paper);
                    }}
                  >
                    <Star className={cn("w-3 h-3 mr-1", isSaved && "fill-current")} />
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Literature Discovery</h1>
          <p className="text-gray-600 mt-1">
            Search and analyze academic literature to build your research foundation
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="py-2 px-4">
            <Database className="w-4 h-4 mr-2" />
            {totalResults} papers found
          </Badge>
          <Badge variant="outline" className="py-2 px-4">
            <Check className="w-4 h-4 mr-2" />
            {selectedPapers.size} selected
          </Badge>
          <Badge variant="outline" className="py-2 px-4">
            <Star className="w-4 h-4 mr-2" />
            {savedPapers.length} saved
          </Badge>
        </div>
      </div>

      {/* Search Section */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Multi-Database Literature Search</span>
            <div className="flex gap-2">
              <Badge variant={filters.includeAIMode ? "default" : "secondary"}>
                <Sparkles className="w-3 h-3 mr-1" />
                AI Mode {filters.includeAIMode ? 'ON' : 'OFF'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Enter keywords, research questions, or topics..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 h-12 text-lg"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="h-12 px-6"
              size="lg"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
              {showFilters ? <X className="w-4 h-4 ml-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 pt-4 border-t"
              >
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">Year Range</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        value={filters.yearFrom}
                        onChange={(e) => setFilters({ ...filters, yearFrom: parseInt(e.target.value) })}
                        className="w-24"
                      />
                      <span className="self-center">to</span>
                      <Input
                        type="number"
                        value={filters.yearTo}
                        onChange={(e) => setFilters({ ...filters, yearTo: parseInt(e.target.value) })}
                        className="w-24"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Min Citations</label>
                    <Input
                      type="number"
                      value={filters.citationMin}
                      onChange={(e) => setFilters({ ...filters, citationMin: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="date">Date (Newest)</option>
                      <option value="citations">Citations</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Databases</label>
                    <div className="flex gap-2 mt-1">
                      <Badge 
                        variant={filters.sources.includes('semantic_scholar') ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const sources = filters.sources.includes('semantic_scholar')
                            ? filters.sources.filter(s => s !== 'semantic_scholar')
                            : [...filters.sources, 'semantic_scholar'];
                          setFilters({ ...filters, sources });
                        }}
                      >
                        Semantic Scholar
                      </Badge>
                      <Badge
                        variant={filters.sources.includes('crossref') ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const sources = filters.sources.includes('crossref')
                            ? filters.sources.filter(s => s !== 'crossref')
                            : [...filters.sources, 'crossref'];
                          setFilters({ ...filters, sources });
                        }}
                      >
                        CrossRef
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleExtractThemes}
              disabled={selectedPapers.size === 0 || analyzingThemes}
            >
              {analyzingThemes ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Extract Themes ({selectedPapers.size})
            </Button>
            <Button
              variant="outline"
              onClick={handleAnalyzeGaps}
              disabled={!query || analyzingGaps}
            >
              {analyzingGaps ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              Find Research Gaps
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportCitations('bibtex')}
              disabled={selectedPapers.size === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export BibTeX
            </Button>
            {themes.length > 0 && (
              <Button
                onClick={handleGenerateStatements}
                className="ml-auto"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Q-Statements from Themes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Database Sources Transparency */}
      <DatabaseSourcesInfo />

      {/* Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">
            Search Results
            {papers.length > 0 && <Badge className="ml-2" variant="secondary">{papers.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="library">
            My Library
            <Badge className="ml-2" variant="secondary">{savedPapers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="themes">
            Themes
            {themes.length > 0 && <Badge className="ml-2" variant="secondary">{themes.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="gaps">
            Research Gaps
            {gaps.length > 0 && <Badge className="ml-2" variant="secondary">{gaps.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : papers.length > 0 ? (
            <div className="space-y-4">
              {papers.map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No papers found. Try adjusting your search query or filters.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          {savedPapers.length > 0 ? (
            savedPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No saved papers yet. Star papers from search results to add them here.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="themes" className="space-y-4">
          {themes.length > 0 ? (
            themes.map((theme) => (
              <Card key={theme.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{theme.name}</h3>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {theme.keywords.map((keyword) => (
                          <Badge key={keyword} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-4 mt-4 text-sm text-gray-600">
                        <span>Relevance: {Math.round(theme.relevanceScore * 100)}%</span>
                        {theme.emergenceYear && (
                          <span>Emerged: {theme.emergenceYear}</span>
                        )}
                        {theme.trendDirection && (
                          <Badge
                            variant={theme.trendDirection === 'rising' ? 'default' : 'secondary'}
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {theme.trendDirection}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select papers and click "Extract Themes" to identify research themes.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          {gaps.length > 0 ? (
            gaps.map((gap) => (
              <Card key={gap.id} className="border-l-4 border-l-orange-500">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg">{gap.title}</h3>
                  <p className="text-gray-700 mt-2">{gap.description}</p>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Opportunity Score</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full"
                            style={{ width: `${gap.opportunityScore * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {Math.round(gap.opportunityScore * 100)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Impact</span>
                      <p className="text-sm mt-1">{gap.potentialImpact}</p>
                    </div>
                  </div>
                  {gap.suggestedMethods && gap.suggestedMethods.length > 0 && (
                    <div className="mt-4">
                      <span className="text-sm font-medium text-gray-500">Suggested Methods</span>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {gap.suggestedMethods.map((method) => (
                          <Badge key={method} variant="outline">
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {gap.fundingOpportunities && gap.fundingOpportunities.length > 0 && (
                    <div className="mt-4">
                      <span className="text-sm font-medium text-gray-500">Funding Opportunities</span>
                      <ul className="list-disc list-inside text-sm mt-2 text-gray-700">
                        {gap.fundingOpportunities.map((funding) => (
                          <li key={funding}>{funding}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Click "Find Research Gaps" to identify opportunities in your field.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalResults > 20 && activeTab === 'search' && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, Math.ceil(totalResults / 20)) }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= Math.ceil(totalResults / 20)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}