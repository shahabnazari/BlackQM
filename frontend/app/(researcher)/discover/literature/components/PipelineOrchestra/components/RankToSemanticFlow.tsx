/**
 * Phase 10.146: Rank to Semantic Flow Visualization
 * Phase 10.147: Enterprise-Grade Optimization
 *
 * Animated particle flow connecting the RANK stage to the Semantic Ranking section.
 * Shows the visual relationship between the main pipeline and 3-tier ranking.
 *
 * Enterprise Features:
 * - Object pooling to eliminate GC pressure
 * - Canvas-based rendering for 60fps performance
 * - Memoized color calculations
 * - Proper cleanup and memory management
 * - WCAG 2.1 AA accessibility compliance
 * - GPU-accelerated rendering hints
 *
 * @module PipelineOrchestra
 * @since Phase 10.146
 * @updated Phase 10.147 - Enterprise optimization
 */

'use client';

import React, { memo, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import type { SemanticTierName } from '@/lib/types/search-stream.types';
import { SPRING_PRESETS, SEMANTIC_TIER_COLORS } from '../constants';

// ============================================================================
// TYPES
// ============================================================================

interface RankToSemanticFlowProps {
  /** Whether the rank stage is active */
  readonly isRankActive: boolean;
  /** Whether ranking is currently processing */
  readonly isProcessing: boolean;
  /** Current semantic tier being processed */
  readonly currentTier: SemanticTierName | null;
  /** Whether to reduce motion */
  readonly reducedMotion: boolean;
}

interface FlowParticle {
  id: number;
  progress: number;
  speed: number;
  size: number;
  opacity: number;
  xOffset: number;
  trail: Array<{ y: number; opacity: number }>;
  active: boolean; // For object pooling
}

// ============================================================================
// CONSTANTS - Frozen for immutability
// ============================================================================

const RANK_COLOR = '#A855F7' as const;

const PARTICLE_CONFIG = Object.freeze({
  maxParticles: 12,
  spawnIntervalMs: 200,
  sizeRange: Object.freeze({ min: 2, max: 4 }),
  speedRange: Object.freeze({ min: 0.012, max: 0.025 }),
  trailLength: 5,
  glowRadius: 8,
  wobbleAmount: 3,
  fadeInThreshold: 0.15,
  fadeOutThreshold: 0.85,
});

// Pre-computed values
const TWO_PI = Math.PI * 2;
const WOBBLE_FREQUENCY = Math.PI * 4;

// ============================================================================
// UTILITY FUNCTIONS - Optimized with caching
// ============================================================================

/** Cubic easing for cinematic motion */
function easeOutCubic(t: number): number {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

/** Parse hex color to RGB components - cached */
const colorCache = new Map<string, { r: number; g: number; b: number }>();

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const cached = colorCache.get(hex);
  if (cached) return cached;

  const result = {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };

  // Limit cache size to prevent memory leaks
  if (colorCache.size > 50) {
    const firstKey = colorCache.keys().next().value;
    if (firstKey) colorCache.delete(firstKey);
  }

  colorCache.set(hex, result);
  return result;
}

/** Convert hex to rgba string */
function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = parseHexColor(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Interpolate between two hex colors */
function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = parseHexColor(color1);
  const c2 = parseHexColor(color2);

  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ============================================================================
// PARTICLE SYSTEM - Enterprise-grade with object pooling
// ============================================================================

class VerticalParticleSystem {
  private readonly pool: FlowParticle[] = [];
  private nextId = 0;
  private lastSpawnTime = 0;
  private readonly sizeRange: number;
  private readonly speedRange: number;

  constructor() {
    // Pre-allocate particle pool
    this.sizeRange = PARTICLE_CONFIG.sizeRange.max - PARTICLE_CONFIG.sizeRange.min;
    this.speedRange = PARTICLE_CONFIG.speedRange.max - PARTICLE_CONFIG.speedRange.min;

    for (let i = 0; i < PARTICLE_CONFIG.maxParticles; i++) {
      this.pool.push(this.createParticle());
    }
  }

  private createParticle(): FlowParticle {
    return {
      id: this.nextId++,
      progress: 0,
      speed: 0,
      size: 0,
      opacity: 0,
      xOffset: 0,
      trail: [],
      active: false,
    };
  }

  private resetParticle(particle: FlowParticle): void {
    particle.progress = 0;
    particle.speed = PARTICLE_CONFIG.speedRange.min + Math.random() * this.speedRange;
    particle.size = PARTICLE_CONFIG.sizeRange.min + Math.random() * this.sizeRange;
    particle.opacity = 0;
    particle.xOffset = (Math.random() - 0.5) * PARTICLE_CONFIG.wobbleAmount * 2;
    particle.trail.length = 0; // Reuse array
    particle.active = true;
  }

  spawnParticle(): void {
    const now = Date.now();
    if (now - this.lastSpawnTime < PARTICLE_CONFIG.spawnIntervalMs) return;

    // Find inactive particle in pool
    const particle = this.pool.find((p) => !p.active);
    if (!particle) return;

    this.resetParticle(particle);
    this.lastSpawnTime = now;
  }

  update(): void {
    const { fadeInThreshold, fadeOutThreshold, wobbleAmount, trailLength } = PARTICLE_CONFIG;

    for (const particle of this.pool) {
      if (!particle.active) continue;

      particle.progress += particle.speed;

      // Deactivate completed particles
      if (particle.progress >= 1) {
        particle.active = false;
        continue;
      }

      // Calculate wobble
      particle.xOffset = Math.sin(particle.progress * WOBBLE_FREQUENCY) * wobbleAmount;

      // Calculate opacity with fade in/out
      if (particle.progress < fadeInThreshold) {
        particle.opacity = particle.progress / fadeInThreshold;
      } else if (particle.progress > fadeOutThreshold) {
        particle.opacity = (1 - particle.progress) / (1 - fadeOutThreshold);
      } else {
        particle.opacity = 1;
      }

      // Update trail (reuse objects)
      if (particle.trail.length >= trailLength) {
        // Shift trail entries (reuse array slots)
        for (let i = particle.trail.length - 1; i > 0; i--) {
          const curr = particle.trail[i];
          const prev = particle.trail[i - 1];
          if (curr && prev) {
            curr.y = prev.y;
            curr.opacity = prev.opacity;
          }
        }
      } else {
        particle.trail.push({ y: 0, opacity: 0 });
      }
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    targetColor: string
  ): void {
    const centerX = width / 2;
    const { glowRadius, trailLength } = PARTICLE_CONFIG;

    for (const particle of this.pool) {
      if (!particle.active) continue;

      const easedProgress = easeOutCubic(particle.progress);
      const y = height * easedProgress;
      const x = centerX + particle.xOffset;

      // Update first trail position
      if (particle.trail[0]) {
        particle.trail[0].y = y;
        particle.trail[0].opacity = particle.opacity;
      }

      const currentColor = lerpColor(RANK_COLOR, targetColor, particle.progress);

      // Draw trail
      for (let i = 1; i < particle.trail.length; i++) {
        const trailPoint = particle.trail[i];
        if (!trailPoint) continue;

        const trailFactor = 1 - i / trailLength;
        const trailOpacity = trailFactor * 0.3 * particle.opacity;
        const trailSize = particle.size * (1 - i / trailLength * 0.5);

        ctx.beginPath();
        ctx.arc(x, trailPoint.y, trailSize, 0, TWO_PI);
        ctx.fillStyle = hexToRgba(currentColor, trailOpacity);
        ctx.fill();
      }

      // Draw glow (skip gradient creation if opacity is very low)
      if (particle.opacity > 0.1) {
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        glowGradient.addColorStop(0, hexToRgba(currentColor, particle.opacity * 0.4));
        glowGradient.addColorStop(1, hexToRgba(currentColor, 0));

        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, TWO_PI);
        ctx.fillStyle = glowGradient;
        ctx.fill();
      }

      // Draw main particle
      ctx.beginPath();
      ctx.arc(x, y, particle.size, 0, TWO_PI);
      ctx.fillStyle = hexToRgba(currentColor, particle.opacity);
      ctx.fill();

      // Inner bright core
      ctx.beginPath();
      ctx.arc(x, y, particle.size * 0.4, 0, TWO_PI);
      ctx.fillStyle = hexToRgba('#FFFFFF', particle.opacity * 0.7);
      ctx.fill();
    }
  }

  clear(): void {
    for (const particle of this.pool) {
      particle.active = false;
      particle.trail.length = 0;
    }
    this.lastSpawnTime = 0;
  }

  getActiveCount(): number {
    return this.pool.filter((p) => p.active).length;
  }
}

// ============================================================================
// ANIMATION TRANSITION - Memoized
// ============================================================================

const ARROW_ANIMATION = Object.freeze({
  y: [0, 4, 0],
});

const ARROW_TRANSITION = Object.freeze({
  duration: 1.5,
  repeat: Infinity,
  ease: 'easeInOut' as const,
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Visual flow connection between RANK stage and Semantic Ranking
 *
 * Shows animated particles flowing downward to indicate data transfer
 * from the main pipeline to the semantic ranking process.
 *
 * @example
 * ```tsx
 * <RankToSemanticFlow
 *   isRankActive={currentStage === 'rank'}
 *   isProcessing={stage === 'ranking'}
 *   currentTier={semanticTier}
 *   reducedMotion={prefersReducedMotion}
 * />
 * ```
 */
export const RankToSemanticFlow = memo<RankToSemanticFlowProps>(
  function RankToSemanticFlow({
    isRankActive,
    isProcessing,
    currentTier,
    reducedMotion,
  }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const particleSystemRef = useRef<VerticalParticleSystem | null>(null);
    const animationFrameRef = useRef<number>(0);
    const dprRef = useRef<number>(1);

    // Memoize derived state
    const shouldAnimate = useMemo(
      () => !reducedMotion && (isRankActive || isProcessing),
      [reducedMotion, isRankActive, isProcessing]
    );

    const targetColor = useMemo(
      () => currentTier ? SEMANTIC_TIER_COLORS[currentTier] : SEMANTIC_TIER_COLORS.immediate,
      [currentTier]
    );

    const gradientStyle = useMemo(
      () => ({ background: `linear-gradient(to bottom, ${RANK_COLOR}60, ${targetColor}60)` }),
      [targetColor]
    );

    const arrowStyle = useMemo(
      () => ({ color: targetColor }),
      [targetColor]
    );

    // Initialize particle system (lazy)
    useEffect(() => {
      if (!particleSystemRef.current) {
        particleSystemRef.current = new VerticalParticleSystem();
      }
      dprRef.current = window.devicePixelRatio || 1;

      return () => {
        particleSystemRef.current?.clear();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);

    // Animation loop with stable reference
    const animate = useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const particleSystem = particleSystemRef.current;

      if (!canvas || !container || !particleSystem) return;

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const dpr = dprRef.current;

      // Resize canvas if needed
      const targetWidth = width * dpr;
      const targetHeight = height * dpr;

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      ctx.clearRect(0, 0, width, height);

      particleSystem.spawnParticle();
      particleSystem.update();
      particleSystem.render(ctx, width, height, targetColor);

      animationFrameRef.current = requestAnimationFrame(animate);
    }, [targetColor]);

    // Start/stop animation effect
    useEffect(() => {
      if (!shouldAnimate) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = 0;
        }
        particleSystemRef.current?.clear();

        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
      }

      animate();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = 0;
        }
      };
    }, [shouldAnimate, animate]);

    // Early return for inactive state
    if (!isRankActive && !isProcessing) {
      return null;
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          ref={containerRef}
          className="relative flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={SPRING_PRESETS.soft}
          role="img"
          aria-label="Data flowing from ranking stage to semantic analysis"
        >
          {/* Phase 10.148: Larger connector for better particle visibility */}
          <div
            className="relative w-12 h-16"
            aria-hidden="true"
          >
            {/* Gradient line */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full"
              style={gradientStyle}
            />

            {/* Animated arrow */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 bottom-0"
              animate={ARROW_ANIMATION}
              transition={ARROW_TRANSITION}
            >
              <ArrowDown
                className="w-4 h-4"
                style={arrowStyle}
                aria-hidden="true"
              />
            </motion.div>

            {/* Canvas for particles */}
            {shouldAnimate && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  transform: 'translateZ(0)',
                  willChange: 'contents',
                }}
                aria-hidden="true"
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

export default RankToSemanticFlow;
