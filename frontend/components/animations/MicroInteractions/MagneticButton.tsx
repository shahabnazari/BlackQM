/**
 * MagneticButton Component
 * Button with magnetic hover effect
 * Phase 5 - Day 13 Implementation
 */

import { MAGNETIC_CONFIG, SCALE_VALUES } from '@/lib/animations/constants';
import { calculateMagneticPosition, throttleAnimation } from '@/lib/animations/utils';
import { cn } from '@/lib/utils';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  attractionRadius?: number;
  strength?: number;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  hapticFeedback?: boolean;
}

/**
 * Magnetic Button with attraction effect
 */
export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  attractionRadius = MAGNETIC_CONFIG.attractionRadius,
  strength = MAGNETIC_CONFIG.strength,
  onClick,
  onHoverStart,
  onHoverEnd,
  hapticFeedback = true,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [_isPressed, setIsPressed] = useState(false);
  
  // Motion values for magnetic effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  
  // Spring animations for smooth movement
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });
  const springScale = useSpring(scale, { stiffness: 400, damping: 25 });

  // Handle mouse move for magnetic effect
  const handleMouseMove = throttleAnimation((event: MouseEvent) => {
    if (!buttonRef.current || disabled) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const position = calculateMagneticPosition(
      event.clientX,
      event.clientY,
      rect,
      attractionRadius,
      strength
    );
    
    x.set(position.x);
    y.set(position.y);
  }, 16); // ~60fps

  // Handle mouse enter
  const handleMouseEnter = () => {
    if (disabled) return;
    setIsHovered(true);
    scale.set(SCALE_VALUES.hover);
    onHoverStart?.();
    
    // Add global mouse move listener
    document.addEventListener('mousemove', handleMouseMove);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (disabled) return;
    setIsHovered(false);
    setIsPressed(false);
    
    // Reset position with spring animation
    x.set(0);
    y.set(0);
    scale.set(SCALE_VALUES.normal);
    onHoverEnd?.();
    
    // Remove global mouse move listener
    document.removeEventListener('mousemove', handleMouseMove);
  };

  // Handle mouse down
  const handleMouseDown = () => {
    if (disabled) return;
    setIsPressed(true);
    scale.set(SCALE_VALUES.pressed);
    
    // Haptic feedback (if supported)
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (disabled) return;
    setIsPressed(false);
    scale.set(isHovered ? SCALE_VALUES.hover : SCALE_VALUES.normal);
  };

  // Handle click with ripple effect
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    // Create ripple effect
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const rippleX = event.clientX - rect.left;
      const rippleY = event.clientY - rect.top;
      
      // Trigger ripple animation (handled by CSS)
      button.style.setProperty('--ripple-x', `${rippleX}px`);
      button.style.setProperty('--ripple-y', `${rippleY}px`);
      button.classList.add('ripple');
      
      setTimeout(() => {
        button.classList.remove('ripple');
      }, 600);
    }
    
    onClick?.(event);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Button styles based on variant
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
  };

  // Button sizes
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      ref={buttonRef}
      className={cn(
        'relative inline-flex items-center justify-center',
        'font-medium rounded-lg transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'overflow-hidden magnetic-button',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      style={{
        x: springX,
        y: springY,
        scale: springScale,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : SCALE_VALUES.pressed }}
    >
      {/* Button Content */}
      <span className="relative z-10">{children}</span>
      
      {/* Hover Glow Effect */}
      {isHovered && !disabled && (
        <motion.div
          className="absolute inset-0 bg-white opacity-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      <style jsx>{`
        .magnetic-button::after {
          content: '';
          position: absolute;
          top: var(--ripple-y, 50%);
          left: var(--ripple-x, 50%);
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .magnetic-button.ripple::after {
          width: 300px;
          height: 300px;
          opacity: 0;
        }
      `}</style>
    </motion.button>
  );
};

/**
 * Magnetic Icon Button variant
 */
export const MagneticIconButton: React.FC<{
  icon: React.ReactNode;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel: string;
}> = ({ icon, className, size = 'medium', onClick, disabled, ariaLabel }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12',
  };

  return (
    <MagneticButton
      className={cn('!p-0', sizeClasses[size], className)}
      variant="ghost"
      {...(onClick && { onClick })}
      {...(disabled !== undefined && { disabled })}
      hapticFeedback
    >
      <span className="sr-only">{ariaLabel}</span>
      {icon}
    </MagneticButton>
  );
};

/**
 * Magnetic Link Component
 */
export const MagneticLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}> = ({ href, children, className, external }) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  const handleMouseMove = throttleAnimation((event: MouseEvent) => {
    if (!linkRef.current) return;
    
    const rect = linkRef.current.getBoundingClientRect();
    const position = calculateMagneticPosition(
      event.clientX,
      event.clientY,
      rect,
      20, // Smaller radius for links
      0.3  // Gentler strength
    );
    
    x.set(position.x);
    y.set(position.y);
  }, 16);

  return (
    <motion.a
      ref={linkRef}
      href={href}
      className={cn(
        'inline-flex items-center text-blue-500 hover:text-blue-600',
        'transition-colors relative',
        className
      )}
      style={{ x: springX, y: springY }}
      onMouseEnter={() => {
        document.addEventListener('mousemove', handleMouseMove);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
        document.removeEventListener('mousemove', handleMouseMove);
      }}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
      {external && (
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      )}
    </motion.a>
  );
};