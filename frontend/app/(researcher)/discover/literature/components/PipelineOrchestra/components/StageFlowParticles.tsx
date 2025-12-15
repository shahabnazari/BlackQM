/**
 * Phase 10.143: Netflix-Grade Inter-Stage Particle Flow
 * Phase 10.148: Horizontal Layout Update
 * Phase 10.152: Removed 'ready' stage - pipeline ends at 'rank'
 *
 * High-performance Canvas-based particle system for visualizing data flow
 * between pipeline stages. Particles travel left to right showing processing:
 * ANALYZE → DISCOVER → REFINE → RANK
 *
 * Netflix-Grade Features:
 * - Canvas rendering for 60fps performance (vs DOM-based)
 * - Horizontal paths with subtle wave motion
 * - Particle depth variation (size, opacity, speed)
 * - Soft glow trails with color gradients
 * - GPU-accelerated rendering
 * - O(1) stage lookups via Map
 *
 * @module PipelineOrchestra
 * @since Phase 10.142
 * @updated Phase 10.143 - Canvas upgrade for Netflix-grade performance
 * @updated Phase 10.148 - Horizontal layout with wave motion
 */

'use client';

import React, { memo, useRef, useEffect, useCallback, useMemo } from 'react';
import type { PipelineStageId, PipelineStageStatus } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface StageInfo {
  id: PipelineStageId;
  status: PipelineStageStatus;
}

interface StageFlowParticlesProps {
  stages: StageInfo[];
  currentStage: PipelineStageId | null;
  isSearching: boolean;
  reducedMotion: boolean;
}

interface StageParticle {
  id: number;
  fromIndex: number;
  toIndex: number;
  progress: number;
  speed: number;
  size: number;
  opacity: number;
  waveOffset: number; // Phase 10.148: Subtle vertical wave offset for visual interest
  waveAmplitude: number; // Phase 10.148: Wave amplitude variation
  fromColor: string;
  toColor: string;
  trail: Array<{ x: number; y: number; opacity: number }>;
}

interface ActiveConnection {
  fromIndex: number;
  toIndex: number;
  fromColor: string;
  toColor: string;
}

// ============================================================================
// CONSTANTS - Netflix-Grade Configuration
// ============================================================================

// Phase 10.152: Removed 'ready' - pipeline ends at 'rank'
const STAGE_COLORS: Record<PipelineStageId, string> = {
  analyze: '#3B82F6',   // Blue
  discover: '#22C55E',  // Green
  refine: '#F59E0B',    // Amber
  rank: '#A855F7',      // Purple
};

const STAGE_ORDER: PipelineStageId[] = ['analyze', 'discover', 'refine', 'rank'];

// Netflix-grade particle configuration
const PARTICLE_CONFIG = Object.freeze({
  // Particle generation
  maxParticlesPerConnection: 8,
  spawnIntervalMs: 180,

  // Size variation for depth effect
  sizeRange: Object.freeze({ min: 2.5, max: 5 }),

  // Speed variation
  speedRange: Object.freeze({ min: 0.008, max: 0.018 }),

  // Phase 10.148: Subtle wave motion for horizontal layout
  waveAmplitudeRange: Object.freeze({ min: 3, max: 8 }), // Subtle vertical displacement
  waveFrequency: Math.PI * 2, // One full wave across the path

  // Trail configuration
  trailLength: 6,
  trailFadeRate: 0.15,

  // Glow configuration
  glowRadius: 12,
  glowIntensity: 0.4,
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Cubic bezier easing for cinematic motion
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Phase 10.148: Calculate horizontal path with subtle wave motion
 * Particles flow straight across with a gentle sine wave for visual interest
 */
function horizontalWavePath(
  startX: number,
  endX: number,
  baseY: number,
  waveOffset: number,
  waveAmplitude: number,
  progress: number
): { x: number; y: number } {
  const easedProgress = easeInOutCubic(progress);
  const x = startX + (endX - startX) * easedProgress;

  // Subtle sine wave motion - creates flowing, organic movement
  const waveY = Math.sin(progress * PARTICLE_CONFIG.waveFrequency + waveOffset) * waveAmplitude;
  const y = baseY + waveY;

  return { x, y };
}

/**
 * Interpolate between two hex colors (returns hex format)
 */
function lerpColor(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  // Return hex format for compatibility with hexToRgba
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Convert hex to rgba
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================================
// PARTICLE SYSTEM CLASS
// ============================================================================

class ParticleSystem {
  private particles: StageParticle[] = [];
  private nextId = 0;
  private lastSpawnTime: Map<string, number> = new Map();

  spawnParticle(connection: ActiveConnection): void {
    const key = `${connection.fromIndex}-${connection.toIndex}`;
    const now = Date.now();
    const lastSpawn = this.lastSpawnTime.get(key) || 0;

    // Throttle spawning
    if (now - lastSpawn < PARTICLE_CONFIG.spawnIntervalMs) return;

    // Limit particles per connection
    const connectionParticles = this.particles.filter(
      (p) => p.fromIndex === connection.fromIndex && p.toIndex === connection.toIndex
    );
    if (connectionParticles.length >= PARTICLE_CONFIG.maxParticlesPerConnection) return;

    // Phase 10.148: Create particle with wave parameters for horizontal flow
    const particle: StageParticle = {
      id: this.nextId++,
      fromIndex: connection.fromIndex,
      toIndex: connection.toIndex,
      progress: 0,
      speed: PARTICLE_CONFIG.speedRange.min +
        Math.random() * (PARTICLE_CONFIG.speedRange.max - PARTICLE_CONFIG.speedRange.min),
      size: PARTICLE_CONFIG.sizeRange.min +
        Math.random() * (PARTICLE_CONFIG.sizeRange.max - PARTICLE_CONFIG.sizeRange.min),
      opacity: 0,
      waveOffset: Math.random() * Math.PI * 2, // Random phase offset for variety
      waveAmplitude: PARTICLE_CONFIG.waveAmplitudeRange.min +
        Math.random() * (PARTICLE_CONFIG.waveAmplitudeRange.max - PARTICLE_CONFIG.waveAmplitudeRange.min),
      fromColor: connection.fromColor,
      toColor: connection.toColor,
      trail: [],
    };

    this.particles.push(particle);
    this.lastSpawnTime.set(key, now);
  }

  update(): void {
    this.particles = this.particles.filter((particle) => {
      // Update progress
      particle.progress += particle.speed;

      // Fade in/out for smooth appearance
      if (particle.progress < 0.15) {
        particle.opacity = particle.progress / 0.15;
      } else if (particle.progress > 0.85) {
        particle.opacity = (1 - particle.progress) / 0.15;
      } else {
        particle.opacity = 1;
      }

      // Remove completed particles
      return particle.progress < 1;
    });
  }

  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    totalStages: number
  ): void {
    const baseY = height / 2;
    const padding = 36; // Match stage orb positioning
    const usableWidth = width - padding * 2;

    this.particles.forEach((particle) => {
      const startX = padding + (particle.fromIndex / (totalStages - 1)) * usableWidth;
      const endX = padding + (particle.toIndex / (totalStages - 1)) * usableWidth;

      // Phase 10.148: Calculate horizontal position with subtle wave
      const pos = horizontalWavePath(
        startX, endX, baseY,
        particle.waveOffset, particle.waveAmplitude,
        particle.progress
      );

      // Update trail
      particle.trail.unshift({ x: pos.x, y: pos.y, opacity: particle.opacity });
      if (particle.trail.length > PARTICLE_CONFIG.trailLength) {
        particle.trail.pop();
      }

      // Interpolate color based on progress
      const currentColor = lerpColor(particle.fromColor, particle.toColor, particle.progress);

      // Draw trail with fade
      if (particle.trail.length > 1) {
        for (let i = 1; i < particle.trail.length; i++) {
          const prev = particle.trail[i - 1];
          const curr = particle.trail[i];
          if (!prev || !curr) continue;

          const trailOpacity = (1 - i / particle.trail.length) * PARTICLE_CONFIG.trailFadeRate * particle.opacity;
          const trailSize = particle.size * (1 - i / particle.trail.length * 0.5);

          ctx.beginPath();
          ctx.arc(curr.x, curr.y, trailSize, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(currentColor, trailOpacity);
          ctx.fill();
        }
      }

      // Draw glow effect
      const glowGradient = ctx.createRadialGradient(
        pos.x, pos.y, 0,
        pos.x, pos.y, PARTICLE_CONFIG.glowRadius
      );
      glowGradient.addColorStop(0, hexToRgba(currentColor, particle.opacity * PARTICLE_CONFIG.glowIntensity));
      glowGradient.addColorStop(1, hexToRgba(currentColor, 0));

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, PARTICLE_CONFIG.glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Draw main particle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(currentColor, particle.opacity);
      ctx.fill();

      // Inner bright core
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, particle.size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba('#FFFFFF', particle.opacity * 0.6);
      ctx.fill();
    });
  }

  clear(): void {
    this.particles = [];
    this.lastSpawnTime.clear();
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Netflix-Grade Inter-Stage Particle Flow
 *
 * Canvas-based particle system showing data flow direction between stages.
 * Optimized for 60fps with GPU-accelerated rendering.
 */
export const StageFlowParticles = memo<StageFlowParticlesProps>(
  function StageFlowParticles({
    stages,
    currentStage,
    isSearching,
    reducedMotion,
  }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particleSystemRef = useRef<ParticleSystem | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Get current stage index
    const currentStageIndex = currentStage ? STAGE_ORDER.indexOf(currentStage) : -1;

    // Build stage status map for O(1) lookups
    const stageStatusMap = useMemo(() => {
      const map = new Map<PipelineStageId, PipelineStageStatus>();
      stages.forEach((stage) => map.set(stage.id, stage.status));
      return map;
    }, [stages]);

    // Determine active connections - O(1) lookups
    const activeConnections = useMemo(() => {
      if (!isSearching || stages.length < 2) return [];

      const connections: ActiveConnection[] = [];

      for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
        const fromId = STAGE_ORDER[i];
        const toId = STAGE_ORDER[i + 1];

        if (!fromId || !toId) continue;

        const fromStatus = stageStatusMap.get(fromId);
        const toStatus = stageStatusMap.get(toId);

        if (!fromStatus || !toStatus) continue;

        // Show flow on active transitions
        const isActive =
          (fromStatus === 'complete' && toStatus === 'active') ||
          (fromStatus === 'complete' && i < currentStageIndex) ||
          (fromStatus === 'active' && i === currentStageIndex - 1);

        if (isActive) {
          connections.push({
            fromIndex: i,
            toIndex: i + 1,
            fromColor: STAGE_COLORS[fromId],
            toColor: STAGE_COLORS[toId],
          });
        }
      }

      return connections;
    }, [stageStatusMap, currentStageIndex, isSearching, stages.length]);

    // Initialize particle system
    useEffect(() => {
      if (!particleSystemRef.current) {
        particleSystemRef.current = new ParticleSystem();
      }
      return () => {
        particleSystemRef.current?.clear();
      };
    }, []);

    // Animation loop
    const animate = useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const particleSystem = particleSystemRef.current;

      if (!canvas || !container || !particleSystem) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Get actual dimensions
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Update canvas size if needed (for HiDPI)
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);
      }

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Spawn particles for active connections
      activeConnections.forEach((conn) => {
        particleSystem.spawnParticle(conn);
      });

      // Update and render
      particleSystem.update();
      particleSystem.render(ctx, width, height, STAGE_ORDER.length);

      animationFrameRef.current = requestAnimationFrame(animate);
    }, [activeConnections]);

    // Start/stop animation
    useEffect(() => {
      if (reducedMotion || !isSearching || activeConnections.length === 0) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        particleSystemRef.current?.clear();

        // Clear canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
        return;
      }

      animate();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [reducedMotion, isSearching, activeConnections, animate]);

    // Early return for reduced motion or inactive
    if (reducedMotion || !isSearching || stages.length < 2) {
      return null;
    }

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none overflow-visible"
        aria-hidden="true"
        style={{
          // GPU acceleration hint
          willChange: 'contents',
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            // Additional GPU hints
            transform: 'translateZ(0)',
          }}
        />
      </div>
    );
  }
);

export default StageFlowParticles;
