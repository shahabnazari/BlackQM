'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { ExternalLink } from 'lucide-react';
import { createPortal } from 'react-dom';

interface InfoTooltipProps {
  title: string;
  content: string;
  examples?: string[];
  link?: {
    text: string;
    href: string;
  };
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  delay?: number;
}

export const InfoTooltipV2: React.FC<InfoTooltipProps> = ({ 
  title, 
  content, 
  examples,
  link,
  position = 'auto',
  delay = 300
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  const tooltipId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const calculatePosition = () => {
      const trigger = triggerRef.current!;
      const tooltip = tooltipRef.current!;
      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      const spacing = 8; // Space between trigger and tooltip
      const viewportPadding = 10; // Minimum distance from viewport edge
      
      let finalPosition = position;
      let x = 0;
      let y = 0;

      // Auto positioning - find best position that fits
      if (position === 'auto') {
        const positions: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'right', 'left'];
        
        for (const pos of positions) {
          const fits = checkPositionFits(triggerRect, tooltipRect, pos, viewportPadding);
          if (fits) {
            finalPosition = pos;
            break;
          }
        }
        
        // Default to top if none fit perfectly
        if (finalPosition === 'auto') finalPosition = 'top';
      }

      // Calculate coordinates based on position
      switch (finalPosition) {
        case 'top':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.top - tooltipRect.height - spacing;
          break;
        case 'bottom':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.bottom + spacing;
          break;
        case 'left':
          x = triggerRect.left - tooltipRect.width - spacing;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
        case 'right':
          x = triggerRect.right + spacing;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
      }

      // Ensure tooltip stays within viewport with padding
      x = Math.max(viewportPadding, Math.min(x, window.innerWidth - tooltipRect.width - viewportPadding));
      y = Math.max(viewportPadding, Math.min(y, window.innerHeight - tooltipRect.height - viewportPadding));

      setActualPosition(finalPosition as any);
      setCoords({ x, y });
    };

    calculatePosition();
    
    // Recalculate on scroll or resize
    const handleRecalculate = () => calculatePosition();
    window.addEventListener('scroll', handleRecalculate, true);
    window.addEventListener('resize', handleRecalculate);
    
    return () => {
      window.removeEventListener('scroll', handleRecalculate, true);
      window.removeEventListener('resize', handleRecalculate);
    };
  }, [isVisible, position]);

  const checkPositionFits = (
    triggerRect: DOMRect,
    tooltipRect: DOMRect,
    pos: 'top' | 'bottom' | 'left' | 'right',
    padding: number
  ): boolean => {
    switch (pos) {
      case 'top':
        return triggerRect.top - tooltipRect.height - 8 > padding;
      case 'bottom':
        return triggerRect.bottom + tooltipRect.height + 8 < window.innerHeight - padding;
      case 'left':
        return triggerRect.left - tooltipRect.width - 8 > padding;
      case 'right':
        return triggerRect.right + tooltipRect.width + 8 < window.innerWidth - padding;
      default:
        return false;
    }
  };

  const handleMouseEnter = () => {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(hoverTimeoutRef.current);
    setIsVisible(!isVisible);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isVisible) {
      setIsVisible(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      clearTimeout(hoverTimeoutRef.current);
      setIsVisible(!isVisible);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const getArrowStyles = () => {
    if (!triggerRef.current || !tooltipRef.current) return {};
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    
    switch (actualPosition) {
      case 'top':
        return {
          bottom: '-4px',
          left: `${triggerRect.left + triggerRect.width / 2 - coords.x}px`,
          transform: 'translateX(-50%) rotate(45deg)',
        };
      case 'bottom':
        return {
          top: '-4px',
          left: `${triggerRect.left + triggerRect.width / 2 - coords.x}px`,
          transform: 'translateX(-50%) rotate(45deg)',
        };
      case 'left':
        return {
          right: '-4px',
          top: `${triggerRect.top + triggerRect.height / 2 - coords.y}px`,
          transform: 'translateY(-50%) rotate(45deg)',
        };
      case 'right':
        return {
          left: '-4px',
          top: `${triggerRect.top + triggerRect.height / 2 - coords.y}px`,
          transform: 'translateY(-50%) rotate(45deg)',
        };
      default:
        return {};
    }
  };

  const tooltipContent = isVisible ? (
    <div
      ref={tooltipRef}
      id={tooltipId}
      role="tooltip"
      className="fixed z-[9999] transition-all duration-200 ease-out opacity-100 scale-100"
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
      }}
      onMouseEnter={() => clearTimeout(hoverTimeoutRef.current)}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-w-xs">
        {/* Arrow */}
        <div
          className="absolute w-2 h-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          style={{
            ...getArrowStyles(),
            borderWidth: actualPosition === 'top' || actualPosition === 'left' ? '0 1px 1px 0' : '1px 0 0 1px',
          }}
        />
        
        {/* Content */}
        <div className="relative p-3">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1.5">
            {title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
            {content}
          </p>
          
          {examples && examples.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                Examples:
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                {examples.map((example, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-1.5 text-gray-400">•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {link && (
            <a 
              href={link.href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {link.text}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
        aria-label="More information"
        aria-describedby={isVisible ? tooltipId : undefined}
        aria-expanded={isVisible}
      >
        <InformationCircleIcon className="w-5 h-5" />
      </button>
      
      {mounted && createPortal(tooltipContent, document.body)}
    </>
  );
};

export default InfoTooltipV2;