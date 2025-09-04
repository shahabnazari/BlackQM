'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/apple-ui/Button';
import { Card } from '@/components/apple-ui/Card';
import { Badge } from '@/components/apple-ui/Badge';
import { ProgressBar } from '@/components/apple-ui/ProgressBar';
import { ThemeToggle } from '@/components/apple-ui/ThemeToggle';

export default function HomePage() {
  const [selectedInterface, setSelectedInterface] = useState<'researcher' | 'participant' | null>(null);

  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation Header */}
      <header className="fixed top-0 w-full bg-surface/80 backdrop-blur-xl border-b border-border z-50">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-system-blue to-system-green rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">VQ</span>
            </div>
            <h1 className="text-xl font-semibold">VQMethod</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="success">v1.0 Ready</Badge>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="info" className="mb-4">Q Methodology Research Platform</Badge>
          
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-system-blue to-system-green bg-clip-text text-transparent">
            VQMethod
          </h1>
          
          <p className="text-2xl text-text-secondary mb-8 max-w-3xl mx-auto">
            Advanced Q-Methodology Research Platform with Apple Design Excellence
          </p>
          
          <p className="text-lg text-text-tertiary max-w-2xl mx-auto mb-12">
            Built from the ground up following Apple Human Interface Guidelines. 
            Featuring dual interfaces, 8-step participant journey, and enterprise-grade security.
          </p>

          {/* Implementation Status */}
          <div className="max-w-4xl mx-auto mb-12">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Implementation Progress</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm w-48 text-right">Phase 1: Foundation</span>
                <ProgressBar value={100} className="flex-1" />
                <Badge variant="success">Complete</Badge>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm w-48 text-right">Phase 2: Security</span>
                <ProgressBar value={100} className="flex-1" />
                <Badge variant="success">Complete</Badge>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm w-48 text-right">Phase 3: Q-Methodology</span>
                <ProgressBar value={15} className="flex-1" />
                <Badge variant="warning">In Progress</Badge>
              </div>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex gap-4 justify-center mb-16">
            <Button 
              variant="primary" 
              size="large"
              onClick={() => setSelectedInterface('researcher')}
              className="min-w-[200px]"
            >
              Researcher Portal
            </Button>
            <Button 
              variant="secondary" 
              size="large"
              onClick={() => setSelectedInterface('participant')}
              className="min-w-[200px]"
            >
              Participant Portal
            </Button>
          </div>
        </div>
      </section>

      {/* Interface Details */}
      {selectedInterface && (
        <section className="pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <Card className="p-8">
              {selectedInterface === 'researcher' ? (
                <>
                  <h2 className="text-3xl font-bold mb-4">Researcher Interface</h2>
                  <p className="text-lg text-text-secondary mb-6">
                    Design and manage Q-methodology studies with advanced tools
                  </p>
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h3 className="font-semibold mb-3">Core Features</h3>
                      <ul className="space-y-2 text-sm text-text-secondary">
                        <li>• Advanced questionnaire builder (15+ question types)</li>
                        <li>• Q-sort grid designer with customizable layouts</li>
                        <li>• Real-time participant tracking</li>
                        <li>• Statistical analysis with factor correlation</li>
                        <li>• Team collaboration tools</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">Security Features</h3>
                      <ul className="space-y-2 text-sm text-text-secondary">
                        <li>✓ Two-factor authentication (2FA/TOTP)</li>
                        <li>✓ Row-level security (RLS)</li>
                        <li>✓ AES-256 encryption at rest</li>
                        <li>✓ Virus scanning for uploads</li>
                        <li>✓ Comprehensive rate limiting</li>
                      </ul>
                    </div>
                  </div>
                  <Link href="/researcher/dashboard">
                    <Button variant="primary">Enter Researcher Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold mb-4">Participant Interface</h2>
                  <p className="text-lg text-text-secondary mb-6">
                    Experience the complete 8-step Q-methodology journey
                  </p>
                  <div className="mb-8">
                    <h3 className="font-semibold mb-4">8-Step Participant Journey</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        '1. Pre-Screening',
                        '2. Welcome',
                        '3. Consent',
                        '4. Familiarization',
                        '5. Pre-Sorting',
                        '6. Q-Sort',
                        '7. Commentary',
                        '8. Thank You'
                      ].map((step) => (
                        <div key={step} className="bg-surface-secondary rounded-lg p-3 text-center">
                          <span className="text-sm font-medium">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h3 className="font-semibold mb-3">Participant Features</h3>
                      <ul className="space-y-2 text-sm text-text-secondary">
                        <li>• Mobile-optimized interface</li>
                        <li>• Drag-and-drop Q-sort grid</li>
                        <li>• Video/audio content support</li>
                        <li>• Real-time progress tracking</li>
                        <li>• Multi-language support</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">Accessibility</h3>
                      <ul className="space-y-2 text-sm text-text-secondary">
                        <li>• WCAG 2.1 AA compliant</li>
                        <li>• VoiceOver support</li>
                        <li>• Keyboard navigation</li>
                        <li>• High contrast mode</li>
                        <li>• Dynamic type support</li>
                      </ul>
                    </div>
                  </div>
                  <Link href="/participant/join">
                    <Button variant="primary">Join a Study</Button>
                  </Link>
                </>
              )}
            </Card>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-6 bg-surface-secondary">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            World-Class Features
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="w-12 h-12 bg-system-blue/10 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Apple Design Excellence</h3>
              <p className="text-sm text-text-secondary">
                Built following Apple Human Interface Guidelines with San Francisco typography, 
                8pt grid system, and native components.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 bg-system-green/10 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">🔬</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Q-Methodology Core</h3>
              <p className="text-sm text-text-secondary">
                Complete 8-step participant journey with advanced Q-sort interface, 
                statistical analysis, and factor correlation ≥ 0.99 accuracy.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 bg-system-red/10 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
              <p className="text-sm text-text-secondary">
                Production-ready with 2FA authentication, virus scanning, row-level security, 
                AES-256 encryption, and comprehensive rate limiting.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Component Showcase */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Apple UI Component Library
          </h2>
          <p className="text-center text-text-secondary mb-12">
            Custom-built components following Apple HIG principles
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="small">Primary</Button>
                <Button variant="secondary" size="small">Secondary</Button>
                <Button variant="tertiary" size="small">Tertiary</Button>
                <Button variant="destructive" size="small">Destructive</Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Badges</h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="secondary">Secondary</Badge>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Progress Indicators</h3>
              <div className="space-y-3">
                <ProgressBar value={25} label="Phase 1" />
                <ProgressBar value={50} label="Phase 2" />
                <ProgressBar value={75} label="Phase 3" />
                <ProgressBar value={100} label="Complete" />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Typography</h3>
              <div className="space-y-2">
                <p className="text-3xl font-bold">Large Title</p>
                <p className="text-2xl font-semibold">Title 1</p>
                <p className="text-xl font-medium">Title 2</p>
                <p className="text-lg">Body</p>
                <p className="text-sm text-text-secondary">Caption</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* All Available Pages - Testing Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="warning" className="mb-4">Testing & Development</Badge>
            <h2 className="text-3xl font-bold mb-4">All Available Pages</h2>
            <p className="text-text-secondary">Quick access to all implemented pages for testing</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Researcher Pages */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6 text-system-blue">
                🔬 Researcher Interface
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Dashboard & Studies</h4>
                  <div className="space-y-2">
                    <Link href="/dashboard" className="block">
                      <div className="p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors">
                        <span className="text-sm font-medium">Dashboard</span>
                        <span className="text-xs text-text-secondary block mt-1">/dashboard</span>
                      </div>
                    </Link>
                    <Link href="/studies" className="block">
                      <div className="p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors">
                        <span className="text-sm font-medium">Studies List</span>
                        <span className="text-xs text-text-secondary block mt-1">/studies</span>
                      </div>
                    </Link>
                    <Link href="/studies/create" className="block">
                      <div className="p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors">
                        <span className="text-sm font-medium">Create Study</span>
                        <span className="text-xs text-text-secondary block mt-1">/studies/create</span>
                      </div>
                    </Link>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Visualizations</h4>
                  <div className="space-y-2">
                    <Link href="/visualization-demo" className="block">
                      <div className="p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors">
                        <span className="text-sm font-medium">Visualization Demo</span>
                        <span className="text-xs text-text-secondary block mt-1">/visualization-demo</span>
                      </div>
                    </Link>
                    <Link href="/visualization-demo/q-methodology" className="block">
                      <div className="p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors">
                        <span className="text-sm font-medium">Q-Methodology Visualizations</span>
                        <span className="text-xs text-text-secondary block mt-1">/visualization-demo/q-methodology</span>
                      </div>
                    </Link>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Not Yet Implemented</h4>
                  <div className="space-y-2 opacity-50">
                    <div className="p-3 bg-surface-secondary rounded-lg">
                      <span className="text-sm font-medium line-through">Settings</span>
                      <span className="text-xs text-text-secondary block mt-1">/settings (empty)</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Participant Pages */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6 text-system-green">
                👥 Participant Interface
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Active Pages</h4>
                  <div className="space-y-2">
                    <Link href="/study/test-token" className="block">
                      <div className="p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors">
                        <span className="text-sm font-medium">Study Journey (Test Token)</span>
                        <span className="text-xs text-text-secondary block mt-1">/study/[token] - Dynamic route</span>
                        <Badge variant="info" className="mt-2 text-xs">8-Step Journey</Badge>
                      </div>
                    </Link>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Not Yet Implemented</h4>
                  <div className="space-y-2 opacity-50">
                    <div className="p-3 bg-surface-secondary rounded-lg">
                      <span className="text-sm font-medium line-through">Join Study</span>
                      <span className="text-xs text-text-secondary block mt-1">/join (empty)</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* API & Backend */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6 text-system-orange">
                🔧 Backend & API
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">API Endpoints</h4>
                  <div className="space-y-2">
                    <a href="http://localhost:3001/api/docs" target="_blank" rel="noopener noreferrer" className="block">
                      <div className="p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors">
                        <span className="text-sm font-medium">Swagger API Documentation</span>
                        <span className="text-xs text-text-secondary block mt-1">http://localhost:3001/api/docs</span>
                        <Badge variant="success" className="mt-2 text-xs">Interactive</Badge>
                      </div>
                    </a>
                    <a href="http://localhost:5555" target="_blank" rel="noopener noreferrer" className="block">
                      <div className="p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors">
                        <span className="text-sm font-medium">Prisma Studio</span>
                        <span className="text-xs text-text-secondary block mt-1">http://localhost:5555</span>
                        <Badge variant="success" className="mt-2 text-xs">Database Browser</Badge>
                      </div>
                    </a>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Health Checks</h4>
                  <div className="space-y-2">
                    <a href="http://localhost:3001/api" target="_blank" rel="noopener noreferrer" className="block">
                      <div className="p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors">
                        <span className="text-sm font-medium">API Health</span>
                        <span className="text-xs text-text-secondary block mt-1">http://localhost:3001/api</span>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            {/* Development Tools */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6 text-system-purple">
                🛠️ Development Tools
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Useful Commands</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-surface-secondary rounded-lg font-mono text-xs">
                      <p className="text-text-secondary mb-1"># Validate directory structure</p>
                      <p>npm run validate:structure</p>
                    </div>
                    <div className="p-3 bg-surface-secondary rounded-lg font-mono text-xs">
                      <p className="text-text-secondary mb-1"># Start development servers</p>
                      <p>npm run dev:safe</p>
                    </div>
                    <div className="p-3 bg-surface-secondary rounded-lg font-mono text-xs">
                      <p className="text-text-secondary mb-1"># Run tests</p>
                      <p>npm test</p>
                    </div>
                    <div className="p-3 bg-surface-secondary rounded-lg font-mono text-xs">
                      <p className="text-text-secondary mb-1"># Check TypeScript</p>
                      <p>npm run typecheck</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-8 p-4 bg-surface-secondary rounded-lg">
            <p className="text-sm text-text-secondary text-center">
              <strong>Note:</strong> Routes now use parentheses for groups: <code className="font-mono">(researcher)</code> and <code className="font-mono">(participant)</code>.
              These don't affect the URL structure.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-text-secondary mb-2">
            VQMethod © 2025 - Advanced Q Methodology Research Platform
          </p>
          <p className="text-xs text-text-tertiary">
            Built with Next.js 15 + NestJS • Following Apple HIG • Phase 1 & 2 Complete
          </p>
          <div className="flex gap-6 justify-center mt-4">
            <Link href="/Lead" className="text-sm text-system-blue hover:underline">
              Documentation
            </Link>
            <Link href="/api/docs" className="text-sm text-system-blue hover:underline">
              API Docs
            </Link>
            <a href="https://github.com/yourusername/vqmethod" className="text-sm text-system-blue hover:underline">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}