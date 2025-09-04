/**
 * Date utility functions that are safe for SSR/hydration
 */

/**
 * Format a date string in a consistent way that doesn't depend on locale
 * This prevents hydration mismatches between server and client
 */
export function formatDate(date: string | Date, options?: {
  format?: 'short' | 'medium' | 'long';
  includeTime?: boolean;
}) {
  const { format = 'short', includeTime = false } = options || {};
  
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(d.getTime())) {
    return typeof date === 'string' ? date : 'Invalid Date';
  }
  
  // Use consistent formatting that doesn't depend on locale
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  if (format === 'short') {
    // YYYY-MM-DD format
    return `${year}-${month}-${day}`;
  }
  
  if (format === 'medium') {
    // MMM DD, YYYY format
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${monthNames[d.getMonth()]} ${d.getDate()}, ${year}`;
  }
  
  if (format === 'long') {
    // Full month name DD, YYYY format
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[d.getMonth()]} ${d.getDate()}, ${year}`;
  }
  
  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
  
  return `${year}-${month}-${day}`;
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 * Only use this after component is mounted to avoid hydration issues
 */
export function formatRelativeTime(date: string | Date): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return 'just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
  
  return formatDate(d, { format: 'medium' });
}

/**
 * Hook to safely render dates on the client side
 * Usage:
 * const formattedDate = useClientDate(date, { format: 'medium' });
 */
export function useClientDate(date: string | Date, options?: {
  format?: 'short' | 'medium' | 'long';
  includeTime?: boolean;
  relative?: boolean;
}) {
  if (typeof window === 'undefined') {
    // Server side - return consistent format
    return formatDate(date, options);
  }
  
  // Client side - can use locale-specific formatting
  if (options?.relative) {
    return formatRelativeTime(date);
  }
  
  return formatDate(date, options);
}