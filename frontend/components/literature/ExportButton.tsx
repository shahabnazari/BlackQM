/**
 * ExportButton Component
 * Phase 10.7 Day 2: Enterprise-Grade Export Functionality
 * Phase 10.7 Day 3: Mobile Responsive (44px touch targets, full-width dropdown on mobile)
 * Supports 7 export formats with optional abstracts
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export interface ExportButtonProps {
  selectedCount: number;
  onExport: (
    format: 'bibtex' | 'ris' | 'json' | 'csv' | 'apa' | 'mla' | 'chicago',
    includeAbstracts: boolean
  ) => Promise<void>;
  isExporting?: boolean;
  disabled?: boolean;
}

const EXPORT_FORMATS = [
  {
    id: 'bibtex' as const,
    label: 'BibTeX',
    description: 'Reference manager format (.bib)',
    icon: '📚',
    category: 'citation',
  },
  {
    id: 'ris' as const,
    label: 'RIS',
    description: 'Research Info Systems (.ris)',
    icon: '📄',
    category: 'citation',
  },
  {
    id: 'json' as const,
    label: 'JSON',
    description: 'Structured data format (.json)',
    icon: '{ }',
    category: 'data',
  },
  {
    id: 'csv' as const,
    label: 'CSV',
    description: 'Spreadsheet format (.csv)',
    icon: '📊',
    category: 'data',
  },
  {
    id: 'apa' as const,
    label: 'APA',
    description: 'APA citation style (.txt)',
    icon: '📝',
    category: 'formatted',
  },
  {
    id: 'mla' as const,
    label: 'MLA',
    description: 'MLA citation style (.txt)',
    icon: '📝',
    category: 'formatted',
  },
  {
    id: 'chicago' as const,
    label: 'Chicago',
    description: 'Chicago citation style (.txt)',
    icon: '📝',
    category: 'formatted',
  },
];

export const ExportButton: React.FC<ExportButtonProps> = ({
  selectedCount,
  onExport,
  isExporting = false,
  disabled = false,
}) => {
  const [includeAbstracts, setIncludeAbstracts] = useState(false);

  const handleExport = useCallback(
    async (format: typeof EXPORT_FORMATS[number]['id']) => {
      await onExport(format, includeAbstracts);
    },
    [onExport, includeAbstracts]
  );

  const citationFormats = EXPORT_FORMATS.filter(f => f.category === 'citation');
  const dataFormats = EXPORT_FORMATS.filter(f => f.category === 'data');
  const formattedFormats = EXPORT_FORMATS.filter(f => f.category === 'formatted');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="default"
          disabled={disabled || selectedCount === 0 || isExporting}
          className="gap-2 min-h-[44px] touch-manipulation w-full sm:w-auto"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm sm:text-base">Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span className="text-sm sm:text-base">Export</span>
              {selectedCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {selectedCount}
                </Badge>
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-72 max-w-sm">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Export Format</span>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedCount} paper{selectedCount > 1 ? 's' : ''}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Citation Management Formats */}
        <DropdownMenuLabel className="text-xs text-gray-500 font-normal px-2 py-1">
          Citation Management
        </DropdownMenuLabel>
        {citationFormats.map(format => (
          <DropdownMenuItem
            key={format.id}
            onClick={() => handleExport(format.id)}
            className="flex items-center gap-2 py-3 min-h-[44px] touch-manipulation cursor-pointer"
          >
            <span className="text-lg flex-shrink-0">{format.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{format.label}</div>
              <div className="text-xs text-gray-500 truncate">{format.description}</div>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Data Formats */}
        <DropdownMenuLabel className="text-xs text-gray-500 font-normal px-2 py-1">
          Data Formats
        </DropdownMenuLabel>
        {dataFormats.map(format => (
          <DropdownMenuItem
            key={format.id}
            onClick={() => handleExport(format.id)}
            className="flex items-center gap-2 py-3 min-h-[44px] touch-manipulation cursor-pointer"
          >
            <span className="text-lg flex-shrink-0">{format.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{format.label}</div>
              <div className="text-xs text-gray-500 truncate">{format.description}</div>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Formatted Citations */}
        <DropdownMenuLabel className="text-xs text-gray-500 font-normal px-2 py-1">
          Formatted Citations
        </DropdownMenuLabel>
        {formattedFormats.map(format => (
          <DropdownMenuItem
            key={format.id}
            onClick={() => handleExport(format.id)}
            className="flex items-center gap-2 py-3 min-h-[44px] touch-manipulation cursor-pointer"
          >
            <span className="text-lg flex-shrink-0">{format.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{format.label}</div>
              <div className="text-xs text-gray-500 truncate">{format.description}</div>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Options */}
        <DropdownMenuCheckboxItem
          checked={includeAbstracts}
          onCheckedChange={setIncludeAbstracts}
          className="flex items-center gap-2 py-3 min-h-[44px] touch-manipulation cursor-pointer"
        >
          <FileText className="w-4 h-4 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">Include Abstracts</div>
            <div className="text-xs text-gray-500">
              Add full abstracts to export (BibTeX, RIS, CSV)
            </div>
          </div>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

