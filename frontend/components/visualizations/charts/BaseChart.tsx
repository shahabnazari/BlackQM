import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

// Apple-style glass morphism effect
const glassStyle = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
  backdropFilter: 'saturate(180%) blur(20px)',
  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  boxShadow: `
    0 0.5px 0 1px rgba(255, 255, 255, 0.23) inset,
    0 1px 0 0 rgba(255, 255, 255, 0.66) inset,
    0 4px 16px rgba(0, 0, 0, 0.12)
  `,
  border: '1px solid rgba(255, 255, 255, 0.18)',
  borderRadius: '20px'
};

interface BaseChartProps {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  title?: string;
  subtitle?: string;
}

export const BaseChart: React.FC<BaseChartProps> = ({
  width,
  height,
  margin = { top: 20, right: 20, bottom: 20, left: 20 },
  children,
  className,
  animate = true,
  title,
  subtitle
}) => {
  const { theme } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add magnetic hover effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // 30px attraction radius
      const distance = Math.sqrt(x * x + y * y);
      if (distance < 30) {
        container.style.transform = `translate(${x * 0.05}px, ${y * 0.05}px)`;
      }
    };

    const handleMouseLeave = () => {
      container.style.transform = 'translate(0, 0)';
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={animate ? { opacity: 0, scale: 0.95 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.4, 0, 0.2, 1] // Apple's signature easing
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.15 }
      }}
      style={{
        ...glassStyle,
        transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      className={cn('p-6 relative overflow-hidden', className)}
    >
      {/* Title and subtitle */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Chart SVG */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-visible"
        style={{ 
          filter: theme === 'dark' ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))' : 'none' 
        }}
      >
        <defs>
          {/* Apple-style gradients */}
          <linearGradient id="appleBlue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#007AFF" stopOpacity="1" />
            <stop offset="100%" stopColor="#0051D5" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="appleGreen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34C759" stopOpacity="1" />
            <stop offset="100%" stopColor="#30B350" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="appleRed" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF3B30" stopOpacity="1" />
            <stop offset="100%" stopColor="#FF1810" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="applePurple" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5856D6" stopOpacity="1" />
            <stop offset="100%" stopColor="#4847C0" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="appleOrange" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF9500" stopOpacity="1" />
            <stop offset="100%" stopColor="#FF7700" stopOpacity="1" />
          </linearGradient>

          {/* Glass effect filter */}
          <filter id="glassEffect">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
            <feComponentTransfer>
              <feFuncA type="discrete" tableValues="1 1" />
            </feComponentTransfer>
          </filter>
        </defs>
        
        <g transform={`translate(${margin.left},${margin.top})`}>
          {children}
        </g>
      </svg>

      {/* Shimmer effect overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.2) 50%, transparent 60%)',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['200% 0%', '-200% 0%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 5,
          ease: 'linear',
        }}
      />
    </motion.div>
  );
};