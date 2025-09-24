/**
 * Literature Search Interface - DISCOVER Phase
 * World-class implementation for research discovery
 */

'use client';

import React, { useState, useCallback } from 'react';
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
  TrendingUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal: string;
  abstract: string;
  citations: number;
  doi: string;
  keywords: string[];
  relevanceScore?: number;
  qMethodology?: boolean;
}

interface SearchFilters {
  yearRange: [number, number];
  journals: string[];
  authors: string[];
  keywords: string[];
  citationMin: number;
  qMethodologyOnly: boolean;
}

export default function LiteratureSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    yearRange: [2010, 2024],
    journals: [],
    authors: [],
    keywords: [],
    citationMin: 0,
    qMethodologyOnly: false
  });

  // Mock search function - would connect to backend
  const performSearch = useCallback(async () => {
    setIsSearching(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock results
    const mockResults: Paper[] = [
      {
        id: '1',
        title: 'Q Methodology in Environmental Policy Research: A Systematic Review',
        authors: ['Smith, J.', 'Johnson, K.', 'Williams, R.'],
        year: 2023,
        journal: 'Journal of Environmental Psychology',
        abstract: 'This systematic review examines the application of Q methodology in environmental policy research over the past decade. We analyze 127 studies that employed Q methodology to understand stakeholder perspectives on environmental issues...',
        citations: 45,
        doi: '10.1016/j.envpsych.2023.01.001',
        keywords: ['Q methodology', 'environmental policy', 'stakeholder analysis', 'systematic review'],
        relevanceScore: 0.95,
        qMethodology: true
      },
      {
        id: '2',
        title: 'Digital Transformation in Q-Sort Studies: Web-Based Applications and Remote Data Collection',
        authors: ['Chen, L.', 'Davis, M.'],
        year: 2024,
        journal: 'Computers in Human Behavior',
        abstract: 'The COVID-19 pandemic accelerated the adoption of digital tools in Q methodology research. This paper presents a comprehensive framework for conducting Q-sort studies using web-based platforms...',
        citations: 12,
        doi: '10.1016/j.chb.2024.02.015',
        keywords: ['Q-sort', 'digital methods', 'web-based research', 'remote data collection'],
        relevanceScore: 0.88,
        qMethodology: true
      },
      {
        id: '3',
        title: 'Mixed Methods Research: Combining Q Methodology with Qualitative Interviews',
        authors: ['Brown, A.', 'Taylor, S.', 'Martinez, C.'],
        year: 2022,
        journal: 'Qualitative Research',
        abstract: 'This methodological paper explores the integration of Q methodology with in-depth qualitative interviews. We present three case studies demonstrating how this mixed-methods approach can provide richer insights...',
        citations: 78,
        doi: '10.1177/1468794122001234',
        keywords: ['mixed methods', 'Q methodology', 'qualitative research', 'triangulation'],
        relevanceScore: 0.82,
        qMethodology: true
      }
    ];
    
    setSearchResults(mockResults);
    setIsSearching(false);
  }, [searchQuery, filters]);

  const handlePaperSelect = (paperId: string) => {
    setSelectedPapers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paperId)) {
        newSet.delete(paperId);
      } else {
        newSet.add(paperId);
      }
      return newSet;
    });
  };

  const handleExportSelected = () => {
    // Export functionality
    console.log('Exporting', selectedPapers.size, 'papers');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Literature Discovery
          </h1>
          <p className="text-gray-600">
            AI-powered search across millions of academic papers
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 hover:border-purple-200 transition-colors">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for papers, authors, keywords..."
                    className="pl-10 pr-4 py-6 text-lg border-gray-200 focus:border-purple-400"
                    onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                  />
                  {aiMode && (
                    <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500 animate-pulse" />
                  )}
                </div>
                
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="px-6"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                
                <Button
                  onClick={() => setAiMode(!aiMode)}
                  variant={aiMode ? "default" : "outline"}
                  className={cn(
                    "px-6",
                    aiMode && "bg-gradient-to-r from-purple-600 to-blue-600"
                  )}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Mode
                </Button>
                
                <Button
                  onClick={performSearch}
                  disabled={isSearching}
                  className="px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isSearching ? (
                    <span className="animate-pulse">Searching...</span>
                  ) : (
                    <>
                      Search
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {/* Filters Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t"
                  >
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Year Range</label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="number"
                            value={filters.yearRange[0]}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              yearRange: [parseInt(e.target.value), prev.yearRange[1]]
                            }))}
                            className="w-24"
                          />
                          <span className="self-center">to</span>
                          <Input
                            type="number"
                            value={filters.yearRange[1]}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              yearRange: [prev.yearRange[0], parseInt(e.target.value)]
                            }))}
                            className="w-24"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Min Citations</label>
                        <Input
                          type="number"
                          value={filters.citationMin}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            citationMin: parseInt(e.target.value)
                          }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.qMethodologyOnly}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              qMethodologyOnly: e.target.checked
                            }))}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Q Methodology papers only
                          </span>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-4 gap-4"
          >
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Total Results</p>
                  <p className="text-2xl font-bold text-purple-900">{searchResults.length}</p>
                </div>
                <Database className="w-8 h-8 text-purple-400" />
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Q-Method Papers</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {searchResults.filter(p => p.qMethodology).length}
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-400" />
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Avg Citations</p>
                  <p className="text-2xl font-bold text-green-900">
                    {Math.round(searchResults.reduce((acc, p) => acc + p.citations, 0) / searchResults.length)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </CardContent>
            </Card>
            
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Selected</p>
                  <p className="text-2xl font-bold text-orange-900">{selectedPapers.size}</p>
                </div>
                <Star className="w-8 h-8 text-orange-400" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Search Results */}
        <div className="space-y-4">
          {searchResults.map((paper, index) => (
            <motion.div
              key={paper.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className={cn(
                  "hover:shadow-lg transition-all cursor-pointer",
                  selectedPapers.has(paper.id) && "ring-2 ring-purple-400 bg-purple-50/30"
                )}
                onClick={() => handlePaperSelect(paper.id)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-4">
                      {paper.title}
                    </h3>
                    {paper.relevanceScore && (
                      <Badge 
                        className={cn(
                          "ml-2",
                          paper.relevanceScore > 0.9 ? "bg-green-100 text-green-700" :
                          paper.relevanceScore > 0.7 ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        )}
                      >
                        {Math.round(paper.relevanceScore * 100)}% match
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {paper.authors.slice(0, 3).join(', ')}
                      {paper.authors.length > 3 && ` +${paper.authors.length - 3}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {paper.year}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {paper.journal}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {paper.citations} citations
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3 line-clamp-2">
                    {paper.abstract}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {paper.keywords.slice(0, 3).map(keyword => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {keyword}
                        </Badge>
                      ))}
                      {paper.qMethodology && (
                        <Badge className="bg-purple-100 text-purple-700 text-xs">
                          Q-Method
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://doi.org/${paper.doi}`, '_blank');
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Download functionality
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Export Actions */}
        {selectedPapers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Card className="shadow-xl border-2 border-purple-200">
              <CardContent className="p-4 flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedPapers.size} papers selected
                </span>
                <Button
                  onClick={handleExportSelected}
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  Export to Reference Manager
                  <Download className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}