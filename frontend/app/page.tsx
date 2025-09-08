'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/apple-ui/Button/Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/apple-ui/Card/Card';

export default function HomePage() {
  const router = useRouter();
  
  // Prefetch critical routes on mount for instant navigation
  useEffect(() => {
    // Prefetch auth pages for instant navigation
    router.prefetch('/auth/login');
    router.prefetch('/auth/register');
    router.prefetch('/dashboard');
    router.prefetch('/join');
  }, [router]);

  return (
    <div className="min-h-screen bg-bg text-text transition-colors duration-normal">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-primary"></div>
            <h1 className="text-xl font-semibold">VQMethod</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Use Link for instant navigation with prefetch */}
            <Link href="/auth/login" prefetch={true}>
              <Button variant="secondary">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register" prefetch={true}>
              <Button>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Advanced Q Methodology Research Platform
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-text-secondary sm:text-xl mb-8">
            Professional Q Methodology Research Platform with Apple Design
            Excellence. Create, manage, and analyze Q-sort studies with
            cutting-edge visualization tools.
          </p>
          <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Link href="/auth/register" prefetch={true}>
              <Button
                size="large"
                className="w-full sm:w-auto"
              >
                Start Your Research
              </Button>
            </Link>
            <Link href="/auth/login" prefetch={true}>
              <Button
                variant="secondary"
                size="large"
                className="w-full sm:w-auto"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Grid - Use Link for navigation */}
        <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>Q-Sort Studies</CardTitle>
              <CardDescription>
                Create and manage Q-methodology studies with intuitive
                drag-and-drop interfaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/join" prefetch={true}>
                <Button
                  variant="secondary"
                  className="w-full"
                >
                  Join a Study
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Powerful statistical analysis and visualization tools for
                Q-methodology research
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/visualization-demo" prefetch={true}>
                <Button
                  variant="secondary"
                  className="w-full"
                >
                  View Demos
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Researcher Dashboard</CardTitle>
              <CardDescription>
                Comprehensive dashboard for managing studies, participants, and
                results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/login" prefetch={true}>
                <Button
                  variant="secondary"
                  className="w-full"
                >
                  Access Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Quick Links */}
        <section className="text-center">
          <h2 className="text-2xl font-bold mb-8">Quick Links</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Link href="/about" className="text-text-secondary hover:text-text">
              About
            </Link>
            <Link
              href="/contact"
              className="text-text-secondary hover:text-text"
            >
              Contact
            </Link>
            <Link
              href="/privacy"
              className="text-text-secondary hover:text-text"
            >
              Privacy
            </Link>
            <Link href="/help" className="text-text-secondary hover:text-text">
              Help
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
