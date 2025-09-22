'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  preview?: {
    title: string;
    description: string;
    stats?: {
      label: string;
      value: string | number;
    }[];
  };
}

interface BreadcrumbsProps {
  className?: string;
  items?: BreadcrumbItem[];
  maxItems?: number;
  showHome?: boolean;
}

export function Breadcrumbs({
  className = '',
  items,
  maxItems = 4,
  showHome = true,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [previewPosition, setPreviewPosition] = useState<'top' | 'bottom'>(
    'bottom'
  );
  const previewRef = useRef<HTMLDivElement>(null);

  // Generate breadcrumbs from pathname if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;

    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home if requested
    if (showHome) {
      breadcrumbs.push({
        label: 'Home',
        href: '/',
        preview: {
          title: 'Dashboard',
          description: 'Return to your main dashboard',
          stats: [
            { label: 'Active Studies', value: 3 },
            { label: 'Participants', value: 127 },
          ],
        },
      });
    }

    // Build breadcrumb items from path segments
    paths.forEach((segment, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      const label = formatLabel(segment);

      // Add preview data based on path segment
      const preview = generatePreview(segment, href);

      const breadcrumbHref = index < paths.length - 1 ? href : undefined;
      if (breadcrumbHref !== undefined && preview) {
        breadcrumbs.push({
          label,
          href: breadcrumbHref,
          preview,
        });
      } else if (breadcrumbHref !== undefined && !preview) {
        breadcrumbs.push({
          label,
          href: breadcrumbHref,
          preview: {
            title: label,
            description: ''
          },
        });
      } else if (preview) {
        breadcrumbs.push({
          label,
          href: '',
          preview,
        });
      } else {
        breadcrumbs.push({
          label,
          href: '',
          preview: {
            title: label,
            description: ''
          },
        });
      }
    });

    return breadcrumbs;
  };

  // Format label from path segment
  const formatLabel = (segment: string): string => {
    // Handle special cases
    const specialCases: Record<string, string> = {
      researcher: 'Researcher',
      participant: 'Participant',
      auth: 'Authentication',
      settings: 'Settings',
      studies: 'Studies',
      analytics: 'Analytics',
      help: 'Help',
    };

    const specialCase = specialCases[segment.toLowerCase()];
    if (specialCase) {
      return specialCase;
    }

    // Handle UUID-like segments
    if (
      segment.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    ) {
      return 'Details';
    }

    // Format normally
    return segment
      .split('-')
      .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Generate preview data based on context
  const generatePreview = (
    segment: string,
    _href: string
  ): BreadcrumbItem['preview'] => {
    const previewMap: Record<string, BreadcrumbItem['preview']> = {
      studies: {
        title: 'Studies Dashboard',
        description: 'Manage all your Q-methodology studies',
        stats: [
          { label: 'Active', value: 3 },
          { label: 'Draft', value: 2 },
          { label: 'Completed', value: 8 },
        ],
      },
      analytics: {
        title: 'Analytics Center',
        description: 'View detailed analysis and reports',
        stats: [
          { label: 'Reports', value: 15 },
          { label: 'Exports', value: 23 },
        ],
      },
      participants: {
        title: 'Participant Management',
        description: 'View and manage study participants',
        stats: [
          { label: 'Total', value: 127 },
          { label: 'Active', value: 45 },
        ],
      },
      settings: {
        title: 'Account Settings',
        description: 'Manage your profile and preferences',
        stats: [
          { label: 'Profile', value: '90% complete' },
          { label: 'Security', value: '2FA enabled' },
        ],
      },
    };

    return previewMap[segment.toLowerCase()];
  };

  // Check if preview should appear above or below
  useEffect(() => {
    if (hoveredIndex !== null && previewRef.current) {
      const rect = previewRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      setPreviewPosition(
        spaceBelow < 200 && spaceAbove > spaceBelow ? 'top' : 'bottom'
      );
    }
  }, [hoveredIndex]);

  const breadcrumbItems = generateBreadcrumbs();

  // Handle overflow with ellipsis
  const displayItems = (() => {
    if (breadcrumbItems.length <= maxItems) {
      return breadcrumbItems;
    }

    const firstItem = breadcrumbItems[0];
    const lastItems = breadcrumbItems.slice(-(maxItems - 2));
    const hiddenCount = breadcrumbItems.length - (maxItems - 1);

    return [
      firstItem,
      {
        label: `... ${hiddenCount} more`,
        preview: {
          title: 'Hidden Items',
          description: `${hiddenCount} items hidden for space`,
        },
      },
      ...lastItems,
    ];
  })();

  return (
    <nav
      className={`flex items-center space-x-1 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1 flex-wrap">
        {displayItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronIcon className="w-4 h-4 mx-1 text-gray-400 dark:text-gray-600 flex-shrink-0" />
            )}

            <div className="relative">
              {item && item.href ? (
                <Link
                  href={item.href}
                  className="relative inline-flex items-center px-2 py-1 rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {index === 0 && showHome && (
                    <HomeIcon className="w-4 h-4 mr-1" />
                  )}
                  <span className="truncate max-w-[200px] sm:max-w-none">
                    {item?.label || ''}
                  </span>
                </Link>
              ) : item ? (
                <span className="inline-flex items-center px-2 py-1 text-gray-900 dark:text-gray-100 font-medium">
                  {index === 0 && showHome && (
                    <HomeIcon className="w-4 h-4 mr-1" />
                  )}
                  <span className="truncate max-w-[200px] sm:max-w-none">
                    {item.label}
                  </span>
                </span>
              ) : null}

              {/* Preview on Hover */}
              {hoveredIndex === index && item?.preview && (
                <div
                  ref={previewRef}
                  className={`absolute left-0 z-50 mt-1 w-64 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-xl ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in slide-in-from-top-1 duration-200 ${
                    previewPosition === 'top' ? 'bottom-full mb-1' : 'top-full'
                  }`}
                >
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {item.preview.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.preview.description}
                      </p>
                    </div>

                    {item.preview.stats && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                        <div className="grid grid-cols-2 gap-2">
                          {item.preview.stats.map((stat, statIndex) => (
                            <div key={statIndex}>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {stat.label}
                              </p>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {stat.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Arrow pointer */}
                  <div
                    className={`absolute left-4 w-2 h-2 bg-white dark:bg-gray-900 transform rotate-45 ring-1 ring-black/5 dark:ring-white/10 ${
                      previewPosition === 'top'
                        ? 'bottom-[-4px] ring-t-0 ring-l-0'
                        : 'top-[-4px] ring-b-0 ring-r-0'
                    }`}
                  />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* Mobile Overflow Indicator */}
      {breadcrumbItems.length > maxItems && (
        <div className="sm:hidden ml-2">
          <button
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Show all breadcrumbs"
          >
            <MoreIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </nav>
  );
}

// Icon Components
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
      />
    </svg>
  );
}
