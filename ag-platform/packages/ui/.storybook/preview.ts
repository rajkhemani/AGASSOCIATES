import type { Preview } from '@storybook/react';
import React from 'react';
import { ThemeProvider } from '../src/components/theme-provider';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f0f23' },
        { name: 'light', value: '#ffffff' },
        { name: 'editorial', value: '#f5f1e8' },
        { name: 'editorial-dark', value: '#05070d' },
      ],
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="glass" defaultColorScheme="dark">
        <div className="p-4">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'glass',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'glass', title: 'Glass (Dark)' },
          { value: 'glass-light', title: 'Glass (Light)' },
          { value: 'editorial', title: 'Editorial (Light)' },
          { value: 'editorial-dark', title: 'Editorial (Dark/Blueprint)' },
          { value: 'brutalist', title: 'Brutalist' },
        ],
        dynamicTitle: true,
      },
    },
    colorScheme: {
      description: 'Color scheme',
      defaultValue: 'dark',
      toolbar: {
        title: 'Color Scheme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
      },
    },
  },
};

export default preview;