'use client';

import { useState, useEffect } from 'react';
import { KnowledgeMapVisualization } from '@/components/literature/KnowledgeMapVisualization';
import type {
  KnowledgeNode,
  KnowledgeLink,
} from '@/components/literature/KnowledgeMapVisualization';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BookOpen,
  Brain,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { literatureAPI } from '@/lib/services/literature-api.service';

export default function EnhancedKnowledgeMapPage() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [links, setLinks] = useState<KnowledgeLink[]>([]);
  const [extractedThemes, setExtractedThemes] = useState<any[]>([]);
  const [controversies, setControversies] = useState<any[]>([]);
  const [generatedStatements, setGeneratedStatements] = useState<string[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load initial data
  useEffect(() => {
    loadSampleData();
  }, []);

  const loadSampleData = () => {
    // Sample knowledge graph data for demonstration
    const sampleNodes: KnowledgeNode[] = [
      // Papers
      {
        id: 'p1',
        label: 'Climate Change Attitudes Study',
        type: 'paper',
        weight: 8,
        metadata: { citations: 245, year: 2023, controversial: true },
      },
      {
        id: 'p2',
        label: 'Public Opinion on Renewable Energy',
        type: 'paper',
        weight: 7,
        metadata: { citations: 189, year: 2023 },
      },
      {
        id: 'p3',
        label: 'Environmental Policy Perspectives',
        type: 'paper',
        weight: 6,
        metadata: { citations: 156, year: 2022 },
      },

      // Themes
      {
        id: 't1',
        label: 'Climate Skepticism',
        type: 'theme',
        weight: 9,
        metadata: {
          controversial: true,
          opposingViews: ['Climate denial', 'Climate acceptance'],
        },
      },
      { id: 't2', label: 'Energy Transition', type: 'theme', weight: 8 },
      { id: 't3', label: 'Policy Effectiveness', type: 'theme', weight: 7 },

      // Concepts
      { id: 'c1', label: 'Carbon Pricing', type: 'concept', weight: 6 },
      { id: 'c2', label: 'Green Technology', type: 'concept', weight: 7 },
      { id: 'c3', label: 'Public Engagement', type: 'concept', weight: 5 },

      // Keywords
      { id: 'k1', label: 'sustainability', type: 'keyword', weight: 4 },
      { id: 'k2', label: 'mitigation', type: 'keyword', weight: 4 },
      { id: 'k3', label: 'adaptation', type: 'keyword', weight: 4 },

      // Controversies
      {
        id: 'con1',
        label: 'Economic Impact Debate',
        type: 'controversy',
        weight: 8,
        metadata: { controversial: true },
      },
    ];

    const sampleLinks: KnowledgeLink[] = [
      // Paper connections
      { source: 'p1', target: 't1', type: 'theme', strength: 0.9 },
      { source: 'p2', target: 't2', type: 'theme', strength: 0.8 },
      { source: 'p3', target: 't3', type: 'theme', strength: 0.7 },

      // Opposing views
      {
        source: 'p1',
        target: 'con1',
        type: 'opposes',
        strength: 0.8,
        metadata: { disagreement: true },
      },
      { source: 'con1', target: 'p2', type: 'opposes', strength: 0.6 },

      // Supporting connections
      { source: 'p2', target: 'c2', type: 'supports', strength: 0.7 },
      { source: 'p3', target: 'c1', type: 'supports', strength: 0.6 },

      // Concept relationships
      { source: 'c1', target: 'c2', type: 'related', strength: 0.5 },
      { source: 'c2', target: 'c3', type: 'related', strength: 0.6 },

      // Keyword associations
      { source: 'k1', target: 't2', type: 'related', strength: 0.4 },
      { source: 'k2', target: 't1', type: 'related', strength: 0.5 },
      { source: 'k3', target: 't3', type: 'related', strength: 0.4 },
    ];

    setNodes(sampleNodes);
    setLinks(sampleLinks);
  };

  const handleNodeClick = (node: KnowledgeNode) => {
    console.log('Node clicked:', node);
    if (node.type === 'paper') {
      setSelectedPapers(prev => {
        if (prev.includes(node.id)) {
          return prev.filter(id => id !== node.id);
        }
        return [...prev, node.id];
      });
    }
  };

  const handleThemeExtracted = (themes: string[]) => {
    console.log('Themes extracted:', themes);
    setExtractedThemes(
      themes.map(theme => ({
        id: `theme-${Date.now()}-${Math.random()}`,
        label: theme,
        keywords: [],
        papers: selectedPapers,
        weight: Math.random() * 10,
      }))
    );
  };

  const handleControversyDetected = (controversy: any) => {
    console.log('Controversy detected:', controversy);
    setControversies(prev => [...prev, controversy]);
  };

  const extractThemesFromPapers = async () => {
    if (selectedPapers.length === 0) {
      alert('Please select papers from the knowledge map first');
      return;
    }

    setIsLoading(true);
    try {
      const themes = await literatureAPI.extractThemes(selectedPapers);
      setExtractedThemes(themes);

      // Detect controversies - using mock data for now since the method doesn't exist
      // const controversyResponse = await literatureAPI.detectControversies(selectedPapers);
      setControversies([]);

      console.log(`Found ${themes.length} themes`);
    } catch (error) {
      console.error('Error extracting themes:', error);
      alert('Failed to extract themes from papers');
    } finally {
      setIsLoading(false);
    }
  };

  const generateStatementsFromThemes = async () => {
    if (extractedThemes.length === 0) {
      alert('Please extract themes first');
      return;
    }

    setIsGenerating(true);
    try {
      const statements = await literatureAPI.generateStatementsFromThemes(
        extractedThemes.map(t => (typeof t === 'string' ? t : t.label || t)),
        { studyType: 'environmental', perspective: 'balanced' }
      );

      setGeneratedStatements(statements);

      console.log(`Created ${statements.length} Q-sort statements`);
    } catch (error) {
      console.error('Error generating statements:', error);
      alert('Failed to generate statements');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportStatements = () => {
    const data = {
      themes: extractedThemes,
      controversies,
      statements: generatedStatements,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'knowledge-map-statements.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Knowledge Map & Theme Extraction
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize research connections and generate Q-sort statements from
            literature
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedPapers.length > 0 && (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {selectedPapers.length} papers selected
            </Badge>
          )}
          <Button onClick={loadSampleData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Data
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="visualization" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="visualization"
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            Knowledge Map
          </TabsTrigger>
          <TabsTrigger value="themes" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Extracted Themes
          </TabsTrigger>
          <TabsTrigger value="statements" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generated Statements
          </TabsTrigger>
        </TabsList>

        {/* Visualization Tab */}
        <TabsContent value="visualization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Knowledge Graph</CardTitle>
              <CardDescription>
                Click on paper nodes to select them for theme extraction. Red
                dashed lines indicate opposing viewpoints.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KnowledgeMapVisualization
                nodes={nodes}
                links={links}
                onNodeClick={handleNodeClick}
                onThemeExtracted={handleThemeExtracted}
                onControversyDetected={handleControversyDetected}
                height={600}
              />

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4">
                <Button
                  onClick={extractThemesFromPapers}
                  disabled={selectedPapers.length === 0 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Extract Themes
                    </>
                  )}
                </Button>

                {extractedThemes.length > 0 && (
                  <Button
                    onClick={generateStatementsFromThemes}
                    variant="secondary"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ChevronRight className="mr-2 h-4 w-4" />
                        Generate Statements
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Themes Tab */}
        <TabsContent value="themes" className="space-y-4">
          {extractedThemes.length === 0 ? (
            <Alert>
              <AlertDescription>
                No themes extracted yet. Select papers from the knowledge map
                and click "Extract Themes".
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Extracted Themes */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Extracted Themes ({extractedThemes.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {extractedThemes.map((theme, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            {theme.label || theme}
                          </h4>
                          <Badge variant="outline">
                            Weight: {theme.weight?.toFixed(1) || 'N/A'}
                          </Badge>
                        </div>
                        {theme.keywords && theme.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {theme.keywords
                              .slice(0, 5)
                              .map((keyword: string, kidx: number) => (
                                <Badge
                                  key={kidx}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {keyword}
                                </Badge>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Detected Controversies */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Controversies ({controversies.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {controversies.length === 0 ? (
                      <p className="text-muted-foreground">
                        No controversies detected
                      </p>
                    ) : (
                      controversies.map((controversy, idx) => (
                        <div
                          key={idx}
                          className="p-3 border border-orange-200 rounded-lg bg-orange-50"
                        >
                          <h4 className="font-medium text-orange-900">
                            {controversy.node?.label ||
                              controversy.topic ||
                              'Unnamed Controversy'}
                          </h4>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-orange-700">
                              Strength:{' '}
                              {(controversy.strength * 100).toFixed(0)}%
                            </p>
                            {controversy.oppositions && (
                              <p className="text-sm text-orange-600">
                                {controversy.oppositions.length} opposing
                                viewpoints
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Theme to Statement Pipeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Theme to Statement Pipeline</CardTitle>
                  <CardDescription>
                    AI-powered generation of Q-sort statements from extracted
                    themes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          1
                        </div>
                        <span className="text-sm font-medium">
                          {extractedThemes.length} themes extracted
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          2
                        </div>
                        <span className="text-sm font-medium">
                          {controversies.length} controversies detected
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          3
                        </div>
                        <span className="text-sm font-medium">
                          Ready for statement generation
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Generated Statements Tab */}
        <TabsContent value="statements" className="space-y-4">
          {generatedStatements.length === 0 ? (
            <Alert>
              <AlertDescription>
                No statements generated yet. Extract themes first, then generate
                statements.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generated Q-Sort Statements</CardTitle>
                    <CardDescription>
                      {generatedStatements.length} statements ready for your
                      Q-methodology study
                    </CardDescription>
                  </div>
                  <Button onClick={exportStatements} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedStatements.map((statement, idx) => (
                    <div
                      key={idx}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm">
                          {idx + 1}
                        </span>
                        <p className="text-sm">{statement}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Statement Statistics */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Statement Analysis</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Total Statements:
                      </span>
                      <p className="font-medium">
                        {generatedStatements.length}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        From Themes:
                      </span>
                      <p className="font-medium">{extractedThemes.length}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Controversial:
                      </span>
                      <p className="font-medium">{controversies.length}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
