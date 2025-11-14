/**
 * Citation Generator Component - Phase 10.8 Day 9
 *
 * Generates academic citations for social media content in multiple formats:
 * - APA 7th Edition
 * - MLA 9th Edition
 * - Chicago 17th Edition
 * - Harvard Style
 *
 * @module CitationModal
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Copy, Check, X, FileText } from 'lucide-react';
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
import type { SocialMediaResult } from '@/lib/types/literature.types';

// ============================================================================
// Types
// ============================================================================

export type CitationFormat = 'apa' | 'mla' | 'chicago' | 'harvard';

export interface CitationModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Social media result to cite */
  result: SocialMediaResult;
}

// ============================================================================
// Citation Generator Functions
// ============================================================================

/**
 * Format author name based on citation style
 */
const formatAuthor = (author: string, format: CitationFormat): string => {
  if (!author) return 'Anonymous';

  // Remove @ symbol if present
  const cleanAuthor = author.replace(/^@/, '');

  // For social media, we typically use the username/handle
  switch (format) {
    case 'apa':
    case 'chicago':
      // Last, F. format (but for usernames, just use as-is with @)
      return `@${cleanAuthor}`;
    case 'mla':
    case 'harvard':
      // First Last format (for usernames, use as-is with @)
      return `@${cleanAuthor}`;
    default:
      return cleanAuthor;
  }
};

/**
 * Format date based on citation style
 */
const formatDate = (date: string | number, format: CitationFormat): string => {
  if (!date) return 'n.d.';

  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.toLocaleString('en-US', { month: 'long' });
  const day = d.getDate();

  switch (format) {
    case 'apa':
      return `${year}, ${month} ${day}`;
    case 'mla':
      return `${day} ${month} ${year}`;
    case 'chicago':
      return `${month} ${day}, ${year}`;
    case 'harvard':
      return `${year}`;
    default:
      return date.toString();
  }
};

/**
 * Generate citation for social media content
 */
const generateCitation = (result: SocialMediaResult, format: CitationFormat): string => {
  const metadata = result.metadata as Record<string, any> | undefined;
  const author = formatAuthor(result.authors?.[0] || metadata?.['creator'] || 'Anonymous', format);
  const title = result.title || 'Untitled Post';
  const platform = result.source || metadata?.['platform'] || 'Social Media';
  const url = result.url || '#';
  const date = formatDate(
    metadata?.['publishedAt'] || metadata?.['createdAt'] || result.year || new Date(),
    format
  );
  const accessDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  switch (format) {
    case 'apa':
      // APA 7th Edition: Author. (Year, Month Day). Title [Platform post]. Platform. URL
      return `${author}. (${date}). ${title} [${platform} post]. ${platform}. ${url}`;

    case 'mla':
      // MLA 9th Edition: Author. "Title." Platform, Day Month Year, URL. Accessed Day Month Year.
      return `${author}. "${title}." ${platform}, ${date}, ${url}. Accessed ${accessDate}.`;

    case 'chicago':
      // Chicago 17th Edition: Author. "Title." Platform post. Month Day, Year. URL.
      return `${author}. "${title}." ${platform} post. ${date}. ${url}.`;

    case 'harvard':
      // Harvard Style: Author (Year) 'Title', Platform, Day Month, Available at: URL (Accessed: Day Month Year).
      return `${author} (${date}) '${title}', ${platform}, Available at: ${url} (Accessed: ${accessDate}).`;

    default:
      return '';
  }
};

// ============================================================================
// Component
// ============================================================================

export const CitationModal: React.FC<CitationModalProps> = ({
  open,
  onClose,
  result,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<CitationFormat>('apa');
  const [copied, setCopied] = useState(false);

  const metadata = result.metadata as Record<string, any> | undefined;
  const citation = generateCitation(result, selectedFormat);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(citation);
    setCopied(true);
    toast.success('Citation copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [citation]);

  const formats: Array<{ id: CitationFormat; label: string; description: string }> = [
    { id: 'apa', label: 'APA 7th', description: 'American Psychological Association' },
    { id: 'mla', label: 'MLA 9th', description: 'Modern Language Association' },
    { id: 'chicago', label: 'Chicago 17th', description: 'Chicago Manual of Style' },
    { id: 'harvard', label: 'Harvard', description: 'Harvard Referencing Style' },
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Citation Generator</DialogTitle>
                <DialogDescription>
                  Generate academic citations for social media content
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Format Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Citation Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {formats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedFormat === format.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-sm">{format.label}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {format.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Citation Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Generated Citation</label>
              <Badge variant="secondary" className="text-xs">
                {selectedFormat.toUpperCase()}
              </Badge>
            </div>
            <div className="relative">
              <div className="border rounded-lg p-4 bg-gray-50 font-mono text-sm leading-relaxed min-h-[100px]">
                {citation}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="absolute top-2 right-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Source Information */}
          <div className="border-t pt-4">
            <label className="text-sm font-medium mb-2 block">
              Source Information
            </label>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Platform:</span>{' '}
                <span className="font-medium">
                  {result.source || metadata?.['platform'] || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Author:</span>{' '}
                <span className="font-medium">
                  {result.authors?.[0] || metadata?.['creator'] || 'Anonymous'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Title:</span>{' '}
                <span className="font-medium">{result.title || 'Untitled'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">URL:</span>{' '}
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {result.url || '#'}
                </a>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Social media citations may require additional verification with
              your institution's style guide. URLs may change or become unavailable over time.
              Consider using archive services for long-term reference.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CitationModal;
