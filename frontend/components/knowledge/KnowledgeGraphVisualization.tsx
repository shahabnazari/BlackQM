'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Search,
  Filter,
  Layers,
  Eye,
  EyeOff,
  Shuffle,
  BookOpen,
  FileText,
  Target,
  Brain,
  Link,
  Activity,
} from 'lucide-react';

// Types
interface KnowledgeNode {
  id: string;
  type: 'paper' | 'theme' | 'study' | 'finding' | 'gap' | 'statement';
  label: string;
  description?: string;
  metadata?: {
    year?: number;
    authors?: string[];
    citations?: number;
    confidence?: number;
    importance?: number;
    status?: 'confirmed' | 'novel' | 'contradictory' | 'pending';
  };
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface KnowledgeEdge {
  source: string;
  target: string;
  type:
    | 'cites'
    | 'informs'
    | 'contradicts'
    | 'confirms'
    | 'extends'
    | 'addresses';
  strength: number;
  label?: string;
}

interface GraphData {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

interface KnowledgeGraphVisualizationProps {
  studyId?: string;
  data?: GraphData;
  height?: number;
  onNodeClick?: (node: KnowledgeNode) => void;
  onEdgeClick?: (edge: KnowledgeEdge) => void;
}

// Node type configurations
const NODE_CONFIGS = {
  paper: {
    color: '#8B5CF6',
    icon: BookOpen,
    size: 8,
    label: 'Paper',
  },
  theme: {
    color: '#10B981',
    icon: Brain,
    size: 10,
    label: 'Theme',
  },
  study: {
    color: '#3B82F6',
    icon: FileText,
    size: 12,
    label: 'Study',
  },
  finding: {
    color: '#F59E0B',
    icon: Target,
    size: 9,
    label: 'Finding',
  },
  gap: {
    color: '#EF4444',
    icon: Activity,
    size: 7,
    label: 'Research Gap',
  },
  statement: {
    color: '#6366F1',
    icon: Link,
    size: 6,
    label: 'Statement',
  },
};

// Edge type configurations
const EDGE_CONFIGS = {
  cites: { color: '#94A3B8', dasharray: 'none', label: 'Cites' },
  informs: { color: '#10B981', dasharray: 'none', label: 'Informs' },
  contradicts: { color: '#EF4444', dasharray: '5,5', label: 'Contradicts' },
  confirms: { color: '#22C55E', dasharray: 'none', label: 'Confirms' },
  extends: { color: '#3B82F6', dasharray: '3,3', label: 'Extends' },
  addresses: { color: '#F59E0B', dasharray: 'none', label: 'Addresses' },
};

export default function KnowledgeGraphVisualization({
  studyId,
  data: propData,
  height = 600,
  onNodeClick,
  onEdgeClick,
}: KnowledgeGraphVisualizationProps) {
  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<
    KnowledgeNode,
    KnowledgeEdge
  > | null>(null);

  // State
  const [graphData, setGraphData] = useState<GraphData>(
    propData || { nodes: [], edges: [] }
  );
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<KnowledgeEdge | null>(null);
  const [hoveredNode, setHoveredNode] = useState<KnowledgeNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [linkStrength, setLinkStrength] = useState(50);
  const [nodeSize, setNodeSize] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [layoutType, setLayoutType] = useState<
    'force' | 'hierarchical' | 'radial'
  >('force');
  const [isLoading, setIsLoading] = useState(!propData);
  const [dimensions, setDimensions] = useState({ width: 0, height });

  // Memoized calculations
  const filteredData = useMemo(() => {
    let nodes = [...graphData.nodes];
    let edges = [...graphData.edges];

    // Apply type filter
    if (filterType !== 'all') {
      nodes = nodes.filter(n => n.type === filterType);
      const nodeIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(
        e =>
          nodeIds.has(
            typeof e.source === 'object' ? (e.source as any).id : e.source
          ) &&
          nodeIds.has(
            typeof e.target === 'object' ? (e.target as any).id : e.target
          )
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      nodes = nodes.filter(
        n =>
          n.label.toLowerCase().includes(query) ||
          n.description?.toLowerCase().includes(query)
      );
      const nodeIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(
        e =>
          nodeIds.has(
            typeof e.source === 'object' ? (e.source as any).id : e.source
          ) &&
          nodeIds.has(
            typeof e.target === 'object' ? (e.target as any).id : e.target
          )
      );
    }

    return { nodes, edges };
  }, [graphData, filterType, searchQuery]);

  // Statistics
  const graphStats = useMemo(() => {
    const nodesByType = filteredData.nodes.reduce(
      (acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const edgesByType = filteredData.edges.reduce(
      (acc, edge) => {
        acc[edge.type] = (acc[edge.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const avgDegree =
      (filteredData.edges.length / Math.max(filteredData.nodes.length, 1)) * 2;
    const density =
      (2 * filteredData.edges.length) /
      (filteredData.nodes.length * (filteredData.nodes.length - 1));

    return { nodesByType, edgesByType, avgDegree, density };
  }, [filteredData]);

  // Load data from API
  useEffect(() => {
    if (!propData && studyId) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        // This would be replaced with actual API call
        const mockData: GraphData = generateMockData();
        setGraphData(mockData);
        setIsLoading(false);
      }, 1500);
    }
  }, [studyId, propData]);

  // Update dimensions on resize
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

  // D3 Force Simulation
  useEffect(() => {
    if (
      !svgRef.current ||
      dimensions.width === 0 ||
      filteredData.nodes.length === 0
    )
      return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width;
    const height = dimensions.height;

    // Create container groups
    const g = svg.append('g');
    const linksGroup = g.append('g').attr('class', 'links');
    const nodesGroup = g.append('g').attr('class', 'nodes');
    const labelsGroup = g.append('g').attr('class', 'labels');

    // Setup zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', event => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create force simulation
    const simulation = d3
      .forceSimulation<KnowledgeNode>(filteredData.nodes)
      .force(
        'link',
        d3
          .forceLink<KnowledgeNode, KnowledgeEdge>(filteredData.edges)
          .id((d: any) => d.id)
          .distance(100)
          .strength(linkStrength / 100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    simulationRef.current = simulation;

    // Draw edges
    const links = linksGroup
      .selectAll('line')
      .data(filteredData.edges)
      .enter()
      .append('line')
      .attr('stroke', d => EDGE_CONFIGS[d.type].color)
      .attr('stroke-width', d => Math.sqrt(d.strength) * 2)
      .attr('stroke-dasharray', d => EDGE_CONFIGS[d.type].dasharray)
      .attr('opacity', 0.6)
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedEdge(d);
        onEdgeClick?.(d);
      })
      .on('mouseenter', function (_event, d) {
        d3.select(this)
          .attr('stroke-width', Math.sqrt(d.strength) * 3)
          .attr('opacity', 1);
      })
      .on('mouseleave', function (_event, d) {
        d3.select(this)
          .attr('stroke-width', Math.sqrt(d.strength) * 2)
          .attr('opacity', 0.6);
      });

    // Draw nodes
    const nodes = nodesGroup
      .selectAll('circle')
      .data(filteredData.nodes)
      .enter()
      .append('circle')
      .attr('r', d => NODE_CONFIGS[d.type].size * nodeSize)
      .attr('fill', d => NODE_CONFIGS[d.type].color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
        onNodeClick?.(d);
      })
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr('r', NODE_CONFIGS[d.type].size * nodeSize * 1.5);
      })
      .on('mouseleave', (event, d) => {
        setHoveredNode(null);
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr('r', NODE_CONFIGS[d.type].size * nodeSize);
      })
      .call(
        d3
          .drag<SVGCircleElement, KnowledgeNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x || 0;
            d.fy = d.y || 0;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            (d as any).fx = null;
            (d as any).fy = null;
          }) as any
      );

    // Draw labels
    if (showLabels) {
      labelsGroup
        .selectAll('text')
        .data(filteredData.nodes)
        .enter()
        .append('text')
        .text(d => d.label)
        .attr('font-size', '10px')
        .attr('dx', 12)
        .attr('dy', 4)
        .style('pointer-events', 'none')
        .style('user-select', 'none');
    }

    // Update positions on tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodes.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      if (showLabels) {
        labelsGroup
          .selectAll('text')
          .attr('x', (d: any) => d.x)
          .attr('y', (d: any) => d.y);
      }
    });

    // Apply layout type
    applyLayout(simulation, layoutType, filteredData.nodes, width, height);

    return () => {
      simulation.stop();
    };
  }, [
    filteredData,
    dimensions,
    linkStrength,
    nodeSize,
    showLabels,
    layoutType,
    onNodeClick,
    onEdgeClick,
  ]);

  // Layout functions
  const applyLayout = (
    simulation: d3.Simulation<KnowledgeNode, KnowledgeEdge>,
    type: string,
    nodes: KnowledgeNode[],
    width: number,
    height: number
  ) => {
    switch (type) {
      case 'hierarchical':
        // Arrange nodes in hierarchical layout
        const nodesByType = d3.group(nodes, d => d.type);
        const types = [
          'paper',
          'theme',
          'study',
          'finding',
          'gap',
          'statement',
        ];
        let yPos = 50;

        types.forEach(type => {
          const typeNodes = nodesByType.get(type as any) || [];
          const xStep = width / (typeNodes.length + 1);
          typeNodes.forEach((node, i) => {
            node.fx = xStep * (i + 1);
            node.fy = yPos;
          });
          yPos += height / types.length;
        });
        simulation.alpha(1).restart();
        break;

      case 'radial':
        // Arrange nodes in radial layout
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;
        const angleStep = (2 * Math.PI) / nodes.length;

        nodes.forEach((node, i) => {
          const angle = i * angleStep;
          node.fx = centerX + radius * Math.cos(angle);
          node.fy = centerY + radius * Math.sin(angle);
        });
        simulation.alpha(1).restart();
        break;

      default:
        // Force layout - release fixed positions
        nodes.forEach(node => {
          (node as any).fx = null;
          (node as any).fy = null;
        });
        simulation.alpha(1).restart();
    }
  };

  // Control functions
  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg
      .transition()
      .call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg
      .transition()
      .call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.7);
  };

  const handleZoomReset = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg
      .transition()
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity
      );
  };

  const handleExport = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'knowledge-graph.svg';
    link.click();
  };

  const handleRandomLayout = () => {
    if (!simulationRef.current) return;
    filteredData.nodes.forEach(node => {
      node.x = Math.random() * dimensions.width;
      node.y = Math.random() * dimensions.height;
    });
    simulationRef.current.alpha(1).restart();
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center h-[600px]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
          />
          <p className="mt-4 text-gray-600">Loading knowledge graph...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Knowledge Graph</h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredData.nodes.length} nodes, {filteredData.edges.length}{' '}
              connections
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleZoomReset}>
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleRandomLayout}>
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b p-4 space-y-4">
        <div className="flex gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(NODE_CONFIGS).map(([type, config]) => (
                <SelectItem key={type} value={type}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Layout */}
          <Select value={layoutType} onValueChange={setLayoutType as any}>
            <SelectTrigger className="w-[180px]">
              <Layers className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="force">Force Layout</SelectItem>
              <SelectItem value="hierarchical">Hierarchical</SelectItem>
              <SelectItem value="radial">Radial</SelectItem>
            </SelectContent>
          </Select>

          {/* Labels Toggle */}
          <Button
            size="sm"
            variant={showLabels ? 'default' : 'outline'}
            onClick={() => setShowLabels(!showLabels)}
          >
            {showLabels ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Advanced Controls */}
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Link Strength</label>
            <Slider
              value={[linkStrength]}
              onValueChange={([v]) => setLinkStrength(v || 50)}
              min={0}
              max={100}
              step={10}
              className="w-32"
            />
            <span className="text-sm text-gray-600">{linkStrength}%</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Node Size</label>
            <Slider
              value={[nodeSize]}
              onValueChange={([v]) => setNodeSize(v || 1)}
              min={0.5}
              max={2}
              step={0.1}
              className="w-32"
            />
            <span className="text-sm text-gray-600">
              {nodeSize.toFixed(1)}x
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[600px]">
        {/* Graph */}
        <div ref={containerRef} className="flex-1 relative">
          <svg ref={svgRef} width="100%" height="100%" />

          {/* Hover Info */}
          <AnimatePresence>
            {hoveredNode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-4 left-4 bg-white border rounded-lg shadow-lg p-3 max-w-xs"
              >
                <div className="flex items-start gap-2">
                  {React.createElement(NODE_CONFIGS[hoveredNode.type].icon, {
                    className: 'w-5 h-5 mt-0.5',
                    style: { color: NODE_CONFIGS[hoveredNode.type].color },
                  })}
                  <div className="flex-1">
                    <h4 className="font-medium">{hoveredNode.label}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {hoveredNode.description ||
                        `${NODE_CONFIGS[hoveredNode.type].label}`}
                    </p>
                    {hoveredNode.metadata && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {hoveredNode.metadata.year && (
                          <Badge variant="secondary">
                            {hoveredNode.metadata.year}
                          </Badge>
                        )}
                        {hoveredNode.metadata.citations && (
                          <Badge variant="secondary">
                            {hoveredNode.metadata.citations} citations
                          </Badge>
                        )}
                        {hoveredNode.metadata.confidence && (
                          <Badge variant="secondary">
                            {Math.round(hoveredNode.metadata.confidence * 100)}%
                            confidence
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side Panel */}
        <div className="w-80 border-l p-4 overflow-y-auto">
          <Tabs defaultValue="stats">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="legend">Legend</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="space-y-4 mt-4">
              <div>
                <h4 className="font-medium mb-2">Graph Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Degree</span>
                    <span className="font-medium">
                      {graphStats.avgDegree.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Density</span>
                    <span className="font-medium">
                      {(graphStats.density * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Node Distribution</h4>
                <div className="space-y-2">
                  {Object.entries(graphStats.nodesByType).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                NODE_CONFIGS[type as keyof typeof NODE_CONFIGS]
                                  .color,
                            }}
                          />
                          <span className="text-sm capitalize">{type}</span>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Edge Types</h4>
                <div className="space-y-2">
                  {Object.entries(graphStats.edgesByType).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize">{type}</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="legend" className="space-y-4 mt-4">
              <div>
                <h4 className="font-medium mb-2">Node Types</h4>
                <div className="space-y-2">
                  {Object.entries(NODE_CONFIGS).map(([type, config]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-sm">{config.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Edge Types</h4>
                <div className="space-y-2">
                  {Object.entries(EDGE_CONFIGS).map(([type, config]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className="flex items-center">
                        <div
                          className="w-8 h-0.5"
                          style={{
                            backgroundColor: config.color,
                            borderTop:
                              config.dasharray !== 'none'
                                ? `2px dashed ${config.color}`
                                : 'none',
                          }}
                        />
                      </div>
                      <span className="text-sm">{config.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              {selectedNode ? (
                <div>
                  <h4 className="font-medium mb-2">Selected Node</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Type</span>
                      <p className="font-medium capitalize">
                        {selectedNode.type}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Label</span>
                      <p className="font-medium">{selectedNode.label}</p>
                    </div>
                    {selectedNode.description && (
                      <div>
                        <span className="text-sm text-gray-600">
                          Description
                        </span>
                        <p className="text-sm">{selectedNode.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedEdge ? (
                <div>
                  <h4 className="font-medium mb-2">Selected Edge</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Type</span>
                      <p className="font-medium capitalize">
                        {selectedEdge.type}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Strength</span>
                      <p className="font-medium">
                        {selectedEdge.strength.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Click on a node or edge to see details
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Card>
  );
}

// Mock data generator for testing
function generateMockData(): GraphData {
  const nodes: KnowledgeNode[] = [
    { id: 'study1', type: 'study', label: 'Climate Opinion Study 2024' },
    {
      id: 'paper1',
      type: 'paper',
      label: 'Smith et al. (2023)',
      metadata: { year: 2023, citations: 45 },
    },
    {
      id: 'paper2',
      type: 'paper',
      label: 'Johnson & Lee (2024)',
      metadata: { year: 2024, citations: 12 },
    },
    {
      id: 'paper3',
      type: 'paper',
      label: 'Brown (2022)',
      metadata: { year: 2022, citations: 78 },
    },
    {
      id: 'theme1',
      type: 'theme',
      label: 'Public Perception',
      metadata: { importance: 0.9 },
    },
    {
      id: 'theme2',
      type: 'theme',
      label: 'Policy Support',
      metadata: { importance: 0.7 },
    },
    {
      id: 'theme3',
      type: 'theme',
      label: 'Economic Concerns',
      metadata: { importance: 0.8 },
    },
    {
      id: 'finding1',
      type: 'finding',
      label: 'Strong consensus on action',
      metadata: { confidence: 0.85, status: 'confirmed' },
    },
    {
      id: 'finding2',
      type: 'finding',
      label: 'Divided on economic impact',
      metadata: { confidence: 0.6, status: 'novel' },
    },
    { id: 'gap1', type: 'gap', label: 'Youth perspectives understudied' },
    { id: 'gap2', type: 'gap', label: 'Rural-urban divide unexplored' },
    { id: 'stmt1', type: 'statement', label: 'Climate change is urgent' },
    { id: 'stmt2', type: 'statement', label: 'Economic growth vs environment' },
    { id: 'stmt3', type: 'statement', label: 'Individual action matters' },
  ];

  const edges: KnowledgeEdge[] = [
    { source: 'paper1', target: 'theme1', type: 'informs', strength: 0.8 },
    { source: 'paper2', target: 'theme1', type: 'informs', strength: 0.7 },
    { source: 'paper3', target: 'theme2', type: 'informs', strength: 0.9 },
    { source: 'theme1', target: 'study1', type: 'informs', strength: 0.85 },
    { source: 'theme2', target: 'study1', type: 'informs', strength: 0.75 },
    { source: 'theme3', target: 'study1', type: 'informs', strength: 0.6 },
    { source: 'study1', target: 'finding1', type: 'confirms', strength: 0.9 },
    { source: 'study1', target: 'finding2', type: 'extends', strength: 0.7 },
    { source: 'finding1', target: 'paper1', type: 'confirms', strength: 0.8 },
    {
      source: 'finding2',
      target: 'paper3',
      type: 'contradicts',
      strength: 0.5,
    },
    { source: 'gap1', target: 'study1', type: 'addresses', strength: 0.6 },
    { source: 'gap2', target: 'theme3', type: 'addresses', strength: 0.4 },
    { source: 'theme1', target: 'stmt1', type: 'informs', strength: 0.9 },
    { source: 'theme2', target: 'stmt2', type: 'informs', strength: 0.8 },
    { source: 'theme3', target: 'stmt3', type: 'informs', strength: 0.7 },
    { source: 'paper1', target: 'paper2', type: 'cites', strength: 0.3 },
    { source: 'paper2', target: 'paper3', type: 'cites', strength: 0.4 },
  ];

  return { nodes, edges };
}
