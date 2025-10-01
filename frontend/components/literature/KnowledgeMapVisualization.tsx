'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'paper' | 'concept' | 'author' | 'keyword' | 'theme' | 'controversy';
  weight: number;
  metadata?: {
    citations?: number;
    year?: number;
    abstract?: string;
    authors?: string[];
    controversial?: boolean;
    opposingViews?: string[];
  };
}

export interface KnowledgeLink {
  source: string;
  target: string;
  type: 'cites' | 'related' | 'opposes' | 'supports' | 'theme';
  strength: number;
  metadata?: {
    context?: string;
    disagreement?: boolean;
  };
}

interface KnowledgeMapVisualizationProps {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
  onNodeClick?: (node: KnowledgeNode) => void;
  onThemeExtracted?: (themes: string[]) => void;
  onControversyDetected?: (controversy: any) => void;
  height?: number;
}

export function KnowledgeMapVisualization({
  nodes,
  links,
  onNodeClick,
  onThemeExtracted,
  onControversyDetected,
  height = 600,
}: KnowledgeMapVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [minWeight, setMinWeight] = useState(0);
  const [simulation, setSimulation] = useState<d3.Simulation<any, any> | null>(
    null
  );
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [themes, setThemes] = useState<string[]>([]);
  const [controversies, setControversies] = useState<any[]>([]);

  // Update dimensions on container resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  // Extract themes from nodes
  const extractThemes = useCallback(() => {
    const themeNodes = nodes.filter(n => n.type === 'theme');
    const extractedThemes = themeNodes.map(n => n.label);

    // Also extract themes from keywords using clustering
    const keywordNodes = nodes.filter(n => n.type === 'keyword');
    const clusters = performClustering(keywordNodes, links);
    const clusterThemes = clusters.map(c => c.theme);

    const allThemes = [...new Set([...extractedThemes, ...clusterThemes])];
    setThemes(allThemes);

    if (onThemeExtracted) {
      onThemeExtracted(allThemes);
    }
  }, [nodes, links, onThemeExtracted]);

  // Detect controversies from opposing links
  const detectControversies = useCallback(() => {
    const opposingLinks = links.filter(l => l.type === 'opposes');
    const controversialNodes = new Set<string>();

    opposingLinks.forEach(link => {
      controversialNodes.add(link.source);
      controversialNodes.add(link.target);
    });

    const detectedControversies = Array.from(controversialNodes).map(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      const relatedOppositions = opposingLinks.filter(
        l => l.source === nodeId || l.target === nodeId
      );

      return {
        nodeId,
        node,
        oppositions: relatedOppositions,
        strength: relatedOppositions.reduce((sum, l) => sum + l.strength, 0),
      };
    });

    setControversies(detectedControversies);

    if (onControversyDetected) {
      detectedControversies.forEach(c => onControversyDetected(c));
    }
  }, [nodes, links, onControversyDetected]);

  // Perform clustering for theme extraction
  const performClustering = (
    keywordNodes: KnowledgeNode[],
    links: KnowledgeLink[]
  ) => {
    // Simple clustering based on connectivity
    const clusters: any[] = [];
    const visited = new Set<string>();

    keywordNodes.forEach(node => {
      if (!visited.has(node.id)) {
        const cluster = {
          nodes: [node],
          theme: node.label,
          weight: node.weight,
        };

        // Find connected nodes
        const queue = [node.id];
        visited.add(node.id);

        while (queue.length > 0) {
          const currentId = queue.shift()!;
          const connectedLinks = links.filter(
            l =>
              (l.source === currentId || l.target === currentId) &&
              l.type === 'related' &&
              l.strength > 0.5
          );

          connectedLinks.forEach(link => {
            const otherId =
              link.source === currentId ? link.target : link.source;
            if (!visited.has(otherId)) {
              const otherNode = keywordNodes.find(n => n.id === otherId);
              if (otherNode) {
                cluster.nodes.push(otherNode);
                cluster.weight += otherNode.weight;
                queue.push(otherId);
                visited.add(otherId);
              }
            }
          });
        }

        if (cluster.nodes.length > 2) {
          // Generate theme name from most common words
          const words = cluster.nodes.flatMap(n => n.label.split(' '));
          const wordCount = words.reduce(
            (acc, word) => {
              acc[word] = (acc[word] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );

          const sortedWords = Object.entries(wordCount).sort(
            ([, a], [, b]) => b - a
          );

          if (sortedWords.length > 0 && sortedWords[0]) {
            const topWord = sortedWords[0][0];
            cluster.theme = `${topWord} Cluster`;
          } else {
            cluster.theme = 'Unknown Cluster';
          }
          clusters.push(cluster);
        }
      }
    });

    return clusters;
  };

  // Filter nodes and links based on search and filters
  const getFilteredData = useCallback(() => {
    let filteredNodes = nodes;
    let filteredLinks = links;

    // Filter by type
    if (filterType !== 'all') {
      filteredNodes = nodes.filter(n => n.type === filterType);
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      filteredLinks = links.filter(
        l => nodeIds.has(l.source) && nodeIds.has(l.target)
      );
    }

    // Filter by weight
    filteredNodes = filteredNodes.filter(n => n.weight >= minWeight);
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    filteredLinks = filteredLinks.filter(
      l => nodeIds.has(l.source) && nodeIds.has(l.target)
    );

    // Filter by search term
    if (searchTerm) {
      filteredNodes = filteredNodes.filter(n =>
        n.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const searchNodeIds = new Set(filteredNodes.map(n => n.id));
      filteredLinks = filteredLinks.filter(
        l => searchNodeIds.has(l.source) || searchNodeIds.has(l.target)
      );
    }

    return { filteredNodes, filteredLinks };
  }, [nodes, links, filterType, minWeight, searchTerm]);

  // Main D3 visualization
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { filteredNodes, filteredLinks } = getFilteredData();

    // Create container for zoom
    const container = svg.append('g');

    // Setup zoom behavior
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', event => {
        container.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    // Color scales
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(['paper', 'concept', 'author', 'keyword', 'theme', 'controversy'])
      .range([
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#8B5CF6',
        '#EC4899',
        '#EF4444',
      ]);

    // Size scale
    const sizeScale = d3
      .scaleLinear()
      .domain([0, d3.max(filteredNodes, d => d.weight) || 1])
      .range([5, 20]);

    // Create force simulation
    const sim = d3
      .forceSimulation(filteredNodes as any)
      .force(
        'link',
        d3
          .forceLink(filteredLinks as any)
          .id((d: any) => d.id)
          .distance(d => 100 / (d as any).strength)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force(
        'center',
        d3.forceCenter(dimensions.width / 2, dimensions.height / 2)
      )
      .force(
        'collision',
        d3.forceCollide().radius((d: any) => sizeScale(d.weight) + 5)
      );

    setSimulation(sim);

    // Create links
    const link = container
      .append('g')
      .selectAll('line')
      .data(filteredLinks)
      .enter()
      .append('line')
      .attr('stroke', d => {
        if (d.type === 'opposes') return '#EF4444';
        if (d.type === 'supports') return '#10B981';
        if (d.type === 'theme') return '#8B5CF6';
        return '#94A3B8';
      })
      .attr('stroke-width', d => Math.sqrt(d.strength * 3))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', d => (d.type === 'opposes' ? '5,5' : 'none'));

    // Create nodes
    const node = container
      .append('g')
      .selectAll('g')
      .data(filteredNodes)
      .enter()
      .append('g')
      .call(
        d3
          .drag<any, any>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended) as any
      );

    // Add circles to nodes
    node
      .append('circle')
      .attr('r', d => sizeScale(d.weight))
      .attr('fill', d => colorScale(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Add controversy indicator
    node
      .filter(d => d.metadata?.controversial === true)
      .append('circle')
      .attr('r', d => sizeScale(d.weight) + 5)
      .attr('fill', 'none')
      .attr('stroke', '#EF4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,3');

    // Add labels
    node
      .append('text')
      .text(d => d.label)
      .attr('font-size', '10px')
      .attr('dx', d => sizeScale(d.weight) + 5)
      .attr('dy', 3)
      .style('pointer-events', 'none');

    // Node click handler
    node.on('click', (_event, d) => {
      setSelectedNode(d);
      if (onNodeClick) {
        onNodeClick(d);
      }
    });

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px');

    node
      .on('mouseover', (_event, d) => {
        tooltip.style('visibility', 'visible').html(`
          <strong>${d.label}</strong><br/>
          Type: ${d.type}<br/>
          Weight: ${d.weight.toFixed(2)}<br/>
          ${d.metadata?.citations ? `Citations: ${d.metadata.citations}<br/>` : ''}
          ${d.metadata?.year ? `Year: ${d.metadata.year}<br/>` : ''}
          ${d.metadata?.controversial ? '<span style="color: #EF4444">⚠ Controversial</span>' : ''}
        `);
      })
      .on('mousemove', event => {
        tooltip
          .style('top', event.pageY - 10 + 'px')
          .style('left', event.pageX + 10 + 'px');
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden');
      });

    // Update positions on simulation tick
    sim.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) sim.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) sim.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Extract themes and detect controversies
    extractThemes();
    detectControversies();

    // Cleanup
    return () => {
      sim.stop();
      tooltip.remove();
    };
  }, [dimensions, getFilteredData, extractThemes, detectControversies]);

  // Zoom controls
  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg
      .transition()
      .call(d3.zoom<SVGSVGElement, unknown>().scaleTo as any, zoom * 1.2);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg
      .transition()
      .call(d3.zoom<SVGSVGElement, unknown>().scaleTo as any, zoom * 0.8);
  };

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(d3.zoom<SVGSVGElement, unknown>().scaleTo as any, 1);
  };

  const handleExport = () => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'knowledge-map.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const restartSimulation = () => {
    if (simulation) {
      simulation.alpha(1).restart();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Knowledge Map Visualization</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {nodes.length} nodes, {links.length} links
            </Badge>
            {themes.length > 0 && (
              <Badge variant="outline" className="bg-purple-50">
                {themes.length} themes
              </Badge>
            )}
            {controversies.length > 0 && (
              <Badge variant="destructive">
                {controversies.length} controversies
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="mb-4 space-y-3">
          {/* Search and Filter Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="paper">Papers</SelectItem>
                <SelectItem value="concept">Concepts</SelectItem>
                <SelectItem value="author">Authors</SelectItem>
                <SelectItem value="keyword">Keywords</SelectItem>
                <SelectItem value="theme">Themes</SelectItem>
                <SelectItem value="controversy">Controversies</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Min Weight:
              </span>
              <Slider
                value={[minWeight]}
                onValueChange={([value]) => setMinWeight(value || 0)}
                min={0}
                max={10}
                step={0.5}
                className="flex-1"
              />
              <span className="text-sm font-medium w-8">{minWeight}</span>
            </div>
          </div>

          {/* Zoom and Action Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetZoom}
                title="Reset View"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <div className="mx-2 text-sm text-muted-foreground">
                {Math.round(zoom * 100)}%
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={restartSimulation}
                title="Restart Animation"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                title="Export SVG"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Themes Display */}
          {themes.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Extracted Themes:</span>
              {themes.slice(0, 5).map((theme, idx) => (
                <Badge key={idx} variant="secondary" className="bg-purple-100">
                  {theme}
                </Badge>
              ))}
              {themes.length > 5 && (
                <span className="text-sm text-muted-foreground">
                  +{themes.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* Selected Node Info */}
          {selectedNode && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{selectedNode.label}</h4>
                  <p className="text-sm text-muted-foreground">
                    Type: {selectedNode.type} | Weight:{' '}
                    {selectedNode.weight.toFixed(2)}
                    {selectedNode.metadata?.citations &&
                      ` | Citations: ${selectedNode.metadata.citations}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedNode(null)}
                >
                  ×
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Visualization */}
        <div
          ref={containerRef}
          className="border rounded-lg bg-muted/10 overflow-hidden"
        >
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            style={{ display: 'block' }}
          />
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Paper</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Concept</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Author</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Keyword</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500" />
            <span>Theme</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Controversy</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
