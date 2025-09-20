import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { WebSocketService } from '../../../services/websocket.service';
import { CacheService } from '../../../common/cache.service';

export interface CollaboratorDto {
  userId: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  permissions: string[];
  invitedAt: Date;
  acceptedAt?: Date;
}

export interface ActivityLogDto {
  id: string;
  studyId: string;
  userId: string;
  userName: string;
  action: string;
  details: any;
  timestamp: Date;
  metadata?: any;
}

export interface CommentDto {
  id: string;
  studyId: string;
  userId: string;
  userName: string;
  content: string;
  parentId?: string;
  sectionId?: string;
  timestamp: Date;
  edited?: boolean;
  resolved?: boolean;
}

export interface CollaborationStateDto {
  studyId: string;
  activeUsers: Map<string, any>;
  lockedSections: Map<string, string>;
  pendingChanges: any[];
  lastSync: Date;
}

@Injectable()
export class CollaborationService {
  private collaborationStates: Map<string, CollaborationStateDto> = new Map();
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly wsService: WebSocketService,
    private readonly cache: CacheService,
  ) {
    // WebSocket handlers are now managed directly in methods
    // The WebSocketService doesn't support event listeners
  }

  // ========== Collaborator Management ==========

  async addCollaborator(
    studyId: string, 
    inviterId: string, 
    email: string, 
    role: 'editor' | 'viewer' | 'commenter'
  ): Promise<CollaboratorDto> {
    // Check if inviter has permission
    const hasPermission = await this.checkPermission(studyId, inviterId, 'manage_collaborators');
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to add collaborators');
    }

    // Check if user exists
    const invitedUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      // Send invitation email (implement email service)
      return await this.createPendingInvitation(studyId, email, role);
    }

    // Add collaborator to study
    const collaborator = await this.prisma.studyCollaborator.create({
      data: {
        studyId,
        userId: invitedUser.id,
        role,
        invitedBy: inviterId,
        invitedAt: new Date(),
        permissions: JSON.stringify(this.getDefaultPermissions(role)),
      },
      include: {
        user: true,
      },
    });

    // Log activity
    await this.logActivity(studyId, inviterId, 'collaborator_added', {
      collaboratorEmail: email,
      role,
    });

    // Notify via WebSocket
    this.wsService.emitToRoom(`study:${studyId}`, 'collaboration', {
      type: 'collaborator_added',
      data: collaborator,
    });

    // Clear cache
    await this.cache.delete(`study:${studyId}:collaborators`);

    return this.mapToCollaboratorDto(collaborator);
  }

  async removeCollaborator(studyId: string, requesterId: string, userId: string): Promise<void> {
    const hasPermission = await this.checkPermission(studyId, requesterId, 'manage_collaborators');
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to remove collaborators');
    }

    await this.prisma.studyCollaborator.delete({
      where: {
        studyId_userId: {
          studyId,
          userId,
        },
      },
    });

    // Log activity
    await this.logActivity(studyId, requesterId, 'collaborator_removed', { userId });

    // Notify via WebSocket
    this.wsService.emitToRoom(`study:${studyId}`, 'collaboration', {
      type: 'collaborator_removed',
      data: { userId },
    });

    // Clear cache
    await this.cache.delete(`study:${studyId}:collaborators`);
  }

  async updateCollaboratorRole(
    studyId: string, 
    requesterId: string, 
    userId: string, 
    newRole: 'editor' | 'viewer' | 'commenter'
  ): Promise<CollaboratorDto> {
    const hasPermission = await this.checkPermission(studyId, requesterId, 'manage_collaborators');
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to update collaborator roles');
    }

    const updated = await this.prisma.studyCollaborator.update({
      where: {
        studyId_userId: {
          studyId,
          userId,
        },
      },
      data: {
        role: newRole,
        permissions: JSON.stringify(this.getDefaultPermissions(newRole)),
      },
      include: {
        user: true,
      },
    });

    // Log activity
    await this.logActivity(studyId, requesterId, 'role_updated', {
      userId,
      newRole,
    });

    // Clear cache
    await this.cache.delete(`study:${studyId}:collaborators`);

    return this.mapToCollaboratorDto(updated);
  }

  async getCollaborators(studyId: string): Promise<CollaboratorDto[]> {
    // Check cache first
    const cacheKey = `study:${studyId}:collaborators`;
    const cached = await this.cache.get(cacheKey) as CollaboratorDto[] | null;
    if (cached) return cached;

    const collaborators = await this.prisma.studyCollaborator.findMany({
      where: { studyId },
      include: {
        user: true,
      },
      orderBy: {
        invitedAt: 'desc',
      },
    });

    const result = collaborators.map(c => this.mapToCollaboratorDto(c));
    
    // Cache for 5 minutes
    await this.cache.set(cacheKey, result, 300);
    
    return result;
  }

  // ========== Real-time Collaboration ==========

  async handleUserJoin(studyId: string, userId: string, metadata: any): Promise<void> {
    const state = this.getOrCreateCollaborationState(studyId);
    
    // Add user to active users
    state.activeUsers.set(userId, {
      userId,
      joinedAt: new Date(),
      metadata,
      cursor: null,
      selection: null,
    });

    // Broadcast to other users
    this.wsService.emitToRoom(`study:${studyId}`, 'presence', {
      type: 'user_joined',
      userId,
      activeUsers: Array.from(state.activeUsers.values()),
    });

    // Log activity
    await this.logActivity(studyId, userId, 'session_started', { metadata });
  }

  async handleUserLeave(studyId: string, userId: string): Promise<void> {
    const state = this.getOrCreateCollaborationState(studyId);
    
    // Remove user from active users
    state.activeUsers.delete(userId);

    // Unlock any sections locked by this user
    for (const [sectionId, lockedBy] of state.lockedSections.entries()) {
      if (lockedBy === userId) {
        state.lockedSections.delete(sectionId);
        this.wsService.emitToRoom(`study:${studyId}`, 'locks', {
          type: 'section_unlocked',
          sectionId,
        });
      }
    }

    // Broadcast to other users
    this.wsService.emitToRoom(`study:${studyId}`, 'presence', {
      type: 'user_left',
      userId,
      activeUsers: Array.from(state.activeUsers.values()),
    });

    // Log activity
    await this.logActivity(studyId, userId, 'session_ended', {});
  }

  async handleSectionLock(studyId: string, userId: string, sectionId: string): Promise<boolean> {
    const state = this.getOrCreateCollaborationState(studyId);
    
    // Check if section is already locked
    if (state.lockedSections.has(sectionId)) {
      return false;
    }

    // Lock the section
    state.lockedSections.set(sectionId, userId);

    // Broadcast to other users
    this.wsService.emitToRoom(`study:${studyId}`, 'locks', {
      type: 'section_locked',
      sectionId,
      userId,
    });

    return true;
  }

  async handleSectionUnlock(studyId: string, sectionId: string): Promise<void> {
    const state = this.getOrCreateCollaborationState(studyId);
    
    // Unlock the section
    state.lockedSections.delete(sectionId);

    // Broadcast to other users
    this.wsService.emitToRoom(`study:${studyId}`, 'locks', {
      type: 'section_unlocked',
      sectionId,
    });
  }

  async handleCollaborativeChange(studyId: string, userId: string, change: any): Promise<void> {
    const state = this.getOrCreateCollaborationState(studyId);
    
    // Add change to pending changes
    state.pendingChanges.push({
      userId,
      change,
      timestamp: new Date(),
    });

    // Broadcast to other users
    this.wsService.emitToRoom(`study:${studyId}`, 'changes', {
      type: 'change',
      userId,
      change,
    });

    // Process change if auto-save is enabled
    if (change.autoSave) {
      await this.processCollaborativeChange(studyId, userId, change);
    }
  }

  // ========== Comments & Discussion ==========

  async addComment(
    studyId: string, 
    userId: string, 
    content: string, 
    sectionId?: string,
    parentId?: string
  ): Promise<CommentDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const comment = await this.prisma.studyComment.create({
      data: {
        studyId,
        userId,
        content,
        sectionId,
        parentId,
        timestamp: new Date(),
      },
    });

    const commentDto: CommentDto = {
      id: comment.id,
      studyId: comment.studyId,
      userId: comment.userId,
      userName: user?.name || 'Unknown',
      content: comment.content,
      sectionId: comment.sectionId || undefined,
      parentId: comment.parentId || undefined,
      timestamp: comment.timestamp,
      edited: false,
      resolved: false,
    };

    // Notify collaborators via WebSocket
    this.wsService.emitToRoom(`study:${studyId}`, 'comments', {
      type: 'comment_added',
      data: commentDto,
    });

    // Log activity
    await this.logActivity(studyId, userId, 'comment_added', {
      sectionId,
      parentId,
    });

    return commentDto;
  }

  async getComments(studyId: string, sectionId?: string): Promise<CommentDto[]> {
    const where: any = { studyId };
    if (sectionId) {
      where.sectionId = sectionId;
    }

    const comments = await this.prisma.studyComment.findMany({
      where,
      include: {
        user: {
          select: { name: true },
        },
        replies: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return comments.map(c => ({
      id: c.id,
      studyId: c.studyId,
      userId: c.userId,
      userName: c.user.name || 'Unknown',
      content: c.content,
      sectionId: c.sectionId || undefined,
      parentId: c.parentId || undefined,
      timestamp: c.timestamp,
      edited: c.edited || false,
      resolved: c.resolved || false,
    }));
  }

  async resolveComment(studyId: string, commentId: string, userId: string): Promise<void> {
    await this.prisma.studyComment.update({
      where: { id: commentId },
      data: {
        resolved: true,
        resolvedBy: userId,
        resolvedAt: new Date(),
      },
    });

    // Notify via WebSocket
    this.wsService.emitToRoom(`study:${studyId}`, 'comments', {
      type: 'comment_resolved',
      data: { commentId, userId },
    });
  }

  // ========== Activity Logging ==========

  async logActivity(studyId: string, userId: string, action: string, details: any): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const activity = await this.prisma.studyActivityLog.create({
      data: {
        studyId,
        userId,
        action,
        details,
        timestamp: new Date(),
      },
    });

    const activityDto: ActivityLogDto = {
      id: activity.id,
      studyId: activity.studyId,
      userId: activity.userId,
      userName: user?.name || 'Unknown',
      action: activity.action,
      details: activity.details,
      timestamp: activity.timestamp,
    };

    // Broadcast activity to collaborators
    this.wsService.emitToRoom(`study:${studyId}`, 'activity', activityDto);

    // Clear activity cache
    await this.cache.delete(`study:${studyId}:activity`);
  }

  async getActivityLog(studyId: string, limit = 50): Promise<ActivityLogDto[]> {
    // Check cache first
    const cacheKey = `study:${studyId}:activity`;
    const cached = await this.cache.get(cacheKey) as ActivityLogDto[] | null;
    if (cached) return cached;

    const activities = await this.prisma.studyActivityLog.findMany({
      where: { studyId },
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    const result = activities.map(a => ({
      id: a.id,
      studyId: a.studyId,
      userId: a.userId,
      userName: a.user.name || 'Unknown',
      action: a.action,
      details: a.details,
      timestamp: a.timestamp,
      metadata: a.metadata,
    }));

    // Cache for 2 minutes
    await this.cache.set(cacheKey, result, 120);

    return result;
  }

  // ========== Permissions & Access Control ==========

  async checkPermission(studyId: string, userId: string, permission: string): Promise<boolean> {
    // Check if user is study owner
    const study = await this.prisma.survey.findUnique({
      where: { id: studyId },
      select: { createdBy: true },
    });

    if (study?.createdBy === userId) {
      return true; // Owner has all permissions
    }

    // Check collaborator permissions
    const collaborator = await this.prisma.studyCollaborator.findUnique({
      where: {
        studyId_userId: {
          studyId,
          userId,
        },
      },
    });

    if (!collaborator) {
      return false;
    }

    return collaborator.permissions.includes(permission);
  }

  async getUserPermissions(studyId: string, userId: string): Promise<string[]> {
    // Check if user is study owner
    const study = await this.prisma.survey.findUnique({
      where: { id: studyId },
      select: { createdBy: true },
    });

    if (study?.createdBy === userId) {
      return this.getAllPermissions(); // Owner has all permissions
    }

    // Get collaborator permissions
    const collaborator = await this.prisma.studyCollaborator.findUnique({
      where: {
        studyId_userId: {
          studyId,
          userId,
        },
      },
    });

    return collaborator?.permissions ? JSON.parse(collaborator.permissions) : [];
  }

  // ========== Helper Methods ==========

  private getOrCreateCollaborationState(studyId: string): CollaborationStateDto {
    if (!this.collaborationStates.has(studyId)) {
      this.collaborationStates.set(studyId, {
        studyId,
        activeUsers: new Map(),
        lockedSections: new Map(),
        pendingChanges: [],
        lastSync: new Date(),
      });
    }
    return this.collaborationStates.get(studyId)!;
  }

  private getDefaultPermissions(role: 'owner' | 'editor' | 'viewer' | 'commenter'): string[] {
    const permissions = {
      owner: this.getAllPermissions(),
      editor: [
        'view_study',
        'edit_study',
        'view_data',
        'edit_data',
        'run_analysis',
        'export_data',
        'add_comments',
        'view_comments',
      ],
      viewer: [
        'view_study',
        'view_data',
        'view_comments',
        'export_data',
      ],
      commenter: [
        'view_study',
        'view_data',
        'add_comments',
        'view_comments',
      ],
    };

    return permissions[role] || [];
  }

  private getAllPermissions(): string[] {
    return [
      'view_study',
      'edit_study',
      'delete_study',
      'view_data',
      'edit_data',
      'delete_data',
      'run_analysis',
      'export_data',
      'manage_collaborators',
      'manage_permissions',
      'add_comments',
      'view_comments',
      'moderate_comments',
      'view_activity',
      'manage_settings',
    ];
  }

  private async createPendingInvitation(studyId: string, email: string, role: string): Promise<CollaboratorDto> {
    // This would create a pending invitation and send an email
    // For now, returning a placeholder
    return {
      userId: 'pending',
      email,
      role: role as any,
      permissions: this.getDefaultPermissions(role as any),
      invitedAt: new Date(),
    };
  }

  private async processCollaborativeChange(studyId: string, userId: string, change: any): Promise<void> {
    // Process and save the collaborative change
    // This would integrate with your existing data update logic
    console.log(`Processing collaborative change for study ${studyId} by user ${userId}`, change);
  }

  private mapToCollaboratorDto(collaborator: any): CollaboratorDto {
    return {
      userId: collaborator.userId,
      email: collaborator.user.email,
      role: collaborator.role,
      permissions: collaborator.permissions,
      invitedAt: collaborator.invitedAt,
      acceptedAt: collaborator.acceptedAt,
    };
  }
}