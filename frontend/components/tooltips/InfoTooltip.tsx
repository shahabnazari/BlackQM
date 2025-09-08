'use client';

import React, { useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { ExternalLink } from 'lucide-react';

interface InfoTooltipProps {
  title: string;
  content: string;
  examples?: string[];
  link?: {
    text: string;
    href: string;
  };
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ 
  title, 
  content, 
  examples,
  link,
  position = 'top' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-tertiary-background';
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-tertiary-background';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-tertiary-background';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-tertiary-background';
      default:
        return 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-tertiary-background';
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          e.preventDefault();
          setIsVisible(!isVisible);
        }}
        className="inline-flex items-center justify-center w-5 h-5 text-secondary-label hover:text-label transition-colors"
        aria-label="More information"
      >
        <InformationCircleIcon className="w-5 h-5" />
      </button>

      {isVisible && (
        <div 
          className={`absolute z-50 ${getPositionClasses()} pointer-events-none`}
          role="tooltip"
        >
          <div className="relative bg-tertiary-background border border-quaternary-fill rounded-lg shadow-lg p-4 max-w-xs pointer-events-auto">
            {/* Arrow */}
            <div 
              className={`absolute w-2 h-2 bg-tertiary-background border-quaternary-fill transform rotate-45 ${getArrowClasses()}`}
              style={{
                borderWidth: position === 'top' || position === 'left' ? '0 1px 1px 0' : '1px 0 0 1px'
              }}
            />
            
            {/* Content */}
            <div className="relative">
              <h4 className="font-semibold text-label mb-2">{title}</h4>
              <p className="text-sm text-secondary-label mb-2">{content}</p>
              
              {examples && examples.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-secondary-label mb-1">Examples:</p>
                  <ul className="text-xs text-tertiary-label space-y-0.5">
                    {examples.map((example, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-1">•</span>
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
                  className="inline-flex items-center gap-1 text-xs text-system-blue hover:underline mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {link.text}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;