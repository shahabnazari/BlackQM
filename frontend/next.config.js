/** @type {import("next").NextConfig} */
/**
 * OPTIMIZED Next.js Configuration for Development Performance
 *
 * Phase 10.1 Day 10 - CPU/Memory Optimization
 *
 * This configuration reduces CPU and memory usage during development:
 * - Disabled heavy experimental features
 * - Reduced file watching
 * - Optimized webpack for faster rebuilds
 * - Memory leak prevention
 */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Image optimization (keep essential only)
  images: {
    domains: ['localhost', 'vqmethod.com'],
    formats: ['image/webp'], // Reduced from avif + webp
    deviceSizes: [640, 1080, 1920], // Reduced sizes
    imageSizes: [16, 32, 64, 128], // Reduced sizes
  },

  // Production optimizations (disabled in dev)
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  // DISABLED: Heavy experimental features for dev performance
  experimental: {
    // optimizeCss: false, // Disabled - heavy in dev
    // scrollRestoration: true, // Keep this
    // webVitalsAttribution: ['CLS', 'LCP'], // Reduced
  },

  // DISABLED: Heavy modularization in dev
  // modularizeImports: {}, // Disabled for dev performance

  // Headers (keep for security)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },

  // OPTIMIZED Webpack configuration for DEVELOPMENT
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // CRITICAL: Reduce file watching overhead
      config.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/dist/**',
          '**/coverage/**',
          '**/playwright-report/**',
          '**/.cache/**',
          '**/logs/**',
        ],
        poll: false, // Use native file watching (faster)
        aggregateTimeout: 300, // Delay before rebuilding
      };

      // CRITICAL: Reduce memory usage
      config.optimization = {
        ...config.optimization,
        minimize: false, // Don't minimize in dev
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false, // Disable code splitting in dev for speed
      };

      // CRITICAL: Faster rebuilds
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };

      // CRITICAL: Reduce chunk loading timeout
      config.output = {
        ...config.output,
        chunkLoadTimeout: 30000, // 30 seconds (reduced from 120)
      };
    }

    // Production optimizations (keep as-is)
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              chunks: 'all',
              priority: 30,
            },
          },
        },
        runtimeChunk: { name: 'runtime' },
        moduleIds: 'deterministic',
      };
    }

    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000',
  },

  // CRITICAL: Disable source maps in development for massive speed boost
  productionBrowserSourceMaps: false,

  // CRITICAL: Reduce memory usage
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 1 minute (reduced from default 15 mins)
    pagesBufferLength: 2, // Only keep 2 pages in memory (reduced from 5)
  },

  // CRITICAL: Faster compilation
  typescript: {
    // !! WARN !! Allow production builds with type errors (for speed)
    // Remove in production if you want strict type checking
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
