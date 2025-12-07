/**
 * Storybook Preview Configuration - Phase 10.101
 *
 * Global decorators and parameters for all stories.
 * Sets up Next.js compatibility, accessibility testing, and theme support.
 *
 * @module .storybook/preview
 * @since Phase 10.101
 */

import type { Preview } from '@storybook/react';
import '../app/globals.css';

const preview: Preview = {
  /**
   * Global parameters for all stories
   */
  parameters: {
    /**
     * Configure addon-actions
     * Auto-generate actions for event handlers
     */
    actions: {
      argTypesRegex: '^on[A-Z].*',
    },

    /**
     * Configure addon-controls
     * Auto-infer controls from prop types
     */
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      expanded: true,
      sort: 'requiredFirst',
    },

    /**
     * Configure Next.js routing
     * Enable Next.js App Router features in Storybook
     */
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },

    /**
     * Configure accessibility addon
     * Run axe-core checks on all stories
     */
    a11y: {
      config: {
        rules: [
          {
            // Disable color-contrast check in Storybook (can be noisy)
            id: 'color-contrast',
            enabled: false,
          },
        ],
      },
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        },
      },
    },

    /**
     * Layout configuration
     * Center stories by default, use 'fullscreen' for pages
     */
    layout: 'centered',

    /**
     * Background colors for testing components
     */
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1d1d1f',
        },
        {
          name: 'gray',
          value: '#f5f5f7',
        },
      ],
    },

    /**
     * Viewport presets for responsive testing
     */
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
        wide: {
          name: 'Wide',
          styles: {
            width: '1920px',
            height: '1080px',
          },
        },
      },
    },
  },

  /**
   * Global decorators
   * Wrap all stories with necessary providers
   */
  decorators: [],
};

export default preview;
