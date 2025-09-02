'use client';

import { 
  Button, 
  TextField, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  Badge,
  ProgressBar
} from '@/components/apple-ui';
import { ThemeToggle } from '@/components/apple-ui/ThemeToggle/ThemeToggle';

export default function AppleDesignSystemDemo() {
  return (
    <div className="min-h-screen bg-bg text-text transition-colors duration-normal">
      {/* Header with Theme Toggle */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-primary"></div>
            <h1 className="text-xl font-semibold">VQMethod</h1>
          </div>
          <ThemeToggle size="sm" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Apple Design System
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-text-secondary sm:text-xl">
            A comprehensive implementation of Apple Human Interface Guidelines for Q methodology research software. 
            This design system ensures consistency, accessibility, and excellence across all interfaces.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Button size="lg" className="w-full sm:w-auto">
              Get Started
            </Button>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              View Documentation
            </Button>
          </div>
        </section>

        {/* Typography Section */}
        <section className="mb-16">
          <h2 className="mb-8 text-3xl font-bold">Typography System</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="text-5xl font-bold">Large Title (34px)</div>
              <div className="text-4xl font-bold">Title 1 (28px)</div>
              <div className="text-3xl font-semibold">Title 2 (22px)</div>
              <div className="text-2xl font-semibold">Title 3 (20px)</div>
              <div className="text-xl font-semibold">Headline (17px)</div>
            </div>
            <div className="space-y-4">
              <div className="text-lg">Body (17px)</div>
              <div className="text-base">Callout (16px)</div>
              <div className="text-sm">Subhead (15px)</div>
              <div className="text-xs">Footnote (13px)</div>
              <div className="text-xs">Caption 1 (12px)</div>
            </div>
          </div>
        </section>

        {/* Color System Section */}
        <section className="mb-16">
          <h2 className="mb-8 text-3xl font-bold">Color System</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-primary"></div>
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-text-secondary">#007aff</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-success"></div>
              <p className="text-sm font-medium">Success</p>
              <p className="text-xs text-text-secondary">#34c759</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-warning"></div>
              <p className="text-sm font-medium">Warning</p>
              <p className="text-xs text-text-secondary">#ff9500</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-danger"></div>
              <p className="text-sm font-medium">Danger</p>
              <p className="text-xs text-text-secondary">#ff3b30</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-info"></div>
              <p className="text-sm font-medium">Info</p>
              <p className="text-xs text-text-secondary">#5ac8fa</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-fill"></div>
              <p className="text-sm font-medium">Fill</p>
              <p className="text-xs text-text-secondary">rgba(120, 120, 128, 0.2)</p>
            </div>
          </div>
        </section>

        {/* Button Components Section */}
        <section className="mb-16">
          <h2 className="mb-8 text-3xl font-bold">Button Components</h2>
          <div className="space-y-8">
            <div>
              <h3 className="mb-4 text-xl font-semibold">Button Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="destructive">Destructive Button</Button>
              </div>
            </div>
            
            <div>
              <h3 className="mb-4 text-xl font-semibold">Button Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-xl font-semibold">Button States</h3>
              <div className="flex flex-wrap gap-4">
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button fullWidth className="max-w-xs">Full Width</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Form Components Section */}
        <section className="mb-16">
          <h2 className="mb-8 text-3xl font-bold">Form Components</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <TextField 
                label="Standard Input" 
                placeholder="Enter your text here"
                helperText="This is helper text below the input"
              />
              <TextField 
                label="Input with Error" 
                placeholder="This input has an error"
                error="This field is required"
              />
              <TextField 
                label="Input with Success" 
                placeholder="This input is valid"
                variant="success"
                helperText="Great! This input is valid"
              />
            </div>
            
            <div className="space-y-4">
              <TextField 
                label="Small Input" 
                size="sm"
                placeholder="Small size input"
              />
              <TextField 
                label="Large Input" 
                size="lg"
                placeholder="Large size input"
              />
              <TextField 
                label="Input with Icons" 
                placeholder="Input with left and right icons"
                leftIcon={<span>🔍</span>}
                rightIcon={<span>✓</span>}
              />
            </div>
          </div>
        </section>

        {/* Card Components Section */}
        <section className="mb-16">
          <h2 className="mb-8 text-3xl font-bold">Card Components</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>This is a default card with standard styling</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Card content goes here with proper spacing and typography.</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>This card has elevated styling with shadows</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Elevated cards provide more visual hierarchy.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Outlined Card</CardTitle>
                <CardDescription>This card uses border styling</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Outlined cards are great for subtle emphasis.</p>
              </CardContent>
            </Card>

            <Card className="bg-fill">
              <CardHeader>
                <CardTitle>Flat Card</CardTitle>
                <CardDescription>This card has no shadows or borders</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Flat cards blend seamlessly with the background.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>This card is clickable</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Interactive cards respond to user interaction.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Card with Footer</CardTitle>
                <CardDescription>This card includes a footer section</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Footer sections are great for actions or metadata.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Badge Components Section */}
        <section className="mb-16">
          <h2 className="mb-8 text-3xl font-bold">Badge Components</h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-xl font-semibold">Badge Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </div>
            
            <div>
              <h3 className="mb-4 text-xl font-semibold">Badge Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Badge size="sm">Small</Badge>
                <Badge size="md">Medium</Badge>
                <Badge size="lg">Large</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Progress Components Section */}
        <section className="mb-16">
          <h2 className="mb-8 text-3xl font-bold">Progress Components</h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-xl font-semibold">Progress Bar Variants</h3>
              <div className="space-y-4">
                <ProgressBar value={75} label="Progress 75%" />
                <ProgressBar value={50} variant="success" label="Success 50%" />
                <ProgressBar value={25} variant="warning" label="Warning 25%" />
                <ProgressBar value={90} variant="danger" label="Danger 90%" />
              </div>
            </div>
            
            <div>
              <h3 className="mb-4 text-xl font-semibold">Progress Bar Sizes</h3>
              <div className="space-y-4">
                <ProgressBar value={60} size="sm" label="Small 60%" />
                <ProgressBar value={60} size="md" label="Medium 60%" />
                <ProgressBar value={60} size="lg" label="Large 60%" />
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-xl font-semibold">Progress Bar Label Positions</h3>
              <div className="space-y-4">
                <ProgressBar value={45} label="Left Label" />
                <ProgressBar value={65} label="Right Label" />
                <ProgressBar value={85} label="Bottom Label" />
              </div>
            </div>
          </div>
        </section>

        {/* Spacing System Section */}
        <section className="mb-16">
          <h2 className="mb-8 text-3xl font-bold">Spacing System (8pt Grid)</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-1 w-1 rounded bg-primary"></div>
              <span className="text-sm">4px (space-1)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded bg-primary"></div>
              <span className="text-sm">8px (space-2)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-4 rounded bg-primary"></div>
              <span className="text-sm">16px (space-4)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-6 w-6 rounded bg-primary"></div>
              <span className="text-sm">24px (space-6)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded bg-primary"></div>
              <span className="text-sm">32px (space-8)</span>
            </div>
          </div>
        </section>

        {/* Accessibility Section */}
        <section className="mb-16">
          <h2 className="mb-8 text-3xl font-bold">Accessibility Features</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Keyboard Navigation</CardTitle>
                <CardDescription>All interactive elements support keyboard navigation</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-2">
                  <li>Tab navigation between elements</li>
                  <li>Enter/Space activation for buttons</li>
                  <li>Arrow key navigation for selectable items</li>
                  <li>Escape key to close modals</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Screen Reader Support</CardTitle>
                <CardDescription>Proper ARIA labels and semantic HTML</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-2">
                  <li>Semantic HTML structure</li>
                  <li>ARIA labels and descriptions</li>
                  <li>Proper heading hierarchy</li>
                  <li>Alt text for images</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface-secondary">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="mb-4 text-lg font-semibold">VQMethod Apple Design System</h3>
            <p className="mb-6 text-text-secondary">
              Built with Apple Human Interface Guidelines
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-text-secondary hover:text-text transition-colors">
                Documentation
              </a>
              <a href="#" className="text-text-secondary hover:text-text transition-colors">
                Components
              </a>
              <a href="#" className="text-text-secondary hover:text-text transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
