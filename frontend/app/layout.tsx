import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
