import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonForm,
  SkeletonList,
  SkeletonWidget,
  SkeletonProfile,
} from '../SkeletonScreen';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, animate, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('Skeleton Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Skeleton Base Component', () => {
    it('renders with default props', () => {
      render(<Skeleton />);
      const skeleton = document.querySelector('.bg-gray-200');
      expect(skeleton).toBeInTheDocument();
    });

    it('applies custom width and height', () => {
      render(<Skeleton width={200} height={100} />);
      const skeleton = document.querySelector('[style*="width: 200px"]');
      expect(skeleton).toHaveStyle({ width: '200px', height: '100px' });
    });

    it('applies custom className', () => {
      render(<Skeleton className="custom-class" />);
      const skeleton = document.querySelector('.custom-class');
      expect(skeleton).toBeInTheDocument();
    });

    it('renders with rounded variant', () => {
      render(<Skeleton variant="rounded" />);
      const skeleton = document.querySelector('.rounded-lg');
      expect(skeleton).toBeInTheDocument();
    });

    it('renders with circular variant', () => {
      render(<Skeleton variant="circular" />);
      const skeleton = document.querySelector('.rounded-full');
      expect(skeleton).toBeInTheDocument();
    });

    it('applies shimmer animation', () => {
      render(<Skeleton animate />);
      const skeleton = document.querySelector('.bg-gray-200');
      expect(skeleton).toBeInTheDocument();
      // Check for shimmer gradient
      const shimmerElement = skeleton?.querySelector('.absolute');
      expect(shimmerElement).toBeInTheDocument();
    });
  });

  describe('SkeletonCard Component', () => {
    it('renders card skeleton structure', () => {
      render(<SkeletonCard />);
      const card = document.querySelector('.rounded-lg');
      expect(card).toBeInTheDocument();
    });

    it('shows image skeleton when showImage is true', () => {
      render(<SkeletonCard showImage />);
      const imageSkeleton = document.querySelector('[style*="height: 200px"]');
      expect(imageSkeleton).toBeInTheDocument();
    });

    it('shows avatar skeleton when showAvatar is true', () => {
      render(<SkeletonCard showAvatar />);
      const avatarSkeleton = document.querySelector('.rounded-full');
      expect(avatarSkeleton).toBeInTheDocument();
    });

    it('renders correct number of text lines', () => {
      render(<SkeletonCard lines={3} />);
      const textLines = document.querySelectorAll('.bg-gray-200');
      // Count text lines (excluding other skeleton elements)
      expect(textLines.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('SkeletonTable Component', () => {
    it('renders table skeleton with default rows and columns', () => {
      render(<SkeletonTable />);
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('renders correct number of rows', () => {
      render(<SkeletonTable rows={3} />);
      const rows = document.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(3);
    });

    it('renders correct number of columns', () => {
      render(<SkeletonTable columns={4} />);
      const firstRow = document.querySelector('tbody tr');
      const cells = firstRow?.querySelectorAll('td');
      expect(cells).toHaveLength(4);
    });

    it('shows header when specified', () => {
      render(<SkeletonTable showHeader />);
      const header = document.querySelector('thead');
      expect(header).toBeInTheDocument();
    });
  });

  describe('SkeletonChart Component', () => {
    it('renders chart skeleton', () => {
      render(<SkeletonChart />);
      const chart = document.querySelector('.rounded-lg');
      expect(chart).toBeInTheDocument();
    });

    it('applies custom height', () => {
      render(<SkeletonChart height={400} />);
      const chart = document.querySelector('[style*="height: 400px"]');
      expect(chart).toBeInTheDocument();
    });

    it('renders bar chart type', () => {
      render(<SkeletonChart type="bar" />);
      const bars = document.querySelectorAll('.bg-gray-200');
      expect(bars.length).toBeGreaterThan(1);
    });

    it('renders line chart type', () => {
      render(<SkeletonChart type="line" />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders pie chart type', () => {
      render(<SkeletonChart type="pie" />);
      const circle = document.querySelector('.rounded-full');
      expect(circle).toBeInTheDocument();
    });
  });

  describe('SkeletonForm Component', () => {
    it('renders form skeleton with default fields', () => {
      render(<SkeletonForm />);
      const form = document.querySelector('.space-y-4');
      expect(form).toBeInTheDocument();
    });

    it('renders correct number of fields', () => {
      render(<SkeletonForm fields={4} />);
      const fields = document.querySelectorAll('.space-y-2');
      expect(fields).toHaveLength(4);
    });

    it('shows button skeleton when specified', () => {
      render(<SkeletonForm showButton />);
      const buttons = document.querySelectorAll('.bg-gray-200');
      const buttonSkeleton = Array.from(buttons).find(el => 
        el.getAttribute('style')?.includes('height: 40px')
      );
      expect(buttonSkeleton).toBeInTheDocument();
    });
  });

  describe('SkeletonList Component', () => {
    it('renders list skeleton with default items', () => {
      render(<SkeletonList />);
      const list = document.querySelector('.space-y-2');
      expect(list).toBeInTheDocument();
    });

    it('renders correct number of items', () => {
      render(<SkeletonList items={6} />);
      const items = document.querySelectorAll('.flex.items-center');
      expect(items.length).toBeGreaterThanOrEqual(6);
    });

    it('shows avatar for each item when specified', () => {
      render(<SkeletonList showAvatar items={3} />);
      const avatars = document.querySelectorAll('.rounded-full');
      expect(avatars.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('SkeletonWidget Component', () => {
    it('renders widget skeleton', () => {
      render(<SkeletonWidget />);
      const widget = document.querySelector('.rounded-lg');
      expect(widget).toBeInTheDocument();
    });

    it('shows icon when specified', () => {
      render(<SkeletonWidget showIcon />);
      const icon = document.querySelector('.rounded-full');
      expect(icon).toBeInTheDocument();
    });

    it('shows chart when specified', () => {
      render(<SkeletonWidget showChart />);
      const chart = document.querySelector('[style*="height: 100px"]');
      expect(chart).toBeInTheDocument();
    });
  });

  describe('SkeletonProfile Component', () => {
    it('renders profile skeleton', () => {
      render(<SkeletonProfile />);
      const profile = document.querySelector('.flex');
      expect(profile).toBeInTheDocument();
    });

    it('shows cover when specified', () => {
      render(<SkeletonProfile showCover />);
      const cover = document.querySelector('[style*="height: 200px"]');
      expect(cover).toBeInTheDocument();
    });

    it('renders avatar skeleton', () => {
      render(<SkeletonProfile />);
      const avatar = document.querySelector('.rounded-full');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders multiple skeletons efficiently', () => {
      const startTime = performance.now();
      const { container } = render(
        <div>
          {Array.from({ length: 50 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should render in under 100ms
      const skeletons = container.querySelectorAll('.rounded-lg');
      expect(skeletons.length).toBe(50);
    });
  });
});