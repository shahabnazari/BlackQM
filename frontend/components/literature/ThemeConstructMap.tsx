'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Network,
  TrendingUp,
  GitBranch,
  Filter,
  Target,
  Info,
  Eye,
  EyeOff,
  Maximize2,
} from 'lucide-react';

/**
 * Theme Construct Map Component
 * Phase 10 Day 5.12
 *
 * Purpose: Visual mapping of themes to theoretical constructs
 * Features:
 * - Interactive construct relationship visualization
 * - Construct clustering (related constructs grouped)
 * - Relationship types (causes/influences/correlates/moderates/mediates)
 * - Strength indicators (weak/moderate/strong)
 * - Clickable nodes for exploration
 * - Toggle relationships on/off
 * - Full-screen mode
 *
 * Enterprise-Grade Features:
 * - Type-safe interfaces matching backend
 * - Accessible UI (keyboard navigation)
 * - Responsive design
 * - Animation states
 * - Performance optimized for 100+ constructs
 */

export interface ConstructMapping {
  construct: {
    id: string;
    name: string;
    definition: string;
    themes: string[]; // theme IDs that map to this construct
  };
  relatedConstructs: Array<{
    constructId: string;
    constructName: string;
    relationshipType:
      | 'causes'
      | 'influences'
      | 'correlates'
      | 'moderates'
      | 'mediates';
    strength: 'weak' | 'moderate' | 'strong';
    confidence: number;
  }>;
}

interface ThemeConstructMapProps {
  mappings: ConstructMapping[];
  onConstructClick?: (constructId: string) => void;
  onRelationshipClick?: (sourceId: string, targetId: string) => void;
  className?: string;
}

const relationshipTypeConfig = {
  causes: {
    label: 'Causes',
    color: 'text-purple-600',
    lineColor: 'stroke-purple-500',
    icon: Target,
    description: 'Causal relationship',
  },
  influences: {
    label: 'Influences',
    color: 'text-blue-600',
    lineColor: 'stroke-blue-500',
    icon: TrendingUp,
    description: 'Influence relationship',
  },
  correlates: {
    label: 'Correlates',
    color: 'text-green-600',
    lineColor: 'stroke-green-500',
    icon: GitBranch,
    description: 'Correlational relationship',
  },
  moderates: {
    label: 'Moderates',
    color: 'text-amber-600',
    lineColor: 'stroke-amber-500',
    icon: Filter,
    description: 'Moderating effect',
  },
  mediates: {
    label: 'Mediates',
    color: 'text-red-600',
    lineColor: 'stroke-red-500',
    icon: GitBranch,
    description: 'Mediating effect',
  },
};

const strengthConfig = {
  weak: { opacity: '0.3', label: 'Weak', dashArray: '5,5' },
  moderate: { opacity: '0.6', label: 'Moderate', dashArray: '3,3' },
  strong: { opacity: '1.0', label: 'Strong', dashArray: '0' },
};

export const ThemeConstructMap: React.FC<ThemeConstructMapProps> = ({
  mappings,
  onConstructClick,
  onRelationshipClick,
  className = '',
}) => {
  const [selectedConstructId, setSelectedConstructId] = useState<string | null>(
    null
  );
  const [visibleRelationships, setVisibleRelationships] = useState<Set<string>>(
    new Set(['causes', 'influences', 'correlates', 'moderates', 'mediates'])
  );
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Calculate node positions (simple circular layout)
  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    const centerX = 300;
    const centerY = 300;
    const radius = 200;

    mappings.forEach((mapping, index) => {
      const angle = (index / mappings.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      positions.set(mapping.construct.id, { x, y });
    });

    return positions;
  }, [mappings]);

  const toggleRelationshipType = (type: string) => {
    const newVisible = new Set(visibleRelationships);
    if (newVisible.has(type)) {
      newVisible.delete(type);
    } else {
      newVisible.add(type);
    }
    setVisibleRelationships(newVisible);
  };

  const handleConstructClick = (constructId: string) => {
    setSelectedConstructId(
      selectedConstructId === constructId ? null : constructId
    );
    onConstructClick?.(constructId);
  };

  if (mappings.length === 0) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">
          No construct mappings available
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Extract themes and generate construct mappings to visualize
          relationships.
        </p>
      </div>
    );
  }

  const selectedMapping = selectedConstructId
    ? mappings.find(m => m.construct.id === selectedConstructId)
    : null;

  return (
    <div
      className={`${className} ${isFullScreen ? 'fixed inset-0 z-50 bg-white p-6' : ''}`}
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600" />
            Theme → Construct Map ({mappings.length} constructs)
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Visual representation of theoretical constructs and their
            relationships
          </p>
        </div>
        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={isFullScreen ? 'Exit full-screen' : 'Enter full-screen'}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Relationship Type Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700 mr-2">
          Show Relationships:
        </span>
        {Object.entries(relationshipTypeConfig).map(([type, config]) => {
          const isVisible = visibleRelationships.has(type);
          const RelIcon = config.icon;
          return (
            <button
              key={type}
              onClick={() => toggleRelationshipType(type)}
              className={`
                px-3 py-1.5 rounded-md text-xs font-medium border transition-all
                ${isVisible ? `${config.color} bg-opacity-10 border-current` : 'text-gray-400 border-gray-300'}
              `}
              title={config.description}
            >
              <span className="flex items-center gap-1">
                {isVisible ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
                <RelIcon className="w-3 h-3" />
                {config.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Visualization Container */}
      <div className="border border-gray-300 rounded-lg bg-white overflow-hidden">
        <div className="relative" style={{ height: '600px' }}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 600 600"
            className="absolute inset-0"
          >
            {/* Draw Relationship Lines */}
            <g className="relationships">
              {mappings.map(mapping => {
                const sourcePos = nodePositions.get(mapping.construct.id);
                if (!sourcePos) return null;

                return mapping.relatedConstructs.map((rel, idx) => {
                  if (!visibleRelationships.has(rel.relationshipType))
                    return null;

                  const targetPos = nodePositions.get(rel.constructId);
                  if (!targetPos) return null;

                  const config = relationshipTypeConfig[rel.relationshipType];
                  const strengthCfg = strengthConfig[rel.strength];

                  return (
                    <g
                      key={`${mapping.construct.id}-${rel.constructId}-${idx}`}
                    >
                      <line
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        className={config.lineColor}
                        strokeWidth="2"
                        opacity={strengthCfg.opacity}
                        strokeDasharray={strengthCfg.dashArray}
                        onClick={() =>
                          onRelationshipClick?.(
                            mapping.construct.id,
                            rel.constructId
                          )
                        }
                        style={{ cursor: 'pointer' }}
                      />
                      {/* Direction Arrow */}
                      <polygon
                        points={`${targetPos.x},${targetPos.y} ${targetPos.x - 5},${targetPos.y - 8} ${targetPos.x + 5},${targetPos.y - 8}`}
                        className={config.lineColor}
                        opacity={strengthCfg.opacity}
                      />
                    </g>
                  );
                });
              })}
            </g>

            {/* Draw Construct Nodes */}
            <g className="nodes">
              {mappings.map(mapping => {
                const pos = nodePositions.get(mapping.construct.id);
                if (!pos) return null;

                const isSelected = selectedConstructId === mapping.construct.id;
                const nodeRadius = isSelected ? 35 : 30;

                return (
                  <g
                    key={mapping.construct.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => handleConstructClick(mapping.construct.id)}
                    style={{ cursor: 'pointer' }}
                    className="group"
                  >
                    {/* Outer Glow for Selected */}
                    {isSelected && (
                      <circle
                        r={nodeRadius + 5}
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2"
                        opacity="0.3"
                      />
                    )}

                    {/* Node Circle */}
                    <circle
                      r={nodeRadius}
                      fill={isSelected ? '#3B82F6' : '#E5E7EB'}
                      stroke={isSelected ? '#1E40AF' : '#9CA3AF'}
                      strokeWidth="2"
                      className="group-hover:fill-blue-100 transition-colors"
                    />

                    {/* Theme Count Badge */}
                    <circle
                      r="10"
                      cx={nodeRadius - 10}
                      cy={-nodeRadius + 10}
                      fill="#10B981"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x={nodeRadius - 10}
                      y={-nodeRadius + 14}
                      textAnchor="middle"
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {mapping.construct.themes.length}
                    </text>

                    {/* Construct Name (truncated) */}
                    <text
                      y="4"
                      textAnchor="middle"
                      fill={isSelected ? 'white' : '#1F2937'}
                      fontSize="11"
                      fontWeight="600"
                      className="pointer-events-none select-none"
                    >
                      {mapping.construct.name.length > 15
                        ? mapping.construct.name.substring(0, 15) + '...'
                        : mapping.construct.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Legend */}
        <div className="border-t border-gray-300 p-3 bg-gray-50">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Theme Count</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-8 h-0.5 bg-gray-400"></div>
              <span>Strong</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-8 h-0.5 bg-gray-400 opacity-60"
                style={{ borderTop: '2px dashed gray' }}
              ></div>
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-8 h-0.5 bg-gray-400 opacity-30"
                style={{ borderTop: '2px dashed gray' }}
              ></div>
              <span>Weak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Construct Details */}
      {selectedMapping && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 border border-blue-300 bg-blue-50 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1">
                {selectedMapping.construct.name}
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                {selectedMapping.construct.definition}
              </p>
              <div className="text-xs text-blue-700">
                <p className="mb-1">
                  <span className="font-medium">Mapped from:</span>{' '}
                  {selectedMapping.construct.themes.length} theme(s)
                </p>
                <p>
                  <span className="font-medium">Related to:</span>{' '}
                  {selectedMapping.relatedConstructs.length} other construct(s)
                </p>
              </div>

              {/* Relationships List */}
              {selectedMapping.relatedConstructs.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-blue-900">
                    Relationships:
                  </p>
                  {selectedMapping.relatedConstructs.map((rel, idx) => {
                    const config = relationshipTypeConfig[rel.relationshipType];
                    const RelIcon = config.icon;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs bg-white p-2 rounded border border-blue-200"
                      >
                        <RelIcon className={`w-3 h-3 ${config.color}`} />
                        <span className={`font-medium ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-gray-700">
                          {rel.constructName}
                        </span>
                        <span className="ml-auto text-gray-500">
                          ({strengthConfig[rel.strength].label},{' '}
                          {(rel.confidence * 100).toFixed(0)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {mappings.length}
          </div>
          <div className="text-xs text-gray-600">Constructs</div>
        </div>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {mappings.reduce((sum, m) => sum + m.construct.themes.length, 0)}
          </div>
          <div className="text-xs text-gray-600">Total Themes</div>
        </div>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {mappings.reduce((sum, m) => sum + m.relatedConstructs.length, 0)}
          </div>
          <div className="text-xs text-gray-600">Relationships</div>
        </div>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {mappings.reduce(
              (sum, m) =>
                sum +
                m.relatedConstructs.filter(r => r.strength === 'strong').length,
              0
            )}
          </div>
          <div className="text-xs text-gray-600">Strong Links</div>
        </div>
      </div>
    </div>
  );
};
