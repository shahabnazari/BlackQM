import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { Alert } from '@/components/ui/alert';
import { 
  MapIcon,
  ArrowsRightLeftIcon,
  CubeTransparentIcon,
  LinkIcon,
  ChartBarIcon,
  AdjustmentsVerticalIcon,
  MagnifyingGlassIcon,
  ShareIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';
import * as d3 from 'd3';

interface FactorNode {
  id: number;
  label: string;
  eigenvalue: number;
  variance: number;
  participants: number;
  x?: number;
  y?: number;
  cluster?: number;
}

interface FactorLink {
  source: number;
  target: number;
  strength: number;
  type: 'correlation' | 'opposition' | 'neutral';
  sharedStatements: number;
  conflictingStatements: number;
}

interface FactorCluster {
  id: number;
  name: string;
  factors: number[];
  coherence: number;
  dominantTheme: string;
  characteristics: string[];
}

interface InteractionPattern {
  pattern: 'hub-spoke' | 'bipolar' | 'triangular' | 'isolated' | 'network';
  description: string;
  factors: number[];
  implications: string[];
}

interface InteractionMetrics {
  density: number; // Network density
  centralization: number; // How centralized the network is
  clustering: number; // Clustering coefficient
  modularity: number; // Community structure strength
  polarization: number; // Degree of polarization
}

interface FactorInteractionMapperProps {
  factors: any[];
  analysisResults: any;
  narratives: any[];
  onInteractionAnalyzed?: (analysis: any) => void;
}

/**
 * FactorInteractionMapper Component - Phase 8 Day 3
 * 
 * World-class factor interaction visualization:
 * - Force-directed network graphs
 * - Cluster detection algorithms
 * - Interaction pattern recognition
 * - Multi-dimensional analysis
 * - Interactive exploration tools
 */
export function FactorInteractionMapper({
  factors,
  analysisResults,
  narratives,
  onInteractionAnalyzed
}: FactorInteractionMapperProps) {
  const [factorNodes, setFactorNodes] = useState<FactorNode[]>([]);
  const [factorLinks, setFactorLinks] = useState<FactorLink[]>([]);
  const [factorClusters, setFactorClusters] = useState<FactorCluster[]>([]);
  const [interactionPatterns, setInteractionPatterns] = useState<InteractionPattern[]>([]);
  const [interactionMetrics, setInteractionMetrics] = useState<InteractionMetrics | null>(null);
  const [visualizationType, setVisualizationType] = useState<'force' | 'matrix' | 'circular' | 'hierarchical'>('force');
  const [selectedFactor, setSelectedFactor] = useState<number | null>(null);
  const [highlightedCluster, setHighlightedCluster] = useState<number | null>(null);
  const [filterThreshold, setFilterThreshold] = useState(0.3);
  const [showLabels, setShowLabels] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (factors.length > 0) {
      initializeFactorData();
    }
  }, [factors, analysisResults]);

  useEffect(() => {
    if (factorNodes.length > 0 && factorLinks.length > 0) {
      renderVisualization();
    }
  }, [factorNodes, factorLinks, visualizationType, selectedFactor, highlightedCluster, filterThreshold, showLabels]);

  const initializeFactorData = async () => {
    setIsAnalyzing(true);
    
    try {
      // Create factor nodes
      const nodes = createFactorNodes();
      setFactorNodes(nodes);
      
      // Calculate factor links
      const links = calculateFactorLinks(nodes);
      setFactorLinks(links);
      
      // Detect clusters
      const clusters = detectFactorClusters(nodes, links);
      setFactorClusters(clusters);
      
      // Identify interaction patterns
      const patterns = identifyInteractionPatterns(nodes, links, clusters);
      setInteractionPatterns(patterns);
      
      // Calculate metrics
      const metrics = calculateInteractionMetrics(nodes, links, clusters);
      setInteractionMetrics(metrics);
      
      if (onInteractionAnalyzed) {
        onInteractionAnalyzed({
          nodes,
          links,
          clusters,
          patterns,
          metrics,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error initializing factor data:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createFactorNodes = (): FactorNode[] => {
    return factors.map((factor, index) => ({
      id: index + 1,
      label: `Factor ${index + 1}`,
      eigenvalue: factor.eigenvalue || 1,
      variance: factor.variance || (factor.eigenvalue / factors.reduce((sum, f) => sum + (f.eigenvalue || 1), 0)) * 100,
      participants: factor.loadings?.filter((l: any) => Math.abs(l.value) > 0.4).length || 0
    }));
  };

  const calculateFactorLinks = (nodes: FactorNode[]): FactorLink[] => {
    const links: FactorLink[] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const correlation = calculateFactorCorrelation(factors[i], factors[j]);
        const sharedStmts = countSharedStatements(factors[i], factors[j]);
        const conflictingStmts = countConflictingStatements(factors[i], factors[j]);
        
        const strength = Math.abs(correlation);
        let type: FactorLink['type'] = 'neutral';
        
        if (correlation > 0.5) {
          type = 'correlation';
        } else if (correlation < -0.3) {
          type = 'opposition';
        }
        
        if (strength >= filterThreshold) {
          const sourceNode = nodes[i];
          const targetNode = nodes[j];
          if (sourceNode && targetNode) {
            links.push({
              source: sourceNode.id,
              target: targetNode.id,
              strength,
              type,
              sharedStatements: sharedStmts,
              conflictingStatements: conflictingStmts
            });
          }
        }
      }
    }
    
    return links;
  };

  const calculateFactorCorrelation = (factor1: any, factor2: any): number => {
    if (!factor1.loadings || !factor2.loadings) return 0;
    
    // Calculate correlation between factor loadings
    const loadings1 = factor1.loadings.map((l: any) => l.value || 0);
    const loadings2 = factor2.loadings.map((l: any) => l.value || 0);
    
    const n = Math.min(loadings1.length, loadings2.length);
    if (n === 0) return 0;
    
    const mean1 = loadings1.reduce((a: number, b: number) => a + b, 0) / n;
    const mean2 = loadings2.reduce((a: number, b: number) => a + b, 0) / n;
    
    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;
    
    for (let i = 0; i < n; i++) {
      const diff1 = loadings1[i] - mean1;
      const diff2 = loadings2[i] - mean2;
      numerator += diff1 * diff2;
      denom1 += diff1 * diff1;
      denom2 += diff2 * diff2;
    }
    
    if (denom1 === 0 || denom2 === 0) return 0;
    
    return numerator / Math.sqrt(denom1 * denom2);
  };

  const countSharedStatements = (factor1: any, factor2: any): number => {
    if (!factor1.loadings || !factor2.loadings) return 0;
    
    let shared = 0;
    const threshold = 0.4;
    
    for (let i = 0; i < Math.min(factor1.loadings.length, factor2.loadings.length); i++) {
      const load1 = Math.abs(factor1.loadings[i]?.value || 0);
      const load2 = Math.abs(factor2.loadings[i]?.value || 0);
      
      if (load1 > threshold && load2 > threshold && 
          Math.sign(factor1.loadings[i].value) === Math.sign(factor2.loadings[i].value)) {
        shared++;
      }
    }
    
    return shared;
  };

  const countConflictingStatements = (factor1: any, factor2: any): number => {
    if (!factor1.loadings || !factor2.loadings) return 0;
    
    let conflicting = 0;
    const threshold = 0.4;
    
    for (let i = 0; i < Math.min(factor1.loadings.length, factor2.loadings.length); i++) {
      const load1 = Math.abs(factor1.loadings[i]?.value || 0);
      const load2 = Math.abs(factor2.loadings[i]?.value || 0);
      
      if (load1 > threshold && load2 > threshold && 
          Math.sign(factor1.loadings[i].value) !== Math.sign(factor2.loadings[i].value)) {
        conflicting++;
      }
    }
    
    return conflicting;
  };

  const detectFactorClusters = (nodes: FactorNode[], links: FactorLink[]): FactorCluster[] => {
    // Simple clustering based on connection strength
    const clusters: FactorCluster[] = [];
    const visited = new Set<number>();
    
    nodes.forEach(node => {
      if (visited.has(node.id)) return;
      
      const cluster: number[] = [node.id];
      visited.add(node.id);
      
      // Find strongly connected factors
      const queue = [node.id];
      while (queue.length > 0) {
        const current = queue.shift()!;
        const connections = links.filter(l => 
          (l.source === current || l.target === current) && 
          l.strength > 0.5 &&
          l.type === 'correlation'
        );
        
        connections.forEach(conn => {
          const otherId = conn.source === current ? conn.target : conn.source;
          if (!visited.has(otherId)) {
            cluster.push(otherId);
            visited.add(otherId);
            queue.push(otherId);
          }
        });
      }
      
      if (cluster.length > 1) {
        clusters.push({
          id: clusters.length + 1,
          name: `Cluster ${clusters.length + 1}`,
          factors: cluster,
          coherence: calculateClusterCoherence(cluster, links),
          dominantTheme: extractDominantTheme(cluster),
          characteristics: extractClusterCharacteristics(cluster)
        });
      }
    });
    
    // Add isolated factors as single-factor clusters
    nodes.forEach(node => {
      if (!clusters.some(c => c.factors.includes(node.id))) {
        clusters.push({
          id: clusters.length + 1,
          name: `Isolated Factor ${node.id}`,
          factors: [node.id],
          coherence: 1,
          dominantTheme: `Factor ${node.id} perspective`,
          characteristics: ['Independent viewpoint']
        });
      }
    });
    
    return clusters;
  };

  const calculateClusterCoherence = (cluster: number[], links: FactorLink[]): number => {
    if (cluster.length <= 1) return 1;
    
    let internalLinks = 0;
    let possibleLinks = (cluster.length * (cluster.length - 1)) / 2;
    
    links.forEach(link => {
      if (cluster.includes(link.source) && cluster.includes(link.target)) {
        internalLinks++;
      }
    });
    
    return possibleLinks > 0 ? internalLinks / possibleLinks : 0;
  };

  const extractDominantTheme = (cluster: number[]): string => {
    // Extract from narratives if available
    const clusterNarratives = narratives.filter(n => cluster.includes(n.factorNumber));
    if (clusterNarratives.length > 0 && clusterNarratives[0].mainTheme) {
      return clusterNarratives[0].mainTheme;
    }
    return `Factors ${cluster.join(', ')}`;
  };

  const extractClusterCharacteristics = (cluster: number[]): string[] => {
    const characteristics: string[] = [];
    
    if (cluster.length === 1) {
      characteristics.push('Independent perspective');
    } else if (cluster.length === 2) {
      characteristics.push('Bilateral alignment');
    } else if (cluster.length > factors.length / 2) {
      characteristics.push('Majority viewpoint');
    } else {
      characteristics.push('Minority coalition');
    }
    
    return characteristics;
  };

  const identifyInteractionPatterns = (
    nodes: FactorNode[],
    links: FactorLink[],
    clusters: FactorCluster[]
  ): InteractionPattern[] => {
    const patterns: InteractionPattern[] = [];
    
    // Check for hub-spoke pattern
    const degrees = nodes.map(node => ({
      id: node.id,
      degree: links.filter(l => l.source === node.id || l.target === node.id).length
    }));
    
    const maxDegree = Math.max(...degrees.map(d => d.degree));
    const avgDegree = degrees.reduce((sum, d) => sum + d.degree, 0) / degrees.length;
    
    if (maxDegree > avgDegree * 2) {
      const hub = degrees.find(d => d.degree === maxDegree)!;
      patterns.push({
        pattern: 'hub-spoke',
        description: `Factor ${hub.id} acts as central hub connecting multiple perspectives`,
        factors: [hub.id],
        implications: ['Central perspective may dominate discourse', 'High influence potential for hub factor']
      });
    }
    
    // Check for bipolar pattern
    const opposingLinks = links.filter(l => l.type === 'opposition');
    if (opposingLinks.length > 0 && clusters.length === 2 && clusters.every(c => c.factors.length > 1)) {
      patterns.push({
        pattern: 'bipolar',
        description: 'Two opposing groups of factors detected',
        factors: clusters.flatMap(c => c.factors),
        implications: ['Strong polarization present', 'Consensus building may be challenging']
      });
    }
    
    // Check for triangular pattern
    if (nodes.length === 3 || (clusters.length === 3 && clusters.every(c => c.factors.length === 1))) {
      patterns.push({
        pattern: 'triangular',
        description: 'Three distinct perspectives forming triangular relationship',
        factors: nodes.slice(0, 3).map(n => n.id),
        implications: ['Multiple valid viewpoints present', 'Opportunity for synthesis']
      });
    }
    
    // Check for isolated factors
    const isolatedFactors = nodes.filter(node => 
      links.filter(l => l.source === node.id || l.target === node.id).length === 0
    );
    
    if (isolatedFactors.length > 0) {
      patterns.push({
        pattern: 'isolated',
        description: `${isolatedFactors.length} factor(s) show no strong connections`,
        factors: isolatedFactors.map(n => n.id),
        implications: ['Unique perspectives present', 'May require targeted engagement']
      });
    }
    
    // Default: network pattern
    if (patterns.length === 0) {
      patterns.push({
        pattern: 'network',
        description: 'Complex network of interconnected perspectives',
        factors: nodes.map(n => n.id),
        implications: ['Rich diversity of viewpoints', 'Multiple pathways for consensus']
      });
    }
    
    return patterns;
  };

  const calculateInteractionMetrics = (
    nodes: FactorNode[],
    links: FactorLink[],
    clusters: FactorCluster[]
  ): InteractionMetrics => {
    const n = nodes.length;
    const possibleLinks = (n * (n - 1)) / 2;
    
    // Density: actual links / possible links
    const density = possibleLinks > 0 ? links.length / possibleLinks : 0;
    
    // Centralization: how centralized the network is
    const degrees = nodes.map(node => 
      links.filter(l => l.source === node.id || l.target === node.id).length
    );
    const maxDegree = Math.max(...degrees);
    const centralization = n > 2 
      ? degrees.reduce((sum, d) => sum + (maxDegree - d), 0) / ((n - 1) * (n - 2))
      : 0;
    
    // Clustering coefficient
    const clustering = clusters.length > 0
      ? clusters.reduce((sum, c) => sum + c.coherence, 0) / clusters.length
      : 0;
    
    // Modularity: strength of division into clusters
    const modularity = clusters.length > 1
      ? 1 - (1 / clusters.length)
      : 0;
    
    // Polarization: based on opposing links
    const opposingLinks = links.filter(l => l.type === 'opposition').length;
    const polarization = links.length > 0 ? opposingLinks / links.length : 0;
    
    return {
      density: density * 100,
      centralization: centralization * 100,
      clustering: clustering * 100,
      modularity: modularity * 100,
      polarization: polarization * 100
    };
  };

  const renderVisualization = () => {
    if (!svgRef.current || !containerRef.current) return;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();
    
    const width = containerRef.current.clientWidth;
    const height = 500;
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    
    switch (visualizationType) {
      case 'force':
        renderForceDirectedGraph(svg, width, height);
        break;
      case 'matrix':
        renderAdjacencyMatrix(svg, width, height);
        break;
      case 'circular':
        renderCircularLayout(svg, width, height);
        break;
      case 'hierarchical':
        renderHierarchicalLayout(svg, width, height);
        break;
    }
  };

  const renderForceDirectedGraph = (svg: any, width: number, height: number) => {
    // Create simulation
    const simulation = d3.forceSimulation(factorNodes as any)
      .force('link', d3.forceLink(factorLinks)
        .id((d: any) => d.id)
        .distance((d: any) => 100 * (1 - d.strength))
        .strength((d: any) => d.strength))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));
    
    // Add container groups
    const g = svg.append('g');
    
    // Add zoom behavior
    svg.call(d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform);
      }));
    
    // Add links
    const link = g.append('g')
      .selectAll('line')
      .data(factorLinks)
      .enter().append('line')
      .attr('stroke', (d: FactorLink) => {
        if (d.type === 'correlation') return '#10b981';
        if (d.type === 'opposition') return '#ef4444';
        return '#9ca3af';
      })
      .attr('stroke-width', (d: FactorLink) => 1 + d.strength * 4)
      .attr('stroke-opacity', 0.6);
    
    // Add nodes
    const node = g.append('g')
      .selectAll('g')
      .data(factorNodes)
      .enter().append('g')
      .attr('cursor', 'pointer')
      .on('click', (_event: any, d: FactorNode) => {
        setSelectedFactor(d.id === selectedFactor ? null : d.id);
      })
      .call(d3.drag<any, any>()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded) as any);
    
    // Add circles
    node.append('circle')
      .attr('r', (d: FactorNode) => 15 + Math.sqrt(d.eigenvalue) * 5)
      .attr('fill', (d: FactorNode) => {
        if (highlightedCluster) {
          const cluster = factorClusters.find(c => c.id === highlightedCluster);
          return cluster && cluster.factors.includes(d.id) ? '#8b5cf6' : '#e5e7eb';
        }
        return d.id === selectedFactor ? '#8b5cf6' : '#6366f1';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
    
    // Add labels
    if (showLabels) {
      node.append('text')
        .text((d: FactorNode) => `F${d.id}`)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('fill', '#fff')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold');
    }
    
    // Add tooltips
    node.append('title')
      .text((d: FactorNode) => 
        `Factor ${d.id}\nEigenvalue: ${d.eigenvalue.toFixed(2)}\nVariance: ${d.variance.toFixed(1)}%\nParticipants: ${d.participants}`);
    
    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragStarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragEnded(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  const renderAdjacencyMatrix = (svg: any, width: number, height: number) => {
    const margin = { top: 80, right: 20, bottom: 20, left: 80 };
    const matrixWidth = width - margin.left - margin.right;
    const matrixHeight = height - margin.top - margin.bottom;
    
    const cellSize = Math.min(matrixWidth, matrixHeight) / factorNodes.length;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create matrix data
    const matrix: any[] = [];
    factorNodes.forEach((source) => {
      factorNodes.forEach((target) => {
        const link = factorLinks.find(l => 
          (l.source === source.id && l.target === target.id) ||
          (l.source === target.id && l.target === source.id)
        );
        
        matrix.push({
          source: source.id,
          target: target.id,
          value: link ? link.strength : source.id === target.id ? 1 : 0,
          type: link ? link.type : 'none'
        });
      });
    });
    
    // Color scale
    const colorScale = d3.scaleSequential()
      .domain([0, 1])
      .interpolator(d3.interpolateViridis);
    
    // Add cells
    g.selectAll('rect')
      .data(matrix)
      .enter().append('rect')
      .attr('x', (d: any) => (d.target - 1) * cellSize)
      .attr('y', (d: any) => (d.source - 1) * cellSize)
      .attr('width', cellSize - 2)
      .attr('height', cellSize - 2)
      .attr('fill', (d: any) => {
        if (d.value === 0) return '#f3f4f6';
        if (d.type === 'opposition') return '#ef4444';
        if (d.type === 'correlation') return '#10b981';
        return colorScale(d.value);
      })
      .attr('opacity', (d: any) => d.value === 0 ? 0.3 : 0.8)
      .on('mouseover', function(this: any, _event: any, _d: any) {
        d3.select(this).attr('stroke', '#000').attr('stroke-width', 2);
      })
      .on('mouseout', function(this: any) {
        d3.select(this).attr('stroke', 'none');
      })
      .append('title')
      .text((d: any) => `F${d.source} - F${d.target}: ${(d.value * 100).toFixed(0)}%`);
    
    // Add labels
    g.selectAll('.row-label')
      .data(factorNodes)
      .enter().append('text')
      .attr('x', -5)
      .attr('y', (_d: FactorNode, i: number) => i * cellSize + cellSize / 2)
      .attr('text-anchor', 'end')
      .attr('dy', '0.3em')
      .attr('font-size', '10px')
      .text((d: FactorNode) => `F${d.id}`);
    
    g.selectAll('.col-label')
      .data(factorNodes)
      .enter().append('text')
      .attr('x', (_d: FactorNode, i: number) => i * cellSize + cellSize / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .text((d: FactorNode) => `F${d.id}`);
  };

  const renderCircularLayout = (svg: any, width: number, height: number) => {
    const radius = Math.min(width, height) / 2 - 50;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const g = svg.append('g')
      .attr('transform', `translate(${centerX},${centerY})`);
    
    // Position nodes in circle
    factorNodes.forEach((node, i) => {
      const angle = (i * 2 * Math.PI) / factorNodes.length - Math.PI / 2;
      node.x = Math.cos(angle) * radius;
      node.y = Math.sin(angle) * radius;
    });
    
    // Add links as curves
    g.selectAll('.link')
      .data(factorLinks)
      .enter().append('path')
      .attr('d', (d: FactorLink) => {
        const source = factorNodes.find(n => n.id === d.source)!;
        const target = factorNodes.find(n => n.id === d.target)!;
        
        const dx = target.x! - source.x!;
        const dy = target.y! - source.y!;
        const dr = Math.sqrt(dx * dx + dy * dy) / 2;
        
        return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
      })
      .attr('fill', 'none')
      .attr('stroke', (d: FactorLink) => {
        if (d.type === 'correlation') return '#10b981';
        if (d.type === 'opposition') return '#ef4444';
        return '#9ca3af';
      })
      .attr('stroke-width', (d: FactorLink) => 1 + d.strength * 3)
      .attr('stroke-opacity', 0.5);
    
    // Add nodes
    const node = g.selectAll('.node')
      .data(factorNodes)
      .enter().append('g')
      .attr('transform', (d: FactorNode) => `translate(${d.x},${d.y})`)
      .attr('cursor', 'pointer')
      .on('click', (_event: any, d: FactorNode) => {
        setSelectedFactor(d.id === selectedFactor ? null : d.id);
      });
    
    node.append('circle')
      .attr('r', (d: FactorNode) => 20 + Math.sqrt(d.eigenvalue) * 5)
      .attr('fill', (d: FactorNode) => {
        if (highlightedCluster) {
          const cluster = factorClusters.find(c => c.id === highlightedCluster);
          return cluster && cluster.factors.includes(d.id) ? '#8b5cf6' : '#e5e7eb';
        }
        return d.id === selectedFactor ? '#8b5cf6' : '#6366f1';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
    
    if (showLabels) {
      node.append('text')
        .text((d: FactorNode) => d.label)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('fill', '#fff')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold');
    }
  };

  const renderHierarchicalLayout = (svg: any, width: number, height: number) => {
    // Create hierarchical structure based on clusters
    const root = {
      name: 'All Factors',
      children: factorClusters.map(cluster => ({
        name: cluster.name,
        children: cluster.factors.map(f => ({
          name: `Factor ${f}`,
          value: factorNodes.find(n => n.id === f)?.eigenvalue || 1
        }))
      }))
    };
    
    const treemap = d3.treemap()
      .size([width, height])
      .padding(2);
    
    const hierarchy = d3.hierarchy(root)
      .sum((d: any) => d.value || 1)
      .sort((a, b) => (b.value || 0) - (a.value || 0));
    
    treemap(hierarchy as any);
    
    // Add cells
    const cell = svg.selectAll('g')
      .data(hierarchy.leaves())
      .enter().append('g')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);
    
    cell.append('rect')
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('fill', '#6366f1')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);
    
    cell.append('text')
      .attr('x', 4)
      .attr('y', 20)
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .text((d: any) => d.data.name);
  };

  const getPatternIcon = (pattern: InteractionPattern['pattern']) => {
    switch (pattern) {
      case 'hub-spoke': return '🎯';
      case 'bipolar': return '⚖️';
      case 'triangular': return '🔺';
      case 'isolated': return '🏝️';
      case 'network': return '🕸️';
      default: return '📊';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-label flex items-center gap-2">
              <MapIcon className="w-6 h-6 text-blue-600" />
              Factor Interaction Mapper
            </h2>
            <p className="text-sm text-secondary-label mt-1">
              Visualize and analyze relationships between factors
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={visualizationType === 'force' ? 'primary' : 'secondary'}
              onClick={() => setVisualizationType('force')}
            >
              <CubeTransparentIcon className="w-4 h-4" />
              Force
            </Button>
            <Button
              size="sm"
              variant={visualizationType === 'matrix' ? 'primary' : 'secondary'}
              onClick={() => setVisualizationType('matrix')}
            >
              <ChartBarIcon className="w-4 h-4" />
              Matrix
            </Button>
            <Button
              size="sm"
              variant={visualizationType === 'circular' ? 'primary' : 'secondary'}
              onClick={() => setVisualizationType('circular')}
            >
              <ArrowsRightLeftIcon className="w-4 h-4" />
              Circular
            </Button>
            <Button
              size="sm"
              variant={visualizationType === 'hierarchical' ? 'primary' : 'secondary'}
              onClick={() => setVisualizationType('hierarchical')}
            >
              <ShareIcon className="w-4 h-4" />
              Hierarchy
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Filter Strength:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={filterThreshold}
              onChange={(e) => setFilterThreshold(parseFloat(e.target.value))}
              className="w-32"
            />
            <span className="text-sm">{(filterThreshold * 100).toFixed(0)}%</span>
          </div>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowLabels(!showLabels)}
          >
            <AdjustmentsVerticalIcon className="w-4 h-4" />
            {showLabels ? 'Hide' : 'Show'} Labels
          </Button>
          
          <Button
            size="sm"
            variant="primary"
            onClick={initializeFactorData}
            loading={isAnalyzing}
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            Analyze Interactions
          </Button>
        </div>

        {/* Metrics */}
        {interactionMetrics && (
          <div className="grid grid-cols-5 gap-4 mt-4">
            {Object.entries(interactionMetrics).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {value.toFixed(0)}%
                </div>
                <div className="text-xs text-secondary-label capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualization */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div ref={containerRef} className="w-full">
              <svg ref={svgRef} className="w-full" />
            </div>
            
            {/* Legend */}
            <div className="mt-4 p-4 bg-system-gray-6 rounded-lg">
              <p className="text-xs font-medium mb-2">Connection Types:</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-green-500" />
                  <span className="text-xs">Correlation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-red-500" />
                  <span className="text-xs">Opposition</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-gray-400" />
                  <span className="text-xs">Neutral</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Clusters */}
          <Card className="p-4">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <CircleStackIcon className="w-4 h-4 text-blue-600" />
              Factor Clusters
            </h3>
            <div className="space-y-2">
              {factorClusters.map(cluster => (
                <div
                  key={cluster.id}
                  onClick={() => setHighlightedCluster(cluster.id === highlightedCluster ? null : cluster.id)}
                  className="cursor-pointer"
                >
                  <Card
                    className={`p-3 transition-all ${
                      highlightedCluster === cluster.id 
                        ? 'ring-2 ring-purple-500 bg-purple-50' 
                        : 'hover:bg-system-gray-6'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{cluster.name}</span>
                      <Badge variant="secondary" size="sm">
                        {cluster.factors.length} factors
                      </Badge>
                    </div>
                    <p className="text-xs text-secondary-label mb-1">{cluster.dominantTheme}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-secondary-label">Coherence:</span>
                      <span className="text-xs font-medium">{(cluster.coherence * 100).toFixed(0)}%</span>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </Card>

          {/* Interaction Patterns */}
          <Card className="p-4">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-blue-600" />
              Interaction Patterns
            </h3>
            <div className="space-y-3">
              {interactionPatterns.map((pattern, index) => (
                <div key={index} className="border-l-2 border-blue-400 pl-3">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getPatternIcon(pattern.pattern)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">
                        {pattern.pattern.replace('-', ' ')} Pattern
                      </p>
                      <p className="text-xs text-secondary-label mb-1">
                        {pattern.description}
                      </p>
                      {pattern.implications.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs font-medium">Implications:</p>
                          <ul className="text-xs text-secondary-label">
                            {pattern.implications.map((imp, i) => (
                              <li key={i}>• {imp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Selected Factor Details */}
          {selectedFactor && (
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
              <h3 className="font-medium text-sm mb-3">Factor {selectedFactor} Details</h3>
              {(() => {
                const node = factorNodes.find(n => n.id === selectedFactor);
                const connections = factorLinks.filter(l => 
                  l.source === selectedFactor || l.target === selectedFactor
                );
                
                return (
                  <>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between">
                        <span className="text-xs text-secondary-label">Eigenvalue:</span>
                        <span className="text-xs font-medium">{node?.eigenvalue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-secondary-label">Variance:</span>
                        <span className="text-xs font-medium">{node?.variance.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-secondary-label">Participants:</span>
                        <span className="text-xs font-medium">{node?.participants}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-secondary-label">Connections:</span>
                        <span className="text-xs font-medium">{connections.length}</span>
                      </div>
                    </div>
                    
                    {connections.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1">Connected to:</p>
                        <div className="flex flex-wrap gap-1">
                          {connections.map((conn, i) => {
                            const otherId = conn.source === selectedFactor ? conn.target : conn.source;
                            return (
                              <Badge 
                                key={i}
                                variant={
                                  conn.type === 'correlation' ? 'success' : 
                                  conn.type === 'opposition' ? 'destructive' : 
                                  'secondary'
                                }
                                size="sm"
                              >
                                F{otherId}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </Card>
          )}

          {/* Network Health */}
          <Alert variant="default">
            <h4 className="font-medium text-sm mb-1">Network Health</h4>
            <p className="text-xs">
              {interactionMetrics && interactionMetrics.density > 50 
                ? 'High connectivity suggests strong consensus potential'
                : interactionMetrics && interactionMetrics.polarization > 30
                ? 'Significant polarization detected - mediation may be needed'
                : 'Moderate connectivity with diverse perspectives'}
            </p>
          </Alert>
        </div>
      </div>
    </div>
  );
}