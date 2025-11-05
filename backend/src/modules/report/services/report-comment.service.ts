import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { ReportCollaborationService } from './report-collaboration.service';

/**
 * Report Comment Service - Phase 10 Day 4
 *
 * Handles threaded commenting system for collaborative report writing
 *
 * @features
 * - Add comments to specific report sections
 * - Reply to comments (threading)
 * - Resolve/unresolve comments
 * - Edit/delete comments
 * - Mention users in comments
 */
@Injectable()
export class ReportCommentService {
  private readonly logger = new Logger(ReportCommentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly collaborationService: ReportCollaborationService,
  ) {}

  /**
   * Create a comment on a report section
   */
  async createComment(
    reportId: string,
    userId: string,
    content: string,
    sectionId?: string,
    parentId?: string,
  ) {
    await this.collaborationService.checkReportAccess(reportId, userId);

    const comment = await this.prisma.reportComment.create({
      data: {
        reportId,
        userId,
        content,
        sectionId,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `💬 [Comment] Created comment on report ${reportId}${sectionId ? ` section ${sectionId}` : ''}`,
    );

    return comment;
  }

  /**
   * Get all comments for a report
   */
  async getComments(reportId: string, userId: string, sectionId?: string) {
    await this.collaborationService.checkReportAccess(reportId, userId);

    const where: any = {
      reportId,
      parentId: null, // Only top-level comments
    };

    if (sectionId) {
      where.sectionId = sectionId;
    }

    const comments = await this.prisma.reportComment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments;
  }

  /**
   * Get a specific comment with replies
   */
  async getComment(commentId: string, userId: string) {
    const comment = await this.prisma.reportComment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.collaborationService.checkReportAccess(comment.reportId, userId);

    return comment;
  }

  /**
   * Reply to a comment
   */
  async replyToComment(commentId: string, userId: string, content: string) {
    const parentComment = await this.prisma.reportComment.findUnique({
      where: { id: commentId },
    });

    if (!parentComment) {
      throw new NotFoundException('Parent comment not found');
    }

    await this.collaborationService.checkReportAccess(
      parentComment.reportId,
      userId,
    );

    const reply = await this.prisma.reportComment.create({
      data: {
        reportId: parentComment.reportId,
        userId,
        content,
        sectionId: parentComment.sectionId,
        parentId: commentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `💬 [Comment] Created reply to comment ${commentId} on report ${parentComment.reportId}`,
    );

    return reply;
  }

  /**
   * Update a comment
   */
  async updateComment(commentId: string, userId: string, content: string) {
    const comment = await this.prisma.reportComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updated = await this.prisma.reportComment.update({
      where: { id: commentId },
      data: {
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`✏️ [Comment] Updated comment ${commentId}`);

    return updated;
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.reportComment.findUnique({
      where: { id: commentId },
      include: {
        replies: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const userRole = await this.collaborationService.getUserRole(
      comment.reportId,
      userId,
    );

    if (comment.userId !== userId && userRole !== 'owner') {
      throw new ForbiddenException(
        'You can only delete your own comments unless you are the report owner',
      );
    }

    if (comment.replies.length > 0) {
      await this.prisma.reportComment.deleteMany({
        where: { parentId: commentId },
      });
    }

    await this.prisma.reportComment.delete({
      where: { id: commentId },
    });

    this.logger.log(
      `🗑️ [Comment] Deleted comment ${commentId} and ${comment.replies.length} replies`,
    );

    return { success: true };
  }

  /**
   * Resolve a comment thread
   */
  async resolveComment(commentId: string, userId: string) {
    const comment = await this.prisma.reportComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.collaborationService.checkPermission(comment.reportId, userId, [
      'owner',
      'editor',
    ]);

    const updated = await this.prisma.reportComment.update({
      where: { id: commentId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`✅ [Comment] Resolved comment ${commentId}`);

    return updated;
  }

  /**
   * Unresolve a comment thread
   */
  async unresolveComment(commentId: string, userId: string) {
    const comment = await this.prisma.reportComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.collaborationService.checkPermission(comment.reportId, userId, [
      'owner',
      'editor',
    ]);

    const updated = await this.prisma.reportComment.update({
      where: { id: commentId },
      data: {
        resolved: false,
        resolvedAt: null,
        resolvedBy: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`♻️ [Comment] Unresolved comment ${commentId}`);

    return updated;
  }

  /**
   * Get unresolved comments count for a report
   */
  async getUnresolvedCount(reportId: string, userId: string) {
    await this.collaborationService.checkReportAccess(reportId, userId);

    const count = await this.prisma.reportComment.count({
      where: {
        reportId,
        resolved: false,
        parentId: null, // Only count top-level comments
      },
    });

    return { unresolvedCount: count };
  }

  /**
   * Get comments by section
   */
  async getCommentsBySection(reportId: string, userId: string) {
    await this.collaborationService.checkReportAccess(reportId, userId);

    const comments = await this.prisma.reportComment.findMany({
      where: {
        reportId,
        parentId: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const commentsBySection = comments.reduce(
      (acc, comment) => {
        const section = comment.sectionId || 'general';
        if (!acc[section]) {
          acc[section] = [];
        }
        acc[section].push(comment);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return commentsBySection;
  }
}
