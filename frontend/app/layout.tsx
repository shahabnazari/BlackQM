import type { Metadata } from 'next';
import './globals.css';
import { ThemeScript } from './theme-script';
import { AuthProvider } from '@/components/providers/AuthProvider';

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
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
