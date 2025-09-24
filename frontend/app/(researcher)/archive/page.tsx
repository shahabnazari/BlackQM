'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Archive,
  Download,
  Upload,
  GitBranch,
  Clock,
  Shield,
  Database,
  Cloud,
  ArrowRight,
  CheckCircle,
  Link as LinkIcon,
  Package,
  FileArchive,
  History,
  HardDrive
} from 'lucide-react'

interface ArchiveItem {
  type: string
  count: number
  size: string
  lastUpdated: string
}

export default function ArchivePhasePage() {
  const archiveItems: ArchiveItem[] = [
    { type: 'Study Data', count: 1, size: '2.4 MB', lastUpdated: '2 hours ago' },
    { type: 'Analysis Results', count: 4, size: '1.8 MB', lastUpdated: '1 day ago' },
    { type: 'Visualizations', count: 12, size: '5.6 MB', lastUpdated: '1 day ago' },
    { type: 'Reports', count: 3, size: '3.2 MB', lastUpdated: '3 hours ago' },
    { type: 'Participant Responses', count: 28, size: '4.1 MB', lastUpdated: '2 days ago' },
    { type: 'Study Materials', count: 6, size: '1.3 MB', lastUpdated: '1 week ago' }
  ]

  const totalSize = archiveItems.reduce((acc, item) => {
    return acc + parseFloat(item.size)
  }, 0)

  const versionHistory = [
    { version: 'v2.1', date: 'Today', changes: 'Added final report', author: 'You' },
    { version: 'v2.0', date: '2 days ago', changes: 'Completed analysis', author: 'You' },
    { version: 'v1.5', date: '1 week ago', changes: 'Data collection complete', author: 'You' },
    { version: 'v1.0', date: '2 weeks ago', changes: 'Initial study creation', author: 'You' }
  ]

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Archive Phase</h1>
          <p className="text-muted-foreground mt-2">
            Preserve, version, and share your complete research package
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Archive className="h-4 w-4" />
          Phase 10 of 10
        </Badge>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold">{totalSize.toFixed(1)} MB</p>
              </div>
              <HardDrive className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Items</p>
                <p className="text-2xl font-bold">{archiveItems.reduce((acc, i) => acc + i.count, 0)}</p>
              </div>
              <FileArchive className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Versions</p>
                <p className="text-2xl font-bold">{versionHistory.length}</p>
              </div>
              <GitBranch className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-xl font-bold">Secured</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Archive Contents */}
      <Card>
        <CardHeader>
          <CardTitle>Archive Contents</CardTitle>
          <CardDescription>
            All study materials and data preserved in the archive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {archiveItems.map((item) => (
              <div key={item.type} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Database className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{item.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.count} items • {item.size} • Updated {item.lastUpdated}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Version Control */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </CardTitle>
            <CardDescription>
              Track changes and restore previous versions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {versionHistory.map((version) => (
                <div key={version.version} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      version.version === 'v2.1' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{version.version}</p>
                      <p className="text-sm text-muted-foreground">
                        {version.changes} • {version.date}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Restore</Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              <GitBranch className="h-4 w-4 mr-2" />
              Create New Version
            </Button>
          </CardContent>
        </Card>

        {/* Export Package */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Study Package
            </CardTitle>
            <CardDescription>
              Export complete study package for sharing or archival
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">All data and materials included</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Metadata and documentation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Analysis scripts and code</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Version history preserved</span>
              </div>
            </div>
            <div className="pt-4 space-y-2">
              <Button className="w-full">
                <Package className="h-4 w-4 mr-2" />
                Export Full Package
              </Button>
              <Button variant="outline" className="w-full">
                <LinkIcon className="h-4 w-4 mr-2" />
                Generate DOI
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Options */}
      <Card>
        <CardHeader>
          <CardTitle>Storage & Backup</CardTitle>
          <CardDescription>
            Configure where and how your archive is stored
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Cloud className="h-6 w-6 text-primary" />
                  <h3 className="font-semibold">Cloud Storage</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Secure cloud backup with encryption
                </p>
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <HardDrive className="h-6 w-6 text-muted-foreground" />
                  <h3 className="font-semibold">Local Backup</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Download to local storage
                </p>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Database className="h-6 w-6 text-muted-foreground" />
                  <h3 className="font-semibold">Repository</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Submit to data repository
                </p>
                <Button variant="outline" size="sm">
                  Submit
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Preservation Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Long-term Preservation</AlertTitle>
        <AlertDescription>
          Your study archive follows best practices for research data preservation, including:
          metadata standards, file format sustainability, and version control. Consider depositing
          in an institutional repository for long-term accessibility.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Archive Actions</CardTitle>
          <CardDescription>
            Final steps for your archived study
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Add Files
            </Button>
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Schedule Backup
            </Button>
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Verify Integrity
            </Button>
            <Button variant="outline">
              <LinkIcon className="h-4 w-4 mr-2" />
              Share Archive
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Completion Message */}
      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500 text-white">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-900">Study Complete!</h3>
              <p className="text-green-700 mt-1">
                Congratulations! Your Q-methodology study has been successfully completed and archived.
                All data, analyses, and reports are preserved for future reference and reproducibility.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href="/report">
          <Button variant="outline">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Report
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button>
            Return to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}