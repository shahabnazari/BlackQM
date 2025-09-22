import React, { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { 
  LightBulbIcon,
  TagIcon,
  DocumentMagnifyingGlassIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import type { Theme } from '@/lib/stores/interpretation.store';

interface ThemeExtractionPanelProps {
  themes: Theme[];
  factors: any[];
  onExtract: () => void;
  generating: boolean;
}

/**
 * ThemeExtractionPanel Component - Phase 8 Day 1
 * 
 * Extracts and displays themes from qualitative data
 * Integrates with AI for pattern recognition
 */
export function ThemeExtractionPanel({
  themes,
  factors: _factors,
  onExtract,
  generating
}: ThemeExtractionPanelProps) {
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [showAddTheme, setShowAddTheme] = useState(false);
  const [newTheme, setNewTheme] = useState({
    name: '',
    description: '',
    keywords: ''
  });

  const handleAddTheme = () => {
    // TODO: Implement add theme functionality
    setShowAddTheme(false);
    setNewTheme({ name: '', description: '', keywords: '' });
  };

  return (
    <Card className="p-6 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-label flex items-center gap-2">
            <LightBulbIcon className="w-6 h-6 text-yellow-500" />
            Theme Extraction
          </h2>
          <p className="text-sm text-secondary-label mt-1">
            Identify recurring themes and patterns across factors
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowAddTheme(!showAddTheme)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Theme
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={onExtract}
            loading={generating}
            className="flex items-center gap-2"
          >
            <DocumentMagnifyingGlassIcon className="w-4 h-4" />
            Extract Themes
          </Button>
        </div>
      </div>

      {/* Add Theme Form */}
      {showAddTheme && (
        <div className="mb-6 p-4 bg-system-gray-6 rounded-lg">
          <h3 className="text-sm font-medium mb-3">Add Custom Theme</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Theme name"
              value={newTheme.name}
              onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
              className="w-full px-3 py-2 border border-system-gray-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-system-blue"
            />
            <textarea
              placeholder="Theme description"
              value={newTheme.description}
              onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
              className="w-full px-3 py-2 border border-system-gray-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-system-blue h-20 resize-none"
            />
            <input
              type="text"
              placeholder="Keywords (comma-separated)"
              value={newTheme.keywords}
              onChange={(e) => setNewTheme({ ...newTheme, keywords: e.target.value })}
              className="w-full px-3 py-2 border border-system-gray-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-system-blue"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={handleAddTheme}>
                Add Theme
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowAddTheme(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {themes.length === 0 && !generating ? (
        <div className="text-center py-12">
          <LightBulbIcon className="w-12 h-12 mx-auto text-system-gray-4 mb-4" />
          <p className="text-secondary-label mb-4">No themes extracted yet</p>
          <Button
            variant="primary"
            onClick={onExtract}
            loading={generating}
            className="flex items-center gap-2 mx-auto"
          >
            <DocumentMagnifyingGlassIcon className="w-4 h-4" />
            Extract Themes from Data
          </Button>
        </div>
      ) : generating ? (
        <div className="text-center py-12">
          <div className="animate-pulse">
            <DocumentMagnifyingGlassIcon className="w-12 h-12 mx-auto text-system-blue mb-4" />
            <p className="text-secondary-label">Extracting themes...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Theme List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-secondary-label mb-2">Extracted Themes</h3>
            {themes.map((theme, index) => (
              <div
                key={index}
                onClick={() => setSelectedTheme(theme)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedTheme?.name === theme.name
                    ? 'border-system-blue bg-system-blue/5'
                    : 'border-system-gray-4 bg-white hover:border-system-gray-3'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-label">{theme.name}</h4>
                  <Badge variant="info">{theme.occurrences} occurrences</Badge>
                </div>
                <p className="text-sm text-secondary-label line-clamp-2">
                  {theme.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1">
                    {theme.factors.slice(0, 3).map((f) => (
                      <Badge key={f} variant="default" size="sm">F{f}</Badge>
                    ))}
                    {theme.factors.length > 3 && (
                      <Badge variant="default" size="sm">+{theme.factors.length - 3}</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Theme Details */}
          <div className="space-y-4">
            {selectedTheme ? (
              <>
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-medium text-secondary-label">Theme Details</h3>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {/* TODO: Remove theme */}}
                    className="text-system-red"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
                
                <Card className="p-4 bg-system-gray-6">
                  <h4 className="font-medium text-label mb-2">{selectedTheme.name}</h4>
                  <p className="text-sm text-secondary-label mb-4">
                    {selectedTheme.description}
                  </p>
                  
                  {/* Keywords */}
                  <div className="mb-4">
                    <h5 className="text-xs font-medium text-secondary-label mb-2 flex items-center gap-1">
                      <TagIcon className="w-3 h-3" />
                      Keywords
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedTheme.keywords.map((keyword, i) => (
                        <Badge key={i} variant="default" size="sm">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Sample Quotes */}
                  {selectedTheme.quotes.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-secondary-label mb-2">
                        Sample Quotes
                      </h5>
                      <div className="space-y-2">
                        {selectedTheme.quotes.slice(0, 3).map((quote, i) => (
                          <div key={i} className="p-2 bg-white rounded text-xs italic text-secondary-label">
                            "{quote}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Factors */}
                  <div className="mt-4">
                    <h5 className="text-xs font-medium text-secondary-label mb-2">
                      Appears in Factors
                    </h5>
                    <div className="flex gap-2">
                      {selectedTheme.factors.map((f) => (
                        <Badge key={f} variant="info">Factor {f}</Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-secondary-label">
                  Select a theme to view details
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}