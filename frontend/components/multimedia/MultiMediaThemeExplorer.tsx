'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  Video,
  Headphones,
  Network,
  BarChart3,
  Clock,
  Quote,
  ChevronRight,
  FileText
} from 'lucide-react';

interface Theme {
  theme: string;
  relevanceScore: number;
  timestamps: Array<{ start: number; end: number }>;
  keywords: string[];
  summary?: string;
  quotes?: Array<{ timestamp: number; quote: string }>;
  sourceId: string;
  sourceType: 'youtube' | 'podcast';
  sourceTitle: string;
}

interface MultiMediaThemeExplorerProps {
  themes: Theme[];
  onThemeSelect?: (theme: Theme) => void;
  onTimestampClick?: (sourceId: string, timestamp: number) => void;
  onGenerateStatements?: (themes: Theme[]) => void;
}

export function MultiMediaThemeExplorer({
  themes,
  onThemeSelect: _onThemeSelect,
  onTimestampClick,
  onGenerateStatements,
}: MultiMediaThemeExplorerProps) {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'clusters' | 'timeline' | 'comparison'>('clusters');

  // Group themes by theme name
  const themeGroups = useMemo(() => {
    const groups: Record<string, Theme[]> = {};
    themes.forEach((theme) => {
      if (!groups[theme.theme]) {
        groups[theme.theme] = [];
      }
      groups[theme.theme]!.push(theme);
    });
    return groups;
  }, [themes]);

  // Sort themes by frequency and relevance
  const sortedThemes = useMemo(() => {
    return Object.entries(themeGroups)
      .map(([themeName, themeInstances]) => ({
        name: themeName,
        instances: themeInstances,
        totalRelevance: themeInstances.reduce((sum, t) => sum + t.relevanceScore, 0),
        avgRelevance: themeInstances.reduce((sum, t) => sum + t.relevanceScore, 0) / themeInstances.length,
        sourceCount: themeInstances.length,
        keywords: [...new Set(themeInstances.flatMap((t) => t.keywords))],
      }))
      .sort((a, b) => b.totalRelevance - a.totalRelevance);
  }, [themeGroups]);

  // Get timeline data
  const timelineData = useMemo(() => {
    const data: Array<{
      theme: string;
      sourceTitle: string;
      sourceType: string;
      start: number;
      end: number;
      relevance: number;
    }> = [];

    themes.forEach((theme) => {
      theme.timestamps.forEach((ts) => {
        data.push({
          theme: theme.theme,
          sourceTitle: theme.sourceTitle,
          sourceType: theme.sourceType,
          start: ts.start,
          end: ts.end,
          relevance: theme.relevanceScore,
        });
      });
    });

    return data.sort((a, b) => a.start - b.start);
  }, [themes]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getSourceIcon = (type: string) => {
    return type === 'youtube' ? <Video className="w-4 h-4" /> : <Headphones className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Multi-Modal Theme Explorer
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {themes.length} themes across {Object.keys(themeGroups).length} topics
              </Badge>
              {onGenerateStatements && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGenerateStatements(themes)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Statements
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clusters">
            <BarChart3 className="w-4 h-4 mr-2" />
            Theme Clusters
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="w-4 h-4 mr-2" />
            Timeline View
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <TrendingUp className="w-4 h-4 mr-2" />
            Cross-Video Comparison
          </TabsTrigger>
        </TabsList>

        {/* Theme Clusters View */}
        <TabsContent value="clusters" className="space-y-4">
          <div className="h-[600px] overflow-y-auto">
            <div className="space-y-3 pr-4">
              {sortedThemes.map((themeGroup) => (
                <Card
                  key={themeGroup.name}
                  className={`cursor-pointer transition-all ${
                    selectedTheme === themeGroup.name ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedTheme(
                    selectedTheme === themeGroup.name ? null : themeGroup.name
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {themeGroup.name}
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              selectedTheme === themeGroup.name ? 'rotate-90' : ''
                            }`}
                          />
                        </CardTitle>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {themeGroup.keywords.slice(0, 5).map((keyword) => (
                            <Badge key={keyword} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="secondary">
                          {Math.round(themeGroup.avgRelevance * 100)}% avg relevance
                        </Badge>
                        <Badge variant="outline">
                          {themeGroup.sourceCount} source{themeGroup.sourceCount > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  {selectedTheme === themeGroup.name && (
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {themeGroup.instances.map((instance, idx) => (
                          <div key={idx} className="border-l-2 border-primary pl-4 py-2">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getSourceIcon(instance.sourceType)}
                                <span className="font-medium text-sm">
                                  {instance.sourceTitle}
                                </span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(instance.relevanceScore * 100)}%
                              </Badge>
                            </div>

                            {instance.summary && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {instance.summary}
                              </p>
                            )}

                            {instance.quotes && instance.quotes.length > 0 && (
                              <div className="space-y-2">
                                {instance.quotes.slice(0, 2).map((quote, qIdx) => (
                                  <button
                                    key={qIdx}
                                    onClick={() => onTimestampClick?.(instance.sourceId, quote.timestamp)}
                                    className="w-full text-left p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                                  >
                                    <div className="flex items-start gap-2">
                                      <Quote className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                                      <div className="flex-1">
                                        <p className="text-sm italic">&ldquo;{quote.quote}&rdquo;</p>
                                        <span className="text-xs text-muted-foreground">
                                          @ {formatTime(quote.timestamp)}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-1 mt-2">
                              {instance.timestamps.map((ts, tsIdx) => (
                                <button
                                  key={tsIdx}
                                  onClick={() => onTimestampClick?.(instance.sourceId, ts.start)}
                                  className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
                                >
                                  {formatTime(ts.start)} - {formatTime(ts.end)}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Timeline View */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="h-[600px] overflow-y-auto">
                <div className="space-y-2">
                  {timelineData.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => onTimestampClick?.(item.sourceTitle, item.start)}
                    >
                      <div className="flex-shrink-0 w-20 text-sm text-muted-foreground">
                        {formatTime(item.start)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getSourceIcon(item.sourceType)}
                          <span className="font-medium text-sm">{item.theme}</span>
                          <Badge variant="secondary" className="text-xs ml-auto">
                            {Math.round(item.relevance * 100)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.sourceTitle}</p>
                      </div>
                      <div className="flex-shrink-0 text-sm text-muted-foreground">
                        {formatTime(item.end - item.start)}s
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cross-Video Comparison */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="h-[600px] overflow-y-auto">
                <div className="space-y-6">
                  {sortedThemes
                    .filter((t) => t.sourceCount > 1)
                    .map((themeGroup) => (
                      <div key={themeGroup.name} className="border rounded p-4">
                        <h3 className="font-semibold mb-3 flex items-center justify-between">
                          <span>{themeGroup.name}</span>
                          <Badge variant="secondary">
                            {themeGroup.sourceCount} sources
                          </Badge>
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                          {themeGroup.instances.map((instance, idx) => (
                            <div key={idx} className="border rounded p-3">
                              <div className="flex items-center gap-2 mb-2">
                                {getSourceIcon(instance.sourceType)}
                                <span className="text-sm font-medium truncate">
                                  {instance.sourceTitle}
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Relevance
                                  </span>
                                  <span className="text-xs font-medium">
                                    {Math.round(instance.relevanceScore * 100)}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Mentions
                                  </span>
                                  <span className="text-xs font-medium">
                                    {instance.timestamps.length}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Keywords
                                  </span>
                                  <span className="text-xs font-medium">
                                    {instance.keywords.length}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                  {sortedThemes.filter((t) => t.sourceCount > 1).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No themes appear across multiple sources yet.</p>
                      <p className="text-sm mt-2">
                        Analyze more videos to find cross-source themes.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
