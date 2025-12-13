/**
 * Phase 10.126: Particle Flow System Component
 *
 * High-performance canvas-based particle system for visualizing
 * papers flowing from sources into the pipeline funnel.
 *
 * Features:
 * - Canvas rendering for 60fps performance
 * - Bezier curve flow paths
 * - Particle pooling for efficiency
 * - Trail effects
 * - Source-specific coloring
 *
 * @module PipelineOrchestra
 * @since Phase 10.126
 */

'use client';

import React, { memo, useRef, useEffect, useCallback, useMemo } from 'react';
import type { FlowParticle, Point, BezierControls } from '../types';
import type { LiteratureSource, SourceStats } from '@/lib/types/search-stream.types';
import { PARTICLE_CONFIG, PARTICLE_INTENSITY, SOURCE_COLORS, TIER_COLORS, SOURCE_TIERS } from '../constants';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate random ID
 */
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Calculate bezier point at progress t
 */
function bezierPoint(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

/**
 * Generate bezier control points for natural flow
 */
function generateBezierControls(
  source: Point,
  target: Point
): BezierControls {
  const dx = target.x - source.x;
  const dy = target.y - source.y;

  // Control points create a smooth arc
  return {
    cp1: {
      x: source.x + dx * 0.3,
      y: source.y + dy * 0.1 - 20,
    },
    cp2: {
      x: source.x + dx * 0.7,
      y: target.y - Math.abs(dy) * 0.2,
    },
  };
}

/**
 * Get color for source
 */
function getSourceColor(source: LiteratureSource): string {
  return SOURCE_COLORS[source] || TIER_COLORS[SOURCE_TIERS[source]] || '#ffffff';
}

// ============================================================================
// PARTICLE CLASS
// ============================================================================

class Particle implements FlowParticle {
  id: string;
  source: LiteratureSource;
  sourcePosition: Point;
  targetPosition: Point;
  bezierControls: BezierControls;
  progress: number;
  size: number;
  color: string;
  opacity: number;
  trail: Point[];
  createdAt: number;
  speed: number;

  constructor(
    source: LiteratureSource,
    sourcePosition: Point,
    targetPosition: Point
  ) {
    this.id = generateId();
    this.source = source;
    this.sourcePosition = sourcePosition;
    this.targetPosition = targetPosition;
    this.bezierControls = generateBezierControls(sourcePosition, targetPosition);
    this.progress = 0;
    this.size = PARTICLE_CONFIG.particleSizeRange.min +
      Math.random() * (PARTICLE_CONFIG.particleSizeRange.max - PARTICLE_CONFIG.particleSizeRange.min);
    this.color = getSourceColor(source);
    this.opacity = 0;
    this.trail = [];
    this.createdAt = Date.now();
    this.speed = PARTICLE_CONFIG.particleSpeedRange.min +
      Math.random() * (PARTICLE_CONFIG.particleSpeedRange.max - PARTICLE_CONFIG.particleSpeedRange.min);
  }

  update(): boolean {
    // Update progress
    this.progress += this.speed;

    // Fade in/out
    if (this.progress < 0.1) {
      this.opacity = this.progress / 0.1;
    } else if (this.progress > 0.9) {
      this.opacity = (1 - this.progress) / 0.1;
    } else {
      this.opacity = 1;
    }

    // Calculate current position
    const currentPos = bezierPoint(
      this.sourcePosition,
      this.bezierControls.cp1,
      this.bezierControls.cp2,
      this.targetPosition,
      this.progress
    );

    // Update trail
    this.trail.unshift(currentPos);
    if (this.trail.length > PARTICLE_CONFIG.trailLength) {
      this.trail.pop();
    }

    // Return false when particle is complete
    return this.progress < 1;
  }

  getCurrentPosition(): Point {
    return bezierPoint(
      this.sourcePosition,
      this.bezierControls.cp1,
      this.bezierControls.cp2,
      this.targetPosition,
      this.progress
    );
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface ParticleFlowSystemProps {
  sources: Map<LiteratureSource, SourceStats>;
  sourcePositions: Map<LiteratureSource, Point>;
  targetPosition: Point;
  intensity: 'low' | 'medium' | 'high';
  isActive: boolean;
  width: number;
  height: number;
  reducedMotion: boolean;
}

/**
 * Particle Flow System Component
 *
 * Renders animated particles flowing from sources to the pipeline.
 *
 * @example
 * ```tsx
 * <ParticleFlowSystem
 *   sources={sourceStats}
 *   sourcePositions={positionMap}
 *   targetPosition={{ x: 400, y: 200 }}
 *   intensity="medium"
 *   isActive={true}
 *   width={800}
 *   height={400}
 *   reducedMotion={false}
 * />
 * ```
 */
export const ParticleFlowSystem = memo<ParticleFlowSystemProps>(
  function ParticleFlowSystem({
    sources,
    sourcePositions,
    targetPosition,
    intensity,
    isActive,
    width,
    height,
    reducedMotion,
  }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const lastSpawnTimeRef = useRef<Map<LiteratureSource, number>>(new Map());

    // Get intensity config from constants
    const intensityConfig = useMemo(
      () => PARTICLE_INTENSITY[intensity],
      [intensity]
    );

    // Spawn new particle from a source
    const spawnParticle = useCallback((source: LiteratureSource) => {
      const sourcePos = sourcePositions.get(source);
      if (!sourcePos) return;

      // Check if we've exceeded max particles
      if (particlesRef.current.length >= intensityConfig.maxActive) return;

      // Check spawn interval
      const lastSpawn = lastSpawnTimeRef.current.get(source) || 0;
      const now = Date.now();
      if (now - lastSpawn < intensityConfig.spawnIntervalMs) return;

      // Create particle
      const particle = new Particle(source, sourcePos, targetPosition);
      particlesRef.current.push(particle);
      lastSpawnTimeRef.current.set(source, now);
    }, [sourcePositions, targetPosition, intensityConfig]);

    // Render particles to canvas
    const render = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        const isAlive = particle.update();

        // Draw trail
        if (particle.trail.length > 1) {
          const firstPoint = particle.trail[0];
          if (!firstPoint) return isAlive;
          ctx.beginPath();
          ctx.moveTo(firstPoint.x, firstPoint.y);

          for (let i = 1; i < particle.trail.length; i++) {
            const point = particle.trail[i];
            if (!point) continue;
            ctx.lineTo(point.x, point.y);
          }

          ctx.strokeStyle = particle.color;
          ctx.globalAlpha = particle.opacity * 0.3;
          ctx.lineWidth = particle.size * 0.5;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Draw main particle
        const pos = particle.getCurrentPosition();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();

        // Glow effect
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, particle.size * 2, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          pos.x, pos.y, particle.size * 0.5,
          pos.x, pos.y, particle.size * 2
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.globalAlpha = particle.opacity * 0.4;
        ctx.fill();

        ctx.globalAlpha = 1;

        return isAlive;
      });
    }, [width, height]);

    // Animation loop
    useEffect(() => {
      if (reducedMotion || !isActive) {
        // Clear particles when not active
        particlesRef.current = [];
        return;
      }

      const animate = () => {
        // Spawn particles from active sources
        sources.forEach((stats, source) => {
          if (stats.status === 'searching' || stats.status === 'complete') {
            // Spawn rate based on paper count
            const spawnChance = Math.min(stats.paperCount / 100, 1) * 0.3;
            if (Math.random() < spawnChance) {
              spawnParticle(source);
            }
          }
        });

        render();
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [sources, spawnParticle, render, isActive, reducedMotion]);

    // Don't render if reduced motion or not active
    if (reducedMotion || !isActive) {
      return null;
    }

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />
    );
  }
);

export default ParticleFlowSystem;
