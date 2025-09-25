"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  PenTool,
  Hammer,
  Users,
  ClipboardList,
  BarChart3,
  Eye,
  Brain,
  FileText,
  Archive,
  ChevronLeft,
  ChevronRight,
  Home,
  Settings,
  User,
  Moon,
  Sun,
  Bell
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
// import { useTheme } from 'next-themes'; // TODO: Install next-themes package

const tabletPhases = [
  { id: 1, name: 'DISCOVER', icon: Search, path: '/discover', color: 'bg-purple-500', description: 'Literature & Research' },
  { id: 2, name: 'DESIGN', icon: PenTool, path: '/design', color: 'bg-indigo-500', description: 'Methodology Design' },
  { id: 3, name: 'BUILD', icon: Hammer, path: '/studies/create', color: 'bg-blue-500', description: 'Create Study' },
  { id: 4, name: 'RECRUIT', icon: Users, path: '/recruitment', color: 'bg-cyan-500', description: 'Find Participants' },
  { id: 5, name: 'COLLECT', icon: ClipboardList, path: '/collect', color: 'bg-teal-500', description: 'Gather Data' },
  { id: 6, name: 'ANALYZE', icon: BarChart3, path: '/analysis', color: 'bg-green-500', description: 'Process Results' },
  { id: 7, name: 'VISUALIZE', icon: Eye, path: '/visualize', color: 'bg-lime-500', description: 'Create Charts' },
  { id: 8, name: 'INTERPRET', icon: Brain, path: '/interpret', color: 'bg-yellow-500', description: 'AI Insights' },
  { id: 9, name: 'REPORT', icon: FileText, path: '/report', color: 'bg-orange-500', description: 'Generate Reports' },
  { id: 10, name: 'ARCHIVE', icon: Archive, path: '/archive', color: 'bg-red-500', description: 'Store & Share' }
];

interface TabletSidebarProps {
  className?: string;
}

export function TabletSidebar({ className }: TabletSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activePhase, setActivePhase] = useState(1);
  const [hoveredPhase, setHoveredPhase] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  // const { theme, setTheme } = useTheme(); // TODO: Enable when next-themes is installed
  const [theme, setTheme] = useState('light'); // Temporary theme state

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem('tablet-sidebar-collapsed');
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Update active phase based on current path
  useEffect(() => {
    const currentPhase = tabletPhases.find(phase => 
      pathname.startsWith(phase.path)
    );
    if (currentPhase) {
      setActivePhase(currentPhase.id);
    }
  }, [pathname]);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('tablet-sidebar-collapsed', JSON.stringify(newState));
  };

  const handlePhaseClick = (phase: typeof tabletPhases[0]) => {
    setActivePhase(phase.id);
    router.push(phase.path);
  };

  return (
    <>
      {/* Tablet Sidebar - Hidden on mobile and desktop */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isCollapsed ? 80 : 280,
          transition: { type: "spring", damping: 20 }
        }}
        className={cn(
          "hidden sm:flex lg:hidden", // Only visible on tablet
          "fixed left-0 top-0 h-full z-40",
          "flex-col bg-background border-r border-border",
          "shadow-lg",
          className
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
              >
                VQMethod
              </motion.h2>
            )}
            <button
              onClick={toggleCollapse}
              className={cn(
                "p-2 rounded-lg hover:bg-accent transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary",
                isCollapsed && "mx-auto"
              )}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {/* Home */}
            <button
              onClick={() => router.push('/dashboard')}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg",
                "transition-all duration-200",
                "hover:bg-accent",
                "focus:outline-none focus:ring-2 focus:ring-primary",
                pathname === '/dashboard' && "bg-accent"
              )}
            >
              <Home className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">Dashboard</span>}
            </button>

            {/* Divider */}
            <div className="h-px bg-border my-4" />

            {/* Research Phases */}
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Research Phases
              </h3>
            )}
            
            {tabletPhases.map((phase) => {
              const Icon = phase.icon;
              const isActive = activePhase === phase.id;
              const isHovered = hoveredPhase === phase.id;
              
              return (
                <motion.button
                  key={phase.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePhaseClick(phase)}
                  onMouseEnter={() => setHoveredPhase(phase.id)}
                  onMouseLeave={() => setHoveredPhase(null)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg",
                    "transition-all duration-200 relative",
                    "hover:bg-accent",
                    "focus:outline-none focus:ring-2 focus:ring-primary",
                    isActive && "bg-accent"
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabletPhase"
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2",
                        "w-1 h-8 rounded-r-full",
                        phase.color
                      )}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                  )}
                  
                  <div className={cn(
                    "flex items-center justify-center",
                    "w-10 h-10 rounded-lg flex-shrink-0",
                    isActive ? phase.color : "bg-accent",
                    isActive && "text-white"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  {!isCollapsed && (
                    <div className="flex-1 text-left">
                      <div className="font-medium">{phase.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {phase.description}
                      </div>
                    </div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && isHovered && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={cn(
                        "absolute left-full ml-2 z-50",
                        "bg-popover text-popover-foreground",
                        "rounded-lg shadow-lg p-3",
                        "whitespace-nowrap"
                      )}
                    >
                      <div className="font-medium">{phase.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {phase.description}
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border space-y-2">
          {/* Notifications */}
          <button
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg",
              "transition-all duration-200",
              "hover:bg-accent",
              "focus:outline-none focus:ring-2 focus:ring-primary"
            )}
          >
            <Bell className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Notifications</span>}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg",
              "transition-all duration-200",
              "hover:bg-accent",
              "focus:outline-none focus:ring-2 focus:ring-primary"
            )}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 flex-shrink-0" />
            ) : (
              <Moon className="h-5 w-5 flex-shrink-0" />
            )}
            {!isCollapsed && <span>Toggle Theme</span>}
          </button>

          {/* Settings */}
          <button
            onClick={() => router.push('/settings')}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg",
              "transition-all duration-200",
              "hover:bg-accent",
              "focus:outline-none focus:ring-2 focus:ring-primary"
            )}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </button>

          {/* Profile */}
          <button
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg",
              "transition-all duration-200",
              "hover:bg-accent",
              "focus:outline-none focus:ring-2 focus:ring-primary"
            )}
          >
            <User className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Profile</span>}
          </button>
        </div>
      </motion.aside>

      {/* Content Offset for Tablet */}
      <div 
        className={cn(
          "hidden sm:block lg:hidden", // Only on tablet
          isCollapsed ? "ml-20" : "ml-[280px]",
          "transition-all duration-300"
        )}
      />
    </>
  );
}