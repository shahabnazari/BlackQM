/**
 * Reference Manager - DISCOVER Phase
 * World-class implementation for citation management
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  // Library, // Unused
  Upload,
  Download,
  Search,
  // Filter, // Unused
  Tags,
  Folder,
  Star,
  // Trash2, // Unused
  // Edit3, // Unused
  // Copy, // Unused
  ExternalLink,
  FileText,
  BookOpen,
  Users,
  Calendar,
  Quote,
  // Hash, // Unused
  MoreVertical,
  FolderPlus,
  // Share2, // Unused
  Cloud,
  CheckCircle,
  // AlertCircle, // Unused
  RefreshCw,
  Grid,
  List,
  Archive,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Unused
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// import { Textarea } from '@/components/ui/textarea'; // Unused
import { cn } from '@/lib/utils';

interface Reference {
  id: string;
  type: 'article' | 'book' | 'conference' | 'thesis' | 'website' | 'report';
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  keywords: string[];
  notes?: string;
  collections: string[];
  tags: string[];
  starred: boolean;
  citationKey: string;
  addedDate: Date;
  modifiedDate: Date;
  readStatus: 'unread' | 'reading' | 'read';
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  referenceCount: number;
  createdDate: Date;
  isShared: boolean;
  collaborators?: string[];
}

const CITATION_STYLES = {
  apa: 'APA 7th Edition',
  mla: 'MLA 9th Edition',
  chicago: 'Chicago 17th Edition',
  harvard: 'Harvard',
  vancouver: 'Vancouver',
  ieee: 'IEEE',
};

export default function ReferenceManagerPage() {
  const [references, setReferences] = useState<Reference[]>([]);
  const [collections, setCollections] = useState<Collection[]>([
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
  ]);

  const [selectedReferences, setSelectedReferences] = useState<Set<string>>(
    new Set()
  );
  const [currentCollection, setCurrentCollection] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'author' | 'year'>(
    'date'
  );
  const [citationStyle] = useState<keyof typeof CITATION_STYLES>('apa');
  // const [showAddReference, setShowAddReference] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    'idle' | 'syncing' | 'success' | 'error'
  >('idle');

  // Mock data - would be loaded from backend
  useEffect(() => {
    const mockReferences: Reference[] = [
      {
        id: '1',
        type: 'article',
        title: 'Q Methodology: A Method for Modern Research in Psychology',
        authors: ['Brown, S. R.', 'Johnson, M. K.'],
        year: 2023,
        journal: 'Psychological Methods',
        volume: '28',
        issue: '3',
        pages: '456-472',
        doi: '10.1037/met0000456',
        abstract:
          'This paper provides a comprehensive overview of Q methodology and its applications in modern psychological research...',
        keywords: [
          'Q methodology',
          'psychology',
          'research methods',
          'subjectivity',
        ],
        collections: ['default', 'q-methodology'],
        tags: ['methodology', 'core-reading'],
        starred: true,
        citationKey: 'brown2023q',
        addedDate: new Date('2024-01-15'),
        modifiedDate: new Date('2024-01-15'),
        readStatus: 'read',
        attachments: [
          {
            name: 'Brown_2023_Q_Methodology.pdf',
            type: 'application/pdf',
            size: 2456789,
            url: '/papers/brown2023.pdf',
          },
        ],
      },
      {
        id: '2',
        type: 'book',
        title:
          'Political Subjectivity: Applications of Q Methodology in Political Science',
        authors: ['Stephenson, W.'],
        year: 2014,
        keywords: ['Q methodology', 'political science', 'subjectivity'],
        collections: ['default', 'q-methodology'],
        tags: ['foundational', 'theory'],
        starred: true,
        citationKey: 'stephenson2014political',
        addedDate: new Date('2024-01-10'),
        modifiedDate: new Date('2024-01-10'),
        readStatus: 'reading',
      },
      {
        id: '3',
        type: 'article',
        title:
          'Digital Q-Sorts: Web-Based Data Collection for Q Methodology Studies',
        authors: ['Davis, L.', 'Chen, K.', 'Williams, R.'],
        year: 2024,
        journal: 'Computers in Human Behavior',
        volume: '150',
        pages: '107-119',
        doi: '10.1016/j.chb.2024.01.015',
        abstract:
          'The transition to digital platforms has transformed Q methodology data collection. This study examines...',
        keywords: ['Q-sort', 'digital methods', 'web-based', 'data collection'],
        collections: ['default'],
        tags: ['digital', 'methods'],
        starred: false,
        citationKey: 'davis2024digital',
        addedDate: new Date('2024-02-01'),
        modifiedDate: new Date('2024-02-01'),
        readStatus: 'unread',
      },
    ];

    setReferences(mockReferences);
    updateCollectionCounts(mockReferences);
  }, []);

  // Update collection counts
  const updateCollectionCounts = (refs: Reference[]) => {
    setCollections(prev =>
      prev.map(collection => ({
        ...collection,
        referenceCount: refs.filter(ref =>
          ref.collections.includes(collection.id)
        ).length,
      }))
    );
  };

  // Filter and sort references
  const filteredReferences = useMemo(() => {
    let filtered = references.filter(ref =>
      ref.collections.includes(currentCollection)
    );

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        ref =>
          ref.title.toLowerCase().includes(query) ||
          ref.authors.some(author => author.toLowerCase().includes(query)) ||
          ref.keywords.some(keyword => keyword.toLowerCase().includes(query)) ||
          ref.abstract?.toLowerCase().includes(query)
      );
    }

    // Apply tag filters
    if (filterTags.length > 0) {
      filtered = filtered.filter(ref =>
        filterTags.every(tag => ref.tags.includes(tag))
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
          return b.addedDate.getTime() - a.addedDate.getTime();
      }
    });

    return filtered;
  }, [references, currentCollection, searchQuery, filterTags, sortBy]);

  // Generate citation
  const generateCitation = (
    ref: Reference,
    style: keyof typeof CITATION_STYLES
  ): string => {
    switch (style) {
      case 'apa':
        const authorList = ref.authors.join(', ');
        if (ref.type === 'article') {
          return `${authorList} (${ref.year}). ${ref.title}. ${ref.journal}, ${ref.volume}${ref.issue ? `(${ref.issue})` : ''}, ${ref.pages}. ${ref.doi ? `https://doi.org/${ref.doi}` : ''}`;
        } else if (ref.type === 'book') {
          return `${authorList} (${ref.year}). ${ref.title}. Publisher.`;
        }
        break;
      case 'mla':
        const mlaAuthors = ref.authors.join(' and ');
        if (ref.type === 'article') {
          return `${mlaAuthors}. "${ref.title}." ${ref.journal}, vol. ${ref.volume}, no. ${ref.issue}, ${ref.year}, pp. ${ref.pages}.`;
        }
        break;
      // Add more citation styles as needed
    }
    return `${ref.authors.join(', ')} (${ref.year}). ${ref.title}.`;
  };

  // Export references
  const exportReferences = (format: 'bibtex' | 'ris' | 'json' | 'csv') => {
    const selected =
      selectedReferences.size > 0
        ? references.filter(ref => selectedReferences.has(ref.id))
        : filteredReferences;

    let content = '';

    switch (format) {
      case 'bibtex':
        content = selected
          .map(ref => {
            const type =
              ref.type === 'article'
                ? '@article'
                : ref.type === 'book'
                  ? '@book'
                  : '@misc';
            return `${type}{${ref.citationKey},
  title = {${ref.title}},
  author = {${ref.authors.join(' and ')}},
  year = {${ref.year}},
  ${ref.journal ? `journal = {${ref.journal}},` : ''}
  ${ref.volume ? `volume = {${ref.volume}},` : ''}
  ${ref.doi ? `doi = {${ref.doi}},` : ''}
}`;
          })
          .join('\n\n');
        break;

      case 'ris':
        content = selected
          .map(ref => {
            const risType =
              ref.type === 'article'
                ? 'JOUR'
                : ref.type === 'book'
                  ? 'BOOK'
                  : 'GEN';
            return `TY  - ${risType}
TI  - ${ref.title}
AU  - ${ref.authors.join('\nAU  - ')}
PY  - ${ref.year}
${ref.journal ? `JO  - ${ref.journal}` : ''}
${ref.volume ? `VL  - ${ref.volume}` : ''}
${ref.doi ? `DO  - ${ref.doi}` : ''}
ER  -`;
          })
          .join('\n\n');
        break;

      case 'json':
        content = JSON.stringify(selected, null, 2);
        break;

      case 'csv':
        const headers = ['Title', 'Authors', 'Year', 'Type', 'Journal', 'DOI'];
        const rows = selected.map(ref => [
          ref.title,
          ref.authors.join('; '),
          ref.year,
          ref.type,
          ref.journal || '',
          ref.doi || '',
        ]);
        content = [headers, ...rows].map(row => row.join(',')).join('\n');
        break;
    }

    // Download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `references.${format}`;
    a.click();
  };

  // Toggle reference selection
  const toggleReference = (id: string) => {
    setSelectedReferences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Toggle star
  const toggleStar = (id: string) => {
    setReferences(prev =>
      prev.map(ref => (ref.id === id ? { ...ref, starred: !ref.starred } : ref))
    );
  };

  // Sync with cloud
  const syncWithCloud = async () => {
    setSyncStatus('syncing');
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncStatus('success');
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Reference Manager
            </h1>
            <p className="text-gray-600 mt-2">
              Organize and cite your research literature
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={syncWithCloud}
              disabled={syncStatus === 'syncing'}
            >
              {syncStatus === 'syncing' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : syncStatus === 'success' ? (
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              ) : (
                <Cloud className="w-4 h-4 mr-2" />
              )}
              {syncStatus === 'syncing'
                ? 'Syncing...'
                : syncStatus === 'success'
                  ? 'Synced'
                  : 'Sync'}
            </Button>
            <Button
              onClick={() => {
                /* setShowAddReference(true) */
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Reference
            </Button>
          </div>
        </motion.div>

        <div className="flex gap-6">
          {/* Sidebar - Collections */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-64 space-y-4"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  Collections
                  <Button size="sm" variant="ghost">
                    <FolderPlus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 p-3">
                {collections.map(collection => (
                  <button
                    key={collection.id}
                    onClick={() => setCurrentCollection(collection.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm',
                      currentCollection === collection.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      <span>{collection.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {collection.referenceCount}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Tags Filter */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Tags className="w-4 h-4 mr-2" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(references.flatMap(ref => ref.tags))).map(
                    tag => (
                      <Badge
                        key={tag}
                        variant={
                          filterTags.includes(tag) ? 'default' : 'outline'
                        }
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          setFilterTags(prev =>
                            prev.includes(tag)
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          );
                        }}
                      >
                        {tag}
                      </Badge>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Library Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total References</span>
                  <span className="font-medium">{references.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Starred</span>
                  <span className="font-medium">
                    {references.filter(r => r.starred).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unread</span>
                  <span className="font-medium">
                    {references.filter(r => r.readStatus === 'unread').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">With PDFs</span>
                  <span className="font-medium">
                    {references.filter(r => r.attachments?.length).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 space-y-4"
          >
            {/* Toolbar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search references..."
                        className="pl-9"
                      />
                    </div>
                    <Select
                      value={sortBy}
                      onValueChange={(value: any) => setSortBy(value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date Added</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="author">Author</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1 border rounded-lg p-1">
                      <Button
                        size="sm"
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        onClick={() => setViewMode('list')}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {selectedReferences.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {selectedReferences.size} selected
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReferences(new Set())}
                      >
                        Clear
                      </Button>
                      <Select
                        value=""
                        onValueChange={(format: any) =>
                          exportReferences(format)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bibtex">BibTeX</SelectItem>
                          <SelectItem value="ris">RIS</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* References List/Grid */}
            {viewMode === 'list' ? (
              <div className="space-y-3">
                {filteredReferences.map((ref, index) => (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={cn(
                        'hover:shadow-lg transition-all',
                        selectedReferences.has(ref.id) && 'ring-2 ring-blue-400'
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={selectedReferences.has(ref.id)}
                            onChange={() => toggleReference(ref.id)}
                            className="mt-1 rounded border-gray-300"
                          />

                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 line-clamp-2">
                                  {ref.title}
                                </h3>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {ref.authors.slice(0, 2).join(', ')}
                                    {ref.authors.length > 2 &&
                                      ` +${ref.authors.length - 2}`}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {ref.year}
                                  </span>
                                  {ref.journal && (
                                    <span className="flex items-center gap-1">
                                      <BookOpen className="w-3 h-3" />
                                      {ref.journal}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs',
                                    ref.readStatus === 'read'
                                      ? 'border-green-500 text-green-700'
                                      : ref.readStatus === 'reading'
                                        ? 'border-yellow-500 text-yellow-700'
                                        : 'border-gray-400 text-gray-600'
                                  )}
                                >
                                  {ref.readStatus}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleStar(ref.id)}
                                >
                                  <Star
                                    className={cn(
                                      'w-4 h-4',
                                      ref.starred
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-400'
                                    )}
                                  />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {ref.abstract && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {ref.abstract}
                              </p>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                {ref.tags.slice(0, 3).map(tag => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {ref.attachments &&
                                  ref.attachments.length > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      <FileText className="w-3 h-3 mr-1" />
                                      PDF
                                    </Badge>
                                  )}
                              </div>

                              <div className="flex gap-2">
                                {ref.doi && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      window.open(
                                        `https://doi.org/${ref.doi}`,
                                        '_blank'
                                      )
                                    }
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const citation = generateCitation(
                                      ref,
                                      citationStyle
                                    );
                                    navigator.clipboard.writeText(citation);
                                  }}
                                >
                                  <Quote className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReferences.map((ref, index) => (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={cn(
                        'hover:shadow-lg transition-all h-full',
                        selectedReferences.has(ref.id) && 'ring-2 ring-blue-400'
                      )}
                    >
                      <CardContent className="p-4 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-2">
                          <input
                            type="checkbox"
                            checked={selectedReferences.has(ref.id)}
                            onChange={() => toggleReference(ref.id)}
                            className="mt-1 rounded border-gray-300"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleStar(ref.id)}
                          >
                            <Star
                              className={cn(
                                'w-4 h-4',
                                ref.starred
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-400'
                              )}
                            />
                          </Button>
                        </div>

                        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                          {ref.title}
                        </h3>

                        <p className="text-xs text-gray-600 mb-2">
                          {ref.authors[0]} {ref.authors.length > 1 && `et al.`}{' '}
                          • {ref.year}
                        </p>

                        {ref.abstract && (
                          <p className="text-xs text-gray-500 line-clamp-3 flex-1 mb-3">
                            {ref.abstract}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex gap-1">
                            {ref.tags.slice(0, 2).map(tag => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              ref.readStatus === 'read'
                                ? 'border-green-500 text-green-700'
                                : ref.readStatus === 'reading'
                                  ? 'border-yellow-500 text-yellow-700'
                                  : 'border-gray-400 text-gray-600'
                            )}
                          >
                            {ref.readStatus}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {filteredReferences.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Archive className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No references found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Try adjusting your search or filters
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
