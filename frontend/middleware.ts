/**
 * Next.js Middleware - Route Consolidation
 * Phase 8.5 Day 3 - World-class implementation
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDestinationRoute, needsConsolidation, trackNavigation, getRoutePhase } from '@/lib/navigation/route-consolidation';

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};

/**
 * Route consolidation middleware
 * Handles redirects for Phase 8.5 navigation restructuring
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next();
  }
  
  // Check if route needs consolidation
  if (needsConsolidation(pathname)) {
    const destination = getDestinationRoute(pathname);
    
    if (destination) {
      // Track the navigation for analytics
      const phase = getRoutePhase(destination);
      trackNavigation(pathname, destination, phase);
      
      // Create the redirect URL
      const url = request.nextUrl.clone();
      url.pathname = destination;
      
      // Preserve query parameters
      searchParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
      
      // Log consolidation in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Route Consolidation] ${pathname} → ${destination} (Phase: ${phase || 'none'})`);
      }
      
      // Return permanent redirect for SEO
      return NextResponse.redirect(url, { status: 301 });
    }
  }
  
  // Add phase header for downstream components
  const phase = getRoutePhase(pathname);
  if (phase) {
    const response = NextResponse.next();
    response.headers.set('x-research-phase', phase);
    return response;
  }
  
  return NextResponse.next();
}