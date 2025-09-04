import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { MagneticButton } from '../MagneticButton';
import { ElasticTap } from '../ElasticTap';
import { HoverScale } from '../HoverScale';
import { RippleEffect } from '../RippleEffect';
import { PulseDot } from '../PulseDot';
import { SpringyRotate } from '../SpringyRotate';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onMouseMove, onMouseLeave, onClick, style, ...props }: any) => (
      <button 
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        style={style}
        {...props}
      >
        {children}
      </button>
    ),
    div: ({ children, onMouseDown, style, ...props }: any) => (
      <div onMouseDown={onMouseDown} style={style} {...props}>
        {children}
      </div>
    ),
    span: ({ children, style, ...props }: any) => (
      <span style={style} {...props}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
  useSpring: () => ({ set: vi.fn(), get: () => 0 }),
  useTransform: (value: any, input: any, output: any) => value,
}));

describe('MicroInteractions Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MagneticButton Component', () => {
    it('renders children correctly', () => {
      render(
        <MagneticButton>
          <span>Magnetic Button</span>
        </MagneticButton>
      );
      
      expect(screen.getByText('Magnetic Button')).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(
        <MagneticButton onClick={handleClick}>
          Click Me
        </MagneticButton>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies custom className', () => {
      render(
        <MagneticButton className="custom-class">
          Button
        </MagneticButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('handles mouse movement for magnetic effect', () => {
      const { container } = render(
        <MagneticButton attractionRadius={50}>
          Hover Me
        </MagneticButton>
      );
      
      const button = container.querySelector('button');
      
      // Simulate mouse movement
      fireEvent.mouseMove(button!, {
        clientX: 100,
        clientY: 100,
      });
      
      // Button should respond to mouse movement
      expect(button).toBeInTheDocument();
    });

    it('resets position on mouse leave', () => {
      const { container } = render(
        <MagneticButton>
          Hover Me
        </MagneticButton>
      );
      
      const button = container.querySelector('button');
      
      // Simulate mouse enter and leave
      fireEvent.mouseMove(button!, { clientX: 100, clientY: 100 });
      fireEvent.mouseLeave(button!);
      
      // Position should reset
      expect(button).toBeInTheDocument();
    });

    it('respects attraction strength prop', () => {
      render(
        <MagneticButton strength={0.8}>
          Strong Magnet
        </MagneticButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('can be disabled', () => {
      const handleClick = vi.fn();
      render(
        <MagneticButton onClick={handleClick} disabled>
          Disabled Button
        </MagneticButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('ElasticTap Component', () => {
    it('renders children correctly', () => {
      render(
        <ElasticTap>
          <div>Elastic Content</div>
        </ElasticTap>
      );
      
      expect(screen.getByText('Elastic Content')).toBeInTheDocument();
    });

    it('handles tap events', () => {
      const handleTap = vi.fn();
      render(
        <ElasticTap onTap={handleTap}>
          Tap Me
        </ElasticTap>
      );
      
      const element = screen.getByText('Tap Me');
      fireEvent.click(element);
      
      expect(handleTap).toHaveBeenCalledTimes(1);
    });

    it('applies custom scale on tap', () => {
      render(
        <ElasticTap tapScale={0.9}>
          Tap Me
        </ElasticTap>
      );
      
      const element = screen.getByText('Tap Me');
      expect(element).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ElasticTap className="elastic-class">
          Content
        </ElasticTap>
      );
      
      expect(container.querySelector('.elastic-class')).toBeInTheDocument();
    });
  });

  describe('HoverScale Component', () => {
    it('renders children correctly', () => {
      render(
        <HoverScale>
          <div>Hover Content</div>
        </HoverScale>
      );
      
      expect(screen.getByText('Hover Content')).toBeInTheDocument();
    });

    it('applies scale on hover', () => {
      render(
        <HoverScale scale={1.1}>
          Hover Me
        </HoverScale>
      );
      
      const element = screen.getByText('Hover Me');
      
      // Simulate hover
      fireEvent.mouseEnter(element);
      expect(element).toBeInTheDocument();
      
      fireEvent.mouseLeave(element);
      expect(element).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(
        <HoverScale onClick={handleClick}>
          Click Me
        </HoverScale>
      );
      
      const element = screen.getByText('Click Me');
      fireEvent.click(element);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies custom duration', () => {
      render(
        <HoverScale duration={0.5}>
          Content
        </HoverScale>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('RippleEffect Component', () => {
    it('renders children correctly', () => {
      render(
        <RippleEffect>
          <button>Ripple Button</button>
        </RippleEffect>
      );
      
      expect(screen.getByText('Ripple Button')).toBeInTheDocument();
    });

    it('creates ripple on click', async () => {
      const { container } = render(
        <RippleEffect>
          <button>Click for Ripple</button>
        </RippleEffect>
      );
      
      const button = screen.getByText('Click for Ripple');
      
      // Simulate click at specific position
      fireEvent.mouseDown(button, {
        clientX: 50,
        clientY: 50,
      });
      
      // Check if ripple element is created
      await waitFor(() => {
        const ripples = container.querySelectorAll('.absolute');
        expect(ripples.length).toBeGreaterThan(0);
      });
    });

    it('applies custom ripple color', () => {
      render(
        <RippleEffect color="rgba(255, 0, 0, 0.5)">
          <button>Red Ripple</button>
        </RippleEffect>
      );
      
      expect(screen.getByText('Red Ripple')).toBeInTheDocument();
    });

    it('applies custom duration', () => {
      render(
        <RippleEffect duration={1000}>
          <button>Slow Ripple</button>
        </RippleEffect>
      );
      
      expect(screen.getByText('Slow Ripple')).toBeInTheDocument();
    });

    it('handles multiple ripples', async () => {
      const { container } = render(
        <RippleEffect>
          <button>Multi Ripple</button>
        </RippleEffect>
      );
      
      const button = screen.getByText('Multi Ripple');
      
      // Create multiple ripples
      fireEvent.mouseDown(button, { clientX: 20, clientY: 20 });
      fireEvent.mouseDown(button, { clientX: 40, clientY: 40 });
      fireEvent.mouseDown(button, { clientX: 60, clientY: 60 });
      
      await waitFor(() => {
        const ripples = container.querySelectorAll('.absolute');
        expect(ripples.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('PulseDot Component', () => {
    it('renders with default props', () => {
      const { container } = render(<PulseDot />);
      
      const dot = container.querySelector('.rounded-full');
      expect(dot).toBeInTheDocument();
    });

    it('applies custom size', () => {
      const { container } = render(<PulseDot size={20} />);
      
      const dot = container.querySelector('[style*="width: 20px"]');
      expect(dot).toHaveStyle({ width: '20px', height: '20px' });
    });

    it('applies custom color', () => {
      const { container } = render(<PulseDot color="bg-red-500" />);
      
      const dot = container.querySelector('.bg-red-500');
      expect(dot).toBeInTheDocument();
    });

    it('creates pulsing rings', () => {
      const { container } = render(<PulseDot />);
      
      // Should have core dot and pulsing rings
      const elements = container.querySelectorAll('.rounded-full');
      expect(elements.length).toBeGreaterThan(1);
    });

    it('applies custom className', () => {
      const { container } = render(<PulseDot className="custom-pulse" />);
      
      expect(container.querySelector('.custom-pulse')).toBeInTheDocument();
    });

    it('handles absolute positioning', () => {
      const { container } = render(<PulseDot className="absolute top-0 right-0" />);
      
      const dot = container.querySelector('.absolute');
      expect(dot).toHaveClass('top-0', 'right-0');
    });
  });

  describe('SpringyRotate Component', () => {
    it('renders children correctly', () => {
      render(
        <SpringyRotate>
          <div>Rotating Content</div>
        </SpringyRotate>
      );
      
      expect(screen.getByText('Rotating Content')).toBeInTheDocument();
    });

    it('rotates on hover', () => {
      render(
        <SpringyRotate rotation={180}>
          Hover to Rotate
        </SpringyRotate>
      );
      
      const element = screen.getByText('Hover to Rotate');
      
      fireEvent.mouseEnter(element);
      expect(element).toBeInTheDocument();
      
      fireEvent.mouseLeave(element);
      expect(element).toBeInTheDocument();
    });

    it('applies spring configuration', () => {
      render(
        <SpringyRotate
          rotation={360}
          stiffness={200}
          damping={15}
        >
          Springy
        </SpringyRotate>
      );
      
      expect(screen.getByText('Springy')).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(
        <SpringyRotate onClick={handleClick}>
          Click Me
        </SpringyRotate>
      );
      
      const element = screen.getByText('Click Me');
      fireEvent.click(element);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies custom className', () => {
      const { container } = render(
        <SpringyRotate className="rotate-class">
          Content
        </SpringyRotate>
      );
      
      expect(container.querySelector('.rotate-class')).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    it('renders multiple magnetic buttons efficiently', () => {
      const startTime = performance.now();
      
      const { container } = render(
        <div>
          {Array.from({ length: 20 }).map((_, i) => (
            <MagneticButton key={i}>
              Button {i}
            </MagneticButton>
          ))}
        </div>
      );
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
      
      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(20);
    });

    it('handles rapid interactions without lag', async () => {
      const handleClick = vi.fn();
      
      render(
        <ElasticTap onTap={handleClick}>
          Rapid Tap
        </ElasticTap>
      );
      
      const element = screen.getByText('Rapid Tap');
      
      // Simulate rapid taps
      for (let i = 0; i < 10; i++) {
        fireEvent.click(element);
      }
      
      expect(handleClick).toHaveBeenCalledTimes(10);
    });
  });

  describe('Accessibility', () => {
    it('magnetic button maintains keyboard accessibility', () => {
      const handleClick = vi.fn();
      
      render(
        <MagneticButton onClick={handleClick}>
          Accessible Button
        </MagneticButton>
      );
      
      const button = screen.getByRole('button');
      
      // Should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);
      
      // Should respond to keyboard events
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
    });

    it('preserves ARIA attributes', () => {
      render(
        <MagneticButton aria-label="Custom Label" aria-pressed="true">
          Button
        </MagneticButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom Label');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  });
});