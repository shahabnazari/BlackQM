/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Image optimization
  images: {
    domains: ['localhost', 'vqmethod.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Production optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Experimental features for better performance - Phase 8.5 Day 5 optimizations
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    // New optimizations for Phase 8.5
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'lucide-react',
      '@heroicons/react',
      'framer-motion',
      'd3',
      'recharts',
      '@visx/visx',
    ],
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
  },

  // Code splitting for phase-based routing
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // Cache static assets
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache fonts
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API routes - no cache
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },

  // Webpack configuration for optimization
  webpack: (config, { dev, isServer }) => {
    // Development optimizations
    if (dev && !isServer) {
      // Increase chunk loading timeout in development
      config.output = {
        ...config.output,
        chunkLoadTimeout: 120000, // 120 seconds timeout for development
      };

      // Disable aggressive code splitting in development
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'async',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Code splitting optimization
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor code splitting
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common components
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Separate large libraries
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            // Phase-specific bundles for Phase 8.5 optimization
            phaseDiscover: {
              name: 'phase-discover',
              test: /[\\/](app|components)[\\/].*discover.*\.(js|jsx|ts|tsx)$/,
              chunks: 'async',
              priority: 25,
              reuseExistingChunk: true,
            },
            phaseAnalyze: {
              name: 'phase-analyze',
              test: /[\\/](app|components)[\\/].*analy[zs].*\.(js|jsx|ts|tsx)$/,
              chunks: 'async',
              priority: 25,
              reuseExistingChunk: true,
            },
            phaseVisualize: {
              name: 'phase-visualize',
              test: /[\\/](app|components)[\\/].*visual.*\.(js|jsx|ts|tsx)$/,
              chunks: 'async',
              priority: 25,
              reuseExistingChunk: true,
            },
            framerMotion: {
              name: 'framer-motion',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            d3: {
              name: 'd3-charts',
              test: /[\\/]node_modules[\\/](d3|@visx|recharts)[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            tiptap: {
              name: 'tiptap-editor',
              test: /[\\/]node_modules[\\/]@tiptap[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            zustand: {
              name: 'state-management',
              test: /[\\/]node_modules[\\/](zustand|immer)[\\/]/,
              chunks: 'all',
              priority: 30,
            },
          },
        },
        runtimeChunk: {
          name: 'runtime',
        },
        moduleIds: 'deterministic',
      };
    }

    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000',
  },
};

module.exports = nextConfig;
