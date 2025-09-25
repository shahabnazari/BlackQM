'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  RotateCw,
  Download,
  Diff,
  Tag,
  Archive,
  Shield,
  Plus,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
// Select components removed as unused
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Version {
  id: string;
  version: string;
  branch: string;
  author: string;
  timestamp: Date;
  message: string;
  changes: {
    added: number;
    modified: number;
    deleted: number;
  };
  tags: string[];
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  parent?: string;
}

interface Branch {
  id: string;
  name: string;
  description: string;
  isMain: boolean;
  isProtected: boolean;
  lastCommit: Date;
  ahead: number;
  behind: number;
  author: string;
}

interface DiffChange {
  type: 'added' | 'modified' | 'deleted';
  field: string;
  oldValue?: any;
  newValue?: any;
  path: string;
}

export function VersionControlManager() {
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [showDiffView, setShowDiffView] = useState(false);
  // Removed unused showMergeDialog state
  const [commitMessage, setCommitMessage] = useState('');

  // Mock data
  const versions: Version[] = [
    {
      id: '1',
      version: 'v2.3.0',
      branch: 'main',
      author: 'John Doe',
      timestamp: new Date('2024-01-20T10:30:00'),
      message: 'Added demographic section and improved question flow',
      changes: { added: 5, modified: 3, deleted: 1 },
      tags: ['production', 'stable'],
      status: 'published',
    },
    {
      id: '2',
      version: 'v2.2.1',
      branch: 'feature/ab-testing',
      author: 'Jane Smith',
      timestamp: new Date('2024-01-19T15:45:00'),
      message: 'Implemented A/B testing for question order',
      changes: { added: 12, modified: 8, deleted: 2 },
      tags: ['experiment'],
      status: 'review',
      parent: '1',
    },
    {
      id: '3',
      version: 'v2.2.0',
      branch: 'main',
      author: 'Mike Johnson',
      timestamp: new Date('2024-01-18T09:15:00'),
      message: 'Fixed validation rules and added skip logic',
      changes: { added: 3, modified: 7, deleted: 0 },
      tags: ['stable'],
      status: 'published',
      parent: '1',
    },
    {
      id: '4',
      version: 'v2.1.0',
      branch: 'feature/multilingual',
      author: 'Sarah Wilson',
      timestamp: new Date('2024-01-17T14:20:00'),
      message: 'Added multilingual support for 5 languages',
      changes: { added: 25, modified: 10, deleted: 0 },
      tags: ['i18n', 'beta'],
      status: 'approved',
      parent: '3',
    },
  ];

  const branches: Branch[] = [
    {
      id: '1',
      name: 'main',
      description: 'Production-ready questionnaire',
      isMain: true,
      isProtected: true,
      lastCommit: new Date('2024-01-20T10:30:00'),
      ahead: 0,
      behind: 0,
      author: 'System',
    },
    {
      id: '2',
      name: 'feature/ab-testing',
      description: 'A/B testing implementation',
      isMain: false,
      isProtected: false,
      lastCommit: new Date('2024-01-19T15:45:00'),
      ahead: 3,
      behind: 1,
      author: 'Jane Smith',
    },
    {
      id: '3',
      name: 'feature/multilingual',
      description: 'Multi-language support',
      isMain: false,
      isProtected: false,
      lastCommit: new Date('2024-01-17T14:20:00'),
      ahead: 8,
      behind: 2,
      author: 'Sarah Wilson',
    },
  ];

  const diffChanges: DiffChange[] = [
    {
      type: 'added',
      field: 'Question 5',
      newValue: 'How would you rate your overall experience?',
      path: 'questions[4]',
    },
    {
      type: 'modified',
      field: 'Question 2 - Options',
      oldValue: ['Yes', 'No'],
      newValue: ['Yes', 'No', 'Maybe'],
      path: 'questions[1].options',
    },
    {
      type: 'deleted',
      field: 'Question 8',
      oldValue: 'Additional comments',
      path: 'questions[7]',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'approved':
        return 'bg-blue-100 text-blue-700';
      case 'review':
        return 'bg-yellow-100 text-yellow-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const renderVersionTree = () => {
    return versions.map((version, index) => (
      <div
        key={version.id}
        className={cn(
          'relative pl-8 pb-4',
          index < versions.length - 1 && 'border-l-2 border-gray-200 ml-3'
        )}
      >
        <div className="absolute -left-[9px] top-0 w-5 h-5 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
          <GitCommit className="w-3 h-3" />
        </div>

        <div onClick={() => setSelectedVersion(version)}>
          <Card
            className={cn(
              'p-4 cursor-pointer hover:shadow-md transition-all',
              selectedVersion?.id === version.id && 'ring-2 ring-blue-500'
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{version.version}</span>
                  <Badge variant="outline" className="text-xs">
                    {version.branch}
                  </Badge>
                  <Badge
                    className={cn('text-xs', getStatusColor(version.status))}
                  >
                    {version.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{version.message}</p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>{version.author}</div>
                <div>{version.timestamp.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-600">+{version.changes.added}</span>
                <span className="text-yellow-600">
                  ~{version.changes.modified}
                </span>
                <span className="text-red-600">-{version.changes.deleted}</span>
              </div>
              <div className="flex gap-1">
                {version.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <GitBranch className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Version Control</h2>
            <p className="text-sm text-gray-600">
              Track changes and manage questionnaire versions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowDiffView(true)}>
            <Diff className="w-4 h-4 mr-2" />
            Compare
          </Button>
          <Button onClick={() => setShowCommitDialog(true)}>
            <GitCommit className="w-4 h-4 mr-2" />
            Commit Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Version History */}
        <div className="col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Version History</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
              </div>
            </div>

            <div className="h-[500px] overflow-y-auto">
              <div className="pr-4">{renderVersionTree()}</div>
            </div>
          </Card>
        </div>

        {/* Branches & Actions */}
        <div className="space-y-4">
          {/* Branches */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Branches</h4>
              <Button variant="outline" size="sm">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {branches.map(branch => (
                <div
                  key={branch.id}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer hover:bg-gray-50',
                    selectedBranch?.id === branch.id &&
                      'border-blue-500 bg-blue-50'
                  )}
                  onClick={() => setSelectedBranch(branch)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4" />
                      <span className="font-medium text-sm">{branch.name}</span>
                      {branch.isMain && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                      {branch.isProtected && (
                        <Shield className="w-3 h-3 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {branch.description}
                  </p>
                  {!branch.isMain && (
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="text-green-600">↑{branch.ahead}</span>
                      <span className="text-red-600">↓{branch.behind}</span>
                      <span>{branch.author}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-4">
            <h4 className="font-medium mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowMergeDialog(true)}
              >
                <GitMerge className="w-4 h-4 mr-2" />
                Merge Branch
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <GitPullRequest className="w-4 h-4 mr-2" />
                Create Pull Request
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Tag className="w-4 h-4 mr-2" />
                Create Release
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <RotateCw className="w-4 h-4 mr-2" />
                Revert Changes
              </Button>
            </div>
          </Card>

          {/* Version Details */}
          {selectedVersion && (
            <Card className="p-4">
              <h4 className="font-medium mb-3">Version Details</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Version:</span>
                  <span className="ml-2 font-medium">
                    {selectedVersion.version}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Author:</span>
                  <span className="ml-2 font-medium">
                    {selectedVersion.author}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-2 font-medium">
                    {selectedVersion.timestamp.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Changes:</span>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      +{selectedVersion.changes.added}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      ~{selectedVersion.changes.modified}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      -{selectedVersion.changes.deleted}
                    </Badge>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <Button variant="outline" className="w-full" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Commit Modal */}
      {showCommitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowCommitDialog(false)}
          />
          <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Commit Changes</h2>
              <div className="space-y-4">
                <div>
                  <Label>Commit Message</Label>
                  <Textarea
                    placeholder="Describe your changes..."
                    value={commitMessage}
                    onChange={e => setCommitMessage(e.target.value)}
                    className="min-h-[100px] mt-2"
                  />
                </div>

                <div>
                  <Label>Changed Files</Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                      <Badge className="bg-green-600 text-white">A</Badge>
                      <span>questions/demographic.json</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded text-sm">
                      <Badge className="bg-yellow-600 text-white">M</Badge>
                      <span>questions/satisfaction.json</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-sm">
                      <Badge className="bg-red-600 text-white">D</Badge>
                      <span>questions/deprecated.json</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Tags (Optional)</Label>
                  <Input
                    placeholder="e.g., release, hotfix, feature"
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowCommitDialog(false)}
                >
                  Cancel
                </Button>
                <Button>
                  <GitCommit className="w-4 h-4 mr-2" />
                  Commit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diff View Modal */}
      {showDiffView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowDiffView(false)}
          />
          <div className="relative bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Compare Versions</h2>
              <Tabs defaultValue="changes">
                <TabsList>
                  <TabsTrigger value="changes">Changes</TabsTrigger>
                  <TabsTrigger value="diff">Diff View</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="changes"
                  className="space-y-2 max-h-96 overflow-y-auto"
                >
                  {diffChanges.map((change, index) => (
                    <div
                      key={index}
                      className={cn(
                        'p-3 rounded-lg border',
                        change.type === 'added' &&
                          'bg-green-50 border-green-200',
                        change.type === 'modified' &&
                          'bg-yellow-50 border-yellow-200',
                        change.type === 'deleted' && 'bg-red-50 border-red-200'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          className={cn(
                            'text-xs',
                            change.type === 'added' &&
                              'bg-green-600 text-white',
                            change.type === 'modified' &&
                              'bg-yellow-600 text-white',
                            change.type === 'deleted' && 'bg-red-600 text-white'
                          )}
                        >
                          {change.type}
                        </Badge>
                        <span className="font-medium text-sm">
                          {change.field}
                        </span>
                      </div>
                      {change.oldValue && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Old:</span>{' '}
                          {JSON.stringify(change.oldValue)}
                        </div>
                      )}
                      {change.newValue && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">New:</span>{' '}
                          {JSON.stringify(change.newValue)}
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="diff">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                    <pre>{`--- a/questionnaire.json
+++ b/questionnaire.json
@@ -10,7 +10,7 @@
   "questions": [
     {
       "id": "q1",
-      "text": "What is your age?",
+      "text": "What is your age range?",
       "type": "radio",
       "options": [
         "18-24",
@@ -25,6 +25,11 @@
+    {
+      "id": "q5",
+      "text": "How would you rate your overall experience?",
+      "type": "likert",
+      "scale": 5
+    }
   ]
}`}</pre>
                  </div>
                </TabsContent>

                <TabsContent value="preview">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Preview of changes</h4>
                      <p className="text-sm text-gray-600">
                        The questionnaire will include the new demographic
                        section with improved question flow and additional
                        validation rules.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowDiffView(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
