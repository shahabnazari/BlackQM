/**
 * Storybook Configuration - Phase 10.101
 *
 * Enterprise-grade Storybook setup for Next.js 14 App Router
 * with strict TypeScript support and accessibility testing.
 *
 * @module .storybook/main
 * @since Phase 10.101
 */

import type { StorybookConfig } from '@storybook/nextjs';
import path from 'path';

const config: StorybookConfig = {
  /**
   * Story file locations
   * Searches for *.stories.tsx files in components, app, and lib directories
   */
  stories: [
    '../components/**/*.stories.@(ts|tsx)',
    '../app/**/*.stories.@(ts|tsx)',
    '../lib/**/*.stories.@(ts|tsx)',
  ],

  /**
   * Storybook addons for enhanced functionality
   * - essentials: Core Storybook features (controls, actions, viewport, etc.)
   * - a11y: Accessibility testing and validation
   * - interactions: Test user interactions
   */
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],

  /**
   * Next.js framework configuration
   * Uses @storybook/nextjs for App Router compatibility
   */
  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: path.resolve(__dirname, '../next.config.js'),
    },
  },

  /**
   * TypeScript configuration
   * Strict mode enabled for enterprise-grade type safety
   */
  typescript: {
    check: true,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => {
        // Filter out props from node_modules except @radix-ui (we use their components)
        if (prop.parent) {
          return (
            !prop.parent.fileName.includes('node_modules') ||
            prop.parent.fileName.includes('@radix-ui')
          );
        }
        return true;
      },
    },
  },

  /**
   * Documentation configuration
   * Automatically generates docs pages from JSDoc comments
   */
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },

  /**
   * Static directory for public assets
   */
  staticDirs: ['../public'],

  /**
   * Webpack configuration customization
   * Adds path aliases to match Next.js tsconfig
   */
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../'),
      };
    }
    return config;
  },

  /**
   * Core configuration
   * Disables telemetry for enterprise environments
   */
  core: {
    disableTelemetry: true,
  },
};

export default config;
