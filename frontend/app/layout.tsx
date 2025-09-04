import type { Metadata } from 'next';
import './globals.css';
import { ThemeScript } from './theme-script';

export const metadata: Metadata = {
  title: 'VQMethod - Apple Design System Demo',
  description: 'Advanced Q Methodology Research Platform with Apple Design Excellence',
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
        {children}
      </body>
    </html>
  );
}
