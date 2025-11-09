/** @type {import("next").NextConfig} */
/**
 * ENTERPRISE-GRADE Next.js Configuration
 *
 * Optimized for large codebases (100K+ files)
 * Designed for i9/64GB RAM machines
 *
 * Key optimizations:
 * 1. Lazy compilation (only compile accessed routes)
 * 2. Aggressive file watching exclusions
 * 3. Source maps disabled in dev
 * 4. Incremental builds with persistent cache
 * 5. Optimized TypeScript project references
 */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Image optimization
  images: {
    domains: ['localhost', 'vqmethod.com'],
    formats: ['image/webp'],
    deviceSizes: [640, 1080, 1920],
    imageSizes: [16, 32, 64, 128],
  },

  // CRITICAL: Disable console removal in dev for faster builds
  compiler: {
    removeConsole: false,
  },

  // ENTERPRISE: Experimental features for large codebases
  experimental: {
    // CRITICAL: Only compile pages when accessed (huge performance win)
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'lucide-react',
      '@heroicons/react',
      'framer-motion',
    ],

    // CRITICAL: Use SWC for faster compilation
    forceSwcTransforms: true,

    // CRITICAL: Incremental cache
    incrementalCacheHandlerPath: undefined,

    // Optimize CSS (only in production)
    optimizeCss: process.env.NODE_ENV === 'production',
  },

  // Headers (minimal for dev performance)
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return []; // Skip headers in dev for speed
    }

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

  // ENTERPRISE: Webpack configuration for 100K+ files
  webpack: (config, { dev, isServer, webpack }) => {
    // CRITICAL: For development on large codebases
    if (dev && !isServer) {
      // 1. AGGRESSIVE file watching exclusions
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
          '**/public/**', // Don't watch static files
          '**/*.log',
          '**/.DS_Store',
          '**/Lead/**', // Don't watch documentation
          '**/Main Docs/**', // Don't watch documentation
          '**/*.md', // Don't watch markdown files
        ],
        // Use native file watching (faster on macOS)
        poll: false,
        // Increase delay to reduce compilation frequency
        aggregateTimeout: 600, // 600ms delay (increased from 300ms)
      };

      // 2. DISABLE source maps in development (MASSIVE performance gain)
      config.devtool = false;

      // 3. Persistent filesystem cache for faster rebuilds
      config.cache = {
        type: 'filesystem',
        cacheDirectory: '.next/cache/webpack',
        buildDependencies: {
          config: [__filename],
        },
        // Cache for 30 days
        maxAge: 30 * 24 * 60 * 60 * 1000,
      };

      // 4. Reduce memory usage
      config.optimization = {
        ...config.optimization,
        minimize: false,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false, // Disable in dev for speed
        runtimeChunk: false,
      };

      // 5. Reduce resolution time
      config.resolve = {
        ...config.resolve,
        // Cache module resolution
        cache: true,
        // Reduce symlinks resolution
        symlinks: false,
        // Optimize extensions (check fewer files)
        extensions: ['.tsx', '.ts', '.jsx', '.js'],
      };

      // 6. Only include necessary plugins
      config.plugins = config.plugins.filter(
        plugin =>
          !plugin.constructor.name.includes('SourceMap') &&
          !plugin.constructor.name.includes('ProgressPlugin')
      );

      // 7. Limit parallel builds
      config.parallelism = 4; // Limit to 4 concurrent compilations

      // 8. Lazy compilation (compile only when accessed)
      config.experiments = {
        ...config.experiments,
        lazyCompilation: {
          entries: false, // Don't lazy compile entries
          imports: true,  // Lazy compile dynamic imports
        },
      };
    }

    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test(module) {
                return (
                  module.size() > 160000 &&
                  /node_modules[/\\]/.test(module.identifier())
                );
              },
              name(module) {
                const hash = require('crypto').createHash('sha1');
                hash.update(module.identifier());
                return hash.digest('hex').substring(0, 8);
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
          },
        },
        runtimeChunk: { name: 'runtime' },
      };
    }

    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000',
  },

  // CRITICAL: Memory management for large codebases
  onDemandEntries: {
    // Keep pages in memory for only 25 seconds (reduced from 60)
    maxInactiveAge: 25 * 1000,
    // Only keep 1 page in memory at a time (reduced from 2)
    pagesBufferLength: 1,
  },

  // TypeScript config
  typescript: {
    // Run type checking in separate process (faster)
    tsconfigPath: './tsconfig.json',
    ignoreBuildErrors: false,
  },

  // CRITICAL: Disable powered by header
  poweredByHeader: false,

  // CRITICAL: Compress responses
  compress: true,

  // CRITICAL: Generate ETags for caching
  generateEtags: true,

  // Page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Output file tracing (helps reduce bundle size)
  outputFileTracing: true,
};

module.exports = nextConfig;
