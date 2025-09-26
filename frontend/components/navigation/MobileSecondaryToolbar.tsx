'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Filter,
  ArrowUpDown,
  Download,
  Upload,
  Share2,
  Copy,
  Edit,
  Trash2,
  Plus,
  Settings,
  Info,
  HelpCircle,
  ChevronDown,
  Grid,
  List,
  Tag,
  Bookmark,
  Star,
  Flag,
  Bell,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolAction {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
}

interface ToolSection {
  id: string;
  title: string;
  actions: ToolAction[];
}

interface MobileSecondaryToolbarProps {
  isOpen: boolean;
  onClose: () => void;
  phase?: string;
  title?: string;
  sections?: ToolSection[];
  className?: string;
}

// Default tool sections for different phases
const phaseTools: Record<string, ToolSection[]> = {
  DISCOVER: [
    {
      id: 'search',
      title: 'Search Tools',
      actions: [
        { id: 'filter', label: 'Filter', icon: Filter, action: () => {} },
        { id: 'sort', label: 'Sort', icon: ArrowUpDown, action: () => {} },
        {
          id: 'save-search',
          label: 'Save Search',
          icon: Bookmark,
          action: () => {},
        },
      ],
    },
    {
      id: 'manage',
      title: 'Manage',
      actions: [
        { id: 'export', label: 'Export', icon: Download, action: () => {} },
        { id: 'import', label: 'Import', icon: Upload, action: () => {} },
        { id: 'share', label: 'Share', icon: Share2, action: () => {} },
      ],
    },
  ],
  BUILD: [
    {
      id: 'statements',
      title: 'Statement Tools',
      actions: [
        {
          id: 'add',
          label: 'Add Statement',
          icon: Plus,
          action: () => {},
          variant: 'primary',
        },
        { id: 'edit', label: 'Edit', icon: Edit, action: () => {} },
        { id: 'duplicate', label: 'Duplicate', icon: Copy, action: () => {} },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          action: () => {},
          variant: 'danger',
        },
      ],
    },
    {
      id: 'organize',
      title: 'Organize',
      actions: [
        { id: 'grid', label: 'Grid View', icon: Grid, action: () => {} },
        { id: 'list', label: 'List View', icon: List, action: () => {} },
        { id: 'tag', label: 'Add Tags', icon: Tag, action: () => {} },
      ],
    },
  ],
  ANALYZE: [
    {
      id: 'analysis',
      title: 'Analysis Tools',
      actions: [
        { id: 'refresh', label: 'Refresh', icon: RefreshCw, action: () => {} },
        {
          id: 'save',
          label: 'Save',
          icon: Save,
          action: () => {},
          variant: 'primary',
        },
        { id: 'export', label: 'Export', icon: Download, action: () => {} },
      ],
    },
    {
      id: 'view',
      title: 'View Options',
      actions: [
        { id: 'show', label: 'Show All', icon: Eye, action: () => {} },
        { id: 'hide', label: 'Hide Details', icon: EyeOff, action: () => {} },
        { id: 'lock', label: 'Lock View', icon: Lock, action: () => {} },
      ],
    },
  ],
};

export function MobileSecondaryToolbar({
  isOpen,
  onClose,
  phase = 'DISCOVER',
  title = 'Tools',
  sections,
  className,
}: MobileSecondaryToolbarProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const toolSections = sections || phaseTools[phase] || [];

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
          />

          {/* Modal Toolbar */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-background rounded-t-2xl shadow-xl',
              'max-h-[70vh] flex flex-col',
              'md:hidden',
              className
            )}
          >
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {phase} Phase Tools
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className={cn(
                    'p-2 rounded-full',
                    'hover:bg-accent transition-colors',
                    'touch-manipulation'
                  )}
                  aria-label="Close toolbar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {toolSections.map(section => (
                <div key={section.id} className="mb-6">
                  {/* Section Header */}
                  <button
                    onClick={() =>
                      setActiveSection(
                        activeSection === section.id ? null : section.id
                      )
                    }
                    className={cn(
                      'w-full flex items-center justify-between',
                      'p-2 mb-3 rounded-lg',
                      'hover:bg-accent transition-colors',
                      'touch-manipulation'
                    )}
                  >
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.title}
                    </h4>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        activeSection === section.id && 'rotate-180'
                      )}
                    />
                  </button>

                  {/* Section Actions */}
                  <motion.div
                    initial={false}
                    animate={{
                      height: activeSection === section.id ? 'auto' : 'auto',
                      opacity: activeSection === section.id ? 1 : 1,
                    }}
                    className="grid grid-cols-3 gap-3"
                  >
                    {section.actions.map(action => {
                      const Icon = action.icon;

                      return (
                        <motion.button
                          key={action.id}
                          whileTap={{ scale: action.disabled ? 1 : 0.95 }}
                          onClick={action.action}
                          disabled={action.disabled}
                          className={cn(
                            'flex flex-col items-center justify-center',
                            'p-4 rounded-xl space-y-2',
                            'transition-all duration-200',
                            'touch-manipulation',
                            'focus:outline-none focus:ring-2 focus:ring-primary',
                            action.disabled && 'opacity-50 cursor-not-allowed',
                            action.variant === 'primary' &&
                              'bg-primary text-primary-foreground',
                            action.variant === 'danger' &&
                              'bg-destructive text-destructive-foreground',
                            !action.variant && 'bg-accent hover:bg-accent/80'
                          )}
                          aria-label={action.label}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs font-medium">
                            {action.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </div>
              ))}

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Quick Actions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: Info, label: 'Info' },
                    { icon: HelpCircle, label: 'Help' },
                    { icon: Settings, label: 'Settings' },
                    { icon: Bell, label: 'Notify' },
                    { icon: Star, label: 'Favorite' },
                    { icon: Flag, label: 'Flag' },
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={index}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2',
                          'bg-accent rounded-lg',
                          'hover:bg-accent/80 transition-colors',
                          'touch-manipulation'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{item.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-background/95 backdrop-blur-sm">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className={cn(
                    'flex-1 px-4 py-3 rounded-lg',
                    'bg-accent hover:bg-accent/80',
                    'font-medium transition-colors',
                    'touch-manipulation'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Apply tools action
                    onClose();
                  }}
                  className={cn(
                    'flex-1 px-4 py-3 rounded-lg',
                    'bg-primary text-primary-foreground',
                    'font-medium transition-colors',
                    'touch-manipulation'
                  )}
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
