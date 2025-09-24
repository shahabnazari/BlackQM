'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  MessageSquare,
  Bell,
  Shield,
  Check,
  X,
  Clock,
  Video,
  Share2,
  Settings,
  Circle,
  Mail,
  Activity,
  MousePointer,
  Edit3,
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Simple Avatar component replacement
const Avatar = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}>
    {children}
  </div>
);

const AvatarImage = ({ src }: { src?: string }) => {
  if (!src) return null;
  return <img className="aspect-square h-full w-full" src={src} alt="" />;
};

const AvatarFallback = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100">
    {children}
  </div>
);

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'reviewer' | 'viewer';
  status: 'online' | 'away' | 'offline';
  lastActive: Date;
  currentSection?: string;
  cursorPosition?: { x: number; y: number };
  color: string;
}

interface Comment {
  id: string;
  author: Collaborator;
  text: string;
  timestamp: Date;
  resolved: boolean;
  replies?: Comment[];
  questionId?: string;
  position?: { x: number; y: number };
}

interface Activity {
  id: string;
  user: Collaborator;
  action: string;
  target?: string;
  timestamp: Date;
  type: 'edit' | 'comment' | 'review' | 'share';
}

export function CollaborationManager() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activeUsers, setActiveUsers] = useState<Collaborator[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showPresence, setShowPresence] = useState(true);
  const [lockMode, setLockMode] = useState<'none' | 'section' | 'full'>('none');

  // Mock data
  useEffect(() => {
    setCollaborators([
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: '/avatars/john.jpg',
        role: 'owner',
        status: 'online',
        lastActive: new Date(),
        currentSection: 'Demographics',
        color: '#3B82F6',
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar: '/avatars/jane.jpg',
        role: 'editor',
        status: 'online',
        lastActive: new Date(),
        currentSection: 'Satisfaction',
        color: '#10B981',
      },
      {
        id: '3',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        role: 'reviewer',
        status: 'away',
        lastActive: new Date(Date.now() - 600000),
        color: '#F59E0B',
      },
      {
        id: '4',
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        role: 'viewer',
        status: 'offline',
        lastActive: new Date(Date.now() - 3600000),
        color: '#8B5CF6',
      },
    ]);

    // Only set active users if collaborators exist
    if (collaborators.length >= 2) {
      setActiveUsers([
        collaborators[0],
        collaborators[1],
      ].filter((c): c is Collaborator => c !== undefined));
    }

    // Only set comments if collaborators exist
    if (collaborators.length >= 3) {
      setComments([
        {
          id: '1',
          author: collaborators[1]!,
          text: 'Should we make this question required?',
          timestamp: new Date(Date.now() - 300000),
          resolved: false,
          questionId: 'q1',
          replies: [
            {
              id: '2',
              author: collaborators[0]!,
              text: 'Yes, it\'s essential for our analysis',
              timestamp: new Date(Date.now() - 180000),
              resolved: false,
            },
          ],
        },
        {
          id: '3',
          author: collaborators[2]!,
          text: 'The wording here might be confusing for some participants',
          timestamp: new Date(Date.now() - 1800000),
          resolved: true,
          questionId: 'q3',
        },
      ]);
    }

    // Only set activities if collaborators exist
    if (collaborators.length >= 3) {
      setActivities([
        {
          id: '1',
          user: collaborators[1]!,
          action: 'edited Question 5',
          timestamp: new Date(Date.now() - 120000),
          type: 'edit',
        },
        {
          id: '2',
          user: collaborators[0]!,
          action: 'added a comment',
          timestamp: new Date(Date.now() - 180000),
          type: 'comment',
        },
        {
          id: '3',
          user: collaborators[2]!,
          action: 'approved changes',
          timestamp: new Date(Date.now() - 600000),
          type: 'review',
        },
      ]);
    }
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700';
      case 'editor': return 'bg-blue-100 text-blue-700';
      case 'reviewer': return 'bg-yellow-100 text-yellow-700';
      case 'viewer': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Collaboration</h2>
            <p className="text-sm text-gray-600">
              Work together in real-time on questionnaires
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Video className="w-4 h-4 mr-2" />
            Start Call
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share Link
          </Button>
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Active Collaborators */}
        <div className="col-span-2 space-y-4">
          {/* Real-time Presence */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Active Now
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show cursors</span>
                <Switch
                  checked={showPresence}
                  onCheckedChange={setShowPresence}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {activeUsers.map((user) => (
                <div 
                  key={user.id}
                  className="relative"
                  title={`${user.name}\nEditing: ${user.currentSection || 'Not editing'}`}
                >
                  <Avatar className={`ring-2`}>
                    <AvatarImage src={user.avatar || ''} />
                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <Circle
                    className={cn(
                      "absolute -bottom-1 -right-1 w-3 h-3 fill-current",
                      getStatusIndicator(user.status)
                    )}
                  />
                </div>
              ))}
              <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                <MousePointer className="w-3 h-3" />
                <span>{activeUsers.length} active</span>
              </div>
            </div>
          </Card>

          {/* Collaborators List */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Team Members</h3>
              <Badge variant="secondary">{collaborators.length} members</Badge>
            </div>

            <div className="space-y-3">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={collaborator.avatar || ''} />
                        <AvatarFallback>
                          {collaborator.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <Circle
                        className={cn(
                          "absolute -bottom-1 -right-1 w-3 h-3 fill-current",
                          getStatusIndicator(collaborator.status)
                        )}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{collaborator.name}</p>
                        <Badge className={cn("text-xs", getRoleColor(collaborator.role))}>
                          {collaborator.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{collaborator.email}</p>
                      {collaborator.currentSection && collaborator.status === 'online' && (
                        <p className="text-xs text-blue-600 mt-1">
                          Editing: {collaborator.currentSection}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      title="Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>

                    <div className="relative group">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <div className="absolute right-0 mt-2 w-48 hidden group-hover:block bg-white border rounded-md shadow-lg z-10">
                        <div className="space-y-2 p-2">
                          <Button variant="ghost" className="w-full justify-start" size="sm">
                            <Edit3 className="w-4 h-4 mr-2" />
                            Change Role
                          </Button>
                          <Button variant="ghost" className="w-full justify-start" size="sm">
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </Button>
                          <Button variant="ghost" className="w-full justify-start text-red-600" size="sm">
                            <X className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Comments Section */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments
              </h3>
              <Button size="sm" onClick={() => setShowCommentDialog(true)}>
                Add Comment
              </Button>
            </div>

            <div className="h-64 overflow-y-auto">
              <div className="space-y-3 pr-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      comment.resolved ? "bg-gray-50 opacity-60" : "bg-white"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={comment.author.avatar || ''} />
                          <AvatarFallback>
                            {comment.author.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{comment.author.name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {comment.resolved ? (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
                    
                    {comment.questionId && (
                      <Badge variant="outline" className="text-xs mb-2">
                        Question: {comment.questionId}
                      </Badge>
                    )}
                    
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-6 mt-2 space-y-2 border-l-2 border-gray-200 pl-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">{reply.author.name}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(reply.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">{reply.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button className="text-xs text-blue-600 hover:underline mt-2">
                      Reply
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Activity & Settings */}
        <div className="space-y-4">
          {/* Lock Controls */}
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Edit Permissions
            </h4>
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Lock Mode</Label>
                <Select value={lockMode} onValueChange={(v: any) => setLockMode(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <Unlock className="w-4 h-4" />
                        <span>No Lock</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="section">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span>Lock Sections</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="full">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span>Full Lock</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {lockMode !== 'none' && (
                <div className="p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Only one person can edit {lockMode === 'section' ? 'each section' : 'at a time'}
                </div>
              )}
            </div>
          </Card>

          {/* Activity Feed */}
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Activity
            </h4>
            <div className="h-64 overflow-y-auto">
              <div className="space-y-3 pr-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={activity.user.avatar || ''} />
                      <AvatarFallback>
                        {activity.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-xs">
                        <span className="font-medium">{activity.user.name}</span>
                        {' '}
                        <span className="text-gray-600">{activity.action}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch defaultChecked />
                <Label className="text-sm font-normal">Comments & mentions</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked />
                <Label className="text-sm font-normal">Edits to my sections</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch />
                <Label className="text-sm font-normal">All activity</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked />
                <Label className="text-sm font-normal">Review requests</Label>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Invite Collaborators</h3>
            <div className="space-y-4">
              <div>
                <Label>Email addresses</Label>
                <Textarea
                  placeholder="Enter email addresses separated by commas..."
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select defaultValue="viewer">
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor - Can edit questions</SelectItem>
                    <SelectItem value="reviewer">Reviewer - Can comment and approve</SelectItem>
                    <SelectItem value="viewer">Viewer - Can only view</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Message (Optional)</Label>
                <Textarea
                  placeholder="Add a message to the invitation..."
                  className="mt-2"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button>
                <Mail className="w-4 h-4 mr-2" />
                Send Invitations
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}