import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CollaborationService } from '../services/collaboration.service';
import { AuthenticatedRequest } from '../../../common/interfaces/auth-request.interface';
import { 
  AddCollaboratorDto, 
  UpdateCollaboratorRoleDto, 
  AddCommentDto,
  JoinSessionDto,
  LockSectionDto
} from '../dto/collaboration.dto';

@ApiTags('Collaboration')
@Controller('api/collaboration')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  // ========== Collaborators ==========

  @Post('study/:studyId/collaborators')
  @ApiOperation({ summary: 'Add a collaborator to a study' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Collaborator added successfully' })
  async addCollaborator(
    @Param('studyId') studyId: string,
    @Request() req: AuthenticatedRequest,
    @Body() body: AddCollaboratorDto
  ) {
    try {
      return await this.collaborationService.addCollaborator(
        studyId,
        req.user.id,
        body.email,
        body.role as 'editor' | 'viewer' | 'commenter'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('study/:studyId/collaborators')
  @ApiOperation({ summary: 'Get all collaborators for a study' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns list of collaborators' })
  async getCollaborators(@Param('studyId') studyId: string) {
    return await this.collaborationService.getCollaborators(studyId);
  }

  @Put('study/:studyId/collaborators/:userId')
  @ApiOperation({ summary: 'Update collaborator role' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Collaborator role updated' })
  async updateCollaboratorRole(
    @Param('studyId') studyId: string,
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
    @Body() body: UpdateCollaboratorRoleDto
  ) {
    return await this.collaborationService.updateCollaboratorRole(
      studyId,
      req.user.id,
      userId,
      body.role as 'editor' | 'viewer' | 'commenter'
    );
  }

  @Delete('study/:studyId/collaborators/:userId')
  @ApiOperation({ summary: 'Remove a collaborator' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Collaborator removed' })
  async removeCollaborator(
    @Param('studyId') studyId: string,
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest
  ) {
    await this.collaborationService.removeCollaborator(studyId, req.user.id, userId);
    return { success: true };
  }

  // ========== Comments ==========

  @Post('study/:studyId/comments')
  @ApiOperation({ summary: 'Add a comment to a study' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Comment added successfully' })
  async addComment(
    @Param('studyId') studyId: string,
    @Request() req: AuthenticatedRequest,
    @Body() body: AddCommentDto
  ) {
    return await this.collaborationService.addComment(
      studyId,
      req.user.id,
      body.content,
      body.sectionId,
      body.parentId
    );
  }

  @Get('study/:studyId/comments')
  @ApiOperation({ summary: 'Get comments for a study' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns list of comments' })
  async getComments(
    @Param('studyId') studyId: string,
    @Query('sectionId') sectionId?: string
  ) {
    return await this.collaborationService.getComments(studyId, sectionId);
  }

  @Put('study/:studyId/comments/:commentId/resolve')
  @ApiOperation({ summary: 'Resolve a comment' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Comment resolved' })
  async resolveComment(
    @Param('studyId') studyId: string,
    @Param('commentId') commentId: string,
    @Request() req: AuthenticatedRequest
  ) {
    await this.collaborationService.resolveComment(studyId, commentId, req.user.id);
    return { success: true };
  }

  // ========== Activity Log ==========

  @Get('study/:studyId/activity')
  @ApiOperation({ summary: 'Get activity log for a study' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns activity log' })
  async getActivityLog(
    @Param('studyId') studyId: string,
    @Query('limit') limit?: number
  ) {
    return await this.collaborationService.getActivityLog(studyId, limit || 50);
  }

  // ========== Permissions ==========

  @Get('study/:studyId/permissions')
  @ApiOperation({ summary: 'Get user permissions for a study' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns user permissions' })
  async getUserPermissions(
    @Param('studyId') studyId: string,
    @Request() req: AuthenticatedRequest
  ) {
    return await this.collaborationService.getUserPermissions(studyId, req.user.id);
  }

  @Get('study/:studyId/permissions/check')
  @ApiOperation({ summary: 'Check if user has specific permission' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns permission status' })
  async checkPermission(
    @Param('studyId') studyId: string,
    @Request() req: AuthenticatedRequest,
    @Query('permission') permission: string
  ) {
    const hasPermission = await this.collaborationService.checkPermission(
      studyId,
      req.user.id,
      permission
    );
    return { hasPermission };
  }

  // ========== Real-time Collaboration ==========

  @Post('study/:studyId/join')
  @ApiOperation({ summary: 'Join collaborative session' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Joined session' })
  async joinSession(
    @Param('studyId') studyId: string,
    @Request() req: AuthenticatedRequest,
    @Body() body: { metadata?: any }
  ) {
    await this.collaborationService.handleUserJoin(
      studyId,
      req.user.id,
      body.metadata
    );
    return { success: true };
  }

  @Post('study/:studyId/leave')
  @ApiOperation({ summary: 'Leave collaborative session' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Left session' })
  async leaveSession(
    @Param('studyId') studyId: string,
    @Request() req: AuthenticatedRequest
  ) {
    await this.collaborationService.handleUserLeave(studyId, req.user.id);
    return { success: true };
  }

  @Post('study/:studyId/lock')
  @ApiOperation({ summary: 'Lock a section for editing' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Section locked' })
  async lockSection(
    @Param('studyId') studyId: string,
    @Request() req: AuthenticatedRequest,
    @Body() body: { sectionId: string }
  ) {
    const locked = await this.collaborationService.handleSectionLock(
      studyId,
      req.user.id,
      body.sectionId
    );
    return { locked };
  }

  @Post('study/:studyId/unlock')
  @ApiOperation({ summary: 'Unlock a section' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Section unlocked' })
  async unlockSection(
    @Param('studyId') studyId: string,
    @Body() body: { sectionId: string }
  ) {
    await this.collaborationService.handleSectionUnlock(studyId, body.sectionId);
    return { success: true };
  }
}