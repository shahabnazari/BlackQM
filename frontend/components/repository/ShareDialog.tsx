import React, { useState, useEffect } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import {
  repositoryApi,
  type ResearchInsight,
  type InsightAccess,
  type AccessRole,
} from '@/lib/api/services/repository-api.service';
import {
  XMarkIcon,
  ShareIcon,
  LockClosedIcon,
  LockOpenIcon,
  UserPlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

/**
 * Phase 10 Day 29: Share & Permissions Dialog
 *
 * Comprehensive permissions management UI for research insights
 *
 * Features:
 * - Public/private toggle
 * - Share level selection (private/team/institution/public)
 * - Grant access to specific users with role selection
 * - View and manage access list
 * - Revoke access
 */

interface ShareDialogProps {
  insight: ResearchInsight;
  onClose: () => void;
  onUpdate?: (insight: ResearchInsight) => void;
}

export function ShareDialog({ insight, onClose, onUpdate }: ShareDialogProps) {
  const [isPublic, setIsPublic] = useState(insight.isPublic);
  const [shareLevel, setShareLevel] = useState<'private' | 'team' | 'institution' | 'public'>(
    insight.shareLevel,
  );
  const [accessList, setAccessList] = useState<InsightAccess[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<AccessRole>('VIEWER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccessList();
  }, []);

  const loadAccessList = async () => {
    try {
      const list = await repositoryApi.getAccessList(insight.id);
      setAccessList(list);
    } catch (err: any) {
      console.error('Failed to load access list:', err);
      // Access list is owner-only, so non-owners will get an error
      // We can ignore this silently
    }
  };

  const handleVisibilityUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await repositoryApi.updateVisibility(insight.id, isPublic, shareLevel);
      onUpdate?.(updated);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update visibility');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!newUserEmail.trim()) {
      setError('Please enter a user email');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // In a real app, you'd need to resolve email to userId
      // For now, we'll use the email as userId (placeholder)
      await repositoryApi.grantAccess(insight.id, newUserEmail, newUserRole);
      setNewUserEmail('');
      setNewUserRole('VIEWER');
      await loadAccessList();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to grant access');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      await repositoryApi.revokeAccess(insight.id, userId);
      await loadAccessList();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to revoke access');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-700';
      case 'EDITOR':
        return 'bg-blue-100 text-blue-700';
      case 'COMMENTER':
        return 'bg-green-100 text-green-700';
      case 'VIEWER':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <ShareIcon className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Share & Permissions</h2>
                <p className="text-sm text-gray-500 mt-1">{insight.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Visibility Settings */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Visibility</h3>
            <div className="space-y-3">
              {/* Public/Private Toggle */}
              <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {isPublic ? (
                    <LockOpenIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <LockClosedIcon className="w-5 h-5 text-gray-600" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{isPublic ? 'Public' : 'Private'}</p>
                    <p className="text-xs text-gray-500">
                      {isPublic
                        ? 'Anyone can view this insight'
                        : 'Only you and people with access can view'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </label>

              {/* Share Level */}
              <div className="border rounded-lg p-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Level
                </label>
                <select
                  value={shareLevel}
                  onChange={(e) =>
                    setShareLevel(e.target.value as 'private' | 'team' | 'institution' | 'public')
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="private">Private - Only you</option>
                  <option value="team">Team - Your research team</option>
                  <option value="institution">Institution - Your organization</option>
                  <option value="public">Public - Everyone</option>
                </select>
              </div>

              <Button
                onClick={handleVisibilityUpdate}
                loading={loading}
                disabled={loading}
                variant="primary"
                size="sm"
                className="w-full"
              >
                Update Visibility
              </Button>
            </div>
          </div>

          {/* Grant Access Section */}
          <div className="mb-6 pb-6 border-b">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <UserPlusIcon className="w-4 h-4" />
              Grant Access to User
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-700 mb-1">User Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as AccessRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="VIEWER">Viewer - Can view only</option>
                  <option value="COMMENTER">Commenter - Can view and add annotations</option>
                  <option value="EDITOR">Editor - Can view, annotate, and edit</option>
                  <option value="OWNER">Owner - Full control</option>
                </select>
              </div>
              <Button
                onClick={handleGrantAccess}
                loading={loading}
                disabled={loading || !newUserEmail.trim()}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                Grant Access
              </Button>
            </div>
          </div>

          {/* Access List */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              People with Access ({accessList.length})
            </h3>
            {accessList.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No additional users have access
              </p>
            ) : (
              <div className="space-y-2">
                {accessList.map((access) => (
                  <div
                    key={access.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {access.user?.name || access.user?.email || access.userId}
                      </p>
                      <p className="text-xs text-gray-500">
                        Granted {new Date(access.grantedAt).toLocaleDateString()}
                        {access.expiresAt &&
                          ` • Expires ${new Date(access.expiresAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(access.role)}`}
                      >
                        {access.role}
                      </span>
                      <button
                        onClick={() => handleRevokeAccess(access.userId)}
                        disabled={loading}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Revoke access"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t flex justify-end gap-2">
            <Button onClick={onClose} variant="secondary" size="sm">
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
