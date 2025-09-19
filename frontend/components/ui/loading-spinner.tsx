import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Loading Spinner Component
 * 
 * World-class loading indicator with smooth animations
 * Part of the unified design system
 */
export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <div className="absolute inset-0">
        <div className="h-full w-full rounded-full border-2 border-gray-200 dark:border-gray-700" />
      </div>
      <div className="absolute inset-0 animate-spin">
        <div className="h-full w-full rounded-full border-2 border-transparent 
                      border-t-blue-600 dark:border-t-blue-400" />
      </div>
    </div>
  );
}