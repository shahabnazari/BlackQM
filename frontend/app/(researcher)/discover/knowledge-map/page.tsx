/**
 * Knowledge Mapping Tool - DISCOVER Phase
 * World-class implementation for research concept visualization
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Search,
  // Filter, // Unused
  Circle,
  // Square,
  // Triangle,
  // Hexagon,
  Trash2,
  Lock,
  Unlock,
  Sparkles,
  // Brain, // Unused
  // BookOpen,
  // Users,
  GitBranch,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Node {
  id: string;
  label: string;
  type: 'concept' | 'theory' | 'method' | 'finding' | 'author' | 'paper';
  x: number;
  y: number;
  size: number;
  color: string;
  description?: string;
  tags?: string[];
  references?: string[];
  locked?: boolean;
  hidden?: boolean;
  cluster?: string;
  importance: number;
  connections: number;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: 'relates' | 'supports' | 'contradicts' | 'extends' | 'uses' | 'cites';
  strength: number;
  label?: string;
  bidirectional?: boolean;
  style?: 'solid' | 'dashed' | 'dotted';
}

interface Cluster {
  id: string;
  name: string;
  color: string;
  nodes: string[];
}

// interface MapView {
//   id: string;
//   name: string;
//   zoom: number;
//   centerX: number;
//   centerY: number;
//   visibleNodes: string[];
//   visibleEdges: string[];
// }

// const NODE_SHAPES = {
//   concept: Circle,
//   theory: Square,
//   method: Triangle,
//   finding: Hexagon,
//   author: Users,
//   paper: BookOpen
// };

const NODE_COLORS = {
  concept: '#8B5CF6',
  theory: '#3B82F6',
  method: '#10B981',
  finding: '#F59E0B',
  author: '#EF4444',
  paper: '#6B7280'
};

const EDGE_COLORS = {
  relates: '#6B7280',
  supports: '#10B981',
  contradicts: '#EF4444',
  extends: '#3B82F6',
  uses: '#8B5CF6',
  cites: '#F59E0B'
};

export default function KnowledgeMapPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [clusters] = useState<Cluster[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  // const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null); // Unused
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  // const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d'); // Unused
  const [layoutMode, setLayoutMode] = useState<'force' | 'hierarchical' | 'circular' | 'grid'>('force');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const [autoLayout, setAutoLayout] = useState(true);

  // Initialize with sample data
  useEffect(() => {
    const sampleNodes: Node[] = [
      {
        id: '1',
        label: 'Q Methodology',
        type: 'concept',
        x: 400,
        y: 300,
        size: 40,
        color: NODE_COLORS.concept,
        description: 'A research method for studying subjectivity',
        tags: ['methodology', 'subjectivity', 'mixed-methods'],
        importance: 10,
        connections: 5
      },
      {
        id: '2',
        label: 'Factor Analysis',
        type: 'method',
        x: 300,
        y: 200,
        size: 30,
        color: NODE_COLORS.method,
        description: 'Statistical method for Q methodology',
        tags: ['statistics', 'analysis'],
        importance: 8,
        connections: 3
      },
      {
        id: '3',
        label: 'Stephenson, W.',
        type: 'author',
        x: 500,
        y: 200,
        size: 25,
        color: NODE_COLORS.author,
        description: 'Founder of Q methodology',
        tags: ['founder', 'psychology'],
        importance: 9,
        connections: 4
      },
      {
        id: '4',
        label: 'Subjectivity Theory',
        type: 'theory',
        x: 400,
        y: 400,
        size: 35,
        color: NODE_COLORS.theory,
        description: 'Theoretical foundation of Q methodology',
        tags: ['theory', 'psychology'],
        importance: 9,
        connections: 3
      },
      {
        id: '5',
        label: 'Q-Sort Technique',
        type: 'method',
        x: 250,
        y: 350,
        size: 30,
        color: NODE_COLORS.method,
        description: 'Data collection method in Q studies',
        tags: ['data-collection', 'sorting'],
        importance: 8,
        connections: 2
      }
    ];

    const sampleEdges: Edge[] = [
      {
        id: 'e1',
        source: '1',
        target: '2',
        type: 'uses',
        strength: 0.9,
        label: 'employs'
      },
      {
        id: 'e2',
        source: '3',
        target: '1',
        type: 'relates',
        strength: 1.0,
        label: 'invented'
      },
      {
        id: 'e3',
        source: '1',
        target: '4',
        type: 'supports',
        strength: 0.8,
        label: 'based on'
      },
      {
        id: 'e4',
        source: '1',
        target: '5',
        type: 'uses',
        strength: 0.9,
        label: 'utilizes'
      },
      {
        id: 'e5',
        source: '5',
        target: '2',
        type: 'relates',
        strength: 0.7,
        label: 'analyzed by'
      }
    ];

    setNodes(sampleNodes);
    setEdges(sampleEdges);
  }, []);

  // Render the knowledge map on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Filter nodes and edges
    const filteredNodes = nodes.filter(node => {
      if (node.hidden) return false;
      if (filterType !== 'all' && node.type !== filterType) return false;
      if (searchQuery && !node.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    const filteredEdges = edges.filter(edge => {
      const sourceVisible = filteredNodes.some(n => n.id === edge.source);
      const targetVisible = filteredNodes.some(n => n.id === edge.target);
      return sourceVisible && targetVisible;
    });

    // Draw edges
    if (showEdges) {
      filteredEdges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        
        // Draw curved edges for better visibility
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        const curve = 20;
        
        ctx.quadraticCurveTo(
          midX + curve,
          midY - curve,
          target.x,
          target.y
        );

        ctx.strokeStyle = EDGE_COLORS[edge.type] + '80';
        ctx.lineWidth = edge.strength * 3;
        
        if (edge.style === 'dashed') {
          ctx.setLineDash([5, 5]);
        } else if (edge.style === 'dotted') {
          ctx.setLineDash([2, 2]);
        }
        
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw edge label
        if (edge.label && showLabels) {
          ctx.fillStyle = '#6B7280';
          ctx.font = '10px sans-serif';
          ctx.fillText(edge.label, midX, midY);
        }
      });
    }

    // Draw nodes
    filteredNodes.forEach(node => {
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;

      // Node shadow
      if (isSelected || isHovered) {
        ctx.shadowColor = node.color + '40';
        ctx.shadowBlur = 20;
      }

      // Draw node
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
      ctx.fillStyle = node.color + (isSelected ? 'FF' : 'DD');
      ctx.fill();
      
      if (isSelected) {
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // Draw label
      if (showLabels) {
        ctx.fillStyle = '#1F2937';
        ctx.font = `${12 + node.importance}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.size + 15);
      }

      // Draw lock icon if locked
      if (node.locked) {
        ctx.fillStyle = '#6B7280';
        ctx.font = '10px sans-serif';
        ctx.fillText('🔒', node.x - 5, node.y);
      }
    });

    ctx.restore();
  }, [nodes, edges, zoom, pan, selectedNode, hoveredNode, showLabels, showEdges, filterType, searchQuery]);

  // Handle mouse events
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Check if clicking on a node
    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.size;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Check if hovering over a node
    const hoveredNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.size;
    });

    setHoveredNode(hoveredNode || null);

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Auto-layout algorithms
  const applyForceLayout = () => {
    // Simple force-directed layout
    const iterations = 50;
    const k = 100; // Ideal distance between nodes
    
    for (let iter = 0; iter < iterations; iter++) {
      const forces = new Map<string, { fx: number; fy: number }>();
      
      // Initialize forces
      nodes.forEach(node => {
        forces.set(node.id, { fx: 0, fy: 0 });
      });
      
      // Repulsive forces between all nodes
      nodes.forEach(node1 => {
        nodes.forEach(node2 => {
          if (node1.id === node2.id) return;
          
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const force = (k * k) / distance;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            const f1 = forces.get(node1.id)!;
            f1.fx -= fx;
            f1.fy -= fy;
          }
        });
      });
      
      // Attractive forces for connected nodes
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return;
        
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const force = (distance * distance) / k;
          const fx = (dx / distance) * force * edge.strength;
          const fy = (dy / distance) * force * edge.strength;
          
          const fs = forces.get(source.id)!;
          const ft = forces.get(target.id)!;
          fs.fx += fx * 0.1;
          fs.fy += fy * 0.1;
          ft.fx -= fx * 0.1;
          ft.fy -= fy * 0.1;
        }
      });
      
      // Apply forces
      nodes.forEach(node => {
        if (node.locked) return;
        
        const force = forces.get(node.id)!;
        node.x += force.fx * 0.01;
        node.y += force.fy * 0.01;
      });
    }
    
    setNodes([...nodes]);
  };

  // Add new node
  const addNode = (type: Node['type']) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      label: `New ${type}`,
      type,
      x: 400 + Math.random() * 200 - 100,
      y: 300 + Math.random() * 200 - 100,
      size: 25,
      color: NODE_COLORS[type],
      importance: 5,
      connections: 0
    };
    
    setNodes([...nodes, newNode]);
  };

  // Add edge between selected nodes
  const addEdge = (type: Edge['type']) => {
    if (!selectedNode) return;
    
    // For demo, create edge to a random node
    const otherNodes = nodes.filter(n => n.id !== selectedNode.id);
    if (otherNodes.length === 0) return;
    
    const target = otherNodes[Math.floor(Math.random() * otherNodes.length)];
    
    const newEdge: Edge = {
      id: `edge-${Date.now()}`,
      source: selectedNode.id,
      target: target?.id || '',
      type,
      strength: 0.5
    };
    
    setEdges([...edges, newEdge]);
  };

  // Export map
  const exportMap = (format: 'json' | 'svg' | 'png') => {
    if (format === 'json') {
      const data = {
        nodes,
        edges,
        clusters,
        metadata: {
          created: new Date().toISOString(),
          version: '1.0'
        }
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'knowledge-map.json';
      a.click();
    } else if (format === 'png') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'knowledge-map.png';
        a.click();
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 bg-white border-b">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Knowledge Map
              </h1>
              <Badge variant="outline">
                {nodes.length} nodes • {edges.length} edges
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant={aiMode ? "default" : "outline"}
                size="sm"
                onClick={() => setAiMode(!aiMode)}
                className={cn(
                  aiMode && "bg-gradient-to-r from-indigo-600 to-purple-600"
                )}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Assist
              </Button>
              <Select value={layoutMode} onValueChange={(value: any) => setLayoutMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="force">Force Layout</SelectItem>
                  <SelectItem value="hierarchical">Hierarchical</SelectItem>
                  <SelectItem value="circular">Circular</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={applyForceLayout}
                variant="outline"
                size="sm"
              >
                <GitBranch className="w-4 h-4 mr-2" />
                Auto Layout
              </Button>
              <Select
                value=""
                onValueChange={(format: any) => exportMap(format)}
              >
                <SelectTrigger className="w-32">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="png">PNG Image</SelectItem>
                  <SelectItem value="svg">SVG Vector</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r p-4 overflow-y-auto">
            <Tabs defaultValue="nodes">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="nodes">Nodes</TabsTrigger>
                <TabsTrigger value="edges">Edges</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
              </TabsList>
              
              <TabsContent value="nodes" className="space-y-4">
                {/* Add Node Buttons */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Add Node</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {Object.entries(NODE_COLORS).map(([type, color]) => (
                      <Button
                        key={type}
                        size="sm"
                        variant="outline"
                        onClick={() => addNode(type as Node['type'])}
                        className="text-xs"
                      >
                        <Circle className="w-3 h-3 mr-1" style={{ color }} />
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Selected Node Info */}
                {selectedNode && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        Selected Node
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedNode(null)}
                        >
                          ×
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Label</label>
                        <Input
                          value={selectedNode.label}
                          onChange={(e) => {
                            setNodes(nodes.map(n =>
                              n.id === selectedNode.id
                                ? { ...n, label: e.target.value }
                                : n
                            ));
                            setSelectedNode({ ...selectedNode, label: e.target.value });
                          }}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-600">Type</label>
                        <Badge className="mt-1" style={{ backgroundColor: selectedNode.color }}>
                          {selectedNode.type}
                        </Badge>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-600">Size</label>
                        <Slider
                          value={[selectedNode.size || 20]}
                          onValueChange={([value]) => {
                            setNodes(nodes.map(n => ({
                              ...n,
                              size: n.id === selectedNode.id ? value : (n.size || 25)
                            })));
                            setSelectedNode({ ...selectedNode, size: value });
                          }}
                          min={10}
                          max={50}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setNodes(nodes.map(n =>
                              n.id === selectedNode.id
                                ? { ...n, locked: !n.locked }
                                : n
                            ));
                            setSelectedNode({ ...selectedNode, locked: !selectedNode.locked });
                          }}
                        >
                          {selectedNode.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => {
                            setNodes(nodes.filter(n => n.id !== selectedNode.id));
                            setEdges(edges.filter(e => 
                              e.source !== selectedNode.id && e.target !== selectedNode.id
                            ));
                            setSelectedNode(null);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="edges" className="space-y-4">
                {/* Add Edge Buttons */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Add Edge</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.keys(EDGE_COLORS).map(type => (
                      <Button
                        key={type}
                        size="sm"
                        variant="outline"
                        onClick={() => addEdge(type as Edge['type'])}
                        disabled={!selectedNode}
                        className="text-xs"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                  {!selectedNode && (
                    <p className="text-xs text-gray-500 mt-2">Select a node first</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="filters" className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Search</label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search nodes..."
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Filter by Type</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.keys(NODE_COLORS).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showLabels}
                      onChange={(e) => setShowLabels(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Show Labels</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showEdges}
                      onChange={(e) => setShowEdges(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Show Edges</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoLayout}
                      onChange={(e) => setAutoLayout(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Auto Layout</span>
                  </label>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative" ref={containerRef}>
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-move"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              style={{ cursor: isDragging ? 'grabbing' : hoveredNode ? 'pointer' : 'grab' }}
            />
            
            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setZoom(Math.min(zoom * 1.2, 3))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setZoom(Math.max(zoom * 0.8, 0.3))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
              >
                <Crosshair className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Status Bar */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-2">
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>Zoom: {Math.round(zoom * 100)}%</span>
                <span>•</span>
                <span>Pan: ({Math.round(pan.x)}, {Math.round(pan.y)})</span>
                {hoveredNode && (
                  <>
                    <span>•</span>
                    <span>Hovering: {hoveredNode.label}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}