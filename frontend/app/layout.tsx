import { AuthProvider } from '@/components/providers/AuthProvider';
import type { Metadata } from 'next';
import './globals.css';
import { ThemeScript } from './theme-script';
// Temporarily disabled for compilation fix
// import { AccessibilityProvider } from '@/components/accessibility/AccessibilityManager';
// import { AccessibilityToggle } from '@/components/accessibility/AccessibilityToggle';
import { SkipLinks } from '@/components/navigation/SkipLinks';

export const metadata: Metadata = {
  title: 'VQMethod - Advanced Q Methodology Research Platform',
  description:
    'Professional Q Methodology Research Platform with Apple Design Excellence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {/* Skip navigation links for keyboard users - WCAG 2.1 Level A */}
        <SkipLinks />

        <AuthProvider>{children}</AuthProvider>

        {/* Accessibility features temporarily disabled for compilation fix */}
      </body>
    </html>
  );
}
