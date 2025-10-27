'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Play, FileText, Download } from 'lucide-react';

interface TranscriptSegment {
  timestamp: number;
  text: string;
  speaker?: string;
}

interface TranscriptTheme {
  theme: string;
  relevanceScore: number;
  timestamps: Array<{ start: number; end: number }>;
  keywords: string[];
  summary?: string;
}

interface TranscriptViewerProps {
  transcript: {
    id: string;
    text: string;
    duration: number;
    confidence?: number;
    timestampedText: TranscriptSegment[];
  };
  themes?: TranscriptTheme[];
  onTimestampClick?: (timestamp: number) => void;
}

export function TranscriptViewer({
  transcript,
  themes,
  onTimestampClick,
}: TranscriptViewerProps) {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [showTimestamps, setShowTimestamps] = useState(true);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const exportTranscript = () => {
    const text = transcript.timestampedText
      .map(seg => `[${formatTime(seg.timestamp)}] ${seg.text}`)
      .join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${transcript.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isTimestampInTheme = (
    timestamp: number,
    theme: TranscriptTheme
  ): boolean => {
    return theme.timestamps.some(
      range => timestamp >= range.start && timestamp <= range.end
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Transcript
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(transcript.duration)}
              </Badge>
              {transcript.confidence && (
                <Badge variant="secondary">
                  {Math.round(transcript.confidence * 100)}% confidence
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportTranscript}
                className="flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Themes Panel */}
      {themes && themes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Extracted Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {themes
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .map(theme => (
                  <Badge
                    key={theme.theme}
                    variant={
                      selectedTheme === theme.theme ? 'default' : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedTheme(
                        selectedTheme === theme.theme ? null : theme.theme
                      )
                    }
                  >
                    {theme.theme}
                    <span className="ml-1 text-xs opacity-70">
                      ({Math.round(theme.relevanceScore * 100)}%)
                    </span>
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript Content */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Full Transcript</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTimestamps(!showTimestamps)}
            >
              {showTimestamps ? 'Hide' : 'Show'} Timestamps
            </Button>
          </div>

          <div className="h-[600px] pr-4 overflow-y-auto">
            <div className="space-y-4">
              {transcript.timestampedText.map((segment, index) => {
                const highlightedTheme = themes?.find(theme =>
                  selectedTheme === theme.theme
                    ? isTimestampInTheme(segment.timestamp, theme)
                    : false
                );

                return (
                  <div
                    key={index}
                    className={`group ${
                      highlightedTheme
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded'
                        : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {showTimestamps && (
                        <button
                          onClick={() => onTimestampClick?.(segment.timestamp)}
                          className="flex-shrink-0 text-sm text-muted-foreground hover:text-primary flex items-center gap-1 group-hover:underline"
                        >
                          <Play className="w-3 h-3" />
                          {formatTime(segment.timestamp)}
                        </button>
                      )}
                      <p className="text-sm leading-relaxed">{segment.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
